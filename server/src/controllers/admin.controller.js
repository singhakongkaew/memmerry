const User = require('../models/user.model');
const Home = require('../models/home.model');

const publicUser = (user) => ({ id: user._id, email: user.email, role: user.role, coupleId: user.coupleId, collectedChestIds: user.collectedChestIds, createdAt: user.createdAt });

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(users.map(publicUser));
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const changes = {};
    if (typeof req.body.email === 'string' && req.body.email.trim()) changes.email = req.body.email.trim().toLowerCase();
    if (req.body.role === 'user' || req.body.role === 'admin') changes.role = req.body.role;
    if (!Object.keys(changes).length) return res.status(400).json({ message: 'Provide a valid email or role.' });
    const user = await User.findByIdAndUpdate(req.params.userId, { $set: changes }, { new: true, runValidators: true }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(publicUser(user));
  } catch (error) { next(error); }
};

exports.getUserHome = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('coupleId').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const home = user.coupleId ? await Home.findOne({ coupleId: user.coupleId }).lean() : null;
    res.json(home || { coupleId: user.coupleId, cards: [], memories: [], tasks: [], moods: {}, dailyMessage: '' });
  } catch (error) { next(error); }
};

exports.updateUserHome = async (req, res, next) => {
  try {
    const allowed = ['cards', 'memories', 'tasks', 'moods', 'dailyMessage'];
    const changes = Object.fromEntries(allowed.filter((field) => Object.prototype.hasOwnProperty.call(req.body, field)).map((field) => [field, req.body[field]]));
    const user = await User.findById(req.params.userId).select('coupleId').lean();
    if (!user?.coupleId) return res.status(404).json({ message: 'User has no couple space' });
    ['cards', 'memories', 'tasks'].forEach((field) => {
      if (Array.isArray(changes[field])) changes[field] = changes[field].map((record) => ({ ...record, coupleId: user.coupleId }));
    });
    const home = await Home.findOneAndUpdate(
      { coupleId: user.coupleId },
      { $set: changes, $setOnInsert: { coupleId: user.coupleId } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    res.json(home);
  } catch (error) { next(error); }
};
