import type { QuoteResponse, SwapResponse } from "@jup-ag/api";
import { JupiterApi } from "../../../lib/protocol";
import type { QuoteQuery } from "./schema";

type ResponseData = {
  quote: QuoteResponse;
  swapResponse: SwapResponse;
};

export async function logic(params: QuoteQuery): Promise<ResponseData> {
  const jupiter = new JupiterApi();
  return jupiter.swapFlow(params);
}
