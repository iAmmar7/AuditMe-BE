const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['auditor', 'rm'],
    },
    profile_picture: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = User = mongoose.model('user', UserSchema);
