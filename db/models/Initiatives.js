const mongoose = require('mongoose');
const nanoId = require('nanoid');
const Schema = mongoose.Schema;

const InitiativesSchema = new Schema(
  {
    id: {
      type: String,
      default: () => nanoId.customAlphabet('0123456789', 5)(),
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
        'Bay Violation',
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
    details: {
      type: String,
      required: true,
    },
    stationNumber: {
      type: String,
      required: true,
    },
    evidencesBefore: [{ type: String }],
    evidencesAfter: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

module.exports = Initiatives = mongoose.model('initiatives', InitiativesSchema);
