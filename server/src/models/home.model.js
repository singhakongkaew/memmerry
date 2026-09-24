const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  cards: { type: [mongoose.Schema.Types.Mixed], default: [] },
  memories: { type: [mongoose.Schema.Types.Mixed], default: [] },
  tasks: { type: [mongoose.Schema.Types.Mixed], default: [] },
  moods: { type: mongoose.Schema.Types.Mixed, default: {} },
  dailyMessage: { type: String, default: '' },
  anniversaryDate: { type: String, default: '' },
  anniversaryMessage: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Home', homeSchema);
