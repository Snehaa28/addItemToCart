'use strict';
const mongoose = require('mongoose');

const clubPriceSchema = mongoose.Schema({
    "item_id": {
        type: String,
        required: true
      },
      "store_id": {
        type: String,
        required: true
      },
	"firstEffectiveDate" : {
        type: Date,
        required: false
    },
	"lastEffectiveDate": {
        type: Date,
        required: false
    },
	"promoPriceFactor" : {
        type: String,
        required: false
    },
	"promoPrice" : {
        type: Number,
        required: false
    },
	"promoMethod" : {
        type: String,
        required: false
    },
	"maxQty" : {
        type: Number,
        required: false
    },
	"minQty" : {
        type: Number,
        required: false
    },
    "limQty" : {
        type: Number,
        required: false
    },
    "offerId": {
        type: String,
        required: false
    },
    "cms_flag": {
        type: Boolean,
        required: false
    }
});

const ClubPrice = mongoose.model('ClubPrices', clubPriceSchema, 'clubPrices');

module.exports = {
    ClubPrice
}