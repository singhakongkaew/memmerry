const Chest = require("../models/chest.model");
const getChests = async (req, res, next) => { try { const f = {}; if (req.query.region && req.query.region !== "All") f.region = req.query.region; if (req.query.rarity && req.query.rarity !== "All") f.rarity = req.query.rarity; if (req.query.q) f.name = { $regex: req.query.q, $options: "i" }; res.json(await Chest.find(f).sort({ region: 1, name: 1 })); } catch (e) { next(e); } };
const createChest = async (req, res, next) => { try { res.status(201).json(await Chest.create(req.body)); } catch (e) { next(e); } };
const getChest = async (req, res, next) => { try { const chest = await Chest.findById(req.params.id); if (!chest) return res.status(404).json({ message: "Chest not found" }); res.json(chest); } catch (e) { next(e); } };
module.exports = { getChests, createChest, getChest };
