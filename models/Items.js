'use strict';
const mongoose = require('mongoose');

const itemsSchema = mongoose.Schema({
  "item_id": {
    type: String,
    required: true
  },
  "ext_description": {
    type: String,
    required: true
  },
  "pos_description": {
    type: String,
    required: true
  },
  "upc_type": {
    type: String,
    required: true
  },
  "scan_code": {
    type: String,
    required: true
  },
  "food_stamp": {
    type: Boolean,
    required: true
  },
  "restricted_item": {
    type: Boolean,
    required: true
  },
  "ewic": {
    type: Boolean,
    required: true
  },
  "weight_item": {
    type: Boolean,
    required: true
  },
  "dept": {
    type: Number,
    required: true
  },
  "sell_multiple": {
    type: Number,
    required: false
  },
  "tax_item": {
    type: Boolean,
    required: true
  },
  "club_item": {
    type: Boolean,
    required: true
  },
  "smic": {
    type: Number,
    required: true
  },
  "image_url": {
    type: String,
    required: true
  },
  //price from the DB
  "sell_price": {
    type: Number,
    required: false
  },
  //the actual price, user pays for the item. sell_price is used to calculate this field.
  //for weight items, regular price is differed to sell_price
  "regular_price": {
    type: Number,
    required: false
  },
  //when the discount is applied for the item. This field is present
  "promoOfferPrice": {
    type: Number,
    required: false
  },
  "bpn_no": {
    type: String,
    required: false
  },
  "clubPrice": {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  "jfuOfferCount": {
    type: Number,
    required: false
  },
  "jfuOffers": {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  "cms_flag": {
    type: Boolean,
    required: false
  },
  "weight": {
    type: Number,
    required: false
  },
  "points_apply": {
    type: Boolean,
    required: false
  },
  "non_discountable": {
    type: Boolean,
    required: false
  },
  //when this value is true, regular price is striked off and promoOfferPrice is shown
  "strikeThroughPrice": {
    type: Boolean,
    required: false
  },
  //tells how the specific item is sold. Ex, Pound, ounce, each
  "sellby_unit": {
    type: String,
    required: false
  },
  "sellByWeight": {
    type: String,
    required: false
  }
});


const Item = mongoose.model("items", itemsSchema);

module.exports = Item;
