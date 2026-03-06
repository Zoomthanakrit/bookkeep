import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const respond = (code, body) => ({ statusCode: code, headers, body: JSON.stringify(body) });

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };

  const supabase = getSupabase();
  const params = new URLSearchParams(event.rawQuery || "");

  try {
    // GET — list all
    if (event.httpMethod === "GET") {
      const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false }).limit(5000);
      if (error) throw error;
      return respond(200, { data });
    }

    // POST — add
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      const { data, error } = await supabase.from("transactions").insert([{
        date: body.date, type: body.type, category: body.category,
        subcategory: body.subcategory, description: body.description || "",
        amount: parseFloat(body.amount), fund_source: body.fundSource || "income",
      }]).select().single();
      if (error) throw error;
      return respond(201, data);
    }

    // PUT — update
    if (event.httpMethod === "PUT") {
      const id = params.get("id");
      if (!id) return respond(400, { error: "Missing id" });
      const body = JSON.parse(event.body);
      const { data, error } = await supabase.from("transactions").update({
        date: body.date, type: body.type, category: body.category,
        subcategory: body.subcategory, description: body.description || "",
        amount: parseFloat(body.amount), fund_source: body.fundSource || "income",
      }).eq("id", id).select().single();
      if (error) throw error;
      return respond(200, data);
    }

    // DELETE
    if (event.httpMethod === "DELETE") {
      const id = params.get("id");
      if (!id) return respond(400, { error: "Missing id" });
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      return respond(200, { deleted: id });
    }

    return respond(404, { error: "Not found" });
  } catch (err) {
    console.error("API error:", err);
    return respond(500, { error: err.message || "Server error" });
  }
}
