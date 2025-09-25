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
import { TokenNotFoundError } from "../lib/error.js";

type TokenCandidates = { buy: MintInformation[]; sell: MintInformation[] };

export type ResponseData =
  | { status: 300; data: { candidates: TokenCandidates } }
  | { status: 200; data: { quote: QuoteResponse; swapResponse: SwapResponse } };

type ParameterRefinement =
  | { ok: false; tokenCandidates: TokenCandidates }
  | { ok: true; query: ParsedQuoteQuery };

export async function refineParams(
  jup: JupiterApi,
  params: QuoteQuery,
): Promise<ParameterRefinement> {
  const tokenMap = loadTokenMap();
  const rpcUrl = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
  const minScore = parseInt(process.env.MIN_TOKEN_SCORE || "95");

  const {
    inputMint: sellToken,
    outputMint: buyToken,
    amount,
    solAddress,
  } = params;
  const [sellTokenData, buyTokenData] = await Promise.all([
    getTokenDetails(sellToken, rpcUrl, jup, tokenMap, minScore),
    getTokenDetails(buyToken, rpcUrl, jup, tokenMap, minScore),
  ]);
  if (buyTokenData.kind === "not_found") {
    throw new TokenNotFoundError("buyToken", buyToken);
  }
  if (sellTokenData.kind === "not_found") {
    throw new TokenNotFoundError("sellToken", sellToken);
  }

  // Candidate Cases:
  if (
    buyTokenData.kind === "candidates" ||
    sellTokenData.kind === "candidates"
  ) {
    const candidates: TokenCandidates = { buy: [], sell: [] };
    if (buyTokenData.kind === "candidates") {
      console.log(
        `Multiple Candidates for buyToken: ${JSON.stringify(buyTokenData.tokens)}`,
      );
      candidates.buy = buyTokenData.tokens;
    }
    if (sellTokenData.kind === "candidates") {
      console.log(
        `Multiple Candidates for buyToken: ${JSON.stringify(sellTokenData.tokens)}`,
      );
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
  const refinedParams = await refineParams(jupiter, params); // may throw TokenNotFoundError
  if (refinedParams.ok === true) {
    const swapData = await jupiter.swapFlow(refinedParams.query);
    return { status: 200, data: { ...swapData } };
  }
  return { status: 300, data: { candidates: refinedParams.tokenCandidates } };
}

const quoteHandler = Router();

quoteHandler.get("/", async (req: Request, res: Response) => {
  const input = validateQuery(req, QuoteSchema);
  if (isInvalid(input)) {
    res
      .status(400)
      .json({ errorType: "InvalidInput", description: input.error });
    return;
  }

  try {
    const { status, data } = await logic(input.query);
    res.status(status).json(data);
  } catch (err: unknown) {
    // 404 Token Not Found
    if (err instanceof TokenNotFoundError) {
      res.status(err.status).json(err.toJSON());
      return;
    }

    // Everything else -> 500
    console.error("Unhandled error in /api/quote:", err);
    res.status(500).json({
      errorType: "InternalError",
      description: "Internal Server Error",
    });
  }
});

export default quoteHandler;
