import { Router, Request, Response } from "express";
import { JupiterApi } from "../../lib/protocol.js";
import { validateQuery, isInvalid, PortfolioSchema } from "../../lib/schema.js";
import { TokenNotFoundError } from "../../lib/error.js";

const portfolioHandler = Router();

portfolioHandler.get("/", async (req: Request, res: Response) => {
  const input = validateQuery(req, PortfolioSchema);
  if (isInvalid(input)) {
    res
      .status(400)
      .json({ errorType: "InvalidInput", description: input.error });
    return;
  }

  try {
    const jupiter = new JupiterApi();
    const portfolio = await jupiter.getHoldings(input.query.solAddress);
    res.status(200).json(portfolio);
  } catch (err: unknown) {
    // 404 Token Not Found
    if (err instanceof TokenNotFoundError) {
      res.status(err.status).json(err.toJSON());
      return;
    }

    // Everything else -> 500
    console.error("Unhandled error in /api/quote:", err);
    res.status(500).json({
      errorType: "InternalError",
      description: "Internal Server Error",
    });
  }
});

export default portfolioHandler;
