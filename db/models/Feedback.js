const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    name: {
      type: String,
    },
    badgeNumber: {
      type: String,
    },
    isAnonymous: {
      type: Boolean,
      required: true,
    },
    department: {
      type: String,
      required: true,
      enum: ['Sales', 'Customer Support', 'Business Development', 'Other'],
    },
    otherDepartment: {
      type: String,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = Feedback = mongoose.model('feedback', FeedbackSchema);
