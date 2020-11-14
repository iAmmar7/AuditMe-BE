const express = require('express');
const router = express.Router();

// Load Models
const AuditReport = require('../db/models/AuditReport');
const PrioritiesReport = require('../db/models/PrioritiesReport');

// @route   GET /api/admin/audit-reports
// @desc    All audit reports
// @access  Private
router.get('/audit-reports', async (req, res) => {
  const page = req.query.page ? req.query.page : 1;

  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const auditReports = await AuditReport.find({}).skip(offset).limit(limit);

    res.status(200).json({ success: true, reports: auditReports });
  } catch (error) {
    res.status(400).json({ success: false, message: 'An error while fetching reports', error });
  }
});

// @route   GET /api/admin/priorities-reports
// @desc    All priorities reports
// @access  Private
router.get('/priorities-reports', async (req, res) => {
  const page = req.query.page ? req.query.page : 1;

  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const prioritiesReports = await PrioritiesReport.find({}).skip(offset).limit(limit);

    res.status(200).json({ success: true, reports: prioritiesReports });
  } catch (error) {
    res.status(400).json({ success: false, message: 'An error while fetching reports', error });
  }
});

module.exports = router;
