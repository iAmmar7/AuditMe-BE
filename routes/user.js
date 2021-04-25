const fs = require('fs');
const express = require('express');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const formidable = require('formidable');
const router = express.Router();

// Load Models
const {
  User,
  AuditReport,
  PrioritiesReport,
  Initiatives,
  Feedback,
  CheckList,
} = require('../db/models');

// Load utils
const compressImage = require('../utils/compressImage');

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

// @route   POST /api/user/priorities-reports
// @desc    Get all priorities reports
// @access  Private
router.post('/priorities-reports', async (req, res) => {
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

  console.log('/priorities-reports', req.body);

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
                { $subtract: [{ $ifNull: ['$dateOfClosure', new Date()] }, '$dateIdentified'] },
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

    if (!reports) return res.status(400).json({ success: false, message: 'No report found' });

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
          reports[i].issueDetails && reports[i].issueDetails.trim().replace(/["]+/g, ''),
        dateIdentified: moment(reports[i].dateIdentified).format('DD-MMM-YY'),
        stationNumber: reports[i].stationNumber,
        logNumber: reports[i].logNumber,
        daysOpen: reports[i].status === 'Resolved' ? '-' : reports[i].daysOpen,
        daysResolved: reports[i].status === 'Resolved' ? reports[i].daysOpen : '-',
        resolvedByName: reports[i].resolvedByName ? reports[i].resolvedByName : '-',
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

// @route   GET /api/user/initiatives-reports
// @desc    Get all initiatives reports
// @access  Private
router.post('/initiatives-reports', async (req, res) => {
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

  console.log(req.body);

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
    matchQuery.push({ processSpecialist: { $regex: processSpecialist, $options: 'i' } });
  if (regionalManager)
    matchQuery.push({ regionalManager: { $regex: regionalManager, $options: 'i' } });
  if (areaManager) matchQuery.push({ areaManager: { $regex: areaManager, $options: 'i' } });
  if (stationNumber) matchQuery.push({ stationNumber: { $regex: stationNumber, $options: 'i' } });

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

    if (!reports) return res.status(400).json({ success: false, message: 'No report found' });

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
        details: reports[i].details && reports[i].details.trim().replace(/["]+/g, ''),
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

// @route   GET /api/user/report-chart
// @desc    GET region vise report data
// @access  Private
router.get('/report-chart', async (req, res) => {
  const month = req.query.month ? req.query.month : 'allTime';

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

// @route   POST /api/user/delete-image
// @desc    Delete saved image
// @access  Private
router.post('/delete-image', async (req, res) => {
  const { requestType, imageType, id, url } = req.body;

  try {
    if (!requestType || !imageType || !id || !url)
      throw 'Request type, image type, ID and URL is required';

    let updateObj = {};

    if (imageType === 'evidenceBefore') updateObj = { $pull: { evidencesBefore: url } };
    if (imageType === 'evidenceAfter') updateObj = { $pull: { evidencesAfter: url } };

    if (requestType === 'issues') {
      const updateIssue = await PrioritiesReport.findOneAndUpdate({ _id: id }, updateObj, {
        new: true,
      });

      if (!updateIssue) throw 'Unable to delete image';

      fs.unlinkSync(`./public${url}`);
    }

    if (requestType === 'initiatives') {
      const updateIssue = await Initiatives.findOneAndUpdate({ _id: id }, updateObj, {
        new: true,
      });

      if (!updateIssue) throw 'Unable to delete image';

      fs.unlinkSync(`./public${url}`);
    }

    return res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error });
  }
});

// @route   POST /api/user/delete-issue
// @desc    Delete raised issue
// @access  Private
router.delete('/delete-issue/:id', async (req, res) => {
  try {
    if (!req.user.isAdmin) throw 'You are not authorized';

    const report = await PrioritiesReport.findOne({ _id: req.params.id });

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

    const deleteIssue = await PrioritiesReport.findOneAndRemove({ _id: req.params.id });

    if (!deleteIssue) throw 'Unable to delete issue';

    return res.status(200).json({ success: true, message: 'Deleted successfully' });
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

    const deleteIssue = await Initiatives.findOneAndRemove({ _id: req.params.id });

    if (!deleteIssue) throw 'Unable to delete issue';

    return res.status(200).json({ success: true, message: 'Deleted successfully' });
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

  if (badgeNumber) matchQuery.push({ badgeNumber: { $regex: badgeNumber, $options: 'i' } });
  if (name) matchQuery.push({ name: { $regex: name, $options: 'i' } });
  if (roleFilter) matchQuery.push({ role: { $in: roleFilter } });

  if (nameSorter === 'ascend') sorter = { name: -1 };
  if (nameSorter === 'descend') sorter = { name: 1 };

  try {
    if (!req.user.isAdmin) throw 'Unauthorized';

    const users = await User.find(matchQuery.length > 0 ? { $and: matchQuery } : {})
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

  if (!req.user.isAdmin) return res.status(400).json({ success: false, message: 'Unauthorized' });

  const user = await User.findOne({ badgeNumber });

  if (user)
    return res
      .status(400)
      .json({ success: false, message: 'Account already exist with this Badge Number' });

  const newUser = await User.create({ name, badgeNumber, password, role: userType });

  if (!newUser)
    return res
      .status(400)
      .json({ success: false, message: 'Unable to add user, please try later' });

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

// @route   POST /api/user/update-activity
// @desc    POST update user activity
// @access  Private
router.post('/update-activity', async (req, res) => {
  const user = await User.findOneAndUpdate({ _id: req.user.id }, { recentActivity: new Date() });

  return res.json({ success: false, user });
});

// @route   POST /api/user/feedback
// @desc    Fill feedback form
// @access  Private
router.post('/feedback', async (req, res) => {
  const feedback = await Feedback.create({ userId: req.user.id, ...req.body });

  if (!feedback)
    return res.status(400).json({ success: false, message: 'Unable to save feedback form' });

  return res.status(200).json({ success: true, feedback });
});

// @route   POST /api/user/feedback-reports
// @desc    Get all feedback reports
// @access  Private
router.post('/feedback-reports', async (req, res) => {
  const { params, sorter, filter } = req.body;
  let {
    current,
    pageSize,
    date,
    name,
    badgeNumber,
    department,
    otherDepartment,
    subject,
    message,
  } = params;
  let { dateSorter } = sorter;
  let { departmentFilter } = filter;

  console.log('/feedback-reports', req.body);

  current = current ? current : 1;
  pageSize = pageSize ? pageSize : 10;

  const offset = +pageSize * (+current - 1);

  try {
    // Add query params if exist in request
    const matchQuery = [];
    if (date)
      matchQuery.push({
        createdAt: {
          $gte: moment(new Date(date[0])).utcOffset(0).startOf('day').toDate(),
          $lte: moment(new Date(date[1])).utcOffset(0).endOf('day').toDate(),
        },
      });
    if (name) matchQuery.push({ name: { $regex: name, $options: 'i' } });
    if (badgeNumber) matchQuery.push({ badgeNumber: { $regex: badgeNumber, $options: 'i' } });
    if (department) matchQuery.push({ department: { $regex: department, $options: 'i' } });
    if (otherDepartment)
      matchQuery.push({ otherDepartment: { $regex: otherDepartment, $options: 'i' } });
    if (subject) matchQuery.push({ subject: { $regex: subject, $options: 'i' } });
    if (message) matchQuery.push({ message: { $regex: message, $options: 'i' } });

    // Add sorter if exist in request
    let sortBy = { createdAt: -1 };
    if (dateSorter === 'ascend') sortBy = { createdAt: +1 };

    // Add filter if exist in request
    if (departmentFilter) matchQuery.push({ department: { $in: departmentFilter } });

    console.log(matchQuery);

    const feedbacks = await Feedback.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: matchQuery.length > 0 ? { $and: matchQuery } : {} },
      { $sort: sortBy },
      { $limit: +pageSize + offset },
      { $skip: offset },
      {
        $project: {
          _id: '$_id',
          userId: { $ifNull: ['$user._id', null] },
          userName: { $ifNull: ['$user.name', null] },
          userBadgeNumber: { $ifNull: ['$user.badgeNumber', null] },
          name: '$name',
          badgeNumber: '$badgeNumber',
          isAnonymous: '$isAnonymous',
          department: '$department',
          otherDepartment: { $ifNull: ['$otherDepartment', null] },
          subject: '$subject',
          message: '$message',
          createdAt: '$createdAt',
          updatedAt: '$updatedAt',
        },
      },
    ]);

    if (!feedbacks) return res.status(400).json({ success: false, message: 'No report found' });

    // Get reports count
    const feedbacksCount = await Feedback.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: matchQuery.length > 0 ? { $and: matchQuery } : {} },
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

    if (!feedbacksCount)
      return res.status(400).json({ success: false, message: 'Unable to calculate report count' });

    return res.status(200).json({
      success: true,
      reports: feedbacks,
      totalReports: feedbacksCount.length < 1 ? 0 : feedbacksCount[0].count,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Unable to fetch reports, reload',
      error,
    });
  }
});

// @route   GET /api/user/dashboard-timeline
// @desc    Get the data for dashboard timeline
// @access  Private
router.get('/dashboard-timeline', async (req, res) => {
  try {
    const openReports = await PrioritiesReport.aggregate([
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
        $match: {
          status: 'Pending',
        },
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
      { $sort: { 'root.createdAt': -1 } },
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

    if (!openReports) throw 'Unable to fetch open reports';

    const closedReports = await PrioritiesReport.aggregate([
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
        $match: {
          $and: [
            {
              date: {
                $gte: moment().utcOffset(0).subtract(29, 'days').startOf('day').toDate(),
                $lte: moment().utcOffset(0).endOf('day').toDate(),
              },
            },
            { status: { $ne: 'Pending' } },
          ],
        },
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

    if (!closedReports) throw 'Unable to fetch closed reports';

    const openObservations = [],
      openIssues = [],
      closedObservations = [],
      closedIssues = [];
    for (let i in openReports) {
      if (openReports[i].isPrioritized) openIssues.push(openReports[i]);
      else openObservations.push(openReports[i]);
    }
    for (let i in closedReports) {
      if (closedReports[i].isPrioritized) closedIssues.push(closedReports[i]);
      else closedObservations.push(closedReports[i]);
    }

    return res
      .status(200)
      .json({ success: true, openObservations, openIssues, closedObservations, closedIssues });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Unable to fetch data, reload',
    });
  }
});

// @route   POST /api/user/checklist-reports
// @desc    Get all checklist reports
// @access  Private
router.post('/checklist-reports', async (req, res) => {
  const { params, sorter, filter } = req.body;
  let {
    current,
    pageSize,
    date,
    stationName,
    region,
    regionalManagerName,
    areaManagerName,
  } = params;
  let { dateSorter } = sorter;
  let { regionFilter } = filter;

  console.log('/checkist-reports', req.body);

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
    if (stationName) matchQuery.push({ stationName: { $regex: stationName, $options: 'i' } });
    if (region) matchQuery.push({ region: { $regex: region, $options: 'i' } });
    if (areaManagerName)
      matchQuery.push({ 'areaManager.name': { $regex: areaManagerName, $options: 'i' } });
    if (regionalManagerName)
      matchQuery.push({ 'regionalManager.name': { $regex: regionalManagerName, $options: 'i' } });

    // Add sorter if exist in request
    let sortBy = { createdAt: -1 };
    if (dateSorter === 'ascend') sortBy = { date: +1 };
    if (dateSorter === 'descend') sortBy = { date: -1 };

    // Add filter if exist in request
    if (regionFilter) matchQuery.push({ region: { $in: regionFilter } });

    console.log(matchQuery);

    const checklist = await CheckList.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'AMName',
          foreignField: '_id',
          as: 'areaManager',
        },
      },
      { $unwind: '$areaManager' },
      {
        $lookup: {
          from: User.collection.name,
          localField: 'RMName',
          foreignField: '_id',
          as: 'regionalManager',
        },
      },
      { $unwind: '$regionalManager' },
      { $match: matchQuery.length > 0 ? { $and: matchQuery } : {} },
      { $sort: sortBy },
      { $limit: +pageSize + offset },
      { $skip: offset },
      {
        $project: {
          _id: '$_id',
          key: '$_id',
          areaManagerId: '$areaManager._id',
          areaManagerName: '$areaManager.name',
          areaManagerBadgeNumber: '$areaManager.badgeNumber',
          regionalManagerId: '$regionalManager._id',
          regionalManagerName: '$regionalManager.name',
          regionalManagerBadgeNumber: '$regionalManager.badgeNumber',
          date: '$date',
          stationName: '$stationName',
          region: '$region',
          question1: '$question1',
          question2: '$question2',
          question3: '$question3',
          question4: '$question4',
          question5: '$question5',
          question6: '$question6',
          question7: '$question7',
          question8: '$question8',
          question9: '$question9',
          question10: '$question10',
          question11: '$question11',
          question12: '$question12',
          question13: '$question13',
          question14: '$question14',
          question15: '$question15',
          question16: '$question16',
          question17: '$question17',
          question18: '$question18',
          question19: '$question19',
          question20: '$question20',
          question21: '$question21',
          question22: '$question22',
          question23: '$question23',
          question24: '$question24',
          question25: '$question25',
          question26: '$question26',
          question27: '$question27',
          question28: '$question28',
          question29: '$question29',
          question30: '$question30',
          question31: '$question31',
          question32: '$question32',
          createdAt: '$createdAt',
          updatedAt: '$updatedAt',
        },
      },
    ]);

    if (!checklist) return res.status(400).json({ success: false, message: 'No report found' });

    // Get reports count
    const checklistCount = await CheckList.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'AMName',
          foreignField: '_id',
          as: 'areaManager',
        },
      },
      { $unwind: '$areaManager' },
      {
        $lookup: {
          from: User.collection.name,
          localField: 'RMName',
          foreignField: '_id',
          as: 'regionalManager',
        },
      },
      { $match: matchQuery.length > 0 ? { $and: matchQuery } : {} },
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

    if (!checklistCount)
      return res.status(400).json({ success: false, message: 'Unable to calculate report count' });

    return res.status(200).json({
      success: true,
      reports: checklist,
      totalReports: checklistCount.length < 1 ? 0 : checklistCount[0].count,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Unable to fetch reports, reload',
      error,
    });
  }
});

// @route   GET /api/user/regional-managers
// @desc    Get the list regional managers name
// @access  Private
router.get('/regional-managers', async (req, res) => {
  try {
    const users = await User.find({ role: 'rm' }).select('_id name').lean();

    if (!users) throw 'Unable to fetch regional managers';

    return res.status(200).json({ success: true, regionalManagers: users });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Unable to fetch data, reload',
      error,
    });
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
