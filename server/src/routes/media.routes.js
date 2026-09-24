const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/media.controller');

router.post('/memory-image', auth, controller.uploadMemoryImage);
router.post('/profile-image', auth, controller.uploadProfileImage);

module.exports = router;
