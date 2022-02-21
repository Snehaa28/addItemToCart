'use strict';

const mongoose = require('mongoose');

const j4uSchema = mongoose.Schema({
    guid: {
        type: String,
        required: true
    },
    storeId: {
        type: String,
        required: true
    },
    companionGalleryOfferList: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
})

module.exports = mongoose.model('j4u', j4uSchema, 'j4uPrices')