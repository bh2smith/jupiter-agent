import { JupiterApi } from "../src/lib/protocol";
import dotenv from "dotenv";

dotenv.config();

describe("Jupiter Protocol", () => {
  it("getToken", async () => {
    // const apiKey = process.env.JUP_API_KEY;
    const jupiter = new JupiterApi();
    await jupiter.getToken("TROLL");
  });
});
