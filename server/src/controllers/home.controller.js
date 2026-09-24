const Home = require('../models/home.model');

const fields = ['cards', 'memories', 'tasks', 'moods', 'dailyMessage', 'anniversaryDate', 'anniversaryMessage'];
const scopeRecords = (value, coupleId) => Array.isArray(value) ? value.map((record) => ({ ...record, coupleId })) : value;

exports.getHome = async (req, res, next) => {
  try {
    if (!req.user.coupleId) return res.status(409).json({ message: 'No couple space assigned.' });
    const home = await Home.findOne({ coupleId: req.user.coupleId }).lean();
    res.json(home || { coupleId: req.user.coupleId, cards: [], memories: [], tasks: [], moods: {}, dailyMessage: '', anniversaryDate: '', anniversaryMessage: '' });
  } catch (error) {
    next(error);
  }
};

exports.updateHome = async (req, res, next) => {
  try {
    if (!req.user.coupleId) return res.status(409).json({ message: 'No couple space assigned.' });
    const changes = {};
    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) changes[field] = ['cards', 'memories', 'tasks'].includes(field) ? scopeRecords(req.body[field], req.user.coupleId) : req.body[field];
    });
    const home = await Home.findOneAndUpdate(
      { coupleId: req.user.coupleId },
      { $set: changes, $setOnInsert: { coupleId: req.user.coupleId } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    res.json(home);
  } catch (error) {
    next(error);
  }
};
