const router = require("express").Router();
const { getChests, createChest, getChest } = require("../controllers/chest.controller");
router.get("/", getChests); router.post("/", createChest); router.get("/:id", getChest);
module.exports = router;
