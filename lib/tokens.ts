// 1. loads the solana_tokens.csv file from public/solana_tokens.csv
// exports a function getTokenData(symbool: string) -> TokenInfo

import { getMint } from "@solana/spl-token";
import { PublicKey, type Connection } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { isAddress } from "@/lib/util";

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

export async function getTokenDetails(
  symbolOrAddress: string,
  connection: Connection,
  // Currated Registry of Tokens
  tokenMap: TokenMap,
): Promise<TokenInfo | undefined> {
  if (isAddress(symbolOrAddress)) {
    return getMint(connection, new PublicKey(symbolOrAddress));
  }

  // TokenMap has lower cased (sanitized) symbols
  return tokenMap[symbolOrAddress.toLowerCase()];
}
