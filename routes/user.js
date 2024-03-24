const fs = require('fs');
const express = require('express');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const formidable = require('formidable');
const router = express.Router();

// Load Models
const AuditReport = require('../db/models/AuditReport');
const PrioritiesReport = require('../db/models/PrioritiesReport');
const Initiatives = require('../db/models/Initiatives');
const User = require('../db/models/User');

// Load utils
const compressImage = require('../utils/compressImage');

// @route   GET /api/user
// @desc    Fetch current user details
// @access  Public
router.get('/', async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errors: error,
    });
  }
});

// @route   POST /api/user/activity
// @desc    Update user activity
// @access  Private
router.post('/activity', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.user.id },
      { recentActivity: new Date() },
    );
    return res.json({ success: true, user });
  } catch (error) {
    return res.json({ success: false, errors: error });
  }
});

// @route   GET /api/user/roles
// @desc    List down all users by role
// @access  Private
router.get('/roles', async (req, res) => {
  let { role } = req.query;

  try {
    const users = await User.find({ role });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(400).json({ success: false, error: error });
  }
});

// @route   GET /api/user/report-chart
// @desc    GET region vise report data
// @access  Private
router.get('/report-chart', async (req, res) => {
  const month =
    req.query.month && req.query.month !== 'undefined'
      ? req.query.month
      : 'allTime';

  try {
    const regionStatusStats = await PrioritiesReport.aggregate([
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

    const regionTypeStats = await PrioritiesReport.aggregate([
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
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          type: '$_id.type',
          region: '$_id.region',
          status: '$_id.status',
          count: { $ifNull: ['$count', 0] },
        },
      },
    ]);

    // Manipulate data for chart
    for (let i of regionStatusStats) {
      for (let j of regionTypeStats) {
        if (i.region === j.region && i.status === j.status) {
          i[j.type] = j.count;
        }
      }
    }

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
      regionStats: regionStatusStats,
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

// @route   POST /api/user/audit-report
// @desc    Get all audit reports
// @access  Private
router.post('/audit-reports', async (req, res) => {
  const { params, sorter, filter, isPrioritized = true } = req.body;
  let {
    current,
    pageSize,
    id,
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

  current = current ? current : 1;
  pageSize = pageSize ? pageSize : 10;

  const offset = +pageSize * (+current - 1);

  try {
    // Add query params if exist in request
    const matchQuery = [];
    if (id) matchQuery.push({ id: parseInt(id) });
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
      matchQuery.push({
        processSpecialist: { $regex: processSpecialist, $options: 'i' },
      });
    if (regionalManager)
      matchQuery.push({
        regionalManager: { $regex: regionalManager, $options: 'i' },
      });
    if (areaManager)
      matchQuery.push({ areaManager: { $regex: areaManager, $options: 'i' } });
    if (stationNumber)
      matchQuery.push({
        stationNumber: { $regex: stationNumber, $options: 'i' },
      });
    if (dateIdentified)
      matchQuery.push({
        dateIdentified: {
          $gte: moment(new Date(dateIdentified[0]))
            .utcOffset(0)
            .startOf('day')
            .toDate(),
          $lte: moment(new Date(dateIdentified[1]))
            .utcOffset(0)
            .endOf('day')
            .toDate(),
        },
      });

    // Add sorter if exist in request
    let sortBy = { 'root.createdAt': -1 };
    if (dateSorter === 'ascend') sortBy = { 'root.date': +1 };
    if (dateSorter === 'descend') sortBy = { 'root.date': -1 };
    if (dateIdentifiedSorter === 'ascend')
      sortBy = { 'root.dateIdentified': +1 };
    if (dateIdentifiedSorter === 'descend')
      sortBy = { 'root.dateIdentified': -1 };
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
    const reports = await AuditReport.aggregate([
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
                $and: [{ isPrioritized }, ...matchQuery],
              }
            : { isPrioritized },
      },
      {
        $project: {
          _id: '$_id',
          daysOpen: {
            $trunc: {
              $divide: [
                {
                  $subtract: [
                    { $ifNull: ['$dateOfClosure', new Date()] },
                    '$dateIdentified',
                  ],
                },
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
          id: '$root.id',
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
          logNumber: '$root.logNumber',
          maintenanceComment: '$root.maintenanceComment',
          isPrioritized: '$root.isPrioritized',
          updatedBy: '$root.updatedBy',
          createdAt: '$root.createdAt',
          updatedAt: '$root.updatedAt',
        },
      },
    ]);

    if (!reports)
      return res
        .status(400)
        .json({ success: false, message: 'No report found' });

    // Get reports count
    const reportsCount = await AuditReport.aggregate([
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
                $and: [{ isPrioritized }, ...matchQuery],
              }
            : { isPrioritized },
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
      return res
        .status(400)
        .json({ success: false, message: 'Unable to calculate report count' });

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

// @route   GET /api/user/initiative-reports
// @desc    Get all initiatives reports
// @access  Private
router.post('/initiative-reports', async (req, res) => {
  const { params, sorter, filter } = req.body;
  let {
    current,
    pageSize,
    id,
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

  current = current ? current : 1;
  pageSize = pageSize ? pageSize : 10;

  const offset = +pageSize * (+current - 1);

  try {
    // Add query params if exist in request
    const matchQuery = [];
    if (id) matchQuery.push({ id: parseInt(id) });
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
      matchQuery.push({
        processSpecialist: { $regex: processSpecialist, $options: 'i' },
      });
    if (regionalManager)
      matchQuery.push({
        regionalManager: { $regex: regionalManager, $options: 'i' },
      });
    if (areaManager)
      matchQuery.push({ areaManager: { $regex: areaManager, $options: 'i' } });
    if (stationNumber)
      matchQuery.push({
        stationNumber: { $regex: stationNumber, $options: 'i' },
      });
    if (dateIdentified)
      matchQuery.push({
        dateIdentified: {
          $gte: moment(new Date(dateIdentified[0]))
            .utcOffset(0)
            .startOf('day')
            .toDate(),
          $lte: moment(new Date(dateIdentified[1]))
            .utcOffset(0)
            .endOf('day')
            .toDate(),
        },
      });

    // Add sorter if exist in request
    let sortBy = { 'root.createdAt': -1 };
    if (dateSorter === 'ascend') sortBy = { 'root.date': +1 };
    if (dateSorter === 'descend') sortBy = { 'root.date': -1 };
    if (dateIdentifiedSorter === 'ascend')
      sortBy = { 'root.dateIdentified': +1 };
    if (dateIdentifiedSorter === 'descend')
      sortBy = { 'root.dateIdentified': -1 };
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
                {
                  $subtract: [
                    { $ifNull: ['$dateOfClosure', new Date()] },
                    '$dateIdentified',
                  ],
                },
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
          id: '$root.id',
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

    if (!reports)
      return res
        .status(400)
        .json({ success: false, message: 'No report found' });

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
      return res
        .status(400)
        .json({ success: false, message: 'Unable to calculate report count' });

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

// @route   POST /api/user/priorities-report
// @desc    Submit priorities/issue report
// @access  Private
router.post('/priorities-report', async (req, res) => {
  // Ensure the directory exists
  const uploadDir = path.join('public', 'issues');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

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
        return res
          .status(400)
          .json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

// @route   POST /api/user/priority-report/:id
// @desc    Update priority/issue report
// @access  Private
router.post('/priority-report/:id', async (req, res) => {
  // Ensure the directory exists
  const uploadDir = path.join('public', 'issues');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const formData = formidable({
    uploadDir: './public/issues',
    keepExtensions: true,
    multiples: true,
  });

  console.log(req.params.id);

  if (!req.params.id) return;

  const report = await PrioritiesReport.findOne({ _id: req.params.id });

  if (!report)
    return res
      .status(400)
      .json({ success: false, message: 'Unable to update report' });

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

      let updatedEvidencesBefore = [
        ...report.evidencesBefore,
        ...arrayOfEvidencesBeforeFiles,
      ];
      let updatedEvidencesAfter = [
        ...report.evidencesAfter,
        ...arrayOfEvidencesAfterFiles,
      ];

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
        return res
          .status(400)
          .json({ success: false, message: 'Input fields validation error' });
      }

      return res.status(400).json({ success: false, message: error });
    }
  });
});

// @route   GET /api/user/csv/priorities-reports
// @desc    Get all priorities reports
// @access  Private
router.post('/csv/priorities-reports', async (req, res) => {
  const {
    filters: {
      id,
      date,
      user,
      status,
      type,
      region,
      processSpecialist,
      areaManager,
      regionalManager,
      stationNumber,
      dateIdentified,
    },
    isPrioritized = true,
  } = req.body;

  const matchQuery = [];
  if (id) matchQuery.push({ id: parseInt(id) });
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
    matchQuery.push({
      processSpecialist: { $regex: processSpecialist, $options: 'i' },
    });
  if (regionalManager)
    matchQuery.push({
      regionalManager: { $regex: regionalManager, $options: 'i' },
    });
  if (areaManager)
    matchQuery.push({ areaManager: { $regex: areaManager, $options: 'i' } });
  if (stationNumber)
    matchQuery.push({
      stationNumber: { $regex: stationNumber, $options: 'i' },
    });
  if (dateIdentified)
    matchQuery.push({
      dateIdentified: {
        $gte: moment(new Date(dateIdentified[0]))
          .utcOffset(0)
          .startOf('day')
          .toDate(),
        $lte: moment(new Date(dateIdentified[1]))
          .utcOffset(0)
          .endOf('day')
          .toDate(),
      },
    });

  try {
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
                $and: [{ isPrioritized }, ...matchQuery],
              }
            : { isPrioritized },
      },
      {
        $project: {
          _id: '$_id',
          daysOpen: {
            $trunc: {
              $divide: [
                {
                  $subtract: [
                    { $ifNull: ['$dateOfClosure', new Date()] },
                    '$dateIdentified',
                  ],
                },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          root: '$$ROOT',
        },
      },
      { $sort: { createdAt: 1 } },
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
          _id: 0,
          id: '$root.id',
          date: '$root.date',
          week: '$root.week',
          userName: '$root.user.name',
          status: '$root.status',
          type: '$root.type',
          region: '$root.region',
          regionalManager: '$root.regionalManager',
          areaManager: '$root.areaManager',
          issueDetails: '$root.issueDetails',
          dateIdentified: '$root.dateIdentified',
          stationNumber: '$root.stationNumber',
          logNumber: '$root.logNumber',
          daysOpen: '$daysOpen',
          resolvedByName: { $ifNull: ['$resolvedBy.name', null] },
          dateOfClosure: '$root.dateOfClosure',
        },
      },
    ]);

    if (!reports)
      return res
        .status(400)
        .json({ success: false, message: 'No report found' });

    const modifiedReport = [];
    for (let i in reports) {
      modifiedReport.push({
        id: reports[i].id,
        date: moment(reports[i].date).format('DD-MMM-YY'),
        week: reports[i].week,
        processSpecialist: reports[i].userName,
        status: reports[i].status,
        type: reports[i].type,
        region: reports[i].region,
        regionalManager: reports[i].regionalManager,
        areaManager: reports[i].areaManager,
        issueDetails:
          reports[i].issueDetails &&
          reports[i].issueDetails.trim().replace(/["]+/g, ''),
        dateIdentified: moment(reports[i].dateIdentified).format('DD-MMM-YY'),
        stationNumber: reports[i].stationNumber,
        logNumber: reports[i].logNumber,
        daysOpen: reports[i].status === 'Resolved' ? '-' : reports[i].daysOpen,
        daysResolved:
          reports[i].status === 'Resolved' ? reports[i].daysOpen : '-',
        resolvedByName: reports[i].resolvedByName
          ? reports[i].resolvedByName
          : '-',
        dateOfClosure: reports[i].dateOfClosure
          ? moment(reports[i].dateOfClosure).format('DD-MMM-YY')
          : '-',
      });
    }

    return res.status(200).json({
      success: true,
      reports: modifiedReport,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Unable to fetch reports, try later',
    });
  }
});

// @route   GET /api/user/csv/priorities-reports
// @desc    Get all priorities reports
// @access  Private
router.post('/csv/initiatives-reports', async (req, res) => {
  const {
    filters: {
      id,
      date,
      user,
      status,
      type,
      region,
      processSpecialist,
      areaManager,
      regionalManager,
      stationNumber,
    },
  } = req.body;

  const matchQuery = [];
  if (id) matchQuery.push({ id: parseInt(id) });
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
    matchQuery.push({
      processSpecialist: { $regex: processSpecialist, $options: 'i' },
    });
  if (regionalManager)
    matchQuery.push({
      regionalManager: { $regex: regionalManager, $options: 'i' },
    });
  if (areaManager)
    matchQuery.push({ areaManager: { $regex: areaManager, $options: 'i' } });
  if (stationNumber)
    matchQuery.push({
      stationNumber: { $regex: stationNumber, $options: 'i' },
    });

  console.log('CSV', matchQuery);

  try {
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
      { $sort: { createdAt: 1 } },
      {
        $project: {
          _id: 0,
          id: '$id',
          date: '$date',
          week: '$week',
          userName: '$user.name',
          type: '$type',
          region: '$region',
          regionalManager: '$regionalManager',
          areaManager: '$areaManager',
          details: '$details',
          stationNumber: '$stationNumber',
        },
      },
    ]);

    if (!reports)
      return res
        .status(400)
        .json({ success: false, message: 'No report found' });

    const modifiedReport = [];
    for (let i in reports) {
      modifiedReport.push({
        id: reports[i].id,
        date: moment(reports[i].date).format('DD-MMM-YY'),
        week: reports[i].week,
        processSpecialist: reports[i].userName,
        type: reports[i].type,
        region: reports[i].region,
        regionalManager: reports[i].regionalManager,
        areaManager: reports[i].areaManager,
        details:
          reports[i].details && reports[i].details.trim().replace(/["]+/g, ''),
        dateIdentified: moment(reports[i].dateIdentified).format('DD-MMM-YY'),
        stationNumber: reports[i].stationNumber,
      });
    }

    return res.status(200).json({
      success: true,
      reports: modifiedReport,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Unable to fetch reports, try later',
    });
  }
});

// @route   POST /api/user/delete-image
// @desc    Delete saved image
// @access  Private
router.post('/delete-image', async (req, res) => {
  const { requestType, imageType, id, url } = req.body;

  try {
    if (!requestType || !imageType || !id || !url)
      throw 'Request type, image type, ID and URL is required';

    let updateObj = {};

    if (imageType === 'evidenceBefore')
      updateObj = { $pull: { evidencesBefore: url } };
    if (imageType === 'evidenceAfter')
      updateObj = { $pull: { evidencesAfter: url } };

    if (requestType === 'issues') {
      const updateIssue = await PrioritiesReport.findOneAndUpdate(
        { _id: id },
        updateObj,
        {
          new: true,
        },
      );

      if (!updateIssue) throw 'Unable to delete image';

      fs.unlinkSync(`./public${url}`);
    }

    if (requestType === 'initiatives') {
      const updateIssue = await Initiatives.findOneAndUpdate(
        { _id: id },
        updateObj,
        {
          new: true,
        },
      );

      if (!updateIssue) throw 'Unable to delete image';

      fs.unlinkSync(`./public${url}`);
    }

    return res
      .status(200)
      .json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error });
  }
});

// @route   POST /api/user/delete-initiative
// @desc    Delete an initiative
// @access  Private
router.delete('/delete-initiative/:id', async (req, res) => {
  try {
    if (!req.user.isAdmin) throw 'You are not authorized';

    const report = await Initiatives.findOne({ _id: req.params.id });

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

    const deleteIssue = await Initiatives.findOneAndRemove({
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

// @route   POST /api/user/all-users
// @desc    List down all users
// @access  Private
router.post('/all-users', async (req, res) => {
  let { current, pageSize, badgeNumber, name } = req.body.params;
  let { nameSorter } = req.body.sorter;
  let { roleFilter } = req.body.filter;

  current = current ? current : 1;
  pageSize = pageSize ? pageSize : 10;

  const offset = +pageSize * (+current - 1);

  let matchQuery = [];
  let sorter = { createdAt: -1 };

  if (badgeNumber)
    matchQuery.push({ badgeNumber: { $regex: badgeNumber, $options: 'i' } });
  if (name) matchQuery.push({ name: { $regex: name, $options: 'i' } });
  if (roleFilter) matchQuery.push({ role: { $in: roleFilter } });

  if (nameSorter === 'ascend') sorter = { name: -1 };
  if (nameSorter === 'descend') sorter = { name: 1 };

  try {
    if (!req.user.isAdmin) throw 'Unauthorized';

    const users = await User.find(
      matchQuery.length > 0 ? { $and: matchQuery } : {},
    )
      .limit(pageSize)
      .skip(offset)
      .sort(sorter);

    const userCount = await User.find(
      matchQuery.length > 0 ? { $and: matchQuery } : {},
    ).countDocuments();

    if (!users) throw 'No user found';

    return res.status(200).json({ success: true, users, total: userCount });
  } catch (error) {
    return res.status(400).json({ success: false, message: error });
  }
});

// @route   POST /api/user/add-user
// @desc    Add a user
// @access  Private
router.post('/add-user', async (req, res) => {
  const { badgeNumber, name, password, userType } = req.body;

  if (!req.user.isAdmin)
    return res.status(400).json({ success: false, message: 'Unauthorized' });

  const user = await User.findOne({ badgeNumber });

  if (user)
    return res.status(400).json({
      success: false,
      message: 'Account already exist with this Badge Number',
    });

  const newUser = await User.create({
    name,
    badgeNumber,
    password,
    role: userType,
  });

  if (!newUser)
    return res.status(400).json({
      success: false,
      message: 'Unable to add user, please try later',
    });

  return res.status(200).json({ success: true, user: newUser });
});

// @route   POST /api/user/update-user/:id
// @desc    Update a user
// @access  Private
router.post('/update-user/:id', async (req, res) => {
  const { badgeNumber, name, password } = req.body;

  try {
    if (!req.user.isAdmin) throw 'Unauthorized';

    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { badgeNumber, name, password },
      { new: true },
    );

    if (!user) throw 'Unable to update the user';

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error });
  }
});

// @route   DELETE /api/user/delete-user/:id
// @desc    Delete a user
// @access  Private
router.delete('/delete-user/:id', async (req, res) => {
  try {
    if (!req.user.isAdmin) throw 'Unauthorized';

    const user = await User.findOneAndRemove({ _id: req.params.id });

    if (!user) throw 'Unable to delete the user';

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error });
  }
});

// @route   GET /api/user/image-resoze
// @desc    GET update image sizes
// @access  Private
router.get('/image-resize', async (req, res) => {
  const { folder } = req.query;

  if (folder !== 'issues' && folder !== 'initiatives')
    return res.json({ message: 'Unknown folder' });

  fs.readdirSync(`./public/${folder}/`).forEach((file) => {
    // Check image size and reduce if greater than 0.5mb
    compressImage(`./public/${folder}/${file}`);
  });

  return res.json({ message: 'Image size decresing' });
});

module.exports = router;
