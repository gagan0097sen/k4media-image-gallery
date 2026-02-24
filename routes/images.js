const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const userAuthMiddleware = require('../middleware/userAuth');
const { validateImageUpload, validateImageUpdate, validateImageId } = require('../validations/imageValidation');
const {
  uploadImage,
  deleteImage,
  updateImage,
  getImages,
  getImagesByAdmin,
  likeImage,
  unlikeImage,
  getUserLikedImages,
} = require('../controllers/imageController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Admin routes
router.post('/upload', authMiddleware, upload.single('image'), validateImageUpload, uploadImage);
router.delete('/:imageId', authMiddleware, validateImageId, deleteImage);
router.put('/:imageId', authMiddleware, upload.single('image'), validateImageUpdate, validateImageId, updateImage);
router.get('/admin/my-images', authMiddleware, getImagesByAdmin);

// Public routes
router.get('/', getImages);
router.post('/:imageId/like', userAuthMiddleware, validateImageId, likeImage);
router.post('/:imageId/unlike', userAuthMiddleware, validateImageId, unlikeImage);
router.get('/user/liked-images', userAuthMiddleware, getUserLikedImages);

module.exports = router;
