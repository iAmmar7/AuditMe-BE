const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CheckListSchema = new Schema(
  {
    BEName: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    stationName: {
      type: String,
      required: true,
    },
    SMName: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    AMName: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    question1: {
      text: {
        type: String,
        default: 'Signage is clean and working properly / Cladding is clean',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question2: {
      text: {
        type: String,
        default: 'Shutter door is clean',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question3: {
      text: {
        type: String,
        default: 'Pillars properly cleaned / no tape marks & stickers on pillars',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question4: {
      text: {
        type: String,
        default: 'No squeegee cleaners / mops in front of station (Cleaning material etc.)',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question5: {
      text: {
        type: String,
        default:
          'Customer Lounge - Clean, floor is mopped and organized properly / No extra things inside the lounge',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question6: {
      text: {
        type: String,
        default: 'Tea - coffee arrangements',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question7: {
      text: {
        type: String,
        default: 'Waste Bin is not overfilled - No posters and stickers at walls',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question8: {
      text: {
        type: String,
        default: 'Water Dispenser - Neat and Clean',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question9: {
      text: {
        type: String,
        default:
          'Computer table - Clean, no extra things on table, paper work should be properly arranged in folders, no dust behind the system, wires properly arranged',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question10: {
      text: {
        type: String,
        default: 'TV - In working condition / No dust on top and behind the screens',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question11: {
      text: {
        type: String,
        default: 'Furniture must be properly cleaned / tidy / not damaged',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question12: {
      text: {
        type: String,
        default: 'Covid related stckers are well in place',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question13: {
      text: {
        type: String,
        default:
          'VAT certificate has been displayed min. at 2 visible locations - One must be near POS',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question14: {
      text: {
        type: String,
        default: 'CR seat & basin clean and no stains',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question15: {
      text: {
        type: String,
        default: 'Soap available',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question16: {
      text: {
        type: String,
        default: 'Floor, Mirror and walls clean',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question17: {
      text: {
        type: String,
        default: 'Floor & ceiling is clean / No dirty hands on walls',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question18: {
      text: {
        type: String,
        default: 'All machines are clean',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question19: {
      text: {
        type: String,
        default: 'Pit rollers are clean (Also sides)',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question20: {
      text: {
        type: String,
        default: 'Oil & water hoses are clean',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question21: {
      text: {
        type: String,
        default: 'Used oil pump & pipes are clean',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question22: {
      text: {
        type: String,
        default: 'Tools properly arranged',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question23: {
      text: {
        type: String,
        default:
          'No extra things in bay area / nothing should be on top of pit-rollers / no hangers hanged on walls / no cartons placed at top of tools trolley/ nothing should be inside bays(pits)',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question24: {
      text: {
        type: String,
        default: 'Tire equipments and tires properly arranged and clean',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question25: {
      text: {
        type: String,
        default: 'Battery display as per the SOP (No old batteries)',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question26: {
      text: {
        type: String,
        default: 'All wall corners should be properly cleaned. No posters & stikers at walls',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question27: {
      text: {
        type: String,
        default:
          'No used gloves to be used to stop bulk oil nozzles or bulk oil pipes (Should be reported to maintenance)',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question28: {
      text: {
        type: String,
        default:
          'Clean fans / Cleaning cloth to be placed inside the tools trolley / Properly clean garbage containers',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question29: {
      text: {
        type: String,
        default: 'Stock room properly arranged, cleaned and marked',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question30: {
      text: {
        type: String,
        default: 'No dust on bulk oil tank / properly clean',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question31: {
      text: {
        type: String,
        default:
          'No extra things at top of the bulk oil tank / remove all old stuff which cannot be used in future',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    question32: {
      text: {
        type: String,
        default: 'Oil compressor change checklist pasted on compressor',
      },
      answer: {
        type: Boolean,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = CheckList = mongoose.model('checkList', CheckListSchema);
