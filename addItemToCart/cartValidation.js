const Joi = require('joi');

module.exports = Joi.object({
    item_id: Joi.string().required(),
    quantity: Joi.number().required(),
    upc_type: Joi.string().required(),
    scan_code: Joi.string().required(),
    bag_item: Joi.boolean().optional(),
    weight_item: Joi.boolean().optional(),
    weight: Joi.number().optional(),
    promoOfferPrice: Joi.number().optional(),
    jfuOfferCount: Joi.number().optional(),
    clubPrice: Joi.array().optional(),
    jfuOffers: Joi.array().optional()
})