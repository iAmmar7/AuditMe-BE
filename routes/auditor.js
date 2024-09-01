const fs = require('fs');
const path = require('path');
const express = require('express');
const moment = require('moment');
const router = express.Router();

// Load Models
const PrioritiesReport = require('../db/models/PrioritiesReport');
const Initiatives = require('../db/models/Initiatives');
const AuditReport = require('../db/models/AuditReport');

// Load utils
const compressImage = require('../utils/compressImage');
const { getFormidable } = require('../utils/getFormidable');

// @route   GET /api/auditor/test
// @desc    Test auditor rooutes
// @access  Private
router.get('/test', (req, res) => {
  res.json({ message: 'Auditor route works' });
});

// @route   POST /api/auditor/report
// @desc    Submit audit report
// @access  Private
router.post('/report', async (req, res) => {
  const formData = getFormidable('issues');

  formData.parse(req, async (error, fields, files) => {
    const { evidences } = files;
    try {
      if (error) throw 'Unable to upload image!';

      let arrayOfEvidences = [];

      if (evidences) {
        Object.keys(evidences).forEach((value) => {
          if (evidences[value] && evidences[value].path) {
            const path = evidences[value].path.split('public')[1];
            arrayOfEvidences.push(path);
          }
          if (value === 'path') {
            const path = evidences[value].split('public')[1];
            arrayOfEvidences.filter((item) => {
              if (item !== path) arrayOfEvidences.push(path);
            });
          }
        });
      }

      // Check image size and reduce if greater than 1mb
      arrayOfEvidences.forEach(async (element) => {
        compressImage(`./public/${element}`);
      });

      // Save the report
      const report = await AuditReport.create({
        ...fields,
        auditor: req.user.id,
        isPrioritized: fields.priority === 'Priority',
        evidencesBefore: arrayOfEvidences,
      });

      return res.status(200).json({ success: true, report });
    } catch (error) {
      if (evidences) fs.unlinkSync(evidences.path);
      if (error && error.name === 'ValidationError') {
        return res
          .status(400)
          .json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

// @route   PATCH /api/auditor/report/:id
// @desc    Update audit report
// @access  Private
router.patch('/report/:id', async (req, res) => {
  const formData = getFormidable('issues');

  if (!req.params.id) return;

  const report = await AuditReport.findOne({ _id: req.params.id });

  if (!report)
    return res
      .status(400)
      .json({ success: false, message: 'Unable to update report' });

  if (report.auditor.toString() !== req.user._id.toString())
    return res.status(400).json({
      success: false,
      message: 'You are not authorized to update this issue',
    });

  formData.parse(req, async (error, fields, files) => {
    const { evidencesBefore } = files;
    try {
      if (error) throw 'Unable to upload image!';

      let arrayOfEvidencesBeforeFiles = [];

      if (evidencesBefore) {
        Object.keys(evidencesBefore).forEach((value) => {
          if (evidencesBefore[value] && evidencesBefore[value].path) {
            const path = evidencesBefore[value].path.split('public')[1];
            arrayOfEvidencesBeforeFiles.push(path);
          }
          if (value === 'path') {
            const path = evidencesBefore[value].split('public')[1];
            arrayOfEvidencesBeforeFiles.filter((item) => {
              if (item !== path) arrayOfEvidencesBeforeFiles.push(path);
            });
          }
        });
      }

      // Check image size and reduce if greater than 1mb
      arrayOfEvidencesBeforeFiles.forEach(async (element) => {
        compressImage(`./public/${element}`);
      });

      let updatedEvidencesBefore = [
        ...report.evidencesBefore,
        ...arrayOfEvidencesBeforeFiles,
      ];

      // Update db
      const updateReport = await AuditReport.findOneAndUpdate(
        { _id: req.params.id },
        {
          ...fields,
          isPrioritized: fields.priority === 'Priority',
          evidencesBefore: updatedEvidencesBefore,
          $push: {
            updatedBy: {
              _id: req.user._id,
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
      console.log('error', error);
      if (evidencesBefore) fs.unlinkSync(evidencesBefore.path);
      if (error && error.name === 'ValidationError') {
        return res
          .status(400)
          .json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

// @route   POST /api/auditor/initiave
// @desc    Submit initiative report
// @access  Private
router.post('/initiative', async (req, res) => {
  const formData = getFormidable('initiatives');

  formData.parse(req, async (error, fields, files) => {
    const { evidencesBefore, evidencesAfter } = files;

    try {
      if (error) throw 'Unable to upload image!';

      let arrayOfEvidencesBefore = [],
        arrayOfEvidencesAfter = [];

      if (evidencesBefore) {
        Object.keys(evidencesBefore).forEach((value) => {
          if (evidencesBefore[value] && evidencesBefore[value].path) {
            const path = evidencesBefore[value].path.split('public')[1];
            arrayOfEvidencesBefore.push(path);
          }
          if (value === 'path') {
            const path = evidencesBefore[value].split('public')[1];
            arrayOfEvidencesBefore.filter((item) => {
              if (item !== path) arrayOfEvidencesBefore.push(path);
            });
          }
        });
      }

      if (evidencesAfter) {
        Object.keys(evidencesAfter).forEach((value) => {
          if (evidencesAfter[value] && evidencesAfter[value].path) {
            const path = evidencesAfter[value].path.split('public')[1];
            arrayOfEvidencesAfter.push(path);
          }
          if (value === 'path') {
            const path = evidencesAfter[value].split('public')[1];
            arrayOfEvidencesAfter.filter((item) => {
              if (item !== path) arrayOfEvidencesAfter.push(path);
            });
          }
        });
      }

      // Check arrayOfEvidencesBefore image size and reduce if greater than 1mb
      arrayOfEvidencesBefore.forEach(async (element) => {
        compressImage(`./public/${element}`);
      });

      // Check arrayOfEvidencesAfter image size and reduce if greater than 1mb
      arrayOfEvidencesAfter.forEach(async (element) => {
        compressImage(`./public/${element}`);
      });

      // Save the initiative
      const report = await Initiatives.create({
        ...fields,
        auditor: req.user.id,
        evidencesBefore: arrayOfEvidencesBefore,
        evidencesAfter: arrayOfEvidencesAfter,
      });

      return res.status(200).json({ success: true, report });
    } catch (error) {
      if (evidencesBefore) fs.unlinkSync(evidencesBefore.path);
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

// @route   PATCH /api/auditor/initiative/:id
// @desc    Update initiative report
// @access  Private
router.patch('/initiative/:id', async (req, res) => {
  const formData = getFormidable('initiatives');

  if (!req.params.id)
    return res
      .status(400)
      .json({ success: false, message: 'Initiative report id is required' });

  const report = await Initiatives.findOne({ _id: req.params.id });

  if (!report)
    return res
      .status(400)
      .json({ success: false, message: 'Unable to update report' });

  if (report.auditor.toString() !== req.user._id.toString())
    return res.status(400).json({
      success: false,
      message: 'You are not authorized to update this initiative',
    });

  formData.parse(req, async (error, fields, files) => {
    const { evidencesBefore, evidencesAfter } = files;
    try {
      if (error) throw 'Unable to upload image!';

      let arrayOfEvidencesBeforeFiles = [],
        arrayOfEvidencesAfterFiles = [];

      if (evidencesBefore) {
        Object.keys(evidencesBefore).forEach((value) => {
          if (evidencesBefore[value] && evidencesBefore[value].path) {
            const path = evidencesBefore[value].path.split('public')[1];
            arrayOfEvidencesBeforeFiles.push(path);
          }
          if (value === 'path') {
            const path = evidencesBefore[value].split('public')[1];
            arrayOfEvidencesBeforeFiles.filter((item) => {
              if (item !== path) arrayOfEvidencesBeforeFiles.push(path);
            });
          }
        });
      }

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

      let updatedEvidencesBefore = [
        ...report.evidencesBefore,
        ...arrayOfEvidencesBeforeFiles,
      ];
      let updatedEvidencesAfter = [
        ...report.evidencesAfter,
        ...arrayOfEvidencesAfterFiles,
      ];

      // Update db
      const updateReport = await Initiatives.findOneAndUpdate(
        { _id: req.params.id },
        {
          ...fields,
          evidencesBefore: updatedEvidencesBefore,
          evidencesAfter: updatedEvidencesAfter,
        },
        { new: true },
      );

      if (!updateReport) throw 'Unable to update the report';

      return res.status(200).json({ success: true, report: updateReport });
    } catch (error) {
      if (evidencesBefore) fs.unlinkSync(evidencesBefore.path);
      if (error && error.name === 'ValidationError') {
        return res
          .status(400)
          .json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

// @route   GET /api/auditor/cancel-issue/:id
// @desc    Cancel issue report
// @access  Private
router.get('/cancel-issue/:id', async (req, res) => {
  try {
    const report = await PrioritiesReport.findOne({ _id: req.params.id });

    if (!report) throw 'Report not found';

    const updateReport = await PrioritiesReport.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      { status: report.status === 'Cancelled' ? 'Pending' : 'Cancelled' },
      { new: true },
    );

    if (!updateReport) throw 'Failed to cancel the issue';

    return res
      .status(200)
      .json({ success: true, message: 'Successfully cancelled the issue' });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: 'Unable to update the issue' });
  }
});

router.get('/script', async (req, res) => {
  const report = await PrioritiesReport.updateMany(
    { type: 'Bay Violation' },
    { $set: { type: 'Violation' } },
  );

  return res.json({ report });
});

module.exports = router;
