const mongoose = require('mongoose');

const aiGenerationSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    type: {
      type: String,
      enum: ['description', 'seo', 'price_suggestion', 'text_improvement', 'translation'],
      required: true,
    },
    input: {
      type: mongoose.Schema.Types.Mixed, // flexible input
    },
    output: {
      type: mongoose.Schema.Types.Mixed, // flexible output
    },
    language: {
      type: String,
      enum: ['FR', 'EN', 'AR'],
      default: 'FR',
    },
    tokensUsed: Number,
    model: String,
    wasApplied: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIGeneration', aiGenerationSchema);
