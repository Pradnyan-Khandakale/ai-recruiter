const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "..", "..", "logs");

function appendWorkflowFailure(entry) {
  // TODO: Create the logs directory and append the timestamped JSON entry to
  // TODO: logs/workflow-failures.log.
}

module.exports = { appendWorkflowFailure };
