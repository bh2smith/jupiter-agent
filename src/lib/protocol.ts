import { createJupiterApiClient } from "jup-fork";
import type {
  HoldingsResponse,
  MintInformation,
  QuoteGetRequest,
  QuoteResponse,
  SwapApi,
  SwapRequest,
  SwapResponse,
  TokenApi,
  UltraApi,
} from "jup-fork";
import type { ParsedQuoteQuery } from "./schema.js";
import { withErrorHandling } from "./error.js";

const NATIVE_ASSET = "So11111111111111111111111111111111111111111";
const WRAPPED_NATIVE = "So11111111111111111111111111111111111111112";

export class JupiterApi {
  private ultraApi: UltraApi;
  private swapApi: SwapApi;
  private tokenApi: TokenApi;

  constructor(apiKey?: string) {
    const { swap, token, ultra } = createJupiterApiClient(
      apiKey ? { apiKey } : undefined,
    );
    this.swapApi = swap;
    this.tokenApi = token;
    this.ultraApi = ultra;
  }

  async getQuote(
    params: QuoteGetRequest,
  ): Promise<{ quote: QuoteResponse; wrapAndUnwrapSol: boolean }> {
    const nativeSellToken = params.inputMint === NATIVE_ASSET;
    if (nativeSellToken) {
      // Note that we are modifying the user's input here (but its not used again).
      // Might be safer to just override the quote parameters without modification.
      params.inputMint = WRAPPED_NATIVE;
    }
    const nativeBuyToken = params.outputMint === NATIVE_ASSET;
    if (nativeBuyToken) {
      params.outputMint = WRAPPED_NATIVE;
    }
    return {
      quote: await withErrorHandling(this.swapApi.quoteGet(params)),
      wrapAndUnwrapSol: nativeSellToken || nativeBuyToken,
    };
  }

  async getHoldings(userPublicKey: string): Promise<HoldingsResponse> {
    return this.ultraApi.getHoldings({
      address: userPublicKey,
    });
  }

  async getSwap(
    userPublicKey: string,
    quote: QuoteResponse,
    wrapAndUnwrapSol: boolean,
  ): Promise<SwapResponse> {
    // Get serialized transaction
    const swapRequest: SwapRequest = {
      // https://dev.jup.ag/docs/api/swap-api/swap
      wrapAndUnwrapSol,
      quoteResponse: quote,
      userPublicKey,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 10000000, // 0.01 SOL
          priorityLevel: "high",
        },
      },
    };
    console.log("Swap Request Payload:", { swapRequest });
    return withErrorHandling(this.swapApi.swapPost({ swapRequest }));
  }

  async swapFlow(
    params: ParsedQuoteQuery,
  ): Promise<{ quote: QuoteResponse; swapResponse: SwapResponse }> {
    const { solAddress: userPublicKey, inputMint, outputMint, amount } = params;
    const { quote, wrapAndUnwrapSol } = await this.getQuote({
      inputMint,
      outputMint,
      amount,
    });
    console.log("Quote:", JSON.stringify(quote, null, 2));

    const swapResponse = await this.getSwap(
      userPublicKey,
      quote,
      wrapAndUnwrapSol,
    );
    console.log("SwapTx:", JSON.stringify(swapResponse, null, 2));
    return { quote, swapResponse };
  }

  async searchToken(
    query: string,
    minScore: number = 80,
  ): Promise<MintInformation[]> {
    const result = await this.tokenApi.searchTokens({ query });
    // Filter with minScore OR exact Symbol & half minScore.
    return result.filter(relaxedScoreExactSymbolFilter(minScore, query));
  }
}

const exactSymbolFilter = (symbol: string) => (t: MintInformation) =>
  t.symbol.toLowerCase() === symbol.toLowerCase();

export const minScoreFilter = (n: number) => (t: MintInformation) =>
  (t.organicScore ?? 0) >= n;

const relaxedScoreExactSymbolFilter =
  (minScore: number, symbol: string) => (t: MintInformation) =>
    minScoreFilter(minScore)(t) ||
    (exactSymbolFilter(symbol)(t) && minScoreFilter(minScore / 2)(t));
