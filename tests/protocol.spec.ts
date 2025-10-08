import { JupiterApi } from "../src/lib/protocol";
import dotenv from "dotenv";

dotenv.config();

describe("Jupiter Protocol Token Search", () => {
  const jupiter = new JupiterApi();
  // We can't be running this, because the dynamic nature of tokens causes these to change.
  it.skip("searches with 95%", async () => {
    const minScore = 40;
    await expect((await jupiter.searchToken("NOMNOM", minScore)).length).toBe(
      1,
    );
    await expect((await jupiter.searchToken("TROLL", minScore)).length).toBe(1);
    await expect((await jupiter.searchToken("USDC", minScore)).length).toBe(1);

    // Multiple Results.
    await expect((await jupiter.searchToken("USD", minScore)).length).toBe(2);
    // Our Curration catches this.
    await expect((await jupiter.searchToken("SOL", minScore)).length).toBe(3);
    // Thier Endpoint uses SOL for WSOL... curration should catch
    await expect((await jupiter.searchToken("WSOL", minScore)).length).toBe(0);
  });
});
