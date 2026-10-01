const QUOTE = "https://api.jup.ag/swap/v1/quote";
const SWAP = "https://api.jup.ag/swap/v1/swap";
const PRICE = "https://api.jup.ag/price/v3";
const LIMIT = "https://api.jup.ag/trigger/v1/createOrder";
const LIMIT_EXECUTE = "https://api.jup.ag/trigger/v1/execute";
const SOL = "So11111111111111111111111111111111111111112";
const TCODE = "6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (request) => {
  const key = process.env.JUPITER_API_KEY;
  if (!key) return json({ error: "Jupiter is not configured on this site." }, 500);
  const headers = { "x-api-key": key, "content-type": "application/json" };
  const incoming = new URL(request.url);

  if (request.method === "GET" && incoming.searchParams.get("action") === "price") {
    const response = await fetch(`${PRICE}?ids=${SOL},${TCODE}`, { headers: { "x-api-key": key } });
    const body = await response.json();
    return json({
      sol: body?.[SOL] ?? null,
      tcode: body?.[TCODE] ?? null,
    }, response.ok ? 200 : response.status);
  }

  if (request.method === "GET") {
    const upstream = new URL(QUOTE);
    for (const name of ["inputMint", "outputMint", "amount", "slippageBps"]) {
      const value = incoming.searchParams.get(name);
      if (!value) return json({ error: `Missing ${name}.` }, 400);
      upstream.searchParams.set(name, value);
    }
    const response = await fetch(upstream, { headers: { "x-api-key": key } });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  }

  if (request.method === "POST") {
    const body = await request.json();
    if (body?.action === "limit") {
      const pair = [body.inputMint, body.outputMint];
      if (!pair.includes(SOL) || !pair.includes(TCODE)) {
        return json({ error: "Limit orders are only for SOL and official $TCODE." }, 400);
      }
      const response = await fetch(LIMIT, {
        method: "POST",
        headers,
        body: JSON.stringify({
          maker: body.userPublicKey,
          payer: body.userPublicKey,
          inputMint: body.inputMint,
          outputMint: body.outputMint,
          params: { makingAmount: body.makingAmount, takingAmount: body.takingAmount },
          computeUnitPrice: "auto",
        }),
      });
      return new Response(await response.text(), {
        status: response.status,
        headers: { "content-type": "application/json" },
      });
    }
    if (body?.action === "limit-execute") {
      const response = await fetch(LIMIT_EXECUTE, {
        method: "POST",
        headers,
        body: JSON.stringify({
          signedTransaction: body.signedTransaction,
          requestId: body.requestId,
        }),
      });
      return new Response(await response.text(), {
        status: response.status,
        headers: { "content-type": "application/json" },
      });
    }
    if (!body?.quoteResponse || typeof body.userPublicKey !== "string") {
      return json({ error: "Missing quote or wallet address." }, 400);
    }
    const swapBody = {
      quoteResponse: body.quoteResponse,
      userPublicKey: body.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    };
    if (body.prioritizationFeeLamports) swapBody.prioritizationFeeLamports = body.prioritizationFeeLamports;
    const response = await fetch(SWAP, {
      method: "POST",
      headers,
      body: JSON.stringify(swapBody),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  }

  return json({ error: "Method not allowed." }, 405);
};
