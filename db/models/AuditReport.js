const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');
const { regions, issueType, issueStatus } = require('../../utils/constants');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);

const AuditReportSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      default: () => nanoid(),
    },
    auditor: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    region: {
      type: String,
      required: true,
      enum: regions,
    },
    stationManager: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: issueType,
    },
    details: {
      type: String,
      required: true,
    },
    station: {
      type: String,
      required: true,
    },
    dateIdentified: {
      type: Date,
      required: true,
    },
    evidencesBefore: [{ type: String }],
    evidencesAfter: [{ type: String }],
    actionTaken: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: 'Pending',
      enum: issueStatus,
    },
    feedback: {
      type: String,
      default: null,
    },
    dateOfClosure: {
      type: Date,
      default: null,
    },
    maintenanceComment: {
      type: String,
      default: null,
    },
    isPrioritized: {
      type: Boolean,
      required: true,
    },
    resolvedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      default: null,
    },
    updatedBy: [
      {
        name: String,
        id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'user',
        },
        time: Date,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const AuditReport = mongoose.model('auditReport', AuditReportSchema);

module.exports = AuditReport;
