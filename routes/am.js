const fs = require('fs');
const express = require('express');
const moment = require('moment');
const formidable = require('formidable');
const router = express.Router();

// Load Models
const PrioritiesReport = require('../db/models/PrioritiesReport');
const CheckList = require('../db/models/CheckList');

// Load utils
const compressImage = require('../utils/compressImage');

// @route   POST /api/rm/update-issue/:id
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

      console.log(arrayOfEvidencesAfterFiles);

      // Check image size and reduce if greater than 1mb
      arrayOfEvidencesAfterFiles.forEach(async (element) => {
        compressImage(`./public/${element}`);
      });

      let updatedEvidencesAfter = [...report.evidencesAfter, ...arrayOfEvidencesAfterFiles];

      // Update db
      const updateReport = await PrioritiesReport.findOneAndUpdate(
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
        return res.status(400).json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

// @route   POST /api/rm/checklist
// @desc    Add checklist report
// @access  Private
router.post('/checklist', async (req, res) => {
  const formData = formidable({
    uploadDir: './public/checklist',
    keepExtensions: true,
    multiples: true,
  });

  formData.parse(req, async (error, fields, files) => {
    const { BENumber, region, RMName, stationName, date, ...questions } = fields;
    let images = {};
    try {
      if (error) throw 'Image upload error';

      // Extract files path from files object
      if (files) {
        Object.keys(files).forEach((key) => {
          if (Array.isArray(files[key])) {
            Object.keys(files[key]).forEach((image) => {
              const path = files[key][image].path;
              images = { ...images, [key]: images[key] ? [...images[key], path] : [path] };
            });
          } else {
            const path = files[key].path;
            images = { ...images, [key]: images[key] ? [...images[key], path] : [path] };
          }
        });
      }

      // Check image size and reduce if greater than 1mb
      Object.keys(images).forEach((image) => {
        images[image].forEach((path) => {
          compressImage(`./${path}`);
        });
      });

      // Create questions object for DB
      let questionsData = {};
      Object.keys(questions).forEach((key) => {
        questionsData[key] = {
          answer: questions[key],
          images: images[key] ? images[key] : [],
        };
      });

      // Save the checklist
      const checkList = await CheckList.create({
        BENumber,
        stationName,
        region,
        RMName,
        date,
        AMName: req.user.id,
        ...questionsData,
      });

      if (!checkList) throw 'Unable to save checklist';

      return res.status(200).json({ success: true, checkList });
    } catch (error) {
      // Delete all images from server
      if (images) {
        Object.keys(images).forEach((image) => {
          images[image].forEach((path) => {
            fs.unlinkSync(path);
          });
        });
      }

      // Throw validation error if any
      if (error && error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: 'Input fields validation error' });
      }
      return res.status(400).json({ success: false, message: error });
    }
  });
});

module.exports = router;
