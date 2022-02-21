const mongoose = require('mongoose');

const SPSdeviceSchema = new mongoose.Schema({
  store_id: {
    type: String,
    required: true
  },
  carts: {
    type: Array,
    required: true
  }
});

const SPSdevices = mongoose.model('spsdevicecatelog', SPSdeviceSchema, 'spsdevicecatelog');

module.exports = SPSdevices;
