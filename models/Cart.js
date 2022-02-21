'use strict';
const mongoose = require('mongoose');
const clubPrice = require('./ClubPrice');

let requiredStr = { type: String, required: true };
let notReqStr = { type: String, required: false };
let notReqNum = { type: Number, required: false }
let notReqBool = {  type: Boolean, required: false}

const CartSchema = mongoose.Schema({

    "guid": requiredStr,
    "store_id": requiredStr,
    items: [{

        "item_id": requiredStr,
        "scan_code": notReqStr,
        "upc_type": notReqStr,
        "quantity": notReqNum,
        "weight_item": notReqBool,
        "weight": notReqNum,
        "status": notReqStr,
        "bag_item": notReqBool,

        "added_time_stamp": {
            type: Number,
            required: true,
            default: new Date().getTime()
        },
        "last_updated_timestamp": {
            type: Number,
            required: true,
            default: new Date().getTime()
        },

        "item_price": notReqNum,
        "regular_price": notReqNum,
        "promoOfferPrice": notReqNum,
        "jfuOfferCount": notReqNum,

        "clubPrice": {
            type: mongoose.Schema.Types.Mixed,
            required: false
        },
        "jfuOffers": {
            type: mongoose.Schema.Types.Mixed,
            required: false
        }
    }],
    "transaction_status": {
        type: String,
        required: false,
        default: undefined
    },
    "time_stamp": {
        type: Number,
        required: true,
        default: new Date().getTime()
    },
    "total_quantity": notReqNum,
    "total_price": notReqNum,
    "order_id": {
        type: String,
        required: false,
        default: undefined
    }
});
const CartItem = mongoose.model("Cart", CartSchema, "cart");

module.exports = CartItem;