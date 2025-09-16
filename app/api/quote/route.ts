import { NextResponse, type NextRequest } from "next/server";
import { validateQuery } from "./schema";
import { toNextResponse } from "@/lib/error";
import { JupiterApi } from "@/lib/protocol";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const validation = validateQuery(url.searchParams);
  if (!validation.ok) {
    console.error("quote/", validation.error);
    return NextResponse.json(
      {
        type: "InvalidInput",
        ...validation.error,
      },
      { status: 400 },
    );
  }
  console.log("quote/", validation.query);
  try {
    const result = new JupiterApi().swapFlow(validation.query);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return toNextResponse(error);
  }
}
