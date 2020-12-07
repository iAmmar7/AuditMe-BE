const fs = require('fs');
const express = require('express');
const moment = require('moment');
const formidable = require('formidable');
const router = express.Router();

// Load Models
const AuditReport = require('../db/models/AuditReport');
const PrioritiesReport = require('../db/models/PrioritiesReport');
const Initiatives = require('../db/models/Initiatives');

// @route   GET /api/user/audit-report
// @desc    Submit audit report
// @access  Private
router.post('/audit-report', async (req, res) => {
  try {
    const newReport = await AuditReport.create(req.body);

    res.status(200).json({ success: true, report: newReport });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Some fields are missing', error });
  }
});

// @route   POST /api/user/priorities-report
// @desc    Submit priorities/issue report
// @access  Private
router.post('/priorities-report', async (req, res) => {
  const formData = formidable({
    uploadDir: './public/issues',
    keepExtensions: true,
    multiples: true,
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

      console.log(arrayOfEvidencesBeforeFiles);
      console.log(arrayOfEvidencesAfterFiles);

      const report = await PrioritiesReport.create({
        ...fields,
        user: req.user.id,
        evidencesBefore: arrayOfEvidencesBeforeFiles,
        evidencesAfter: arrayOfEvidencesAfterFiles,
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

// @route   GET /api/user/priorities-reports
// @desc    Get all priorities reports
// @access  Private
router.post('/priorities-reports', async (req, res) => {
  const { params, sorter, filter } = req.body;
  let {
    current,
    pageSize,
    date,
    user,
    status,
    type,
    region,
    processSpecialist,
    regionalManager,
    areaManager,
    dateIdentified,
    stationNumber,
  } = params;
  let { dateSorter, dateIdentifiedSorter, daysOpenSorter } = sorter;
  let { statusFilter, typeFilter, regionFilter } = filter;

  console.log(req.body);

  current = current ? current : 1;
  pageSize = pageSize ? pageSize : 10;

  const offset = +pageSize * (+current - 1);

  try {
    // Add query params if exist in request
    const matchQuery = [];
    if (date)
      matchQuery.push({
        date: {
          $gte: moment(new Date(date[0])).utcOffset(0).startOf('day').toDate(),
          $lte: moment(new Date(date[1])).utcOffset(0).endOf('day').toDate(),
        },
      });
    if (user) matchQuery.push({ 'user.name': { $regex: user, $options: 'i' } });
    if (status) matchQuery.push({ status: { $regex: status, $options: 'i' } });
    if (type) matchQuery.push({ type: { $regex: type, $options: 'i' } });
    if (region) matchQuery.push({ region: { $regex: region, $options: 'i' } });
    if (processSpecialist)
      matchQuery.push({ processSpecialist: { $regex: processSpecialist, $options: 'i' } });
    if (regionalManager)
      matchQuery.push({ regionalManager: { $regex: regionalManager, $options: 'i' } });
    if (areaManager) matchQuery.push({ areaManager: { $regex: areaManager, $options: 'i' } });
    if (stationNumber) matchQuery.push({ stationNumber: { $regex: stationNumber, $options: 'i' } });
    if (dateIdentified)
      matchQuery.push({
        dateIdentified: {
          $gte: moment(new Date(dateIdentified[0])).utcOffset(0).startOf('day').toDate(),
          $lte: moment(new Date(dateIdentified[1])).utcOffset(0).endOf('day').toDate(),
        },
      });

    // Add sorter if exist in request
    let sortBy = { 'root.createdAt': -1 };
    if (dateSorter === 'ascend') sortBy = { 'root.date': +1 };
    if (dateSorter === 'descend') sortBy = { 'root.date': -1 };
    if (dateIdentifiedSorter === 'ascend') sortBy = { 'root.dateIdentified': +1 };
    if (dateIdentifiedSorter === 'descend') sortBy = { 'root.dateIdentified': -1 };
    if (daysOpenSorter === 'ascend') sortBy = { daysOpen: +1 };
    if (daysOpenSorter === 'descend') sortBy = { daysOpen: -1 };

    // Add filter if exist in request
    if (statusFilter) {
      matchQuery.push({ status: { $in: statusFilter } });
    }
    if (typeFilter) {
      matchQuery.push({ type: { $in: typeFilter } });
    }
    if (regionFilter) {
      matchQuery.push({ region: { $in: regionFilter } });
    }

    console.log(matchQuery);

    // Get reports
    const reports = await PrioritiesReport.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $match:
          matchQuery.length > 0
            ? {
                $and: matchQuery,
              }
            : {},
      },
      {
        $project: {
          _id: '$_id',
          daysOpen: {
            $trunc: {
              $divide: [
                { $subtract: [{ $ifNull: ['$dateOfClosure', new Date()] }, '$dateIdentified'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          root: '$$ROOT',
        },
      },
      { $sort: sortBy },
      { $limit: +pageSize + offset },
      { $skip: offset },
      {
        $lookup: {
          from: User.collection.name,
          localField: 'root.resolvedBy',
          foreignField: '_id',
          as: 'resolvedBy',
        },
      },
      {
        $unwind: {
          path: '$resolvedBy',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: '$_id',
          daysOpen: '$daysOpen',
          date: '$root.date',
          week: '$root.week',
          userName: '$root.user.name',
          userId: '$root.user._id',
          resolvedByName: { $ifNull: ['$resolvedBy.name', null] },
          resolvedById: { $ifNull: ['$resolvedBy._id', null] },
          type: '$root.type',
          status: '$root.status',
          region: '$root.region',
          areaManager: '$root.areaManager',
          regionalManager: '$root.regionalManager',
          processSpecialist: '$root.processSpecialist',
          issueDetails: '$root.issueDetails',
          stationNumber: '$root.stationNumber',
          evidencesBefore: '$root.evidencesBefore',
          evidencesAfter: '$root.evidencesAfter',
          feedback: '$root.feedback',
          dateOfClosure: '$root.dateOfClosure',
          dateIdentified: '$root.dateIdentified',
          actionTaken: '$root.actionTaken',
          updatedBy: '$root.updatedBy',
          createdAt: '$root.createdAt',
          updatedAt: '$root.updatedAt',
        },
      },
    ]);

    if (!reports) return res.status(400).json({ success: false, message: 'No report found' });

    // Get reports count
    const reportsCount = await PrioritiesReport.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $match:
          matchQuery.length > 0
            ? {
                $and: matchQuery,
              }
            : {},
      },
      {
        $group: {
          _id: 0,
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          count: '$count',
        },
      },
    ]);

    if (!reportsCount)
      return res.status(400).json({ success: false, message: 'Unable to calculate report count' });

    return res.status(200).json({
      success: true,
      reports,
      totalReports: reportsCount.length < 1 ? 0 : reportsCount[0].count,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Unable to fetch reports, reload',
    });
  }
});

// @route   GET /api/user/initiatives-reports
// @desc    Get all initiatives reports
// @access  Private
router.post('/initiatives-reports', async (req, res) => {
  const { params, sorter, filter } = req.body;
  let {
    current,
    pageSize,
    date,
    user,
    status,
    type,
    region,
    processSpecialist,
    regionalManager,
    areaManager,
    dateIdentified,
    stationNumber,
  } = params;
  let { dateSorter, dateIdentifiedSorter, daysOpenSorter } = sorter;
  let { statusFilter, typeFilter, regionFilter } = filter;

  console.log(req.body);

  current = current ? current : 1;
  pageSize = pageSize ? pageSize : 10;

  const offset = +pageSize * (+current - 1);

  try {
    // Add query params if exist in request
    const matchQuery = [];
    if (date)
      matchQuery.push({
        date: {
          $gte: moment(new Date(date[0])).utcOffset(0).startOf('day').toDate(),
          $lte: moment(new Date(date[1])).utcOffset(0).endOf('day').toDate(),
        },
      });
    if (user) matchQuery.push({ 'user.name': { $regex: user, $options: 'i' } });
    if (status) matchQuery.push({ status: { $regex: status, $options: 'i' } });
    if (type) matchQuery.push({ type: { $regex: type, $options: 'i' } });
    if (region) matchQuery.push({ region: { $regex: region, $options: 'i' } });
    if (processSpecialist)
      matchQuery.push({ processSpecialist: { $regex: processSpecialist, $options: 'i' } });
    if (regionalManager)
      matchQuery.push({ regionalManager: { $regex: regionalManager, $options: 'i' } });
    if (areaManager) matchQuery.push({ areaManager: { $regex: areaManager, $options: 'i' } });
    if (stationNumber) matchQuery.push({ stationNumber: { $regex: stationNumber, $options: 'i' } });
    if (dateIdentified)
      matchQuery.push({
        dateIdentified: {
          $gte: moment(new Date(dateIdentified[0])).utcOffset(0).startOf('day').toDate(),
          $lte: moment(new Date(dateIdentified[1])).utcOffset(0).endOf('day').toDate(),
        },
      });

    // Add sorter if exist in request
    let sortBy = { 'root.createdAt': -1 };
    if (dateSorter === 'ascend') sortBy = { 'root.date': +1 };
    if (dateSorter === 'descend') sortBy = { 'root.date': -1 };
    if (dateIdentifiedSorter === 'ascend') sortBy = { 'root.dateIdentified': +1 };
    if (dateIdentifiedSorter === 'descend') sortBy = { 'root.dateIdentified': -1 };
    if (daysOpenSorter === 'ascend') sortBy = { daysOpen: +1 };
    if (daysOpenSorter === 'descend') sortBy = { daysOpen: -1 };

    // Add filter if exist in request
    if (statusFilter) {
      matchQuery.push({ status: { $in: statusFilter } });
    }
    if (typeFilter) {
      matchQuery.push({ type: { $in: typeFilter } });
    }
    if (regionFilter) {
      matchQuery.push({ region: { $in: regionFilter } });
    }

    console.log(matchQuery);

    // Get reports
    const reports = await Initiatives.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $match:
          matchQuery.length > 0
            ? {
                $and: matchQuery,
              }
            : {},
      },
      {
        $project: {
          _id: '$_id',
          daysOpen: {
            $trunc: {
              $divide: [
                { $subtract: [{ $ifNull: ['$dateOfClosure', new Date()] }, '$dateIdentified'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          root: '$$ROOT',
        },
      },
      { $sort: sortBy },
      { $limit: +pageSize + offset },
      { $skip: offset },
      {
        $project: {
          _id: '$_id',
          date: '$root.date',
          week: '$root.week',
          userName: '$root.user.name',
          userId: '$root.user._id',
          type: '$root.type',
          region: '$root.region',
          areaManager: '$root.areaManager',
          regionalManager: '$root.regionalManager',
          details: '$root.details',
          stationNumber: '$root.stationNumber',
          evidencesBefore: '$root.evidencesBefore',
          evidencesAfter: '$root.evidencesAfter',
          dateIdentified: '$root.dateIdentified',
          actionTaken: '$root.actionTaken',
          createdAt: '$root.createdAt',
          updatedAt: '$root.updatedAt',
        },
      },
    ]);

    if (!reports) return res.status(400).json({ success: false, message: 'No report found' });

    // Get reports count
    const reportsCount = await Initiatives.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $match:
          matchQuery.length > 0
            ? {
                $and: matchQuery,
              }
            : {},
      },
      {
        $group: {
          _id: 0,
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          count: '$count',
        },
      },
    ]);

    if (!reportsCount)
      return res.status(400).json({ success: false, message: 'Unable to calculate report count' });

    return res.status(200).json({
      success: true,
      reports,
      totalReports: reportsCount.length < 1 ? 0 : reportsCount[0].count,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Unable to fetch reports, reload',
    });
  }
});

// @route   GET /api/user/report-chart
// @desc    GET region vise report data
// @access  Private
router.get('/report-chart', async (req, res) => {
  const month = req.query.month ? req.query.month : 'allTime';

  try {
    const regionStats = await PrioritiesReport.aggregate([
      {
        $match:
          month === 'allTime'
            ? {}
            : {
                date: {
                  $gte: moment(month, 'YYYY-MM-DD')
                    .utcOffset(0)
                    .startOf('month')
                    .startOf('day')
                    .toDate(),
                  $lte: moment(month, 'YYYY-MM-DD')
                    .utcOffset(0)
                    .endOf('month')
                    .endOf('day')
                    .toDate(),
                },
              },
      },
      {
        $group: {
          _id: {
            status: '$status',
            region: '$region',
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          region: '$_id.region',
          status: '$_id.status',
          count: { $ifNull: ['$count', 0] },
        },
      },
    ]);

    const overallStats = await PrioritiesReport.aggregate([
      {
        $match:
          month === 'allTime'
            ? {}
            : {
                date: {
                  $gte: moment(month, 'YYYY-MM-DD')
                    .utcOffset(0)
                    .startOf('month')
                    .startOf('day')
                    .toDate(),
                  $lte: moment(month, 'YYYY-MM-DD')
                    .utcOffset(0)
                    .endOf('month')
                    .endOf('day')
                    .toDate(),
                },
              },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: { $ifNull: ['$count', 0] },
        },
      },
    ]);

    let total = 0;
    for (let i in overallStats) total += overallStats[i].count;

    return res.status(200).json({
      success: true,
      regionStats,
      overallStats,
      total,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error,
    });
  }
});

router.post('/add-user', async (req, res) => {
  const reports = await PrioritiesReport.updateMany({}, { user: '5fb0088bbf9fac391822ea2c' });

  return res.json(reports);
});

module.exports = router;
