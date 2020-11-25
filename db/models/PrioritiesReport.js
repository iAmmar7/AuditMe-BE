const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrioritesReportSchema = new Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    week: {
      type: Number,
    },
    date: {
      type: Date,
      required: true,
    },
    region: {
      type: String,
      default: null,
    },
    areaManager: {
      type: String,
      default: null,
    },
    regionalManager: {
      type: String,
      default: null,
    },
    processSpecialist: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      required: true,
    },
    issueDetails: {
      type: String,
      default: null,
    },
    stationNumber: {
      type: String,
      default: null,
    },
    dateIdentified: {
      type: Date,
      required: true,
    },
    evidencesBefore: [{ type: String }],
    evidencesAfter: [{ type: String }],
    actionTaken: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Resolved'],
    },
    feedback: {
      type: String,
      default: null,
    },
    daysOpen: {
      type: Number,
      default: null,
    },
    dateOfClosure: {
      type: Date,
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

module.exports = PrioritesReport = mongoose.model('prioritiesReport', PrioritesReportSchema);
