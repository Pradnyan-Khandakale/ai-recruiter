const analyticsService = require("../services/analytics.service");
const { sendSuccess } = require("../utils/response");

async function getAnalytics(req, res) {
  const data = await analyticsService.getRecruiterAnalytics(req.user, req.query);
  return sendSuccess(res, data, 200);
}

module.exports = { getAnalytics };
