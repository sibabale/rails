const Joi = require('joi');

const createAccountSchema = Joi.object({
    accountNumber: Joi.string().required().min(8).max(20).pattern(/^[0-9]+$/),
    ownerEmail: Joi.string().email().required(),
    ownerName: Joi.string().required().min(2).max(100),
    initialBalance: Joi.number().min(0).default(0),
    currency: Joi.string().length(3).uppercase().default('ZAR')
});

module.exports = {
    createAccountSchema
};