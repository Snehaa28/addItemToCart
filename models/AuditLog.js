'use strict';

const mongoose = require('mongoose');

const auditSchema = mongoose.Schema({
    "source": {
        type: String,
        required: true
    },
    "auditTime": {
        type: Date,
        required: true,
        default: new Date().getTime()
    },
    "store_id": {
        type: String,
        required: true
    },
    "orderId": {
        type: String,
        required: true
    },
    "unscannedItems": {
        type: Boolean,
        required: true,
        default: false
    },
    "itemList": {
        type: [ String ],
        required: true
    }
});

module.exports = mongoose.model('AuditLog', auditSchema, 'auditlog');