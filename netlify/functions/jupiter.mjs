const QUOTE = "https://api.jup.ag/swap/v1/quote";
const SWAP = "https://api.jup.ag/swap/v1/swap";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (request) => {
  const key = process.env.JUPITER_API_KEY;
  if (!key) return json({ error: "Jupiter is not configured on this site." }, 500);

  if (request.method === "GET") {
    const incoming = new URL(request.url);
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
    if (!body?.quoteResponse || typeof body.userPublicKey !== "string") {
      return json({ error: "Missing quote or wallet address." }, 400);
    }
    const response = await fetch(SWAP, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        quoteResponse: body.quoteResponse,
        userPublicKey: body.userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
      }),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  }

  return json({ error: "Method not allowed." }, 405);
};
