import { refineParams } from "@/app/api/quote/logic";
import { loadTokenMap } from "@/lib/tokens";
import { describe, it, expect } from "bun:test";

const solAddress = "So11111111111111111111111111111111111111112";

describe("Logic", () => {
  it("refineParams", async () => {
    const buyToken = "USDC";
    const sellToken = "TRUMP";
    const amount = 1;

    const refinedParams = await refineParams({
      solAddress,
      inputMint: sellToken,
      outputMint: buyToken,
      amount,
    });
    const tokenMap = loadTokenMap();
    expect(refinedParams).toStrictEqual({
      solAddress,
      inputMint: tokenMap[sellToken.toLowerCase()]!.address.toString(),
      outputMint: tokenMap[buyToken.toLowerCase()]!.address.toString(),
      amount: amount * 10 ** tokenMap[sellToken.toLowerCase()]!.decimals,
    });
  });
});
