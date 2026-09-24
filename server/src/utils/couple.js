const crypto = require('crypto');
const Couple = require('../models/couple.model');
const Home = require('../models/home.model');

function newInviteCode() { return crypto.randomBytes(5).toString('base64url').toUpperCase(); }

async function createCouple(userId, inviteCode) {
  const couple = await Couple.create({ memberIds: [userId], inviteCode: inviteCode || newInviteCode() });
  const legacyHome = await Home.findOne({ userId });
  if (legacyHome) {
    legacyHome.coupleId = couple._id;
    await legacyHome.save();
  } else {
    await Home.create({ coupleId: couple._id, userId, cards: [{ coupleId: couple._id, id: 1, title: 'Our first hello', date: new Date().toISOString().slice(0, 10), emoji: '💞', color: 'peach', pinned: true }], memories: [], tasks: [{ coupleId: couple._id, id: 1, title: 'Make this space ours', category: 'Things to do', who: 'Both', done: false }], moods: {}, dailyMessage: 'Welcome to your little universe.' });
  }
  return couple;
}

async function ensureCouple(user) {
  if (user.coupleId) return Couple.findById(user.coupleId);
  const couple = await createCouple(user._id);
  user.coupleId = couple._id;
  await user.save();
  return couple;
}

module.exports = { createCouple, ensureCouple };
