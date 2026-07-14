const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');

const summary = asyncHandler(async (req, res) => {
  const data = req.user.role === 'admin'
    ? await dashboardService.getAdminSummary()
    : await dashboardService.getAgentSummary(req.user._id);

  ApiResponse.success(res, { data });
});

const recentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
  const data = await dashboardService.getRecentActivity(limit);
  ApiResponse.success(res, { data });
});

module.exports = { summary, recentActivity };
