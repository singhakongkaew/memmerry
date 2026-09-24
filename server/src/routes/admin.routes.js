const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/admin.controller');

router.use(auth, admin);
router.get('/users', controller.listUsers);
router.patch('/users/:userId', controller.updateUser);
router.get('/users/:userId/home', controller.getUserHome);
router.put('/users/:userId/home', controller.updateUserHome);

module.exports = router;
