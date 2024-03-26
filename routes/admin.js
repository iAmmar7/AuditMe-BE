const express = require('express');
const fs = require('fs');
const router = express.Router();

// Load Models
const AuditReport = require('../db/models/AuditReport');

// @route   DELETE /api/admin/audit-report
// @desc    Delete audit report
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

// @route   DELETE /api/admin/initiative
// @desc    Delete an initiative
// @access  Private
router.delete('/initiative/:id', async (req, res) => {
  try {
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

    const deleteInitiative = await Initiatives.findOneAndRemove({
      _id: req.params.id,
    });

    if (!deleteInitiative) throw 'Unable to delete initiative';

    return res
      .status(200)
      .json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.log('error', error);
    return res.status(400).json({ success: false, message: error });
  }
});

// @route   POST /api/admin/user
// @desc    List down all users
// @access  Private
router.post('/user', async (req, res) => {
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

// @route   POST /api/admin/add-user
// @desc    Add a user
// @access  Private
router.post('/user', async (req, res) => {
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

// @route   PATCH /api/admin/user/:id
// @desc    Update a user
// @access  Private
router.patch('/user/:id', async (req, res) => {
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

// @route   DELETE /api/admin/user/:id
// @desc    Delete a user
// @access  Private
router.delete('/user/:id', async (req, res) => {
  try {
    if (!req.user.isAdmin) throw 'Unauthorized';

    const user = await User.findOneAndRemove({ _id: req.params.id });

    if (!user) throw 'Unable to delete the user';

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error });
  }
});

module.exports = router;
