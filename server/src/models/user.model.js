const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', default: null, index: true },
  collectedChestIds: { type: [String], default: [] },
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
