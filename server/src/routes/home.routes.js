const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/home.controller');

router.get('/', auth, controller.getHome);
router.put('/', auth, controller.updateHome);

module.exports = router;
