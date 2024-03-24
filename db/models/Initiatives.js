const mongoose = require('mongoose');
const { regions, issueType } = require('../../utils/constants');

const InitiativesSchema = new mongoose.Schema(
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
    evidencesBefore: [{ type: String }],
    evidencesAfter: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

module.exports = Initiatives = mongoose.model('initiatives', InitiativesSchema);
