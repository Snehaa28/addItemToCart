/*
  As vendors do checkout they only pass the scan codes and quantity to checkout API.
  So, to get all the other details (dept, weight...) checkout API calls this service.
*/
const getUpcType = require('./upcType');
const { newScanCode } = require('./scanCodeFormatting');

const { serverError } = require('../middleware/sendError');

const Item = require('../models/Items');

module.exports = async (context, storeid, scanCodes) => {
  context.log('itemLookup: arra of items:', scanCodes);

  try {

    const reformattedCodes = {};
    const itemIds = [];
    scanCodes.forEach(code => {
      const upcType = getUpcType(code);
      const {
        scanCodeNew,
        sellPrice,
        pluCode,
        weight
      } = newScanCode(context, upcType, code);

      reformattedCodes[scanCodeNew] = {
        scanCodeNew,
        sellPrice,
        pluCode,
        weight,
        code
      };
    });

    // extract items ids to query db
    // const itemIds = [];
    for (const key in reformattedCodes) {
      itemIds.push(key);
    }
    const dbItems = await Item.find({ store_id: storeid, item_id: { $in: itemIds } });

    const responseToCheckout = {};
    dbItems.forEach(item => {
      const dataFromScanCode = reformattedCodes[item.item_id];
      let { weight, sellPrice, code } = dataFromScanCode;

      if (weight) {
        // for code 128 barcodes extract weight and calculate price by multiplying
        item.weight = weight.toString();
        sellPrice = parseFloat((item.sell_price * weight).toFixed(2));
      } else if (sellPrice == null) {
        // regular packaged items
        sellPrice = parseFloat(item.sell_price);
        sellPrice /= parseFloat(item.sell_multiple);
        sellPrice = parseFloat((sellPrice).toFixed(2));
      }
      item.sell_price = sellPrice;
      item.scan_code = code;
      const {
        item_id,
        dept,
        sell_price,
        restricted_item,
        weight_item
      } = item;

      responseToCheckout[code] = {
        item_id,
        code,
        weight: item.weight,
        dept,
        sell_price,
        restricted_item,
        weight_item
      };
    });
    return responseToCheckout;
  } catch (err) {
    context.log('itemLookup: unhandled item error', err);
    return serverError(context);
  }
};
