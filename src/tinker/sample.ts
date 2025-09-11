// send-zero-to-self.ts
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Load your keypair:
 * - Option 1: put your base58-encoded secret key in SECRET_KEY
 * - Option 2: use a throwaway keypair + airdrop on devnet
 */
const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  // --- load signer ---
  let payer: Keypair;
  const secret = process.env.SECRET_KEY;
  if (secret) {
    payer = Keypair.fromSecretKey(bs58.decode(secret));
  } else {
    // demo: ephemeral keypair on devnet
    payer = Keypair.generate();
    console.log(
      "Using Randomly Generated Secret Key:",
      bs58.encode(payer.secretKey),
    );
    const signature = await connection.requestAirdrop(
      payer.publicKey,
      1_000_000_000,
    ); // 1 SOL
    const faucetReceipt = await connection.confirmTransaction(
      { signature, ...(await connection.getLatestBlockhash("confirmed")) },
      "confirmed",
    );
    console.log("Faucet Request", faucetReceipt);
  }

  const transferParams = {
    fromPubkey: payer.publicKey,
    toPubkey: new PublicKey("AjK4ynTVgNfKSEDkeK57RM6JG1KzzWg8f79sGDjHkANA"),
    lamports: 1_000_000,
  };

  // transfer instruction
  const ix = SystemProgram.transfer(transferParams);

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(
    `✅ Sent ${transferParams.lamports}-lamport transfer to ${transferParams.toPubkey}`,
  );
  console.log(
    `Explorer: https://explorer.solana.com/tx/${sig}?cluster=${RPC_URL.includes("devnet") ? "devnet" : "mainnet"}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
