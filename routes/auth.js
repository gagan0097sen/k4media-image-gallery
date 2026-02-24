const express = require('express');
const router = express.Router();
const { adminLogin, adminRegister, adminLogout } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validateLoginInput, validateRegisterInput } = require('../validations/authValidation');

router.post('/login', validateLoginInput, adminLogin);
router.post('/register', validateRegisterInput, adminRegister);
router.post('/logout', authMiddleware, adminLogout);

module.exports = router;
