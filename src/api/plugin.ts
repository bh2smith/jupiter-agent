import { ACCOUNT_ID, PLUGIN_URL, SUPPORTED_NETWORKS } from "../config.js";
import { usdcCandidates, usdtCandidates } from "./responseExamples.js";

const manifest = {
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
          ALWAYS 
            - pass the user's connected solanaAddress for tool calls requiring solAddress - unless otherwise specified.
            - describe any errors to the user based on the toolCall Response.
          NEVER 
            - infer token addresses. Use the exact information provided by the user (symbol or address).
          `,
      tools: [{ type: "generate-sol-tx" }],
      image: `${PLUGIN_URL}/jup.png`,
      chainIds: SUPPORTED_NETWORKS,
    },
  },
  paths: {
    "/api/quote": {
      get: {
        operationId: "getQuote",
        summary: "Get quote and swap response from Jupiter Swap Router",
        description: `
          Returns the quote and swap transaction for a given swap query. 
          solAddress parameter is the connected user's solanaAddress, base58 encoded, solAddress
          If the Tool Response with 300 Status - this means that the users buy or sell token query was insufficient.
          The response will contain candidate buy and/or sell tokens that the user can choose from.
          Use the candidate token ID as the corresponding input parameter on second attempt.
        `,
        parameters: [
          {
            name: "solAddress",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "The connected user's solAddress (base58 encoded)",
          },
          {
            name: "inputMint",
            in: "query",
            required: true,
            schema: { type: "string" },
            description:
              "The sell token address (base58 encoded) or token symbol",
          },
          {
            name: "outputMint",
            in: "query",
            required: true,
            schema: { type: "string" },
            description:
              "The buy token address (base58 encoded) or token symbol",
          },
          {
            name: "amount",
            in: "query",
            required: true,
            schema: { type: "number" },
            description:
              "The amount of the input token in token units (not lamports)",
          },
        ],
        responses: {
          "200": {
            description: "Executable quote + swap",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ResponseExecutable" },
                // examples: {
                //   summary: "Executable quote + swap",
                //   value: {
                //     ok: true,
                //     quote: {
                //       inputMint: "EPjFWd...",
                //       inAmount: "1000000",
                //       outputMint: "So1111...",
                //       outAmount: "12345",
                //       otherAmountThreshold: "12000",
                //       swapMode: "ExactIn",
                //       slippageBps: 50,
                //       priceImpactPct: "0.0012",
                //       routePlan: [
                //         {
                //           swapInfo: {
                //             ammKey: "AMM_KEY",
                //             label: "Jupiter",
                //             inputMint: "EPjFWd...",
                //             outputMint: "So1111...",
                //             inAmount: "1000000",
                //             outAmount: "12345",
                //             feeAmount: "0",
                //             feeMint: "EPjFWd...",
                //           },
                //           percent: 100,
                //         },
                //       ],
                //       contextSlot: 271234567,
                //       timeTaken: 87,
                //     },
                //     swapResponse: {
                //       swapTransaction: "BASE64...",
                //       lastValidBlockHeight: 271999999,
                //       prioritizationFeeLamports: 0,
                //     },
                //   },
                // },
              },
            },
          },
          "300": {
            description: "Multiple token candidates; refine and try again",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ResponseCandidates" },
                // examples: {
                //   summary: "Needs user to pick tokens",
                //   value: {
                //     candidates: {
                //       buy: usdcCandidates,
                //       sell: usdtCandidates,
                //     },
                //   },
                // },
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
                    type: { type: "string", enum: ["InvalidInput"] },
                    errors: { type: "array", items: { type: "string" } },
                    properties: { type: "array", items: { type: "string" } },
                  },
                  required: ["type"],
                },
              },
            },
          },
          "404": {
            description: "Token not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TokenNotFoundError",
                },
                examples: {
                  buyTokenNotFound: {
                    summary: "outputMint not found",
                    value: {
                      errorType: "TokenNotFound",
                      description: "Token not found for outputMint: FAKECOIN",
                    },
                  },
                  sellTokenNotFound: {
                    summary: "inputMint not found",
                    value: {
                      errorType: "TokenNotFound",
                      description:
                        "Token not found for inputMint: NotARealMint",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/portfolio": {
      get: {
        operationId: "getPortfolio",
        summary: "Get user holdings from Jupiter Ultra API",
        description: "Returns the detailed account of user holdings",
        parameters: [
          {
            name: "solAddress",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "The connected user's solAddress (base58 encoded)",
          },
        ],
        responses: {
          "200": {
            description: "Executable quote + swap",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HoldingsResponse" },
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
    schemas: {
      HoldingsResponse: {
        type: "object",
        properties: {
          amount: {
            type: "string",
            description: "Total SOL in lamports",
          },
          uiAmount: {
            type: "number",
            description: "Total SOL in UI units after applying decimals",
          },
          uiAmountString: {
            type: "string",
            description:
              "Total SOL as string in UI units after applying decimals",
          },
          tokens: {
            type: "object",
            description:
              "Other token holdings organized by mint address as keys",
            additionalProperties: {
              description: "Token mint address as key",
              type: "array",
              items: {
                $ref: "#/components/schemas/TokenAccount",
              },
            },
          },
        },
        required: ["amount", "uiAmount", "uiAmountString", "tokens"],
      },
      ResponseCandidates: {
        type: "object",
        properties: {
          candidates: { $ref: "#/components/schemas/TokenCandidates" },
        },
        required: ["candidates"],
      },
      ResponseExecutable: {
        type: "object",
        properties: {
          quote: { $ref: "#/components/schemas/QuoteResponse" },
          swapResponse: { $ref: "#/components/schemas/SwapResponse" },
        },
        required: ["quote", "swapResponse"],
      },
      TokenAccount: {
        type: "object",
        properties: {
          account: {
            type: "string",
            description: "The token account address",
          },
          amount: {
            type: "string",
            description: "Token amount in atomic/raw units",
          },
          uiAmount: {
            type: "number",
            description: "Token amount in UI units after applying decimals",
          },
          uiAmountString: {
            type: "string",
            description:
              "Token amount as string in UI units after applying decimals",
          },
          isFrozen: {
            type: "boolean",
            description: "Whether the token account is frozen",
          },
          isAssociatedTokenAccount: {
            type: "boolean",
            description: "Whether this is an associated token account",
          },
          decimals: {
            type: "number",
            description: "Number of decimal places for the token",
          },
          programId: {
            type: "string",
            description: "The token program ID",
          },
        },
        required: [
          "account",
          "amount",
          "uiAmount",
          "uiAmountString",
          "isFrozen",
          "isAssociatedTokenAccount",
          "decimals",
          "programId",
        ],
      },
      TokenCandidates: {
        type: "object",
        properties: {
          buy: {
            type: "array",
            items: { $ref: "#/components/schemas/MintInformation" },
          },
          sell: {
            type: "array",
            items: { $ref: "#/components/schemas/MintInformation" },
          },
        },
        required: ["buy", "sell"],
      },
      TokenNotFoundError: {
        type: "object",
        properties: {
          errorType: {
            type: "string",
            enum: ["TokenNotFound"],
            description: "Fixed error type discriminator",
          },
          description: {
            type: "string",
            description:
              "Human-readable explanation of which token was not found",
          },
        },
        required: ["errorType", "description"],
      },
      QuoteResponse: {
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
            description: "The minimum amount threshold for the output",
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
                    ammKey: { type: "string", description: "The AMM pool key" },
                    label: { type: "string", description: "The AMM label" },
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
                      description: "Output amount for this swap",
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
              required: ["swapInfo", "percent"],
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
      SwapResponse: {
        type: "object",
        properties: {
          swapTransaction: {
            type: "string",
            description: "The unsigned base64 encoded swap transaction",
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
      MintInformation: {
        type: "object",
        properties: {
          id: { type: "string", description: "The token's mint address" },
          name: { type: "string" },
          symbol: { type: "string" },
          icon: { type: "string", nullable: true },
          decimals: { type: "integer" },
          twitter: { type: "string", nullable: true },
          telegram: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          dev: {
            type: "string",
            nullable: true,
            description: "The token's developer address",
          },
          circSupply: { type: "number", nullable: true },
          totalSupply: { type: "number", nullable: true },
          tokenProgram: {
            type: "string",
            description: "The token program address",
          },
          launchpad: { type: "string", nullable: true },
          partnerConfig: { type: "string", nullable: true },
          graduatedPool: { type: "string", nullable: true },
          graduatedAt: { type: "string", nullable: true },
          holderCount: { type: "integer", nullable: true },
          fdv: { type: "number", nullable: true },
          mcap: { type: "number", nullable: true },
          usdPrice: { type: "number", nullable: true },
          priceBlockId: { type: "integer", nullable: true },
          liquidity: { type: "number", nullable: true },
          stats5m: { $ref: "#/components/schemas/SwapStats", nullable: true },
          stats1h: { $ref: "#/components/schemas/SwapStats", nullable: true },
          stats6h: { $ref: "#/components/schemas/SwapStats", nullable: true },
          stats24h: { $ref: "#/components/schemas/SwapStats", nullable: true },
          firstPool: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              createdAt: { type: "string" },
            },
          },
          audit: {
            type: "object",
            nullable: true,
            properties: {
              isSus: { type: "boolean", nullable: true },
              mintAuthorityDisabled: { type: "boolean", nullable: true },
              freezeAuthorityDisabled: { type: "boolean", nullable: true },
              topHoldersPercentage: { type: "number", nullable: true },
              devBalancePercentage: { type: "number", nullable: true },
              devMigrations: { type: "number", nullable: true },
            },
          },
          organicScore: { type: "number" },
          organicScoreLabel: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
          isVerified: { type: "boolean", nullable: true },
          cexes: { type: "array", items: { type: "string" }, nullable: true },
          tags: { type: "array", items: { type: "string" }, nullable: true },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SwapStats: {
        type: "object",
        properties: {
          priceChange: { type: "number", nullable: true },
          holderChange: { type: "number", nullable: true },
          liquidityChange: { type: "number", nullable: true },
          volumeChange: { type: "number", nullable: true },
          buyVolume: { type: "number", nullable: true },
          sellVolume: { type: "number", nullable: true },
          buyOrganicVolume: { type: "number", nullable: true },
          sellOrganicVolume: { type: "number", nullable: true },
          numBuys: { type: "integer", nullable: true },
          numSells: { type: "integer", nullable: true },
          numTraders: { type: "integer", nullable: true },
          numOrganicBuyers: { type: "integer", nullable: true },
          numNetBuyers: { type: "integer", nullable: true },
        },
      },
    },
  },
};

export default manifest;
