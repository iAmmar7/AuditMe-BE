const express = require('express');
const router = express.Router();

// Load Models
const AuditReport = require('../db/models/AuditReport');

// @route   DELETE /api/admin/audit-report
// @desc    Delete raised audit report
// @access  Private
router.delete('/audit-report/:id', async (req, res) => {
  try {
    const report = await AuditReport.findOne({ _id: req.params.id });

    if (!report) throw 'Unable to find report';

    if (report.evidencesBefore.length > 0) {
      for (let url of report.evidencesBefore) {
        fs.unlinkSync(`./public${url}`);
      }
    }

    if (report.evidencesAfter.length > 0) {
      for (let url of report.evidencesAfter) {
        fs.unlinkSync(`./public${url}`);
      }
    }

    const deleteIssue = await AuditReport.findOneAndRemove({
      _id: req.params.id,
    });

    if (!deleteIssue) throw 'Unable to delete issue';

    return res
      .status(200)
      .json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error });
  }
});

module.exports = router;
