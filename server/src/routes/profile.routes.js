const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/profile.controller');

router.use(auth);
router.patch('/me', controller.updateMe);
router.patch('/me/password', controller.changePassword);
router.get('/couple', controller.getCoupleDetails);
router.patch('/couple', controller.updateCouple);
router.post('/couple/leave', controller.leaveCouple);

module.exports = router;
