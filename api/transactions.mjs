import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

// Vercel uses (req, res) format instead of Netlify's event/handler format
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const supabase = getSupabase();

  try {
    // GET — list all
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(5000);

      if (error) throw error;
      return res.status(200).json({ data });
    }

    // POST — add
    if (req.method === "POST") {
      const body = req.body;
      const { data, error } = await supabase
        .from("transactions")
        .insert([{
          date: body.date,
          type: body.type,
          category: body.category,
          subcategory: body.subcategory,
          description: body.description || "",
          amount: parseFloat(body.amount),
          fund_source: body.fundSource || "income",
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // PUT — update
    if (req.method === "PUT") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const body = req.body;
      const { data, error } = await supabase
        .from("transactions")
        .update({
          date: body.date,
          type: body.type,
          category: body.category,
          subcategory: body.subcategory,
          description: body.description || "",
          amount: parseFloat(body.amount),
          fund_source: body.fundSource || "income",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    // DELETE
    if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return res.status(200).json({ deleted: id });
    }

    return res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
