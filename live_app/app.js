const DATA_URL = "../data/WA_Fn-UseC_-Telco-Customer-Churn.csv";

const els = {
  statusPanel: document.getElementById("statusPanel"),
  csvUpload: document.getElementById("csvUpload"),
  totalCustomers: document.getElementById("totalCustomers"),
  churnRate: document.getElementById("churnRate"),
  retainedCustomers: document.getElementById("retainedCustomers"),
  monthlyRevenueLost: document.getElementById("monthlyRevenueLost"),
  contractChart: document.getElementById("contractChart"),
  tenureChart: document.getElementById("tenureChart"),
  paymentChart: document.getElementById("paymentChart"),
  chargesChart: document.getElementById("chargesChart"),
  contractTitle: document.getElementById("contractTitle"),
  contractSubtitle: document.getElementById("contractSubtitle"),
  tenureTitle: document.getElementById("tenureTitle"),
  tenureSubtitle: document.getElementById("tenureSubtitle"),
  paymentTitle: document.getElementById("paymentTitle"),
  paymentSubtitle: document.getElementById("paymentSubtitle"),
  chargesTitle: document.getElementById("chargesTitle"),
  chargesSubtitle: document.getElementById("chargesSubtitle"),
  riskTableHeader: document.getElementById("riskTableHeader"),
  riskTable: document.getElementById("riskTable"),
  insightsList: document.getElementById("insightsList"),
  recommendations: document.getElementById("recommendations"),
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift().map((header) => header.trim().replace(/^\uFEFF/, ""));
  return rows.map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (cells[index] || "").trim();
    });
    return record;
  });
}

function pct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatBytes(bytes) {
  if (!bytes) return "Unknown";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasData(rows, column) {
  return rows.some((row) => String(row[column] || "").trim() !== "");
}

function firstValue(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== "") {
      return row[name];
    }
  }
  return "";
}

function normalizeRows(rows) {
  return rows.map((row, index) => {
    const supportTickets = asNumber(firstValue(row, ["SupportTickets", "support_tickets", "supportTickets"]));
    const techSupport =
      firstValue(row, ["TechSupport", "tech_support"]) ||
      (supportTickets > 5 ? "No" : supportTickets > 0 ? "Limited" : "Yes");

    return {
      ...row,
      customerID: firstValue(row, ["customerID", "CustomerID", "Customer ID", "customer_id"]) || `ROW-${index + 1}`,
      Gender: firstValue(row, ["Gender", "gender"]),
      Age: firstValue(row, ["Age", "age"]),
      SeniorCitizen: firstValue(row, ["SeniorCitizen", "Senior Citizen", "senior_citizen"]),
      Married: firstValue(row, ["Married", "Partner", "partner"]),
      Dependents: firstValue(row, ["Dependents", "dependents"]),
      NumberOfDependents: firstValue(row, ["Number of Dependents", "NumberOfDependents"]),
      tenure: firstValue(row, ["tenure", "Tenure"]),
      Contract: firstValue(row, ["Contract", "ContractType", "contract_type"]),
      PaymentMethod: firstValue(row, ["PaymentMethod", "Payment Method", "payment_method"]),
      TechSupport: techSupport,
      InternetService: firstValue(row, ["InternetService", "Internet Service", "internet_service"]),
      MonthlyCharges: firstValue(row, ["MonthlyCharges", "Monthly Charges", "monthly_charges"]),
      TotalCharges: firstValue(row, ["TotalCharges", "Total Charges", "total_charges"]),
      Churn: firstValue(row, ["Churn", "churn"]),
    };
  });
}

function readSpreadsheetFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    if (!window.XLSX) {
      throw new Error("Excel parser is not loaded. Refresh the page and try again.");
    }

    return file.arrayBuffer().then((buffer) => {
      const workbook = window.XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const csvText = window.XLSX.utils.sheet_to_csv(sheet);
      return {
        rows: parseCsv(csvText),
        sourceLabel: `Uploaded ${file.name} (${sheetName})`,
      };
    });
  }

  return file.text().then((text) => ({
    rows: parseCsv(text),
    sourceLabel: `Uploaded ${file.name}`,
  }));
}

function groupChurnRate(rows, getKey) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = getKey(row);
    const item = groups.get(key) || { label: key, total: 0, churned: 0 };
    item.total += 1;
    if (row.Churn === "Yes") item.churned += 1;
    groups.set(key, item);
  });

  return [...groups.values()]
    .map((item) => ({
      ...item,
      rate: item.total ? item.churned / item.total : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
}

function groupDistribution(rows, getKey) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = getKey(row) || "Unknown";
    const item = groups.get(key) || { label: key, total: 0, churned: 0 };
    item.total += 1;
    groups.set(key, item);
  });

  const total = rows.length || 1;
  return [...groups.values()]
    .map((item) => ({
      ...item,
      rate: item.total / total,
    }))
    .sort((a, b) => b.total - a.total);
}

function renderBars(node, data) {
  node.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-label">${item.label}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${Math.max(item.rate * 100, 1)}%"></div>
      </div>
      <div class="bar-value">${pct(item.rate)}</div>
    `;
    node.appendChild(row);
  });
}

function setPanelTitles(mode) {
  if (mode === "demographics") {
    els.contractTitle.textContent = "Gender Distribution";
    els.contractSubtitle.textContent = "Customer mix by gender";
    els.tenureTitle.textContent = "Age Segments";
    els.tenureSubtitle.textContent = "Customer distribution by age band";
    els.paymentTitle.textContent = "Senior Citizen Split";
    els.paymentSubtitle.textContent = "Senior vs non-senior customers";
    els.chargesTitle.textContent = "Dependents Split";
    els.chargesSubtitle.textContent = "Customers with and without dependents";
    return;
  }

  els.contractTitle.textContent = "Churn By Contract";
  els.contractSubtitle.textContent = "Which contract type loses customers?";
  els.tenureTitle.textContent = "Churn By Tenure";
  els.tenureSubtitle.textContent = "When do customers leave?";
  els.paymentTitle.textContent = "Payment Method Risk";
  els.paymentSubtitle.textContent = "Churn rate by payment method";
  els.chargesTitle.textContent = "Monthly Charges";
  els.chargesSubtitle.textContent = "Do high charges increase churn?";
}

function setLoadingStatus(title, message, details = []) {
  els.statusPanel.className = "status-panel";
  els.statusPanel.innerHTML = `
    <div>
      <div class="loading-line">
        <span class="spinner" aria-hidden="true"></span>
        <h2>${title}</h2>
      </div>
      <p>${message}</p>
      ${
        details.length
          ? `<div class="info-grid">${details
              .map(
                (item) => `
                  <div class="info-item">
                    <span>${item.label}</span>
                    <strong>${item.value}</strong>
                  </div>
                `,
              )
              .join("")}</div>`
          : ""
      }
    </div>
  `;
}

function renderDatasetInfo({ rows, sourceLabel, fileSize, columnCount, churned, retained, revenueLost, mode }) {
  const loadedAt = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  els.statusPanel.className = "status-panel success";
  els.statusPanel.innerHTML = `
    <div>
      <h2>Dataset Loaded Successfully</h2>
      <p>The churn dashboard is now using the selected customer dataset.</p>
      <div class="info-grid">
        <div class="info-item wide">
          <span>Source</span>
          <strong>${sourceLabel}</strong>
        </div>
        <div class="info-item">
          <span>Rows</span>
          <strong>${rows.length.toLocaleString()}</strong>
        </div>
        <div class="info-item">
          <span>Columns</span>
          <strong>${columnCount}</strong>
        </div>
        <div class="info-item">
          <span>Mode</span>
          <strong>${mode}</strong>
        </div>
        <div class="info-item">
          <span>File Size</span>
          <strong>${formatBytes(fileSize)}</strong>
        </div>
        <div class="info-item">
          <span>Churned</span>
          <strong>${churned.toLocaleString()}</strong>
        </div>
        <div class="info-item">
          <span>Retained</span>
          <strong>${retained.toLocaleString()}</strong>
        </div>
        <div class="info-item">
          <span>Revenue Lost</span>
          <strong>${money(revenueLost)}</strong>
        </div>
        <div class="info-item">
          <span>Loaded At</span>
          <strong>${loadedAt}</strong>
        </div>
      </div>
    </div>
  `;
}

function tenureBand(row) {
  const tenure = asNumber(row.tenure);
  if (tenure < 6) return "0-5 months";
  if (tenure <= 12) return "6-12 months";
  if (tenure <= 36) return "1-3 years";
  return "3+ years";
}

function chargeBand(row) {
  const charge = asNumber(row.MonthlyCharges);
  if (charge < 35) return "Low: < 35";
  if (charge <= 70) return "Medium: 35-70";
  return "High: > 70";
}

function ageBand(row) {
  const age = asNumber(row.Age);
  if (!age) return "Unknown";
  if (age < 30) return "Under 30";
  if (age <= 45) return "30-45";
  if (age <= 60) return "46-60";
  return "60+";
}

function riskScore(row) {
  let score = 0;
  const tenure = asNumber(row.tenure);
  const charge = asNumber(row.MonthlyCharges);

  if (tenure < 6) score += 30;
  else if (tenure < 12) score += 22;
  else if (tenure < 24) score += 12;

  if (row.Contract === "Month-to-month") score += 24;
  if (charge > 80) score += 18;
  else if (charge > 65) score += 12;
  if (row.TechSupport === "No") score += 12;
  if (row.PaymentMethod === "Electronic check") score += 10;
  if (row.PaperlessBilling === "Yes") score += 4;

  return Math.min(score, 100);
}

function renderRiskTable(rows) {
  els.riskTableHeader.innerHTML = `
    <th>Customer</th>
    <th>Tenure</th>
    <th>Contract</th>
    <th>Payment</th>
    <th>Monthly</th>
    <th>Risk</th>
  `;

  const retained = rows
    .filter((row) => row.Churn === "No")
    .map((row) => ({ ...row, RiskScore: riskScore(row) }))
    .sort((a, b) => b.RiskScore - a.RiskScore)
    .slice(0, 12);

  els.riskTable.innerHTML = retained
    .map(
      (row) => `
        <tr>
          <td>${row.customerID}</td>
          <td>${row.tenure} months</td>
          <td>${row.Contract}</td>
          <td>${row.PaymentMethod}</td>
          <td>${money(asNumber(row.MonthlyCharges))}</td>
          <td><span class="risk-pill">${row.RiskScore}%</span></td>
        </tr>
      `,
    )
    .join("");
}

function renderDemographicTable(rows) {
  els.riskTableHeader.innerHTML = `
    <th>Customer</th>
    <th>Age</th>
    <th>Gender</th>
    <th>Senior</th>
    <th>Dependents</th>
    <th>Status</th>
  `;

  const sample = [...rows]
    .sort((a, b) => asNumber(b.Age) - asNumber(a.Age))
    .slice(0, 12);

  els.riskTable.innerHTML = sample
    .map(
      (row) => `
        <tr>
          <td>${row.customerID}</td>
          <td>${row.Age || "-"}</td>
          <td>${row.Gender || "-"}</td>
          <td>${row.SeniorCitizen || "-"}</td>
          <td>${row.Dependents || "-"}</td>
          <td><span class="risk-pill">Need Churn</span></td>
        </tr>
      `,
    )
    .join("");
}

function strongestInsight(title, group) {
  return `<div class="insight-item">${title}: <strong>${group.label}</strong> has the highest churn rate at <strong>${pct(group.rate)}</strong> (${group.churned} of ${group.total} customers).</div>`;
}

function missingValueCount(rows, column) {
  return rows.filter((row) => !String(row[column] || "").trim()).length;
}

function renderDemographicInsights(rows) {
  const ages = rows.map((row) => asNumber(row.Age)).filter(Boolean);
  const avgAge = ages.reduce((sum, age) => sum + age, 0) / Math.max(ages.length, 1);
  const genderTop = groupDistribution(rows, (row) => row.Gender)[0];
  const ageTop = groupDistribution(rows, ageBand)[0];
  const seniorTop = groupDistribution(rows, (row) => row.SeniorCitizen)[0];
  const dependentsTop = groupDistribution(rows, (row) => row.Dependents)[0];

  els.insightsList.innerHTML = [
    `<div class="insight-item">This uploaded file is a <strong>demographics-only</strong> dataset with ${rows.length.toLocaleString()} customers.</div>`,
    `<div class="insight-item">Average customer age is <strong>${avgAge.toFixed(1)}</strong>.</div>`,
    `<div class="insight-item">Largest gender group is <strong>${genderTop.label}</strong> at <strong>${pct(genderTop.rate)}</strong>.</div>`,
    `<div class="insight-item">Largest age segment is <strong>${ageTop.label}</strong> at <strong>${pct(ageTop.rate)}</strong>.</div>`,
    `<div class="insight-item">Senior citizen split is led by <strong>${seniorTop.label}</strong> at <strong>${pct(seniorTop.rate)}</strong>.</div>`,
    `<div class="insight-item">Dependents split is led by <strong>${dependentsTop.label}</strong> at <strong>${pct(dependentsTop.rate)}</strong>.</div>`,
    `<div class="insight-item">For churn prediction, upload or join the file containing <strong>Churn</strong>, <strong>Contract</strong>, <strong>PaymentMethod</strong>, and <strong>MonthlyCharges</strong>.</div>`,
  ].join("");
}

function renderInsights(rows) {
  const contractRisk = groupChurnRate(rows, (row) => row.Contract)[0];
  const paymentRisk = groupChurnRate(rows, (row) => row.PaymentMethod)[0];
  const tenureRisk = groupChurnRate(rows, tenureBand)[0];
  const chargesRisk = groupChurnRate(rows, chargeBand)[0];
  const internetRisk = groupChurnRate(rows, (row) => row.InternetService)[0];
  const totalChargesMissing = missingValueCount(rows, "TotalCharges");
  const avgChurnCharge =
    rows
      .filter((row) => row.Churn === "Yes")
      .reduce((sum, row) => sum + asNumber(row.MonthlyCharges), 0) /
    Math.max(rows.filter((row) => row.Churn === "Yes").length, 1);

  els.insightsList.innerHTML = [
    strongestInsight("Contract risk", contractRisk),
    strongestInsight("Payment risk", paymentRisk),
    strongestInsight("Tenure risk", tenureRisk),
    strongestInsight("Monthly charge risk", chargesRisk),
    strongestInsight("Internet service risk", internetRisk),
    `<div class="insight-item">Average monthly charge among churned customers is <strong>${money(avgChurnCharge)}</strong>.</div>`,
    `<div class="insight-item">Data quality check: <strong>${totalChargesMissing}</strong> rows have missing TotalCharges values.</div>`,
  ].join("");
}

function renderRecommendations(rows) {
  const contractRisk = groupChurnRate(rows, (row) => row.Contract)[0];
  const paymentRisk = groupChurnRate(rows, (row) => row.PaymentMethod)[0];
  const supportRisk = groupChurnRate(rows, (row) => row.TechSupport)[0];
  const tenureRisk = groupChurnRate(rows, tenureBand)[0];

  const items = [
    `Prioritize retention campaigns for ${contractRisk.label} customers because this group has the highest churn rate at ${pct(contractRisk.rate)}.`,
    `Create payment-specific save offers for ${paymentRisk.label} customers, the highest-risk payment group.`,
    `Improve support outreach for customers with TechSupport = ${supportRisk.label}, where churn is ${pct(supportRisk.rate)}.`,
    `Add onboarding check-ins for the ${tenureRisk.label} tenure group because early-life churn is usually the easiest to prevent.`,
    "Use the high-risk table to contact retained customers before they become churned customers.",
  ];

  els.recommendations.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function renderDemographicRecommendations() {
  const items = [
    "This file can explain customer profile patterns, but it cannot calculate churn rate because it has no Churn column.",
    "Join this demographics file with the churn/status/service file using Customer ID.",
    "After joining, use age, senior citizen status, dependents, contract, payment, and monthly charges together for better churn analysis.",
    "Upload the full Kaggle Telco churn CSV when you want complete churn rate, revenue loss, high-risk customer scoring, and recommendations.",
  ];

  els.recommendations.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function validateRows(rows) {
  if (!rows.length) {
    throw new Error("The uploaded file has no data rows.");
  }

  const required = ["customerID", "tenure", "Contract", "PaymentMethod", "TechSupport", "MonthlyCharges", "Churn"];
  const missing = required.filter((column) => !(column in rows[0]));
  if (missing.length) {
    const detected = Object.keys(rows[0]).slice(0, 12).join(", ") || "No columns detected";
    throw new Error(
      `Missing required columns: ${missing.join(", ")}. Detected columns: ${detected}. Please upload the Kaggle Telco CSV, not the README, SQL file, or ZIP file.`,
    );
  }

  const emptyRequired = required.filter((column) =>
    rows.every((row) => String(row[column] || "").trim() === ""),
  );

  if (emptyRequired.length) {
    const detected = Object.keys(rows[0]).slice(0, 12).join(", ") || "No columns detected";
    throw new Error(
      `These required columns are empty after reading the file: ${emptyRequired.join(", ")}. Detected columns: ${detected}. Please select WA_Fn-UseC_-Telco-Customer-Churn.csv.`,
    );
  }
}

function renderDashboard(rows, sourceLabel, fileSize = 0) {
  rows = normalizeRows(rows);

  if (hasData(rows, "Churn") && hasData(rows, "MonthlyCharges")) {
    renderChurnDashboard(rows, sourceLabel, fileSize);
    return;
  }

  if (hasData(rows, "Age") || hasData(rows, "Gender") || hasData(rows, "SeniorCitizen")) {
    renderDemographicDashboard(rows, sourceLabel, fileSize);
    return;
  }

  const detected = Object.keys(rows[0] || {}).slice(0, 12).join(", ") || "No columns detected";
  throw new Error(`Unsupported file. Detected columns: ${detected}. Upload a full churn CSV or the Telco demographics workbook.`);
}

function renderChurnDashboard(rows, sourceLabel, fileSize = 0) {
  setPanelTitles("churn");
  validateRows(rows);

  const total = rows.length;
  const churned = rows.filter((row) => row.Churn === "Yes");
  const retained = rows.filter((row) => row.Churn === "No");
  const churnRate = churned.length / total;
  const revenueLost = churned.reduce((sum, row) => sum + asNumber(row.MonthlyCharges), 0);
  const columnCount = Object.keys(rows[0]).length;

  els.totalCustomers.textContent = total.toLocaleString();
  els.churnRate.textContent = pct(churnRate);
  els.retainedCustomers.textContent = retained.length.toLocaleString();
  els.monthlyRevenueLost.textContent = money(revenueLost);

  renderBars(els.contractChart, groupChurnRate(rows, (row) => row.Contract));
  renderBars(els.tenureChart, groupChurnRate(rows, tenureBand));
  renderBars(els.paymentChart, groupChurnRate(rows, (row) => row.PaymentMethod));
  renderBars(els.chargesChart, groupChurnRate(rows, chargeBand));
  renderInsights(rows);
  renderRiskTable(rows);
  renderRecommendations(rows);

  renderDatasetInfo({
    rows,
    sourceLabel,
    fileSize,
    columnCount,
    churned: churned.length,
    retained: retained.length,
    revenueLost,
    mode: "Churn Analysis",
  });
}

function renderDemographicDashboard(rows, sourceLabel, fileSize = 0) {
  setPanelTitles("demographics");

  const total = rows.length;
  const columnCount = Object.keys(rows[0]).length;

  els.totalCustomers.textContent = total.toLocaleString();
  els.churnRate.textContent = "Need Churn";
  els.retainedCustomers.textContent = "Need Churn";
  els.monthlyRevenueLost.textContent = "Need Charges";

  renderBars(els.contractChart, groupDistribution(rows, (row) => row.Gender));
  renderBars(els.tenureChart, groupDistribution(rows, ageBand));
  renderBars(els.paymentChart, groupDistribution(rows, (row) => row.SeniorCitizen));
  renderBars(els.chargesChart, groupDistribution(rows, (row) => row.Dependents));
  renderDemographicInsights(rows);
  renderDemographicTable(rows);
  renderDemographicRecommendations();

  renderDatasetInfo({
    rows,
    sourceLabel,
    fileSize,
    columnCount,
    churned: 0,
    retained: 0,
    revenueLost: 0,
    mode: "Demographics Only",
  });
}

async function loadDefaultCsv() {
  const demoFile = new URLSearchParams(window.location.search).get("demo");
  if (demoFile) {
    const demoUrl = `../data/${encodeURIComponent(demoFile)}`;
    try {
      setLoadingStatus("Loading Demo Dataset", "Opening a sample churn CSV for the README dashboard preview.", [
        { label: "File Name", value: demoFile },
        { label: "Source", value: "Project data folder" },
      ]);
      const response = await fetch(demoUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("Demo CSV not found");
      const text = await response.text();
      const fileSize = Number(response.headers.get("content-length")) || text.length;
      renderDashboard(parseCsv(text), `Demo ${demoFile}`, fileSize);
      return;
    } catch (error) {
      els.statusPanel.className = "status-panel warning";
      els.statusPanel.innerHTML = `
        <div>
          <h2>Could Not Load Demo CSV</h2>
          <p>${error.message}</p>
        </div>
      `;
      return;
    }
  }

  els.statusPanel.className = "status-panel warning";
  els.statusPanel.innerHTML = `
    <div>
      <h2>Upload Dataset To Start Analysis</h2>
      <p>Choose a Kaggle Telco CSV or Excel workbook using the Upload CSV button. The dashboard will analyze the uploaded file immediately.</p>
      <div class="info-grid">
        <div class="info-item wide">
          <span>Expected File</span>
          <strong>CSV or XLSX Telco data</strong>
        </div>
        <div class="info-item">
          <span>Status</span>
          <strong>Waiting for upload</strong>
        </div>
        <div class="info-item">
          <span>Analysis</span>
          <strong>Starts after upload</strong>
        </div>
      </div>
    </div>
  `;
}

els.csvUpload.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    setLoadingStatus("Uploading Dataset", "Reading the selected CSV file from your computer.", [
      { label: "File Name", value: file.name },
      { label: "File Size", value: formatBytes(file.size) },
    ]);
    const result = await readSpreadsheetFile(file);
    setLoadingStatus("Processing Dataset", "Validating columns and generating analytics.", [
      { label: "File Name", value: file.name },
      { label: "Status", value: "Parsing data" },
    ]);
    renderDashboard(result.rows, result.sourceLabel, file.size);
  } catch (error) {
    els.statusPanel.className = "status-panel warning";
    els.statusPanel.innerHTML = `
      <div>
        <h2>Could Not Load CSV</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
});

loadDefaultCsv();
