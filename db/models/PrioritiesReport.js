const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrioritesReportSchema = new Schema(
  {
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
    },
    feedback: {
      type: String,
      default: null,
    },
    daysOpen: {
      type: Date,
      default: null,
    },
    dateOfClosure: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = PrioritesReport = mongoose.model('prioritiesReport', PrioritesReportSchema);
