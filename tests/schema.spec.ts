import { describe, it, expect } from "bun:test";
import { QuoteQuerySchema, solanaAddressSchema } from "@/lib/schema";
import z from "zod";

describe("Tool Schemas", () => {
  const validAddress44 = "So11111111111111111111111111111111111111112";
  const validAddress42 = "11oWVpNVuSeBbwEjkC6RQfVaGzgXdMPUYtkiREgWGh";

  it("Solana Address Schema", async () => {
    expect(solanaAddressSchema.safeParse(validAddress44).success).toBe(true);
    expect(solanaAddressSchema.safeParse(validAddress42).success).toBe(true);

    expect(solanaAddressSchema.safeParse("1234567890").success).toBe(false);
  });

  it("Solana Address Schema", async () => {
    // Address validation tested above.
    const common = {
      solAddress: validAddress44,
      inputMint: validAddress42,
      outputMint: validAddress44,
    };
    const schema = QuoteQuerySchema;
    expect(schema.safeParse({ ...common, amount: 1 }).success).toBe(true);
    expect(schema.safeParse({ ...common, amount: "1" }).success).toBe(true);

    expect(schema.safeParse({ ...common, amount: "1.23" }).success).toBe(false);
    expect(schema.safeParse({ ...common, amount: -1 }).success).toBe(false);
    expect(schema.safeParse({ ...common, amount: 0 }).success).toBe(false);

    const zodError = schema.safeParse({ fart: "coin" });
    expect(zodError.success).toBe(false);
    expect(z.treeifyError(zodError.error!)).toStrictEqual({
      errors: [],
      properties: {
        solAddress: {
          errors: ["Invalid input: expected string, received undefined"],
        },
        inputMint: {
          errors: ["Invalid input: expected string, received undefined"],
        },
        outputMint: {
          errors: ["Invalid input: expected string, received undefined"],
        },
        amount: {
          errors: ["Invalid input: expected number, received NaN"],
        },
      },
    });
  });
});
