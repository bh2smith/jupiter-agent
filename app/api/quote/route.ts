import { NextResponse, type NextRequest } from "next/server";
import { validateQuery } from "./schema";
import { logic } from "./logic";
import { toNextResponse } from "../../../lib/error";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const validationResult = validateQuery(url.searchParams);
  if (!validationResult.ok) {
    return NextResponse.json(
      {
        type: "InvalidInput",
        ...validationResult.error,
      },
      { status: 400 },
    );
  }
  console.log("quote/", validationResult.query);
  try {
    const result = await logic(validationResult.query);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return toNextResponse(error);
  }
}
