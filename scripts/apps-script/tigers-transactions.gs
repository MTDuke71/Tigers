// Tigers Offseason Transactions Sync
// - Pulls MLB Stats API transactions into a Google Sheet
// - Deduplicates by MLB transaction id
// - Custom menu with manual run, set/reset daily trigger
// - Optional Slack webhook notification for newly added rows

// ====== CONFIG ======
const TEAM_ID = 116; // Detroit Tigers
const DEFAULT_START = '2024-11-01';
const DEFAULT_END = '2025-03-31';
const SHEET_NAME = 'Tigers Transactions';
const META_SHEET_NAME = 'Meta';
// If set, posts new transactions to Slack Incoming Webhook
const SLACK_WEBHOOK_URL = '';

// ====== PUBLIC ENTRYPOINTS ======
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tigers Tracker')
    .addItem('Sync Now', 'syncTransactions')
    .addItem('Create Daily Trigger', 'createDailyTrigger')
    .addItem('Remove Daily Trigger', 'removeDailyTrigger')
    .addToUi();
}

function syncTransactions() {
  const sheet = ensureSheet(SHEET_NAME, getHeaderRow());
  const metaSheet = ensureSheet(META_SHEET_NAME, ['Key', 'Value']);

  const { startDate, endDate } = getDateRange(metaSheet);
  const url = `https://statsapi.mlb.com/api/v1/transactions?teamId=${TEAM_ID}&startDate=${startDate}&endDate=${endDate}`;

  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    throw new Error(`MLB API error ${response.getResponseCode()}: ${response.getContentText()}`);
  }

  const data = JSON.parse(response.getContentText());
  const transactions = (data.transactions || []).map(normalizeTransaction);

  const existingIds = loadExistingIds(sheet);
  const newRows = [];
  const newForSlack = [];

  transactions.forEach((t) => {
    if (!existingIds.has(t.id)) {
      newRows.push([t.id, t.date, t.playerName, t.move, t.level, t.description, t.typeCode, t.typeDesc, t.url, t.effectiveDate, t.resolutionDate]);
      newForSlack.push(t);
      existingIds.add(t.id);
    }
  });

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, getHeaderRow().length).setValues(newRows);
    if (SLACK_WEBHOOK_URL) {
      postToSlack(newForSlack);
    }
  }
}

function createDailyTrigger() {
  // Runs at ~8am sheet timezone
  removeDailyTrigger();
  ScriptApp.newTrigger('syncTransactions')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}

function removeDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((t) => {
    if (t.getHandlerFunction() === 'syncTransactions') {
      ScriptApp.deleteTrigger(t);
    }
  });
}

// ====== HELPERS ======
function normalizeTransaction(tx) {
  const playerName = tx.person && tx.person.fullName ? tx.person.fullName : '';
  const move = tx.description || tx.typeDesc || '';
  // Heuristic: MLB/Minors from description keywords
  const level = /minor league|MiLB|Toledo|Erie|West Michigan|Lakeland/i.test(move) ? 'Minors' : 'MLB';
  return {
    id: tx.id,
    date: tx.date || '',
    playerName,
    move,
    level,
    description: tx.description || '',
    typeCode: tx.typeCode || '',
    typeDesc: tx.typeDesc || '',
    url: buildTransactionUrl(tx),
    effectiveDate: tx.effectiveDate || '',
    resolutionDate: tx.resolutionDate || '',
  };
}

function buildTransactionUrl(tx) {
  // No direct item URL in Stats API; link to team transactions filtered by date
  const date = tx.date || '';
  return `https://www.mlb.com/tigers/roster/transactions/${date}`;
}

function ensureSheet(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (headers && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    // Autosize some columns
    for (let i = 1; i <= headers.length; i++) sheet.autoResizeColumn(i);
  }
  return sheet;
}

function getHeaderRow() {
  return ['Transaction ID', 'Date', 'Player', 'Move', 'Level', 'Description', 'Type Code', 'Type Desc', 'Source URL', 'Effective Date', 'Resolution Date'];
}

function loadExistingIds(sheet) {
  const ids = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return ids; // only header
  const range = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  range.forEach((row) => {
    const v = row[0];
    if (v !== '' && v !== null) ids.add(Number(v));
  });
  return ids;
}

/**
 * Normalize a date-like value to YYYY-MM-DD for the MLB Stats API.
 * Accepts Date objects or strings (including long timezone strings from Sheets).
 */
function normalizeDateForApi(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'UTC', 'yyyy-MM-dd');
  }
  const str = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Attempt to parse other string formats (e.g., "Fri Nov 01 2024 00:00:00 GMT-0400 ...")
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, 'UTC', 'yyyy-MM-dd');
  }
  // Fallback to default if parsing fails; caller should supply sane defaults
  return str;
}

function getDateRange(metaSheet) {
  const map = readKeyValueMap(metaSheet);
  const startDate = normalizeDateForApi(map['startDate'] || DEFAULT_START);
  const endDate = normalizeDateForApi(map['endDate'] || DEFAULT_END);

  // Basic validation to prevent MLB API 400 errors
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error(`Invalid startDate: ${startDate}. Expected YYYY-MM-DD`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error(`Invalid endDate: ${endDate}. Expected YYYY-MM-DD`);
  }
  return { startDate, endDate };
}

function readKeyValueMap(sheet) {
  const data = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0] || '').trim();
    const val = String(data[i][1] || '').trim();
    if (key) map[key] = val;
  }
  return map;
}

function postToSlack(items) {
  if (!SLACK_WEBHOOK_URL || items.length === 0) return;
  const lines = items.map((t) => `• ${t.date} — ${t.playerName}: ${t.move}`);
  const payload = {
    text: `Detroit Tigers transactions added (${items.length}):\n` + lines.join('\n'),
  };
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}
