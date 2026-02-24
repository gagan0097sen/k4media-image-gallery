const express = require('express');
const router = express.Router();
const { validateUserProfile } = require('../validations/userValidation');
const { googleLogin } = require('../controllers/userController');

router.post('/google-login', googleLogin);
router.get('/profile/:userId', validateUserProfile, (req, res) => {
  // Profile route handler
});

module.exports = router;
