import { logic, ResponseData } from "../src/api/tools/quote";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";

console.log = () => {};

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

  it("Native Asset SellToken SwapFlow", async () => {
    const query = {
      solAddress: "AjK4ynTVgNfKSEDkeK57RM6JG1KzzWg8f79sGDjHkANA",
      inputMint: "SOL",
      outputMint: "USDC",
      amount: 0.001,
    };
    await expect(logic(query)).resolves.toBeDefined();
  });

  it("Native Asset BuyToken SwapFlow", async () => {
    const query = {
      solAddress: "AjK4ynTVgNfKSEDkeK57RM6JG1KzzWg8f79sGDjHkANA",
      inputMint: "USDC",
      outputMint: "SOL",
      amount: 0.01,
    };
    await expect(logic(query)).resolves.toBeDefined();
  });

  it.skip("Full Swap", async () => {
    const query = {
      solAddress: "AjK4ynTVgNfKSEDkeK57RM6JG1KzzWg8f79sGDjHkANA",
      inputMint: "SOL",
      outputMint: "USDC",
      amount: 0.001,
    };
    const { status, data }: ResponseData = await logic(query);
    if (status === 300) {
      console.warn("Insufficient Token Details", data);
      return;
    }

    // loadWallet
    /**
     * Load your keypair:
     * - Option 1: put your base58-encoded secret key in SECRET_KEY
     * - Option 2: use a throwaway keypair + airdrop on devnet
     */
    const RPC_URL = process.env.RPC_URL;
    if (!RPC_URL) {
      console.warn("No RPC_URL provided - skiping Full e2e test");
      return;
    }

    // --- load signer ---
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      console.warn("No Key Provided - skiping Full e2e test");
      return;
    }
    const connection = new Connection(RPC_URL, "confirmed");
    const payer = Keypair.fromSecretKey(bs58.decode(secretKey));

    const transactionBase64 = data.swapResponse.swapTransaction;
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(transactionBase64, "base64"),
    );

    transaction.sign([payer]);

    const transactionBinary = transaction.serialize();

    const signature = await connection.sendRawTransaction(transactionBinary, {
      maxRetries: 2,
      skipPreflight: true,
    });

    console.log(`Transaction successful: https://solscan.io/tx/${signature}/`);
  });
});
