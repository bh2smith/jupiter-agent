import { Router, Request, Response } from "express";
import type { QuoteResponse, SwapResponse } from "jup-fork";
import { JupiterApi } from "../lib/protocol.js";
import {
  validateQuery,
  type ParsedQuoteQuery,
  QuoteSchema,
  type QuoteQuery,
  isInvalid,
} from "../lib/schema.js";
import { getTokenDetails, loadTokenMap } from "../lib/tokens.js";
import { normalizeError } from "../lib/error.js";

type ResponseData = {
  quote: QuoteResponse;
  swapResponse: SwapResponse;
};

export async function refineParams(
  params: QuoteQuery,
): Promise<ParsedQuoteQuery> {
  const tokenMap = loadTokenMap();
  const rpcUrl = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
  const {
    inputMint: sellToken,
    outputMint: buyToken,
    amount,
    solAddress,
  } = params;
  const [sellTokenData, buyTokenData] = await Promise.all([
    getTokenDetails(sellToken, rpcUrl, tokenMap),
    getTokenDetails(buyToken, rpcUrl, tokenMap),
  ]);
  if (!buyTokenData) {
    throw new Error(`Could not determine buyToken info for: ${buyToken}`);
  }
  if (!sellTokenData) {
    throw new Error(`Could not determine sellToken info for: ${sellToken}`);
  }
  return {
    solAddress,
    inputMint: sellTokenData.address.toString(),
    outputMint: buyTokenData.address.toString(),
    // Convert to lamports
    amount: amount * 10 ** sellTokenData.decimals,
  };
}

export async function logic(params: QuoteQuery): Promise<ResponseData> {
  try {
    const refinedParams = await refineParams(params);
    console.log("Refined Params", refinedParams);
    const jupiter = new JupiterApi();
    return jupiter.swapFlow(refinedParams);
  } catch (err: unknown) {
    console.error("Error", String(err));
    throw normalizeError(err);
  }
}

const quoteHandler = Router();

quoteHandler.get("/", async (req: Request, res: Response) => {
  const input = validateQuery(req, QuoteSchema);
  if (isInvalid(input)) {
    res.status(400).json({
      error: input.error,
    });
    return;
  }
  const result = await logic(input.query);
  res.status(200).json(result);
});

export default quoteHandler;
