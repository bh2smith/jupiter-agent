import { isAddress } from "../lib/util.js";
import { z } from "zod";

export const solanaAddressSchema = z
  .string()
  .refine(isAddress, "Invalid Solana public key");

export const QuoteSchema = z.object({
  solAddress: solanaAddressSchema,
  // These can be either addresses or symbols.
  inputMint: z.string(),
  outputMint: z.string(),
  amount: z.coerce.number().positive(),
});

export type QuoteQuery = z.infer<typeof QuoteSchema>;

export type ParsedQuoteQuery = {
  solAddress: string;
  inputMint: string;
  outputMint: string;
  amount: number;
};

export type ValidationResult<T> =
  | { ok: true; query: T }
  | { ok: false; error: object };

export function validateQuery<T extends z.ZodType>(
  req: { url: string },
  schema: T,
): ValidationResult<z.infer<T>> {
  console.log("Raw request", req.url);
  if (req.url.startsWith("/?")) {
    req.url = req.url.slice(2);
  }
  const params = new URLSearchParams(req.url);
  console.log("params", params);
  const result = schema.safeParse(Object.fromEntries(params.entries()));
  console.log("parsed query", result);
  if (!result.success) {
    return { ok: false as const, error: z.treeifyError(result.error) };
  }
  return { ok: true as const, query: result.data };
}

export function isInvalid<T>(
  result: ValidationResult<T>,
): result is { ok: false; error: object } {
  return result.ok === false;
}
