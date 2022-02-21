'use strict';
const mongoose = require('mongoose');

const ReceiptSchema = mongoose.Schema({
    "batch_id": {
        type: String,
        required: false
    },
    "total_amount" : {
        type: Number,
        required: false
    },
    "order_id": {
        type: String,
        required: true
    },
    "store_id": {
        type: String,
        required: true
    },
    "guid": {
        type: String,
        required: true
    },
    "time_stamp": {
        type: Number,
        required: true
    },
    "item_count": {
        type: Number,
        required: true
    },
    "audit": {
        type: Boolean,
        required: false
    },
    "notified": {
        type: Boolean,
        required: false
    },
    "store_address": {
        type: String,
        required: false
    },
    "store_time": {
        type: String,
        required: false
    },
    "item_count": {
        type: String,
        required: false
    },
    "terminal_number": {
        type: String,
        required: false
    },
    "transaction_id": {
        type: String,
        required: false
    },
    "retrieve_barcode_value": {
        type: String,
        required: false
    },
    "receipt":{
        type: String,
        required: false
    },
    "receipt_json": {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    "itemNotScanned": {
        type: Boolean,
        required: false
    },
    'exitScan': {
      type: Boolean,
      required: false
    }

})
module.exports = mongoose.model('Receipt', ReceiptSchema, 'receipt')