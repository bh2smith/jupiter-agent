import { loadTokenMap } from "@/lib/tokens";
import { PublicKey } from "@solana/web3.js";
import { describe, it, expect } from "bun:test";

describe("Tokens", () => {
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
});
