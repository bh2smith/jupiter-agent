import { NextResponse } from "next/server";
import { ACCOUNT_ID, PLUGIN_URL, SUPPORTED_NETWORKS } from "../../config";

export async function GET() {
  const pluginData = {
    openapi: "3.0.0",
    info: {
      title: "Bitte Solana Jupiter Agent",
      description: "A Solana Agent for Jupiter Dex (jup.ag)",
      version: "1.0.0",
    },
    servers: [{ url: PLUGIN_URL }],
    "x-mb": {
      "account-id": ACCOUNT_ID,
      assistant: {
        name: "Jupiter Solana Agent",
        description:
          "Jupiter Solana Agent. Get Quotes and Swap on Jupiter Dex (jup.ag)",
        instructions: `
          You faciliate trading on Jupiter Dex (jup.ag). 
          You are able to get quotes and build transactions for swaps on Jupiter.
          Responses from the quote tool should include a quote and swapResponse: 
            - The Quote should be displayed to the user.
            - The swapResponse should be be forwarded to generate-sol-tx tool.
          `,
        tools: [{ type: "generate-sol-tx" }],
        image: `${PLUGIN_URL}/jup.png`,
        chainIds: SUPPORTED_NETWORKS,
      },
    },
    paths: {
      "/api/quote": {
        get: {
          tags: ["quote"],
          operationId: "getQuote",
          summary: "Get quote and swap response from Jupiter Swap Router",
          description:
            "Returns the quote and swap transaction for a given swap query.",
          parameters: [
            {
              name: "solAddress",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description:
                "The connected user's Solana address (base58 encoded)",
            },
            {
              name: "inputMint",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The sell token address (base58 encoded)",
            },
            {
              name: "outputMint",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The buy token address (base58 encoded)",
            },
            {
              name: "amount",
              in: "query",
              required: true,
              schema: {
                type: "number",
              },
              description: "The amount of the input token in lamports",
            },
          ],
          responses: {
            "200": {
              description: "Quote and Swap transaction response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      quote: {
                        type: "object",
                        properties: {
                          inputMint: {
                            type: "string",
                            description: "The input token mint address",
                          },
                          inAmount: {
                            type: "string",
                            description: "The input amount in lamports",
                          },
                          outputMint: {
                            type: "string",
                            description: "The output token mint address",
                          },
                          outAmount: {
                            type: "string",
                            description: "The output amount in lamports",
                          },
                          otherAmountThreshold: {
                            type: "string",
                            description:
                              "The minimum amount threshold for the output",
                          },
                          swapMode: {
                            type: "string",
                            enum: ["ExactIn", "ExactOut"],
                            description: "The swap mode",
                          },
                          slippageBps: {
                            type: "number",
                            description: "Slippage tolerance in basis points",
                          },
                          priceImpactPct: {
                            type: "string",
                            description: "Price impact percentage",
                          },
                          routePlan: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                swapInfo: {
                                  type: "object",
                                  properties: {
                                    ammKey: {
                                      type: "string",
                                      description: "The AMM pool key",
                                    },
                                    label: {
                                      type: "string",
                                      description: "The AMM label",
                                    },
                                    inputMint: {
                                      type: "string",
                                      description: "Input mint for this swap",
                                    },
                                    outputMint: {
                                      type: "string",
                                      description: "Output mint for this swap",
                                    },
                                    inAmount: {
                                      type: "string",
                                      description: "Input amount for this swap",
                                    },
                                    outAmount: {
                                      type: "string",
                                      description:
                                        "Output amount for this swap",
                                    },
                                    feeAmount: {
                                      type: "string",
                                      description: "Fee amount for this swap",
                                    },
                                    feeMint: {
                                      type: "string",
                                      description: "Fee mint address",
                                    },
                                  },
                                },
                                percent: {
                                  type: "number",
                                  description: "Percentage of the route",
                                },
                              },
                            },
                          },
                          contextSlot: {
                            type: "number",
                            description: "The context slot number",
                          },
                          timeTaken: {
                            type: "number",
                            description: "Time taken to generate the quote",
                          },
                        },
                        required: [
                          "inputMint",
                          "inAmount",
                          "outputMint",
                          "outAmount",
                          "swapMode",
                          "slippageBps",
                          "routePlan",
                        ],
                      },
                      swapResponse: {
                        type: "object",
                        properties: {
                          swapTransaction: {
                            type: "string",
                            description:
                              "The unsigned base64 encoded swap transaction",
                          },
                          lastValidBlockHeight: {
                            type: "number",
                            description: "The last valid block height",
                          },
                          prioritizationFeeLamports: {
                            type: "number",
                            description: "The prioritization fee in lamports",
                          },
                        },
                        required: [
                          "swapTransaction",
                          "lastValidBlockHeight",
                          "prioritizationFeeLamports",
                        ],
                      },
                    },
                    required: ["quote", "swapResponse"],
                  },
                },
              },
            },
            "400": {
              description: "Bad Request",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["InvalidInput"],
                      },
                      errors: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      properties: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                    required: ["type"],
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      parameters: {},
      responses: {},
      schemas: {},
    },
  };

  return NextResponse.json(pluginData);
}
