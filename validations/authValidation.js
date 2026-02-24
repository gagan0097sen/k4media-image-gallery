const Joi = require('joi');
const { sendError } = require('../utils/responseHandler');

const validateRegisterInput = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return sendError(res, 400, error.details[0].message, 'VALIDATION_ERROR');
  }

  next();
};

const validateLoginInput = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return sendError(res, 400, error.details[0].message, 'VALIDATION_ERROR');
  }

  next();
};

module.exports = {
  validateLoginInput,
  validateRegisterInput,
};