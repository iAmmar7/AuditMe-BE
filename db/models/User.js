const mongoose = require('mongoose');
const { userRoles } = require('../../utils/constants');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
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
      enum: userRoles,
    },
    profile_picture: {
      type: String,
      default: null,
    },
    recentActivity: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = User = mongoose.model('user', UserSchema);
