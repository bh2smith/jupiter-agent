import { createJupiterApiClient } from "@jup-ag/api";
import type {
  QuoteGetRequest,
  QuoteResponse,
  SwapApi,
  SwapRequest,
  SwapResponse,
} from "@jup-ag/api";
import type { ParsedQuoteQuery } from "@/lib/schema";
import { withErrorHandling } from "@/lib/error";

export class JupiterApi {
  private swapApi: SwapApi;

  constructor(apiKey?: string) {
    this.swapApi = createJupiterApiClient(apiKey ? { apiKey } : undefined);
  }

  async getQuote(params: QuoteGetRequest): Promise<QuoteResponse> {
    return withErrorHandling(this.swapApi.quoteGet(params));
  }

  async getSwap(
    userPublicKey: string,
    quote: QuoteResponse,
  ): Promise<SwapResponse> {
    // Get serialized transaction
    const swapRequest: SwapRequest = {
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
    const quote = await this.getQuote({ inputMint, outputMint, amount });
    console.log("Quote:", JSON.stringify(quote, null, 2));

    const swapResponse = await this.getSwap(userPublicKey, quote);
    console.log("SwapTx:", JSON.stringify(swapResponse, null, 2));
    return { quote, swapResponse };
  }
}
