import { google } from "googleapis";

// ─── Auth ───
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SHEET_ID = () => process.env.GOOGLE_SHEET_ID;
const RANGE = "transactions!A:F";

// ─── Helpers ───
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const respond = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

// ─── Handler ───
export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const sheets = getSheets();
  const path = event.path.replace("/.netlify/functions/sheets", "").replace("/api", "");

  try {
    // GET /api/transactions — list all
    if (event.httpMethod === "GET" && (path === "" || path === "/" || path === "/transactions")) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID(),
        range: RANGE,
      });

      const rows = res.data.values || [];
      if (rows.length <= 1) return respond(200, []); // only header row

      const data = rows.slice(1).map((row) => ({
        id: row[0],
        date: row[1],
        type: row[2],
        category: row[3],
        description: row[4] || "",
        amount: parseFloat(row[5]) || 0,
      }));

      return respond(200, data);
    }

    // POST /api/transactions — add new
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const row = [id, body.date, body.type, body.category, body.description || "", body.amount];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID(),
        range: RANGE,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });

      return respond(201, { id, ...body });
    }

    // DELETE /api/transactions?id=xxx — delete by ID
    if (event.httpMethod === "DELETE") {
      const params = new URLSearchParams(event.rawQuery || "");
      const deleteId = params.get("id");
      if (!deleteId) return respond(400, { error: "Missing id parameter" });

      // Read all rows, find the row to delete
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID(),
        range: RANGE,
      });

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] === deleteId);
      if (rowIndex < 0) return respond(404, { error: "Not found" });

      // Get the sheet's internal ID
      const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID() });
      const sheetMeta = meta.data.sheets.find((s) => s.properties.title === "transactions");
      const sheetGid = sheetMeta ? sheetMeta.properties.sheetId : 0;

      // Delete the row
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID(),
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetGid,
                  dimension: "ROWS",
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });

      return respond(200, { deleted: deleteId });
    }

    return respond(404, { error: "Not found" });
  } catch (err) {
    console.error("Sheets API error:", err);
    return respond(500, { error: err.message || "Internal server error" });
  }
}
