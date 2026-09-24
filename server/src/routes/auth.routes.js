const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/auth.controller');
router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.get('/me', auth, controller.me);
router.put('/progress', auth, controller.saveProgress);
module.exports = router;
