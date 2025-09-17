import { NextResponse, type NextRequest } from "next/server";
import { validateQuery } from "../../../lib/schema";
import { toNextResponse } from "@/lib/error";
import { logic } from "./logic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  console.log("quote/", searchParams);
  const validation = validateQuery(searchParams);
  if (!validation.ok) {
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
    const result = await logic(validation.query);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return toNextResponse(error);
  }
}
