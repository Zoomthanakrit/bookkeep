// ─── Config ───
const API = "/api/transactions";
const CATEGORIES_INCOME = ["Booking Payment", "Deposit", "Late Fee", "Extra Service", "Other Income"];
const CATEGORIES_EXPENSE = ["Cleaning", "Maintenance", "Supplies", "Utilities", "Commission", "Insurance", "Marketing", "Other Expense"];

// ─── State ───
let transactions = [];
let currentView = "dashboard";
let reportMonth = new Date().toISOString().slice(0, 7);

// ─── API Calls ───
async function apiGet() {
  try {
    const r = await fetch(API);
    if (!r.ok) throw new Error("Failed to load");
    transactions = await r.json();
    transactions.sort((a, b) => b.date.localeCompare(a.date));
  } catch (e) {
    console.error(e);
    showToast("Failed to load data — check your connection", true);
  }
}

async function apiAdd(tx) {
  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });
    if (!r.ok) throw new Error("Failed to save");
    const saved = await r.json();
    transactions.unshift(saved);
    showToast("Transaction saved!");
  } catch (e) {
    console.error(e);
    showToast("Failed to save — try again", true);
  }
}

async function apiDelete(id) {
  try {
    const r = await fetch(`${API}?id=${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error("Failed to delete");
    transactions = transactions.filter((t) => t.id !== id);
    showToast("Deleted");
  } catch (e) {
    console.error(e);
    showToast("Failed to delete — try again", true);
  }
}

// ─── Helpers ───
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const monthKey = (d) => d.slice(0, 7);
const todayStr = () => new Date().toISOString().split("T")[0];

function monthLabel(m) {
  return new Date(m + "-01").toLocaleString("default", { month: "long", year: "numeric" });
}

function getMonths() {
  const set = new Set(transactions.map((t) => monthKey(t.date)));
  set.add(reportMonth);
  return [...set].sort().reverse();
}

function getMonthTxs() {
  return transactions.filter((t) => monthKey(t.date) === reportMonth);
}

function showToast(msg, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.background = isError ? "#ff5252" : "#00e676";
  el.style.color = isError ? "#fff" : "#0f0f23";
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

// ─── CSV Export ───
function exportCSV(rows, filename) {
  const header = "Date,Type,Category,Description,Amount\n";
  const body = rows.map((r) => `${r.date},${r.type},${r.category},"${r.description}",${r.amount}`).join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Render Functions ───
function render() {
  const app = document.getElementById("app");
  if (currentView === "dashboard") renderDashboard(app);
  else if (currentView === "add") renderAdd(app);
  else if (currentView === "report") renderReport(app);
  updateNav();
}

function updateNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === currentView);
  });
}

function renderDashboard(app) {
  const txs = getMonthTxs();
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = income - expense;
  const allIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const allExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const total = income + expense || 1;

  app.innerHTML = `
    <div class="month-selector">
      <select id="dashMonth" onchange="reportMonth=this.value;render()">
        ${getMonths().map((m) => `<option value="${m}" ${m === reportMonth ? "selected" : ""}>${monthLabel(m)}</option>`).join("")}
      </select>
      <span class="muted">${txs.length} transactions</span>
    </div>

    <div class="stat-row">
      <div class="stat-card" style="border-left-color:#00e676">
        <div class="stat-label">Income</div>
        <div class="stat-value" style="color:#00e676">${fmt(income)}</div>
      </div>
      <div class="stat-card" style="border-left-color:#ff5252">
        <div class="stat-label">Expenses</div>
        <div class="stat-value" style="color:#ff5252">${fmt(expense)}</div>
      </div>
      <div class="stat-card" style="border-left-color:${net >= 0 ? "#00e676" : "#ff5252"}">
        <div class="stat-label">Net Profit</div>
        <div class="stat-value" style="color:${net >= 0 ? "#00e676" : "#ff5252"}">${fmt(net)}</div>
      </div>
    </div>

    <div class="mini-bar">
      <div style="width:${(income / total) * 100}%;background:#00e676"></div>
      <div style="width:${(expense / total) * 100}%;background:#ff5252"></div>
    </div>

    <div class="all-time muted">
      All-Time Balance: <span style="color:${allIncome - allExpense >= 0 ? "#00e676" : "#ff5252"};font-weight:700">${fmt(allIncome - allExpense)}</span>
    </div>

    <div class="tx-list">
      ${txs.length === 0 ? '<div class="empty">No transactions this month. Tap <strong>+ Add</strong> to start.</div>' : ""}
      ${txs
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(
          (tx) => `
        <div class="tx-row">
          <div class="tx-dot" style="background:${tx.type === "income" ? "#00e676" : "#ff5252"}"></div>
          <div class="tx-info">
            <div class="tx-desc">${tx.description || tx.category}</div>
            <div class="tx-meta muted">${tx.category} · ${tx.date}</div>
          </div>
          <div class="tx-amount" style="color:${tx.type === "income" ? "#00e676" : "#ff5252"}">
            ${tx.type === "income" ? "+" : "−"} ${fmt(tx.amount)}
          </div>
          <button class="tx-del" onclick="deleteTx('${tx.id}')">✕</button>
        </div>`
        )
        .join("")}
    </div>
  `;
}

function renderAdd(app) {
  app.innerHTML = `
    <div class="form-card">
      <h2>New Transaction</h2>
      <div class="type-toggle">
        <button id="typeIncome" class="type-btn active-income" onclick="setFormType('income')">💰 Income</button>
        <button id="typeExpense" class="type-btn" onclick="setFormType('expense')">💸 Expense</button>
      </div>
      <label class="field-label">Date</label>
      <input type="date" id="fDate" value="${todayStr()}" />
      <label class="field-label">Category</label>
      <select id="fCategory">
        ${CATEGORIES_INCOME.map((c) => `<option>${c}</option>`).join("")}
      </select>
      <label class="field-label">Description</label>
      <input type="text" id="fDesc" placeholder="e.g. Room 204 — John Smith" />
      <label class="field-label">Amount (USD)</label>
      <input type="number" id="fAmount" min="0" step="0.01" placeholder="0.00" class="amount-input" />
      <button class="btn-primary" onclick="submitForm()">Save Transaction</button>
    </div>
  `;
  window._formType = "income";
}

function renderReport(app) {
  const txs = getMonthTxs();
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  function catBreakdown(type) {
    const filtered = txs.filter((t) => t.type === type);
    const map = {};
    filtered.forEach((t) => (map[t.category] = (map[t.category] || 0) + t.amount));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  const incCats = catBreakdown("income");
  const expCats = catBreakdown("expense");

  function catHTML(items, total, color) {
    if (!items.length) return "";
    return items
      .map(
        ([cat, amt]) => `
      <div class="cat-item">
        <div class="cat-row"><span>${cat}</span><span class="mono">${fmt(amt)} (${((amt / total) * 100).toFixed(1)}%)</span></div>
        <div class="cat-bar-bg"><div class="cat-bar" style="width:${(amt / total) * 100}%;background:${color}"></div></div>
      </div>`
      )
      .join("");
  }

  app.innerHTML = `
    <div class="report-header">
      <h2>Monthly Report</h2>
      <select id="repMonth" onchange="reportMonth=this.value;render()">
        ${getMonths().map((m) => `<option value="${m}" ${m === reportMonth ? "selected" : ""}>${monthLabel(m)}</option>`).join("")}
      </select>
    </div>

    <div class="stat-row">
      <div class="stat-card" style="border-left-color:#00e676">
        <div class="stat-label">Total Income</div>
        <div class="stat-value" style="color:#00e676">${fmt(income)}</div>
      </div>
      <div class="stat-card" style="border-left-color:#ff5252">
        <div class="stat-label">Total Expenses</div>
        <div class="stat-value" style="color:#ff5252">${fmt(expense)}</div>
      </div>
      <div class="stat-card" style="border-left-color:${net >= 0 ? "#00e676" : "#ff5252"}">
        <div class="stat-label">Net Profit</div>
        <div class="stat-value" style="color:${net >= 0 ? "#00e676" : "#ff5252"}">${fmt(net)}</div>
      </div>
    </div>

    ${incCats.length ? `<div class="breakdown-card"><h3 style="color:#00e676">Income Breakdown</h3>${catHTML(incCats, income, "#00e676")}</div>` : ""}
    ${expCats.length ? `<div class="breakdown-card"><h3 style="color:#ff5252">Expense Breakdown</h3>${catHTML(expCats, expense, "#ff5252")}</div>` : ""}

    <div class="breakdown-card">
      <h3 class="muted">All Transactions (${txs.length})</h3>
      ${txs.length === 0 ? '<div class="empty">No data for this month.</div>' : ""}
      ${
        txs.length > 0
          ? `<div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
        <tbody>${txs
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(
            (tx) => `<tr>
            <td class="mono">${tx.date}</td>
            <td>${tx.type}</td>
            <td>${tx.category}</td>
            <td class="muted">${tx.description || "—"}</td>
            <td class="mono" style="color:${tx.type === "income" ? "#00e676" : "#ff5252"};font-weight:600">${fmt(tx.amount)}</td>
          </tr>`
          )
          .join("")}</tbody></table></div>`
          : ""
      }
    </div>

    <button class="btn-primary" onclick="exportCSV(getMonthTxs(),'booking-report-${reportMonth}.csv')" ${txs.length === 0 ? "disabled" : ""}>
      📥 Export Month to CSV
    </button>
    ${transactions.length > 0 ? `<button class="btn-outline" onclick="exportCSV(transactions,'booking-all.csv')">📥 Export All Data to CSV</button>` : ""}
  `;
}

// ─── Actions ───
window.setFormType = function (type) {
  window._formType = type;
  const cats = type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;
  document.getElementById("fCategory").innerHTML = cats.map((c) => `<option>${c}</option>`).join("");
  document.getElementById("typeIncome").className = "type-btn" + (type === "income" ? " active-income" : "");
  document.getElementById("typeExpense").className = "type-btn" + (type === "expense" ? " active-expense" : "");
};

window.submitForm = async function () {
  const amount = parseFloat(document.getElementById("fAmount").value);
  if (!amount || isNaN(amount)) {
    showToast("Please enter a valid amount", true);
    return;
  }
  const tx = {
    date: document.getElementById("fDate").value,
    type: window._formType || "income",
    category: document.getElementById("fCategory").value,
    description: document.getElementById("fDesc").value,
    amount: Math.abs(amount),
  };
  await apiAdd(tx);
  currentView = "dashboard";
  render();
};

window.deleteTx = async function (id) {
  if (!confirm("Delete this transaction?")) return;
  await apiDelete(id);
  render();
};

window.getMonthTxs = getMonthTxs;
window.exportCSV = exportCSV;

// ─── Nav ───
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentView = btn.dataset.view;
    render();
  });
});

// ─── Init ───
(async function () {
  document.getElementById("app").innerHTML = '<div class="loading">Loading...</div>';
  await apiGet();
  render();
})();
