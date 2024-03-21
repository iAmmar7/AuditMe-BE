const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
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
      enum: ['auditor', 'rm', 'viewer', 'am', 'sm', 'admin'],
    },
    isAdmin: {
      type: Boolean,
      default: false,
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
