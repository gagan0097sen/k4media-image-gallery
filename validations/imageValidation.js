const Joi = require('joi');
const { sendError } = require('../utils/responseHandler');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Image Upload Validation
const validateImageUpload = (req, res, next) => {
  const bodySchema = Joi.object({
    title: Joi.string().trim().required().messages({
      'any.required': 'Image title is required',
      'string.empty': 'Image title is required'
    }),
    description: Joi.string().allow('').optional()
  });

  const { error } = bodySchema.validate(req.body);

  if (error) {
    return sendError(res, 400, error.details[0].message, 'VALIDATION_ERROR');
  }

  // File Validation (Custom)
  if (!req.file) {
    return sendError(res, 400, 'Image file is required', 'NO_FILE');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
    return sendError(
      res,
      400,
      'Invalid file type. Only JPEG, PNG, GIF, and WebP allowed',
      'INVALID_FILE_TYPE'
    );
  }

  if (req.file.size > MAX_FILE_SIZE) {
    return sendError(
      res,
      400,
      'File size exceeds 5MB limit',
      'FILE_TOO_LARGE'
    );
  }

  next();
};

// Image Update Validation (file is optional)
const validateImageUpdate = (req, res, next) => {
  const bodySchema = Joi.object({
    title: Joi.string().trim().required().messages({
      'any.required': 'Image title is required',
      'string.empty': 'Image title is required'
    }),
    description: Joi.string().allow('').optional()
  });

  const { error } = bodySchema.validate(req.body);

  if (error) {
    return sendError(res, 400, error.details[0].message, 'VALIDATION_ERROR');
  }

  // File validation is optional for updates
  if (req.file) {
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      return sendError(
        res,
        400,
        'Invalid file type. Only JPEG, PNG, GIF, and WebP allowed',
        'INVALID_FILE_TYPE'
      );
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return sendError(
        res,
        400,
        'File size exceeds 5MB limit',
        'FILE_TOO_LARGE'
      );
    }
  }

  next();
};

// Image ID Validation (params)
const validateImageId = (req, res, next) => {
  const paramsSchema = Joi.object({
    imageId: Joi.string().trim().required().messages({
      'any.required': 'Image ID is required',
      'string.empty': 'Image ID is required'
    })
  });

  const { error } = paramsSchema.validate(req.params);

  if (error) {
    return sendError(res, 400, error.details[0].message, 'VALIDATION_ERROR');
  }

  next();
};

module.exports = {
  validateImageUpload,
  validateImageUpdate,
  validateImageId,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
};