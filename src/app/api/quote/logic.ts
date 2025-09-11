import type { QuoteQuery } from "./schema";

type ResponseData = {
  quote: object;
};

export async function logic(_: QuoteQuery): Promise<ResponseData> {
  // TODO: implement Jupiter API Quote request.
  return { quote: { quoteResponse: { ok: true } } };
}
