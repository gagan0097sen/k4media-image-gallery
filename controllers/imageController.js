const Image = require('../models/Image');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const { sendSuccess, sendError, handleException } = require('../utils/responseHandler');

const uploadImage = async (req, res) => {
  try {
    const { title, description } = req.body;
    const file = req.file;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'image-gallery',
      resource_type: 'auto',
    });
    // Delete temporary file
    fs.unlinkSync(file.path);

    // Save to database
    const image = new Image({
      title,
      description,
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
      uploadedBy: req.adminId,
    });

    await image.save();

    sendSuccess(res, 201, image, 'Image uploaded successfully');
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    handleException(res, error);
  }
};

const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await Image.findById(imageId);
    if (!image) {
      return sendError(res, 404, 'Image not found', 'IMAGE_NOT_FOUND');
    }

    if (image.uploadedBy.toString() !== req.adminId) {
      return sendError(res, 403, 'Not authorized', 'UNAUTHORIZED');
    }

    // Delete from Cloudinary
    if (image.cloudinaryId) {
      await cloudinary.uploader.destroy(image.cloudinaryId);
    }

    // Delete from database
    await Image.findByIdAndDelete(imageId);

    sendSuccess(res, 200, null, 'Image deleted successfully');
  } catch (error) {
    handleException(res, error);
  }
};

const updateImage = async (req, res) => {
  let tempFilePath = null;
  try {
    const { imageId } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    console.log('=== UPDATE IMAGE REQUEST ===');
    console.log('ImageID:', imageId);
    console.log('AdminID:', req.adminId);
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Has File:', !!file);

    // Validate imageId
    if (!imageId || imageId === 'undefined') {
      return sendError(res, 400, 'Invalid image ID', 'INVALID_ID');
    }

    // Find image
    const image = await Image.findById(imageId);
    if (!image) {
      console.log('Image not found with ID:', imageId);
      return sendError(res, 404, 'Image not found', 'IMAGE_NOT_FOUND');
    }

    // Check authorization
    if (image.uploadedBy.toString() !== req.adminId.toString()) {
      console.log('Unauthorized: uploadedBy', image.uploadedBy, 'vs adminId', req.adminId);
      return sendError(res, 403, 'Not authorized to update this image', 'UNAUTHORIZED');
    }

    // Update title and description
    if (title && title.trim()) {
      image.title = title.trim();
      console.log('Title updated to:', image.title);
    }
    
    if (description !== undefined) {
      image.description = description.trim();
      console.log('Description updated to:', image.description);
    }

    // Handle image file upload if provided
    if (file) {
      tempFilePath = file.path;
      try {
        console.log('Cloudinary upload starting...');
        
        // Delete old image from Cloudinary
        if (image.cloudinaryId) {
          console.log('Deleting old image from Cloudinary:', image.cloudinaryId);
          await cloudinary.uploader.destroy(image.cloudinaryId);
          console.log('Old image deleted from Cloudinary');
        }

        // Upload new image to Cloudinary
        console.log('Uploading new image from path:', file.path);
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'image-gallery',
          resource_type: 'auto',
        });

        console.log('New image uploaded. PublicID:', result.public_id);
        console.log('New image URL:', result.secure_url);

        // Update image document
        image.imageUrl = result.secure_url;
        image.cloudinaryId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError.message);
        throw new Error(`Failed to upload image to Cloudinary: ${uploadError.message}`);
      }
    }

    // Update timestamp
    image.updatedAt = new Date();

    // Save to database
    console.log('Saving image to database...');
    const updatedImage = await image.save();
    console.log('Image saved successfully');

    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Temp file cleaned up');
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    }

    console.log('=== UPDATE SUCCESSFUL ===');
    return sendSuccess(res, 200, updatedImage, 'Image updated successfully');
  } catch (error) {
    console.error('=== UPDATE IMAGE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Error deleting temp file on error:', err);
      }
    }

    handleException(res, error);
  }
};

const getImages = async (req, res) => {
  try {
    const { sort = 'newest' } = req.query;
    let sortQuery = {};

    if (sort === 'oldest') {
      sortQuery = { createdAt: 1 };
    } else if (sort === 'popular') {
      sortQuery = { likeCount: -1 };
    } else {
      sortQuery = { createdAt: -1 }; // newest
    }

    const images = await Image.find()
      .sort(sortQuery)
      .populate('uploadedBy', 'email name')
      .populate('likes.userId', 'name email photoURL')
      .populate('unlikes.userId', 'name email photoURL');

    sendSuccess(res, 200, images, 'Images retrieved successfully');
  } catch (error) {
    handleException(res, error);
  }
};

const getImagesByAdmin = async (req, res) => {
  try {
    const images = await Image.find({ uploadedBy: req.adminId })
      .populate('uploadedBy', 'email name')
      .populate('likes.userId', 'name email photoURL')
      .populate('unlikes.userId', 'name email photoURL')
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, images, 'Admin images retrieved successfully');
  } catch (error) {
    handleException(res, error);
  }
};

const likeImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await Image.findById(imageId);
    if (!image) {
      return sendError(res, 404, 'Image not found', 'IMAGE_NOT_FOUND');
    }

    const isLiked = image.likes.some(like => like.userId.toString() === req.userId);

    if (isLiked) {
      return sendError(res, 400, 'Image already liked', 'ALREADY_LIKED');
    }

    // Remove from unlikes if user had unliked before
    const unlikeIndex = image.unlikes.findIndex(unlike => unlike.userId.toString() === req.userId);
    if (unlikeIndex !== -1) {
      image.unlikes.splice(unlikeIndex, 1);
      image.unlikeCount = image.unlikes.length;
    }

    image.likes.push({ userId: req.userId });
    image.likeCount = image.likes.length;
    await image.save();

    sendSuccess(res, 200, { likeCount: image.likeCount, unlikeCount: image.unlikeCount }, 'Image liked successfully');
  } catch (error) {
    handleException(res, error);
  }
};

const unlikeImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await Image.findById(imageId);
    if (!image) {
      return sendError(res, 404, 'Image not found', 'IMAGE_NOT_FOUND');
    }

    const likeIndex = image.likes.findIndex(like => like.userId.toString() === req.userId);

    if (likeIndex === -1) {
      return sendError(res, 400, 'Image not liked', 'NOT_LIKED');
    }

    image.likes.splice(likeIndex, 1);
    image.likeCount = image.likes.length;

    // Add to unlikes
    const isUnliked = image.unlikes.some(unlike => unlike.userId.toString() === req.userId);
    if (!isUnliked) {
      image.unlikes.push({ userId: req.userId });
      image.unlikeCount = image.unlikes.length;
    }

    await image.save();

    sendSuccess(res, 200, { likeCount: image.likeCount, unlikeCount: image.unlikeCount }, 'Image unliked successfully');
  } catch (error) {
    handleException(res, error);
  }
};

const getUserLikedImages = async (req, res) => {
  try {
    const images = await Image.find({ 'likes.userId': req.userId })
      .populate('uploadedBy', 'email name')
      .populate('likes.userId', 'name email photoURL')
      .populate('unlikes.userId', 'name email photoURL')
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, images, 'Liked images retrieved successfully');
  } catch (error) {
    handleException(res, error);
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  updateImage,
  getImages,
  getImagesByAdmin,
  likeImage,
  unlikeImage,
  getUserLikedImages,
};
