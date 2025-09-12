import { NextResponse } from "next/server";

export interface NormalizedError {
  message: string;
  status?: number;
  code?: string;
  url?: string;
  // details?: unknown;
  // TODO: keep the raw for debugging (if necessary)
  raw?: unknown;
}

async function parseResponse(res: Response) {
  let body: any;
  try {
    body = await res.clone().json?.();
  } catch {
    try {
      const txt = await res.clone().text?.();
      body = txt ? { error: txt } : undefined;
    } catch {}
  }

  const message = body?.message || body?.error || `HTTP ${res.status}`;

  const code = body?.errorCode ?? body?.code;

  return {
    status: res.status,
    url: res.url,
    message,
    code,
  };
}

/**
 * Normalize an error to a standardized format
 * @param e - The error to normalize
 * @returns The normalized error
 */
export async function normalizeError(e: unknown): Promise<NormalizedError> {
  // Axios/fetch-like: e.response is a Response
  const maybeRes: any = (e as any)?.response;
  if (maybeRes && typeof maybeRes.status === "number") {
    return {
      ...(await parseResponse(maybeRes)),
      // We managed to parse the error from the response, shouldn't need the raw
      // raw: e
    };
  }

  // Plain Error / message
  if (e && typeof (e as any).message === "string") {
    return { message: (e as any).message, raw: e };
  }

  return { message: "Unknown error", raw: e };
}

// Type guard to check if error is a NormalizedError
export function isNormalizedError(
  error: unknown,
): error is Error & NormalizedError {
  return (
    error instanceof Error &&
    typeof (error as any).message === "string" &&
    ((error as any).status !== undefined ||
      (error as any).code !== undefined ||
      (error as any).url !== undefined ||
      (error as any).raw !== undefined)
  );
}

/** Convenience wrapper to apply on any promise */
export const withErrorHandling = <T>(promise: Promise<T>): Promise<T> =>
  promise.catch(async (e) => {
    const ne = await normalizeError(e);
    // Log once in a consistent format
    console.error("Request Error:", ne);
    // Throw a standard Error with message while preserving structured info
    const err = new Error(ne.message) as Error & NormalizedError;
    Object.assign(err, ne);
    throw err;
  });

export function toNextResponse(error: unknown): NextResponse {
  if (isNormalizedError(error)) {
    const statusCode = error.status || 500;
    return NextResponse.json(
      { message: error.message },
      { status: statusCode },
    );
  }

  return NextResponse.json(
    { message: "Internal server error", raw: error },
    { status: 500 },
  );
}
