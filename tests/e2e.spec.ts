import { logic } from "@/app/api/quote/logic";
import { describe, it, expect } from "bun:test";

describe("E2E", () => {
  it("Jupiter SwapFlow", async () => {
    const query = {
      solAddress: "AjK4ynTVgNfKSEDkeK57RM6JG1KzzWg8f79sGDjHkANA",
      inputMint: "WSOL",
      outputMint: "USDC",
      amount: 0.001,
    };
    await expect(logic(query)).resolves.toBeDefined();
  });
});
