import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

export const solanaAddressSchema = z.string().refine((v) => {
  try {
    new PublicKey(v);
    return true;
  } catch {
    return false;
  }
}, "Invalid Solana public key");

export const QuoteQuerySchema = z.object({
  solAddress: solanaAddressSchema,
  // TODO: Accept Symbols aswell.
  inputMint: solanaAddressSchema,
  outputMint: solanaAddressSchema,
  amount: z.coerce.number().int().positive(),
});

export type QuoteQuery = z.infer<typeof QuoteQuerySchema>;

export type ValidationResult<T> =
  | { ok: true; query: T }
  | { ok: false; error: object };

export function validateQuery(
  params: URLSearchParams,
): ValidationResult<QuoteQuery> {
  const result = QuoteQuerySchema.safeParse(
    Object.fromEntries(params.entries()),
  );
  if (!result.success) {
    return { ok: false, error: z.treeifyError(result.error) };
  }
  return { ok: true, query: result.data };
}
