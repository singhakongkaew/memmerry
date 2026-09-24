const Couple = require('../models/couple.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

function view(couple) {
  return { id: couple._id, inviteCode: couple.inviteCode, names: couple.names, startDate: couple.startDate, countdownLabel: couple.countdownLabel, memberCount: couple.memberIds.length };
}

exports.getCouple = async (req, res, next) => {
  try {
    const couple = await Couple.findOne({ _id: req.user.coupleId, memberIds: req.user.id }).lean();
    if (!couple) return res.status(404).json({ message: 'Couple space not found' });
    res.json(view(couple));
  } catch (error) { next(error); }
};

exports.updateCouple = async (req, res, next) => {
  try {
    const changes = {};
    ['names', 'countdownLabel'].forEach((field) => { if (typeof req.body[field] === 'string') changes[field] = req.body[field].trim(); });
    if (req.body.startDate === null || !Number.isNaN(Date.parse(req.body.startDate))) changes.startDate = req.body.startDate || null;
    const couple = await Couple.findOneAndUpdate({ _id: req.user.coupleId, memberIds: req.user.id }, { $set: changes }, { new: true, runValidators: true }).lean();
    if (!couple) return res.status(404).json({ message: 'Couple space not found' });
    res.json(view(couple));
  } catch (error) { next(error); }
};

exports.join = async (req, res, next) => {
  try {
    if (req.user.coupleId) return res.status(409).json({ message: 'You already belong to a couple space.' });
    const couple = await Couple.findOne({ inviteCode: req.body.inviteCode?.trim().toUpperCase() });
    if (!couple) return res.status(404).json({ message: 'Invite code not found.' });
    if (couple.memberIds.length >= 2) return res.status(409).json({ message: 'This couple space already has two members.' });
    couple.memberIds.push(req.user.id);
    await couple.save();
    const user = await User.findByIdAndUpdate(req.user.id, { coupleId: couple._id }, { new: true });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, coupleId: user.coupleId }, process.env.JWT_SECRET || 'change-this-in-production', { expiresIn: '7d' });
    res.json({ token, couple: view(couple), user: { id: user._id, email: user.email, role: user.role, coupleId: user.coupleId } });
  } catch (error) { next(error); }
};
