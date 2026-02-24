const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { verifyFirebaseToken, getFirebaseAdmin, isFirebaseInitialized } = require('../config/firebase');
const { sendSuccess, sendError, handleException } = require('../utils/responseHandler');

const googleLogin = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return sendError(res, 400, 'Firebase token required', 'MISSING_TOKEN');
    }

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(firebaseToken);

    // If Firebase Admin is initialized, try to fetch up-to-date user record
    let firebaseUserInfo = {};
    try {
      if (isFirebaseInitialized) {
        const admin = getFirebaseAdmin();
        const firebaseUser = await admin.auth().getUser(decodedToken.uid);
        firebaseUserInfo.email = firebaseUser.email;
        firebaseUserInfo.name = firebaseUser.displayName;
        firebaseUserInfo.photoURL = firebaseUser.photoURL;
      }
    } catch (fetchErr) {
      // Non-fatal: fall back to token fields
      console.warn('Could not fetch full user record from Firebase Admin:', fetchErr.message);
    }

    // Merge token fields with any fetched info
    const email = firebaseUserInfo.email || decodedToken.email;
    const name = firebaseUserInfo.name || decodedToken.name || (email ? email.split('@')[0] : 'User');
    const photoURL = firebaseUserInfo.photoURL || decodedToken.picture || '';

    // Find or create user in DB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = new User({
        firebaseUid: decodedToken.uid,
        email,
        name,
        photoURL,
      });
      await user.save();
    } else {
      // Update user info if changed
      let changed = false;
      if (user.email !== email) { user.email = email; changed = true; }
      if (user.name !== name) { user.name = name; changed = true; }
      if (user.photoURL !== photoURL) { user.photoURL = photoURL; changed = true; }
      if (changed) {
        user.updatedAt = new Date();
        await user.save();
      }
    }

    // Create JWT token for API calls
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    sendSuccess(res, 200, {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL,
      },
    }, 'Login successful');
  } catch (error) {
    handleException(res, error);
  }
};

module.exports = {
  googleLogin,
};
