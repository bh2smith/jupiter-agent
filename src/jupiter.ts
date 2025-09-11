// Adapted from https://github.com/jup-ag/jupiter-quote-api-node/tree/main/example

import { createJupiterApiClient } from "@jup-ag/api";
import type { QuoteGetRequest, QuoteResponse } from "@jup-ag/api";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

// If you have problem landing transactions, read this: https://dev.jup.ag/docs/swap-api/send-swap-transaction#how-jupiter-estimates-priority-fee

const connection = new Connection(
  "https://api.mainnet-beta.solana.com", // Jupiter only on mainnet.
);

const apiKey = process.env.API_KEY;
// Create Jupiter API client with API key if available
const jupiterQuoteApi = createJupiterApiClient(apiKey ? { apiKey } : undefined);

// Log which API endpoint is being used
console.log(
  "Using API endpoint:",
  apiKey
    ? "https://api.jup.ag/swap/v1 (with API key)"
    : "https://lite-api.jup.ag/swap/v1 (free tier)",
);

async function getQuote() {
  const params: QuoteGetRequest = {
    inputMint: "So11111111111111111111111111111111111111112", // SOL
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    amount: 1_000_000, // 0.001 SOL
    slippageBps: 100, // 1%
  };

  // get quote
  const quote = await jupiterQuoteApi.quoteGet(params);

  if (!quote) {
    throw new Error("unable to quote");
  }
  return quote;
}

async function getSwapResponse(wallet: Keypair, quote: QuoteResponse) {
  // Get serialized transaction
  const swapResponse = await jupiterQuoteApi.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: wallet.publicKey.toBase58(),
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 10000000,
          priorityLevel: "veryHigh", // If you want to land transaction fast, set this to use `veryHigh`. You will pay on average higher priority fee.
        },
      },
    },
  });
  return swapResponse;
}

async function flowQuote() {
  const quote = await getQuote();
  console.dir(quote, { depth: null });
}

async function flowQuoteAndSwap() {
  const payer = Keypair.fromSecretKey(
    bs58.decode(process.env.SECRET_KEY || ""),
  );
  console.log("Wallet:", payer.publicKey.toBase58());

  const quote = await getQuote();
  console.log("Got Quote:");
  console.dir(quote, { depth: null });
  const swapResponse = await getSwapResponse(payer, quote);
  console.log("Got Swap:");
  console.dir(swapResponse, { depth: null });

  // Serialize the transaction
  const swapTransactionBuf = Uint8Array.from(
    Buffer.from(swapResponse.swapTransaction, "base64"),
  );
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  // Sign the transaction
  transaction.sign([payer]);

  // simulate whether the transaction would be successful
  const { value: simulatedTransactionResponse } =
    await connection.simulateTransaction(transaction, {
      replaceRecentBlockhash: true,
      commitment: "processed",
    });
  const { err, logs } = simulatedTransactionResponse;

  if (err) {
    console.error("Simulation Error:");
    console.error({ err, logs });
    return;
  }

  const serializedTransaction = Buffer.from(transaction.serialize());
  // See example for more sophistocated transaction handling.
  // https://github.com/jup-ag/jupiter-quote-api-node/blob/main/example/utils/transactionSender.ts
  const txid = await connection.sendRawTransaction(serializedTransaction);

  // Fun Fact: Transaction hashes are signatures on Solana!
  console.log(`https://solscan.io/tx/${txid}`);
}

export async function main() {
  switch (process.env.FLOW) {
    case "quote": {
      await flowQuote();
      break;
    }

    case "quoteAndSwap": {
      await flowQuoteAndSwap();
      break;
    }

    default: {
      console.error("Please set the FLOW environment");
    }
  }
}

main();
