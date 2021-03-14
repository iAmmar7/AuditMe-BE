const fs = require('fs');
const express = require('express');
const moment = require('moment');
const formidable = require('formidable');
const router = express.Router();

// Load Models
const PrioritiesReport = require('../db/models/PrioritiesReport');
const Initiatives = require('../db/models/Initiatives');

// Load utils
const compressImage = require('../utils/compressImage');

// @route   GET /api/auditor/test
// @desc    Test auditor rooutes
// @access  Private
router.get('/test', (req, res) => {
  res.json({ message: 'Auditor route works' });
});

// @route   POST /api/auditor/raise issue
// @desc    Submit priorities/issue report
// @access  Private
router.post('/raise-issue', async (req, res) => {
  const formData = formidable({
    uploadDir: './public/issues',
    keepExtensions: true,
    multiples: true,
  });

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

      // Get the most recent report for the ID
      const recentReport = await PrioritesReport.find({})
        .select('id')
        .lean()
        .sort({ createdAt: -1 })
        .limit(1);

      // Save the report
      const report = await PrioritiesReport.create({
        ...fields,
        user: req.user.id,
        id: recentReport[0]?.id + 1,
        week:
          moment(fields.date).week() -
          moment(fields.date).add(0, 'month').startOf('month').week() +
          1,
        isPrioritized: fields.priority === 'Priority',
        evidencesBefore: arrayOfEvidences,
      });

      return res.status(200).json({ success: true, report });
    } catch (error) {
      if (evidences) fs.unlinkSync(evidences.path);
      if (error && error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

// @route   POST /api/user/priority-report/:id
// @desc    Update priority/issue report
// @access  Private
router.post('/priority-report/:id', async (req, res) => {
  const formData = formidable({
    uploadDir: './public/issues',
    keepExtensions: true,
    multiples: true,
  });

  console.log(req.params.id);

  if (!req.params.id) return;

  const report = await PrioritiesReport.findOne({ _id: req.params.id });

  if (!report) return res.status(400).json({ success: false, message: 'Unable to update report' });

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

      console.log(arrayOfEvidencesBeforeFiles);
      console.log(arrayOfEvidencesAfterFiles);

      let updatedEvidencesBefore = [...report.evidencesBefore, ...arrayOfEvidencesBeforeFiles];
      let updatedEvidencesAfter = [...report.evidencesAfter, ...arrayOfEvidencesAfterFiles];

      // Update db
      const updateReport = await PrioritiesReport.findOneAndUpdate(
        { _id: req.params.id },
        {
          ...fields,
          evidencesBefore: updatedEvidencesBefore,
          evidencesAfter: updatedEvidencesAfter,
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
      if (evidencesBefore) fs.unlinkSync(evidencesBefore.path);
      if (evidencesAfter) fs.unlinkSync(evidencesAfter.path);
      if (error && error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: 'Input fields validation error' });
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

    return res.status(200).json({ success: true, message: 'Successfully cancelled the issue' });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Unable to update the issue' });
  }
});

// @route   POST /api/auditor/update-issue/:id
// @desc    Update issue report
// @access  Private
router.post('/update-issue/:id', async (req, res) => {
  const formData = formidable({
    uploadDir: './public/issues',
    keepExtensions: true,
    multiples: true,
  });

  if (!req.params.id) return;

  const report = await PrioritiesReport.findOne({ _id: req.params.id });

  if (!report) return res.status(400).json({ success: false, message: 'Unable to update report' });

  if (report.user.toString() !== req.user.id.toString())
    return res
      .status(400)
      .json({ success: false, message: 'You are not authorized to update this issue' });

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

      let updatedEvidencesBefore = [...report.evidencesBefore, ...arrayOfEvidencesBeforeFiles];

      // Update db
      const updateReport = await PrioritiesReport.findOneAndUpdate(
        { _id: req.params.id },
        {
          ...fields,
          isPrioritized: fields.priority === 'Priority',
          evidencesBefore: updatedEvidencesBefore,
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
      if (evidencesBefore) fs.unlinkSync(evidencesBefore.path);
      if (error && error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

// @route   POST /api/auditor/initiave
// @desc    Submit initiative report
// @access  Private
router.post('/initiative', async (req, res) => {
  const formData = formidable({
    uploadDir: './public/initiatives',
    keepExtensions: true,
    multiples: true,
  });

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

      console.log(arrayOfEvidencesBefore, arrayOfEvidencesAfter);

      // Check arrayOfEvidencesBefore image size and reduce if greater than 1mb
      arrayOfEvidencesBefore.forEach(async (element) => {
        compressImage(`./public/${element}`);
      });

      // Check arrayOfEvidencesAfter image size and reduce if greater than 1mb
      arrayOfEvidencesAfter.forEach(async (element) => {
        compressImage(`./public/${element}`);
      });

      // Get the most recent initiative for the ID
      const recentReport = await Initiatives.find({})
        .select('id')
        .lean()
        .sort({ createdAt: -1 })
        .limit(1);

      // Save the initiative
      const report = await Initiatives.create({
        ...fields,
        user: req.user.id,
        id: recentReport[0]?.id + 1,
        week: moment(fields.date).isoWeek() - moment(fields.date).startOf('month').isoWeek() + 1,
        evidencesBefore: arrayOfEvidencesBefore,
        evidencesAfter: arrayOfEvidencesAfter,
      });

      return res.status(200).json({ success: true, report });
    } catch (error) {
      if (evidencesBefore) fs.unlinkSync(evidencesBefore.path);
      if (evidencesAfter) fs.unlinkSync(evidencesAfter.path);
      if (error && error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

// @route   POST /api/auditor/update-initiative/:id
// @desc    Update initiative report
// @access  Private
router.post('/update-initiative/:id', async (req, res) => {
  const formData = formidable({
    uploadDir: './public/initiatives',
    keepExtensions: true,
    multiples: true,
  });

  if (!req.params.id)
    return res.status(400).json({ success: false, message: 'Initiative report id is required' });

  const report = await Initiatives.findOne({ _id: req.params.id });

  if (!report) return res.status(400).json({ success: false, message: 'Unable to update report' });

  if (report.user.toString() !== req.user.id.toString())
    return res
      .status(400)
      .json({ success: false, message: 'You are not authorized to update this initiative' });

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

      console.log(arrayOfEvidencesBeforeFiles);
      console.log(arrayOfEvidencesAfterFiles);

      let updatedEvidencesBefore = [...report.evidencesBefore, ...arrayOfEvidencesBeforeFiles];
      let updatedEvidencesAfter = [...report.evidencesAfter, ...arrayOfEvidencesAfterFiles];

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
        return res.status(400).json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

router.get('/update-id', async (req, res) => {
  const all = await PrioritesReport.find({});

  console.log(all.length);

  for (let report of all) {
    await PrioritesReport.findOneAndUpdate({ _id: report._id }, { isPrioritized: true });
  }

  const all2 = await PrioritesReport.countDocuments();
  const priority2 = await PrioritesReport.countDocuments({ isPrioritized: true });
  const notPrio2 = await PrioritesReport.countDocuments({ isPrioritized: false });

  return res.json({ all2, priority2, notPrio2 });
});

module.exports = router;
