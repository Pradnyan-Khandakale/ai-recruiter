const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "..", "..", "logs");

function appendWorkflowFailure(entry) {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, "workflow-failures.log");
    const payload = {
      timestamp: new Date().toISOString(),
      ...entry
    };
    fs.appendFileSync(logPath, JSON.stringify(payload) + "\n", "utf-8");
  } catch (err) {
    console.error("Failed to append workflow failure log:", err.message);
  }
}

module.exports = { appendWorkflowFailure };
