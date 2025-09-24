import { isAddress } from "../src/lib/util";

describe("Utility Library", () => {
  it("isAddress", async () => {
    expect(isAddress("1234567890")).toBe(false);
    expect(isAddress("So11111111111111111111111111111111111111112")).toBe(true);
    expect(isAddress("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN")).toBe(
      true,
    );
    expect(isAddress("pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn")).toBe(true);
    expect(isAddress("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")).toBe(
      true,
    );
  });
});
