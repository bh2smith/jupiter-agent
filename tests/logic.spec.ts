import { refineParams } from "../src/api/tools/quote";
import { JupiterApi } from "../src/lib/protocol";
import { loadTokenMap } from "../src/lib/tokens";

const solAddress = "So11111111111111111111111111111111111111112";

describe("Logic", () => {
  it("refineParams", async () => {
    const buyToken = "USDC";
    const sellToken = "TRUMP";
    const amount = 1;
    const jupiter = new JupiterApi();

    const refinedParams = await refineParams(jupiter, {
      solAddress,
      inputMint: sellToken,
      outputMint: buyToken,
      amount,
    });
    const tokenMap = loadTokenMap();
    expect(refinedParams).toStrictEqual({
      ok: true,
      query: {
        solAddress,
        inputMint: tokenMap[sellToken.toLowerCase()]!.address.toString(),
        outputMint: tokenMap[buyToken.toLowerCase()]!.address.toString(),
        amount: amount * 10 ** tokenMap[sellToken.toLowerCase()]!.decimals,
      },
    });
  });
});
