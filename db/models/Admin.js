const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminSchema = new Schema(
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
      default: 'admin',
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

module.exports = Admin = mongoose.model('admin', AdminSchema);
