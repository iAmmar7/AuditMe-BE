const fs = require('fs');
const express = require('express');
const router = express.Router();

const compressImage = require('../utils/compressImage');
const AuditReport = require('../db/models/AuditReport');
const { getFormidable } = require('../utils/getFormidable');

// @route   PATCH /api/sm/report/:id
// @desc    Update issue report
// @access  Private
router.patch('/report/:id', async (req, res) => {
  const formData = getFormidable('issues');

  if (!req.params.id) return;

  const report = await AuditReport.findOne({ _id: req.params.id });

  if (!report)
    return res
      .status(400)
      .json({ success: false, message: 'Unable to update report' });

  formData.parse(req, async (error, fields, files) => {
    const { evidencesAfter } = files;
    try {
      if (error) throw 'Unable to upload image!';

      let arrayOfEvidencesAfterFiles = [];

      if (evidencesAfter) {
        Object.keys(evidencesAfter).forEach((value) => {
          if (evidencesAfter[value] && evidencesAfter[value].path) {
            const path = evidencesAfter[value].path.split('public')[1];
            arrayOfEvidencesAfterFiles.push(path);
          }
          if (value === 'path') {
            const path = evidencesAfter[value].split('public')[1];
            arrayOfEvidencesAfterFiles.filter((item) => {
              if (item !== path) arrayOfEvidencesAfterFiles.push(path);
            });
          }
        });
      }

      // Check image size and reduce if greater than 1mb
      arrayOfEvidencesAfterFiles.forEach(async (element) => {
        compressImage(`./public/${element}`);
      });

      let updatedEvidencesAfter = [
        ...report.evidencesAfter,
        ...arrayOfEvidencesAfterFiles,
      ];

      // Update db
      const updateReport = await AuditReport.findOneAndUpdate(
        { _id: req.params.id },
        {
          ...fields,
          evidencesAfter: updatedEvidencesAfter,
          resolvedBy: req.user.id,
          $push: {
            updatedBy: {
              name: req.user.name,
              id: req.user.id,
              time: new Date(),
            },
          },
        },
        { new: true },
      );

      if (!updateReport) throw 'Unable to update the report';

      return res.status(200).json({ success: true, report: updateReport });
    } catch (error) {
      if (evidencesAfter) fs.unlinkSync(evidencesAfter.path);
      if (error && error.name === 'ValidationError') {
        return res
          .status(400)
          .json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

module.exports = router;
