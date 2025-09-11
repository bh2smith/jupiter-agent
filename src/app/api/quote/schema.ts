import { z } from "zod";

export const QuoteQuerySchema = z.object({
  inputMint: z.string(),
  outputMint: z.string(),
  amount: z.coerce.number(),
});

export type QuoteQuery = z.infer<typeof QuoteQuerySchema>;

export type ValidationResult<T> =
  | { ok: true; query: T }
  | { ok: false; error: string };

export function validateQuery(
  params: URLSearchParams,
): ValidationResult<QuoteQuery> {
  const result = QuoteQuerySchema.safeParse(
    Object.fromEntries(params.entries()),
  );
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, query: result.data };
}
