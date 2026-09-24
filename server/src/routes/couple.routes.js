const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/couple.controller');

router.use(auth);
router.get('/', controller.getCouple);
router.patch('/', controller.updateCouple);
router.post('/join', controller.join);

module.exports = router;
