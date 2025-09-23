import { isAddress } from "../lib/util.js";
import { z } from "zod";

export const solanaAddressSchema = z
  .string()
  .refine(isAddress, "Invalid Solana public key");

export const QuoteQuerySchema = z.object({
  solAddress: solanaAddressSchema,
  // These can be either addresses or symbols.
  inputMint: z.string(),
  outputMint: z.string(),
  amount: z.coerce.number().positive(),
});

export type QuoteQuery = z.infer<typeof QuoteQuerySchema>;

export type ParsedQuoteQuery = {
  solAddress: string;
  inputMint: string;
  outputMint: string;
  amount: number;
};

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
