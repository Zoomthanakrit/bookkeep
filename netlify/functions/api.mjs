import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const respond = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };

  const supabase = getSupabase();
  const path = event.path.replace("/.netlify/functions/api", "").replace("/api", "");
  const params = new URLSearchParams(event.rawQuery || "");

  try {
    // ─── GET /api/transactions ───
    if (event.httpMethod === "GET" && (path === "" || path === "/" || path === "/transactions")) {
      const page = parseInt(params.get("page") || "0");
      const limit = parseInt(params.get("limit") || "5000");
      const from = page * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .order("date", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return respond(200, { data, count, page, limit });
    }

    // ─── POST /api/transactions ───
    if (event.httpMethod === "POST" && (path === "" || path === "/" || path === "/transactions")) {
      const body = JSON.parse(event.body);
      const row = {
        date: body.date,
        type: body.type,
        category: body.category,
        subcategory: body.subcategory,
        description: body.description || "",
        amount: parseFloat(body.amount),
        fund_source: body.fundSource || "income",
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert([row])
        .select()
        .single();

      if (error) throw error;
      return respond(201, data);
    }

    // ─── PUT /api/transactions?id=xxx ───
    if (event.httpMethod === "PUT") {
      const id = params.get("id");
      if (!id) return respond(400, { error: "Missing id" });

      const body = JSON.parse(event.body);
      const row = {
        date: body.date,
        type: body.type,
        category: body.category,
        subcategory: body.subcategory,
        description: body.description || "",
        amount: parseFloat(body.amount),
        fund_source: body.fundSource || "income",
      };

      const { data, error } = await supabase
        .from("transactions")
        .update(row)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return respond(200, data);
    }

    // ─── DELETE /api/transactions?id=xxx ───
    if (event.httpMethod === "DELETE") {
      const id = params.get("id");
      if (!id) return respond(400, { error: "Missing id" });

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return respond(200, { deleted: id });
    }

    return respond(404, { error: "Not found" });
  } catch (err) {
    console.error("API error:", err);
    return respond(500, { error: err.message || "Internal server error" });
  }
}
