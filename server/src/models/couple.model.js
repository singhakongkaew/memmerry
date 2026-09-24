const mongoose = require('mongoose');

const coupleSchema = new mongoose.Schema({
  memberIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], validate: [(members) => members.length <= 2, 'A couple space can have at most two members.'] },
  inviteCode: { type: String, required: true, unique: true, index: true },
  names: { type: String, default: 'Our little universe' },
  startDate: { type: Date, default: null },
  countdownLabel: { type: String, default: 'Days together' },
  nickname: { type: String, default: '' },
  theme: { type: String, enum: ['peach', 'rose', 'sunny'], default: 'peach' },
}, { timestamps: true });

module.exports = mongoose.model('Couple', coupleSchema);
