import { Router, Request, Response } from "express";
import type { MintInformation, QuoteResponse, SwapResponse } from "jup-fork";
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

type TokenCandidates = { buy: MintInformation[]; sell: MintInformation[] };

export type ResponseData =
  | { ok: false; candidates: TokenCandidates }
  | { ok: true; quote: QuoteResponse; swapResponse: SwapResponse };

type ParameterRefinement =
  | { ok: false; tokenCandidates: TokenCandidates }
  | { ok: true; query: ParsedQuoteQuery };

export async function refineParams(
  jup: JupiterApi,
  params: QuoteQuery,
): Promise<ParameterRefinement> {
  const tokenMap = loadTokenMap();
  const rpcUrl = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
  const {
    inputMint: sellToken,
    outputMint: buyToken,
    amount,
    solAddress,
  } = params;
  const [sellTokenData, buyTokenData] = await Promise.all([
    getTokenDetails(sellToken, rpcUrl, jup, tokenMap),
    getTokenDetails(buyToken, rpcUrl, jup, tokenMap),
  ]);
  // Not Found Cases:
  if (buyTokenData.kind === "not_found") {
    throw new Error(`Could not determine buyToken info for: ${buyToken}`);
  }
  if (sellTokenData.kind === "not_found") {
    throw new Error(`Could not determine sellToken info for: ${sellToken}`);
  }

  // Candidate Cases:
  if (
    buyTokenData.kind === "candidates" ||
    sellTokenData.kind === "candidates"
  ) {
    const candidates: TokenCandidates = { buy: [], sell: [] };
    if (buyTokenData.kind === "candidates") {
      console.log(`Multiple Candidates for buyToken: ${buyTokenData.tokens}`);
      candidates.buy = buyTokenData.tokens;
    }
    if (sellTokenData.kind === "candidates") {
      console.log(`Multiple Candidates for buyToken: ${sellTokenData.tokens}`);
      candidates.sell = sellTokenData.tokens;
    }
    return { ok: false, tokenCandidates: candidates };
  }

  // TODO: check cases.
  return {
    ok: true,
    query: {
      solAddress,
      inputMint: sellTokenData.token.address.toString(),
      outputMint: buyTokenData.token.address.toString(),
      // Convert to lamports
      amount: amount * 10 ** sellTokenData.token.decimals,
    },
  };
}

export async function logic(params: QuoteQuery): Promise<ResponseData> {
  const jupiter = new JupiterApi();
  try {
    const refinedParams = await refineParams(jupiter, params);
    console.log("Refined Params", refinedParams);
    if (refinedParams.ok === true) {
      const swapData = await jupiter.swapFlow(refinedParams.query);
      return { ok: true, ...swapData };
    } else {
      return { ok: false, candidates: refinedParams.tokenCandidates };
    }
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
