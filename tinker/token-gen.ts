import fs from "fs";

// URL of the Solana token list
const URL =
  "https://raw.githubusercontent.com/solana-labs/token-list/refs/heads/main/src/tokens/solana.tokenlist.json";

// 1) Interface for a valid token entry
export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

export type DuplicateIndex = Record<string, string[]>;

// 2) Type guard: checks that an unknown value is a TokenInfo
export function isTokenInfo(obj: any): obj is TokenInfo {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.symbol === "string" &&
    obj.symbol.trim().length > 0 &&
    typeof obj.address === "string" &&
    obj.address.trim().length > 0 &&
    typeof obj.decimals === "number" &&
    Number.isFinite(obj.decimals)
  );
}

async function main() {
  // 1) Fetch and parse the token list
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Failed to fetch token list: ${res.status}`);
  const data = (await res.json()) as { tokens: unknown[] };

  // 3) Filter and validate
  const tokens: TokenInfo[] = [];
  for (const t of data.tokens) {
    if (isTokenInfo(t)) {
      tokens.push({
        symbol: t.symbol,
        address: t.address,
        decimals: t.decimals,
      });
    }
  }

  // 4) Sort by symbol
  tokens.sort((a, b) => a.symbol.localeCompare(b.symbol));

  // 5) Build map of symbol -> address[]
  const bySymbol = new Map<string, string[]>();
  for (const t of tokens) {
    const arr = bySymbol.get(t.symbol) ?? [];
    arr.push(t.address);
    bySymbol.set(t.symbol, arr);
  }

  // 6) Extract only duplicates into a plain object { [symbol]: TokenInfo[] }
  const duplicatesObj: DuplicateIndex = {};
  for (const [symbol, arr] of bySymbol.entries()) {
    if (arr.length > 1) {
      // keep array entries sorted consistently (optional: by address)
      arr.sort((a, b) => a.localeCompare(b));
      duplicatesObj[symbol] = arr;
    }
  }

  // 7) Write duplicates to JSON (pretty-printed)
  const duplicatesJson = JSON.stringify(duplicatesObj, null, 2);
  fs.writeFileSync("public/duplicates.json", duplicatesJson);
  console.log(
    `📄 Wrote duplicates JSON with ${Object.keys(duplicatesObj).length} duplicate symbol(s) to duplicates.json`,
  );
  // remove duplicates
  const filteredTokens = tokens.filter((x) => !(x.symbol in duplicatesObj));

  // 6) Convert to CSV
  const header = "symbol,address,decimals";
  const rows = filteredTokens.map(
    (t) => `${t.symbol},${t.address},${t.decimals}`,
  );
  const csv = [header, ...rows].join("\n");

  // 4) Write to a file
  fs.writeFileSync("public/solana_tokens.csv.gen", csv);
  console.log(
    "✅ CSV written to solana_tokens.csv with",
    filteredTokens.length,
    "entries",
  );
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
