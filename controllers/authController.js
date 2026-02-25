const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError, handleException } = require('../utils/responseHandler');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return sendError(res, 401, 'Invalid credentials', 'AUTH_FAILED');
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid credentials', 'AUTH_FAILED');
    }

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // res.cookie('adminToken', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'lax',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

     res.cookie('adminToken', token, {
  httpOnly: true,
  secure: true,          // 🔥 MUST in production (HTTPS)
  sameSite: 'none',      // 🔥 MUST for cross-site (Render ↔ Vercel)
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

    sendSuccess(res, 200, {
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
      },
    }, 'Login successful');
  } catch (error) {
    handleException(res, error);
  }
};

const adminRegister = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return sendError(res, 400, 'Admin already exists', 'ADMIN_EXISTS');
    }

    const admin = new Admin({
      email,
      password,
      name: name || email.split('@')[0],
    });

    await admin.save();

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, 201, {
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
      },
    }, 'Registration successful');
  } catch (error) {
    handleException(res, error);
  }
};

module.exports = {
  adminLogin,
  adminRegister,
  adminLogout: (req, res) => {
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    sendSuccess(res, 200, null, 'Logout successful');
  },
};

