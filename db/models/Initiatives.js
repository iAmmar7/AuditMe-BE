const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');
const { regions, issueType } = require('../../utils/constants');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);

const InitiativesSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      default: () => nanoid(),
    },
    auditor: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'auditor',
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

const Initiatives = mongoose.model('initiatives', InitiativesSchema);

module.exports = Initiatives;
