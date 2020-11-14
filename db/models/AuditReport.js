const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuditReportSchema = new Schema(
  {
    stationName: {
      type: String,
      required: true,
    },
    areaManager: {
      type: String,
      default: null,
    },
    regionalManager: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    auditedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    receivingAndGreeting: [
      {
        name: {
          type: String,
          required: true,
        },
        point: {
          type: Number,
          required: true,
        },
      },
    ],
    requestAndRecommendations: [
      {
        name: {
          type: String,
          required: true,
        },
        point: {
          type: Number,
          required: true,
        },
      },
    ],
    workOrder: [
      {
        name: {
          type: String,
          required: true,
        },
        point: {
          type: Number,
          required: true,
        },
      },
    ],
    servicing: [
      {
        name: {
          type: String,
          required: true,
        },
        point: {
          type: Number,
          required: true,
        },
      },
    ],
    qualityCheck: [
      {
        name: {
          type: String,
          required: true,
        },
        point: {
          type: Number,
          required: true,
        },
      },
    ],
    explainationAndNextService: [
      {
        name: {
          type: String,
          required: true,
        },
        point: {
          type: Number,
          required: true,
        },
      },
    ],
    invoicingAndPayment: [
      {
        name: {
          type: String,
          required: true,
        },
        point: {
          type: Number,
          required: true,
        },
      },
    ],
    releasing: [
      {
        name: {
          type: String,
          required: true,
        },
        point: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    netScore: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    cleaningAndDisinfection: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    handSanitizers: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    temperatureCheck: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    socialDistancing: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    PPEDisinfectantsAndHandSanitizersSupplies: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    staffAwareness: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    PPE: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    procedureOfSuspected: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    procedureOfConfirmed: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    swipeMachinesAndEPayment: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    customer: {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      evidence: {
        type: String,
        required: true,
      },
    },
    implemented: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = AuditReport = mongoose.model('auditReport', AuditReportSchema);
