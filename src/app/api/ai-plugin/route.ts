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
          You are able to get quotes and build transactions for swaps on Jupiter
          `,
        tools: [],
        image: `${PLUGIN_URL}/jup.png`,
        chainIds: SUPPORTED_NETWORKS,
      },
    },
    paths: {
      "/api/quote": {
        get: {
          tags: ["quote"],
          operationId: "getQuote",
          summary: "Get quote from Jupiter Swap Router",
          description:
            "Returns the quote for a given token address and chain ID.",
          parameters: [
            {
              name: "inputMint",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The input mint address or symbol",
            },
            {
              name: "outputMint",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The output mint address or symbol",
            },
            {
              name: "amount",
              in: "query",
              required: true,
              schema: {
                type: "number",
              },
              description: "The amount of the input token",
            },
          ],
          responses: {
            "200": {
              description: "Quote response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      quote: {
                        type: "object",
                        properties: {
                          quoteResponse: {
                            type: "object",
                          },
                        },
                      },
                    },
                    required: ["quote"],
                  },
                },
              },
            },
            "400": { description: "Missing parameters" },
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
