import { getTokenDetails, loadTokenMap } from "../src/lib/tokens.js";
import { PublicKey } from "@solana/web3.js";
import { describe, it, expect } from "bun:test";

describe("Tokens", () => {
  const rpcUrl = "https://api.mainnet-beta.solana.com";
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

    const tokenDetails = await getTokenDetails(tokenAddress, rpcUrl, {});
    expect(tokenDetails).toStrictEqual({
      address: new PublicKey(tokenAddress),
      decimals: 9,
    });
  });

  it("getTokenDetails - Token Valid", async () => {
    const tokenAddress = "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC";
    await expect(await getTokenDetails(tokenAddress, rpcUrl, {})).toStrictEqual(
      {
        address: new PublicKey(tokenAddress),
        decimals: 9,
      },
    );
  });

  it("getTokenDetails - Wallet Address Not a Token", async () => {
    await expect(
      getTokenDetails(
        // Wallet Address
        "AjK4ynTVgNfKSEDkeK57RM6JG1KzzWg8f79sGDjHkANA",
        rpcUrl,
        {},
      ),
    ).rejects.toThrow("Failed to decode account data at address");
  });
});
