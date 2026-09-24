const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Couple = require('../models/couple.model');
const { createCouple, ensureCouple } = require('../utils/couple');

const sign = (user) => jwt.sign({ id: user._id, email: user.email, role: user.role, coupleId: user.coupleId }, process.env.JWT_SECRET || 'change-this-in-production', { expiresIn: '7d' });
const publicUser = (user) => ({ id: user._id, email: user.email, displayName: user.displayName, profileImage: user.profileImage, role: user.role, coupleId: user.coupleId, collectedChestIds: user.collectedChestIds });
const payload = (user, couple) => ({ token: sign(user), user: publicUser(user), couple: couple ? { id: couple._id, inviteCode: couple.inviteCode, names: couple.names, startDate: couple.startDate, countdownLabel: couple.countdownLabel, memberCount: couple.memberIds.length } : null });

exports.signup = async (req, res, next) => {
	try {
		const { email, password, inviteCode } = req.body;
		if (!email || !password || password.length < 8) return res.status(400).json({ message: 'Use an email and a password of at least 8 characters.' });
		if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account already uses this email.' });
		let couple;
		if (inviteCode) {
			couple = await Couple.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
			if (!couple) return res.status(404).json({ message: 'Invite code not found.' });
			if (couple.memberIds.length >= 2) return res.status(409).json({ message: 'This couple space already has two members.' });
		}
		const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12) });
		if (couple) { couple.memberIds.push(user._id); await couple.save(); user.coupleId = couple._id; await user.save(); }
		else { couple = await createCouple(user._id); user.coupleId = couple._id; await user.save(); }
		res.status(201).json(payload(user, couple));
	} catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
	try {
		const user = await User.findOne({ email: req.body.email?.toLowerCase() });
		if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' });
		const inviteCode = req.body.inviteCode?.trim().toUpperCase();
		if (inviteCode) {
			const invitedCouple = await Couple.findOne({ inviteCode });
			if (!invitedCouple) return res.status(404).json({ message: 'Invite code not found.' });
			if (user.coupleId && String(user.coupleId) !== String(invitedCouple._id)) return res.status(409).json({ message: 'Leave your current couple space before joining another one.' });
			if (!user.coupleId) {
				if (invitedCouple.memberIds.length >= 2) return res.status(409).json({ message: 'This couple space already has two members.' });
				invitedCouple.memberIds.push(user._id);
				await invitedCouple.save();
				user.coupleId = invitedCouple._id;
				await user.save();
			}
			return res.json(payload(user, invitedCouple));
		}
		const couple = await ensureCouple(user);
		res.json(payload(user, couple));
	} catch (error) { next(error); }
};

exports.me = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: 'User not found' });
		const couple = await ensureCouple(user);
		res.json({ token: sign(user), ...publicUser(user), couple: { id: couple._id, inviteCode: couple.inviteCode, names: couple.names, startDate: couple.startDate, countdownLabel: couple.countdownLabel, memberCount: couple.memberIds.length } });
	} catch (error) { next(error); }
};

exports.saveProgress = async (req, res, next) => { 
	try { 
		const ids = Array.isArray(req.body.collectedChestIds) ? req.body.collectedChestIds : null; 
		if (!ids) return res.status(400).json({ message: 'collectedChestIds must be an array' }); 
		const user = await User.findByIdAndUpdate(req.user.id, { collectedChestIds: ids }, { new: true }); 
		res.json({ collectedChestIds: user.collectedChestIds }); 
	} catch (error) { next(error); } 
};
