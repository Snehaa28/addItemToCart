'use strict';
const mongoose = require('mongoose');

const tagsSchema = mongoose.Schema({
    "upc": {
        type: String,
        required: true
    },
    "brand": {
        type: String,
        required: false
    },
    "source": [{
        type: String,
        required: false
    }],
    "tags": [{
        "name": {
            type: String,
            required: true
        },
        "desc": {
            type: String,
            required: true
        }
    }],
    "lastUpdDate": {
        type: Number,
        required: true,
        default: new Date().getTime()
    }
});


const tags = mongoose.model("tags", tagsSchema);

module.exports = tags;
