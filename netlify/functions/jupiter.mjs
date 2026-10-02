const QUOTE = "https://api.jup.ag/swap/v1/quote";
const SWAP = "https://api.jup.ag/swap/v1/swap";
const PRICE = "https://api.jup.ag/price/v3";
const CHART = "https://datapi.jup.ag/v2/charts";
const CHART_INTERVALS = new Set(["1_MINUTE", "5_MINUTE", "15_MINUTE", "1_HOUR", "4_HOUR", "1_DAY"]);
const LIMIT = "https://api.jup.ag/trigger/v1/createOrder";
const LIMIT_EXECUTE = "https://api.jup.ag/trigger/v1/execute";
const SOL = "So11111111111111111111111111111111111111112";
const TCODE = "6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory";
const TCODE_FEE_ACCOUNT = "4z379ogRNL1TkFY59ZmU6d69SSn3eDN23pZh248peHkc";
const FEE_BPS = "20";

function chargesTcodeFee(inputMint, outputMint) {
  return inputMint === TCODE || outputMint === TCODE;
}

function mintList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(item))
    .slice(0, 50);
}

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
    const ids = mintList(incoming.searchParams.get("ids"));
    const query = (ids.length ? ids : [SOL, TCODE]).join(",");
    const response = await fetch(`${PRICE}?ids=${query}`, { headers: { "x-api-key": key } });
    const body = await response.json();
    return json({
      prices: body && typeof body === "object" ? body : {},
      sol: body?.[SOL] ?? null,
      tcode: body?.[TCODE] ?? null,
    }, response.ok ? 200 : response.status);
  }

  if (request.method === "GET" && incoming.searchParams.get("action") === "chart") {
    const mint = mintList(incoming.searchParams.get("mint"))[0];
    const interval = incoming.searchParams.get("interval") || "15_MINUTE";
    const candles = Math.min(200, Math.max(2, Number(incoming.searchParams.get("candles")) || 96));
    if (!mint) return json({ error: "Missing mint." }, 400);
    if (!CHART_INTERVALS.has(interval)) return json({ error: "Unsupported chart interval." }, 400);
    const upstream = new URL(`${CHART}/${mint}`);
    upstream.searchParams.set("interval", interval);
    upstream.searchParams.set("to", String(Date.now()));
    upstream.searchParams.set("candles", String(candles));
    const response = await fetch(upstream);
    const body = await response.json();
    const points = Array.isArray(body?.candles)
      ? body.candles
          .filter((candle) => Number.isFinite(candle?.time) && Number.isFinite(candle?.close))
          .map((candle) => ({ time: candle.time, close: candle.close }))
      : [];
    return json({ candles: points }, response.ok ? 200 : response.status);
  }

  if (request.method === "GET") {
    const upstream = new URL(QUOTE);
    for (const name of ["inputMint", "outputMint", "amount", "slippageBps"]) {
      const value = incoming.searchParams.get(name);
      if (!value) return json({ error: `Missing ${name}.` }, 400);
      upstream.searchParams.set(name, value);
    }
    const inputMint = incoming.searchParams.get("inputMint");
    const outputMint = incoming.searchParams.get("outputMint");
    if (chargesTcodeFee(inputMint, outputMint)) upstream.searchParams.set("platformFeeBps", FEE_BPS);
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
    const quote = body.quoteResponse;
    if (chargesTcodeFee(quote.inputMint, quote.outputMint)) swapBody.feeAccount = TCODE_FEE_ACCOUNT;
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
