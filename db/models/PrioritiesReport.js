const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrioritesReportSchema = new Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    week: {
      type: Number,
      required: true,
    },
    region: {
      type: String,
      required: true,
      enum: [
        'WR-North',
        'WR-South',
        'CR-East',
        'CR-South',
        'CR-North',
        'Southern',
        'ER-North',
        'ER-South',
      ],
    },
    areaManager: {
      type: String,
      required: true,
    },
    regionalManager: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'Customer Experience',
        'Housekeeping',
        'Customer Mistreatment',
        'Initiative',
        'Admin Issues',
        'Maintenance Issues',
        'IT Issues',
        'Inventory Issues',
        'Violation',
        'Safety',
        'Others',
      ],
    },
    issueDetails: {
      type: String,
      required: true,
    },
    stationNumber: {
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
      enum: ['Pending', 'Resolved', 'Maintenance'],
    },
    feedback: {
      type: String,
      default: null,
    },
    dateOfClosure: {
      type: Date,
      default: null,
    },
    logNumber: {
      type: String,
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

module.exports = PrioritesReport = mongoose.model('prioritiesReport', PrioritesReportSchema);
