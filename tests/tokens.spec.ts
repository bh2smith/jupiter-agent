import { JupiterApi } from "../src/lib/protocol.js";
import { getTokenDetails, loadTokenMap } from "../src/lib/tokens.js";
import { PublicKey } from "@solana/web3.js";

describe("Tokens", () => {
  const rpcUrl = "https://api.mainnet-beta.solana.com";
  const jupiter = new JupiterApi();
  it("loadTokenMap", async () => {
    const tokenMap = loadTokenMap();
    expect(tokenMap["usdc"]).toStrictEqual({
      address: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      decimals: 6,
    });
    expect(tokenMap["pump"]).toStrictEqual({
      address: new PublicKey("pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn"),
      decimals: 6,
    });
    expect(tokenMap["trump"]).toStrictEqual({
      address: new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"),
      decimals: 6,
    });
  });
  it("getTokenDetails", async () => {
    const tokenAddress = "CLoUDKc4Ane7HeQcPpE3YHnznRxhMimJ4MyaUqyHFzAu";

    const tokenDetails = await getTokenDetails(
      tokenAddress,
      rpcUrl,
      jupiter,
      {},
    );
    expect(tokenDetails).toStrictEqual({
      kind: "ok",
      token: {
        address: new PublicKey(tokenAddress),
        decimals: 9,
      },
    });
  });

  it("getTokenDetails - Token Valid", async () => {
    const tokenAddress = "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC";
    await expect(
      await getTokenDetails(tokenAddress, rpcUrl, jupiter, {}),
    ).toStrictEqual({
      kind: "ok",
      token: {
        address: new PublicKey(tokenAddress),
        decimals: 9,
      },
    });
  });

  it("getTokenDetails - Wallet Address Not a Token", async () => {
    await expect(
      getTokenDetails(
        // Wallet Address
        "AjK4ynTVgNfKSEDkeK57RM6JG1KzzWg8f79sGDjHkANA",
        rpcUrl,
        jupiter,
        {},
      ),
    ).rejects.toThrow("Failed to decode account data at address");
  });

  it.only("getTokenDetails - Weak Search WIF in hopes for $WIF", async () => {
    const result = await getTokenDetails("WIF", rpcUrl, jupiter, {});
    expect(result).toStrictEqual({
      kind: "ok",
      token: {
        decimals: 6,
        address: new PublicKey("EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm"),
      },
    });
    await expect(
      getTokenDetails("NOMNOM", rpcUrl, jupiter, {}, 50),
    ).resolves.toStrictEqual({
      kind: "ok",
      token: {
        decimals: 6,
        address: new PublicKey("6ZrYhkwvoYE4QqzpdzJ7htEHwT2u2546EkTNJ7qepump"),
      },
    });
  });
});
