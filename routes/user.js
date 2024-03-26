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

// @route   PATCH /api/user/activity
// @desc    Update user activity
// @access  Private
router.patch('/activity', async (req, res) => {
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
    auditor,
    status,
    type,
    region,
    stationManager,
    dateIdentified,
    station,
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
    if (auditor)
      matchQuery.push({ 'auditor.name': { $regex: auditor, $options: 'i' } });
    if (stationManager)
      matchQuery.push({
        'stationManager.name': { $regex: stationManager, $options: 'i' },
      });
    if (status) matchQuery.push({ status: { $regex: status, $options: 'i' } });
    if (type) matchQuery.push({ type: { $regex: type, $options: 'i' } });
    if (region) matchQuery.push({ region: { $regex: region, $options: 'i' } });
    if (station)
      matchQuery.push({
        station: { $regex: station, $options: 'i' },
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
    const reports = await AuditReport.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'auditor',
          foreignField: '_id',
          as: 'auditor',
        },
      },
      { $unwind: '$auditor' },
      {
        $lookup: {
          from: User.collection.name,
          localField: 'stationManager',
          foreignField: '_id',
          as: 'stationManager',
        },
      },
      { $unwind: '$stationManager' },
      {
        $match:
          matchQuery.length > 0
            ? {
                $and: [...matchQuery],
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
          auditor: '$root.auditor.name',
          auditorId: '$root.auditor._id',
          resolvedByName: { $ifNull: ['$resolvedBy.name', null] },
          resolvedById: { $ifNull: ['$resolvedBy._id', null] },
          type: '$root.type',
          status: '$root.status',
          region: '$root.region',
          details: '$root.details',
          station: '$root.station',
          stationManager: '$root.stationManager.name',
          stationManagerId: '$root.stationManager._id',
          evidencesBefore: '$root.evidencesBefore',
          evidencesAfter: '$root.evidencesAfter',
          feedback: '$root.feedback',
          dateOfClosure: '$root.dateOfClosure',
          dateIdentified: '$root.dateIdentified',
          actionTaken: '$root.actionTaken',
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
          localField: 'auditor',
          foreignField: '_id',
          as: 'auditor',
        },
      },
      { $unwind: '$auditor' },
      {
        $match:
          matchQuery.length > 0
            ? {
                $and: [...matchQuery],
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
    console.log('error', error);
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
  let { current, pageSize, id, date, auditor, status, type, region, station } =
    params;
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
    if (auditor)
      matchQuery.push({ 'auditor.name': { $regex: auditor, $options: 'i' } });
    if (status) matchQuery.push({ status: { $regex: status, $options: 'i' } });
    if (type) matchQuery.push({ type: { $regex: type, $options: 'i' } });
    if (region) matchQuery.push({ region: { $regex: region, $options: 'i' } });
    if (station)
      matchQuery.push({ station: { $regex: station, $options: 'i' } });

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
          localField: 'auditor',
          foreignField: '_id',
          as: 'auditor',
        },
      },
      { $unwind: '$auditor' },
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
          auditorName: '$root.auditor.name',
          auditorId: '$root.auditor._id',
          type: '$root.type',
          region: '$root.region',
          details: '$root.details',
          station: '$root.station',
          evidencesBefore: '$root.evidencesBefore',
          evidencesAfter: '$root.evidencesAfter',
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
          localField: 'auditor',
          foreignField: '_id',
          as: 'auditor',
        },
      },
      { $unwind: '$auditor' },
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

// @route   PATCH /api/user/delete-image
// @desc    Delete saved image
// @access  Private
router.patch('/delete-image', async (req, res) => {
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
      const updateIssue = await AuditReport.findOneAndUpdate(
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

// @route   POST /api/user/csv/audit-reports
// @desc    Get all audit reports
// @access  Private
router.post('/csv/audit-reports', async (req, res) => {
  const {
    filters: {
      id,
      date,
      auditor,
      status,
      type,
      region,
      stationManager,
      station,
      dateIdentified,
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
  if (auditor)
    matchQuery.push({ 'auditor.name': { $regex: auditor, $options: 'i' } });
  if (status) matchQuery.push({ status: { $regex: status, $options: 'i' } });
  if (type) matchQuery.push({ type: { $regex: type, $options: 'i' } });
  if (region) matchQuery.push({ region: { $regex: region, $options: 'i' } });
  if (stationManager)
    matchQuery.push({
      'stationManager.name': { $regex: stationManager, $options: 'i' },
    });
  if (station) matchQuery.push({ station: { $regex: station, $options: 'i' } });
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
    const reports = await AuditReport.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'auditor',
          foreignField: '_id',
          as: 'auditor',
        },
      },
      { $unwind: '$auditor' },
      {
        $lookup: {
          from: User.collection.name,
          localField: 'stationManager',
          foreignField: '_id',
          as: 'stationManager',
        },
      },
      { $unwind: '$stationManager' },
      {
        $match:
          matchQuery.length > 0
            ? {
                $and: [...matchQuery],
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
          auditorName: '$root.auditor.name',
          auditorId: '$root.auditor._id',
          stationManagerName: '$root.stationManager.name',
          stationManagerId: '$root.stationManager._id',
          status: '$root.status',
          type: '$root.type',
          region: '$root.region',
          details: '$root.details',
          dateIdentified: '$root.dateIdentified',
          station: '$root.station',
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
        auditor: reports[i].auditorName,
        stationManager: reports[i].stationManagerName,
        status: reports[i].status,
        type: reports[i].type,
        region: reports[i].region,
        details:
          reports[i].details && reports[i].details.trim().replace(/["]+/g, ''),
        dateIdentified: moment(reports[i].dateIdentified).format('DD-MMM-YY'),
        station: reports[i].station,
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
// @desc    Get all initiatives reports
// @access  Private
router.post('/csv/initiatives-reports', async (req, res) => {
  const {
    filters: { id, date, auditor, type, region, station },
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
  if (auditor)
    matchQuery.push({ 'auditor.name': { $regex: auditor, $options: 'i' } });
  if (type) matchQuery.push({ type: { $regex: type, $options: 'i' } });
  if (region) matchQuery.push({ region: { $regex: region, $options: 'i' } });
  if (station)
    matchQuery.push({
      station: { $regex: station, $options: 'i' },
    });

  try {
    // Get reports
    const reports = await Initiatives.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'auditor',
          foreignField: '_id',
          as: 'auditor',
        },
      },
      { $unwind: '$auditor' },
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
          auditorName: '$auditor.name',
          auditorId: '$auditor._id',
          type: '$type',
          region: '$region',
          details: '$details',
          station: '$station',
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
        auditor: reports[i].auditorName,
        auditorId: reports[i].auditorId,
        type: reports[i].type,
        region: reports[i].region,
        details:
          reports[i].details && reports[i].details.trim().replace(/["]+/g, ''),
        station: reports[i].station,
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
