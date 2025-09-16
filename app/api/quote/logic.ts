import type { QuoteResponse, SwapResponse } from "@jup-ag/api";
import { JupiterApi } from "@/lib/protocol";
import type { ParsedQuoteQuery, QuoteQuery } from "@/lib/schema";
import { getTokenDetails, loadTokenMap } from "@/lib/tokens";
import { Connection } from "@solana/web3.js";

type ResponseData = {
  quote: QuoteResponse;
  swapResponse: SwapResponse;
};

export async function refineParams(
  params: QuoteQuery,
): Promise<ParsedQuoteQuery> {
  const tokenMap = loadTokenMap();
  const connection = new Connection(
    process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
  );
  const {
    inputMint: sellToken,
    outputMint: buyToken,
    amount,
    solAddress,
  } = params;
  const [sellTokenData, buyTokenData] = await Promise.all([
    getTokenDetails(sellToken, connection, tokenMap),
    getTokenDetails(buyToken, connection, tokenMap),
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
  const refinedParams = await refineParams(params);
  console.log("Refined Params", refinedParams);
  const jupiter = new JupiterApi();
  return jupiter.swapFlow(refinedParams);
}
