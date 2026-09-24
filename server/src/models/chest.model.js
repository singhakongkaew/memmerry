const mongoose = require("mongoose");
const chestSchema = new mongoose.Schema({ name: { type: String, required: true }, region: { type: String, required: true, index: true }, subregion: String, rarity: { type: String, enum: ["Basic", "Standard", "Advanced", "Premium", "Sonance"] }, x: { type: Number, required: true }, y: { type: Number, required: true }, instructions: { type: String, required: true }, rewards: [String], verified: Boolean }, { timestamps: true });
module.exports = mongoose.model("Chest", chestSchema);
