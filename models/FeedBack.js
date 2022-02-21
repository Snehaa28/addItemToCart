const mongoose = require('mongoose');

const FeedbackInputSchema = mongoose.Schema({

  guid: {
    type: String,
    required: true
  },
  order_id: {
    type: String,
    required: false,
    default: undefined
  },
  store_id: {
    type: String,
    required: false,
    default: undefined
  },
  stars: {
    type: Number,
    required: false,
    default: undefined
  },
  version: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true
  },
  feedback_text: {
    type: String,
    required: false,
    default: undefined
  },
  feedback_options: {
    pricing: {
      type: Boolean,
      required: false
    },
    cart: {
      type: Boolean,
      required: false
    },
    checkout_process: {
      type: Boolean,
      required: false
    },
    receipt: {
      type: Boolean,
      required: false
    },
    use_again: {
      type: String,
      required: false,
      uppercase: true
    },
    recommend_others: {
      type: Boolean,
      required: false
    },
    peferred_over_sco: {
      type: Boolean,
      required: false
    }
  },
  skip: {
    type: Boolean,
    required: false,
    default: undefined
  },
  time_stamp: {
    type: Number,
    required: true,
    default: new Date().getTime()
  }
});
const FeedbackInput = mongoose.model('Feedback', FeedbackInputSchema, 'feedback');

module.exports = FeedbackInput;
