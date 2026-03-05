// ─── API layer — talks to Netlify Functions → Supabase ───
const API = "/api/transactions";

export async function fetchTransactions() {
  const r = await fetch(API);
  if (!r.ok) throw new Error("Failed to load");
  const json = await r.json();
  return json.data.map(row => ({
    id: row.id,
    date: row.date,
    type: row.type,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description || "",
    amount: parseFloat(row.amount),
    fundSource: row.fund_source || "income",
  }));
}

export async function addTransaction(tx) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  if (!r.ok) throw new Error("Failed to save");
  const row = await r.json();
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description || "",
    amount: parseFloat(row.amount),
    fundSource: row.fund_source || "income",
  };
}

export async function updateTransaction(id, tx) {
  const r = await fetch(`${API}?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  if (!r.ok) throw new Error("Failed to update");
  const row = await r.json();
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description || "",
    amount: parseFloat(row.amount),
    fundSource: row.fund_source || "income",
  };
}

export async function deleteTransaction(id) {
  const r = await fetch(`${API}?id=${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Failed to delete");
  return true;
}
