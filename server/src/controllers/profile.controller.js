const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Couple = require('../models/couple.model');

const tokenFor = (user) => jwt.sign({ id: user._id, email: user.email, role: user.role, coupleId: user.coupleId }, process.env.JWT_SECRET || 'change-this-in-production', { expiresIn: '7d' });
const publicUser = (user) => ({ id: user._id, email: user.email, displayName: user.displayName, profileImage: user.profileImage, role: user.role, coupleId: user.coupleId, createdAt: user.createdAt });
const publicCouple = (couple, members = []) => ({ id: couple._id, inviteCode: couple.inviteCode, names: couple.names, nickname: couple.nickname, startDate: couple.startDate, countdownLabel: couple.countdownLabel, theme: couple.theme, memberCount: couple.memberIds.length, members });

exports.updateMe = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });
    const changes = {};
    if (typeof req.body.displayName === 'string') changes.displayName = req.body.displayName.trim().slice(0, 80);
    if (typeof req.body.profileImage === 'string') changes.profileImage = req.body.profileImage;
    const nextEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : currentUser.email;
    if (nextEmail !== currentUser.email.toLowerCase()) {
      if (!req.body.currentPassword) return res.status(400).json({ message: 'Current password is required to change email.' });
      if (!(await bcrypt.compare(req.body.currentPassword, currentUser.passwordHash))) return res.status(401).json({ message: 'Current password is incorrect.' });
      if (await User.exists({ email: nextEmail, _id: { $ne: currentUser._id } })) return res.status(409).json({ message: 'An account already uses this email.' });
      changes.email = nextEmail;
    }
    const user = await User.findByIdAndUpdate(currentUser._id, { $set: changes }, { new: true, runValidators: true }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) { next(error); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Use a new password of at least 8 characters.' });
    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(401).json({ message: 'Current password is incorrect.' });
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) { next(error); }
};

exports.updateCouple = async (req, res, next) => {
  try {
    const changes = {};
    ['nickname', 'names', 'countdownLabel', 'theme'].forEach((field) => { if (typeof req.body[field] === 'string') changes[field] = req.body[field].trim(); });
    if (req.body.theme && !['peach', 'rose', 'sunny'].includes(req.body.theme)) return res.status(400).json({ message: 'Invalid couple theme.' });
    if (req.body.startDate === null || !Number.isNaN(Date.parse(req.body.startDate))) changes.startDate = req.body.startDate || null;
    const couple = await Couple.findOneAndUpdate({ _id: req.user.coupleId, memberIds: req.user.id }, { $set: changes }, { new: true, runValidators: true }).lean();
    if (!couple) return res.status(404).json({ message: 'Couple space not found' });
    res.json({ couple: publicCouple(couple) });
  } catch (error) { next(error); }
};

exports.getCoupleDetails = async (req, res, next) => {
  try {
    const couple = await Couple.findOne({ _id: req.user.coupleId, memberIds: req.user.id }).lean();
    if (!couple) return res.status(404).json({ message: 'Couple space not found' });
    const members = await User.find({ _id: { $in: couple.memberIds } }).select('displayName email createdAt').lean();
    res.json({ couple: publicCouple(couple, members) });
  } catch (error) { next(error); }
};

exports.leaveCouple = async (req, res, next) => {
  try {
    const couple = await Couple.findOneAndUpdate({ _id: req.user.coupleId, memberIds: req.user.id }, { $pull: { memberIds: req.user.id } }, { new: true }).lean();
    if (!couple) return res.status(404).json({ message: 'Couple space not found' });
    await User.findByIdAndUpdate(req.user.id, { $set: { coupleId: null } });
    res.json({ message: 'You left the couple space.' });
  } catch (error) { next(error); }
};
