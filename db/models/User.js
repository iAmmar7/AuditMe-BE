const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Pre-save hook to hash password before saving a new user
UserSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  }
  next();
});

// Method to check the password on login
UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('user', UserSchema);

module.exports = User;
