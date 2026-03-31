// Cloudflare Pages Function
// Cloudflare doesn't support npm imports in Pages Functions directly,
// so we use the Supabase REST API with fetch instead of the JS client.

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function supaFetch(env, path, options = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "apikey": env.SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
}

function respond(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: getHeaders(),
  });
}

// Handle all methods
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getHeaders() });
  }

  try {
    // GET — list all
    if (method === "GET") {
      const res = await supaFetch(env, "transactions?select=*&order=date.desc&limit=5000");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return respond(200, { data });
    }

    // POST — add
    if (method === "POST") {
      const body = await request.json();
      const row = {
        date: body.date,
        type: body.type,
        category: body.category,
        subcategory: body.subcategory,
        description: body.description || "",
        amount: parseFloat(body.amount),
        fund_source: body.fundSource || "income",
      };
      const res = await supaFetch(env, "transactions", {
        method: "POST",
        body: JSON.stringify(row),
        prefer: "return=representation",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return respond(201, data[0]);
    }

    // PUT — update
    if (method === "PUT") {
      if (!id) return respond(400, { error: "Missing id" });
      const body = await request.json();
      const row = {
        date: body.date,
        type: body.type,
        category: body.category,
        subcategory: body.subcategory,
        description: body.description || "",
        amount: parseFloat(body.amount),
        fund_source: body.fundSource || "income",
      };
      const res = await supaFetch(env, `transactions?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify(row),
        prefer: "return=representation",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return respond(200, data[0]);
    }

    // DELETE
    if (method === "DELETE") {
      if (!id) return respond(400, { error: "Missing id" });
      const res = await supaFetch(env, `transactions?id=eq.${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return respond(200, { deleted: id });
    }

    return respond(404, { error: "Not found" });
  } catch (err) {
    console.error("API error:", err);
    return respond(500, { error: err.message || "Server error" });
  }
}
