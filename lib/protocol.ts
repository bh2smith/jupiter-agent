import { createJupiterApiClient } from "@jup-ag/api";
import type {
  QuoteGetRequest,
  QuoteResponse,
  SwapApi,
  SwapRequest,
  SwapResponse,
} from "@jup-ag/api";
import type { ParsedQuoteQuery } from "@/lib/schema";
import { withErrorHandling, type NormalizedError } from "@/lib/error";

export class JupiterApi {
  private swapApi: SwapApi;

  constructor(apiKey?: string) {
    this.swapApi = createJupiterApiClient(apiKey ? { apiKey } : undefined);
  }

  async getQuote(
    params: QuoteGetRequest,
  ): Promise<{ quote: QuoteResponse; nativeSellToken: boolean }> {
    const nativeSellToken =
      params.inputMint === "So11111111111111111111111111111111111111111";
    if (nativeSellToken) {
      // Native Asset.
      params.inputMint = "So11111111111111111111111111111111111111112";
    }
    return {
      quote: await withErrorHandling(this.swapApi.quoteGet(params)),
      nativeSellToken,
    };
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
    const { quote, nativeSellToken } = await this.getQuote({
      inputMint,
      outputMint,
      amount,
    });
    console.log("Quote:", JSON.stringify(quote, null, 2));

    const swapResponse = await this.getSwap(
      userPublicKey,
      quote,
      nativeSellToken,
    );
    console.log("SwapTx:", JSON.stringify(swapResponse, null, 2));
    return { quote, swapResponse };
  }
}
