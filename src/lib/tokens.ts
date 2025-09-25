// 1. loads the solana_tokens.csv file from public/solana_tokens.csv
// exports a function getTokenData(symbool: string) -> TokenInfo

import { fetchMint } from "@solana-program/token";
import { type Address } from "@solana/addresses";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { isAddress } from "../lib/util.js";
import { createSolanaRpc } from "@solana/kit";
import { JupiterApi, minScoreFilter } from "./protocol.js";
import { MintInformation } from "jup-fork";

export interface TokenInfo {
  address: PublicKey;
  decimals: number;
}

export type TokenMap = Record<string, TokenInfo>;

export function loadTokenMap(): TokenMap {
  const csv = fs.readFileSync(
    path.join(process.cwd(), "public", "solana_tokens.csv"),
    "utf8",
  );
  const rows = csv.trim().split("\n");
  const dataRows = rows.slice(1); // skip header
  const map: TokenMap = {};
  for (const row of dataRows) {
    const [symbol, address, decimalsStr] = row.split(",");
    if (!symbol || !address || !decimalsStr) continue;
    const decimals = Number.parseInt(decimalsStr, 10);
    if (!Number.isInteger(decimals) || decimals < 0) continue;
    map[symbol.toLowerCase()] = { address: new PublicKey(address), decimals };
  }
  return map;
}

type TokenLookupResult =
  | { kind: "ok"; token: TokenInfo }
  | { kind: "candidates"; tokens: MintInformation[] }
  | { kind: "not_found" };

export async function getTokenDetails(
  symbolOrAddress: string,
  rpc: string,
  jup: JupiterApi,
  // Currated Registry of Tokens
  tokenMap: TokenMap,
  minScore: number = 90,
): Promise<TokenLookupResult> {
  if (isAddress(symbolOrAddress)) {
    const { data: token } = await fetchMint(
      createSolanaRpc(rpc),
      symbolOrAddress as Address,
    );

    return {
      kind: "ok",
      token: {
        address: new PublicKey(symbolOrAddress),
        decimals: token.decimals,
      },
    };
  }
  // If we already have it in our list:
  const currated = tokenMap[symbolOrAddress.toLowerCase()];
  if (currated) {
    return { kind: "ok", token: currated };
  }
  // Jupiter Fetch.
  console.log("Retrieving token from Jupiter...", symbolOrAddress);
  const possibleTokens = await jup.searchToken(symbolOrAddress, minScore);
  if (possibleTokens.length === 0) {
    console.error("No tokens matching search found", symbolOrAddress);
    return { kind: "not_found" };
  }
  if (possibleTokens.length === 1) {
    const match = possibleTokens[0];
    return {
      kind: "ok",
      token: asTokenInfo(possibleTokens[0]),
    };
  }
  // Multiple Matches for search!
  const perfectScores = possibleTokens.filter(minScoreFilter(100));
  if (perfectScores.length === 0) {
    return { kind: "candidates", tokens: possibleTokens };
  }
  if (perfectScores.length === 1) {
    return { kind: "ok", token: asTokenInfo(perfectScores[0]) };
  }
  // Most likely candidates.
  return { kind: "candidates", tokens: perfectScores };
}

const asTokenInfo = (info: MintInformation): TokenInfo => {
  const { id, decimals } = info;
  if (!id || !decimals) {
    throw new Error(`Insufficient Token Data! ${info}`);
  }
  return { address: new PublicKey(id), decimals };
};
