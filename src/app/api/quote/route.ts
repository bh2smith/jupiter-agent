import { NextResponse, type NextRequest } from "next/server";
import { validateQuery } from "./schema";
import { logic } from "./logic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const validationResult = validateQuery(url.searchParams);
  if (!validationResult.ok) {
    return NextResponse.json(
      { error: validationResult.error },
      { status: 400 },
    );
  }
  console.log("quote/", validationResult.query);
  try {
    const result = await logic(validationResult.query);
    console.log("result", result);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 },
    );
  }
}
