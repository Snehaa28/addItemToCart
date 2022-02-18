const appInsights = require('applicationinsights');

appInsights.setup().start();
const axios = require('axios');
const Item = require('../models/Items');
// Sharing code for ClubPrice look up from the clubPrices Azure function
const clubPriceLookUp = require('../clubPrices/clubPriceLookUp');
const clubPriceDiscount = require('./itemDiscountPrice');
const getUpcType = require('./upcType');
const { newScanCode } = require('./scanCodeFormatting');
const multiItemLookup = require('./multiItemLookup');

const hostName = require('../middleware/hostName');
const { serverError } = require('../middleware/sendError');
const {
  bulkItems,
  pluMap,
  offerCodes
} = require('../middleware/SNPConstants');

const host = hostName();
const baseUrl = (host.includes('0.0.0.0') || host.includes('localhost')) ? `http://${host}` : `https://${host}`;

const {
  MESSAGE_ITEM_NOT_SUPPORTED,
  SNJ_JS_OCP_KEY,
  SNJ_JS_XFUNCTIONS,
  // eslint-disable-next-line camelcase
  image_url,
} = process.env;

const itemLookup = (context, reqQuery, client, oktatoken) => {

  const scanCode = reqQuery.scan_code;
  const storeid = (reqQuery.storeid).padStart(4, '0');
  scan_code = reqQuery.scan_code;
  const upcType = (reqQuery.upc_type || getUpcType(scan_code)).toUpperCase();

  // we change scanned_code as per type, we keep actual code same
  const actualCode = scanCode;

  let clubresponse,
    item,
    scanCodeNew,
    pluCode,
    upcOffers,
    sellPrice = null,
    weight = null;

  try {
    ({
      scanCodeNew,
      sellPrice,
      pluCode,
      weight
    } = newScanCode(context, upcType, scanCode));
    context.log('itemlookup: formatted sellPrice, weight, client:', sellPrice, client, weight);

    if (sellPrice === 0 && client === 'snp') {
      // upctype2 codes with price as 0
      return noItemResp(context, scanCode, storeid);
    }

    // Item Query
    const itemQuery = Item.findOne({ store_id: storeid, item_id: scanCodeNew });
    const promiseArray = [itemQuery];
    
    // ClubPrice look up
    if (client !== 'snp3pl') {
      const clubPrice = clubPriceLookUp(context, storeid, scanCodeNew);
      promiseArray.push(clubPrice);
    }

    // #region Only call J4U when token is passed in the header
    if (oktatoken && client !== 'snp3pl') {
      const upc2jfuUrl = `${baseUrl}/api/upc2j4u`;
      const upcjfuConfig = {
        headers: {
          upcid: scanCodeNew,
          storeid: parseInt(storeid, 10), // remove leading 0's
          oktatoken,
          'Ocp-Apim-Subscription-Key': SNJ_JS_OCP_KEY,
          'x-functions-key': SNJ_JS_XFUNCTIONS,
        }
      };
      context.log('itemLookup: calling j4u url with config', upcjfuConfig);
      const upc2jfu = axios.get(upc2jfuUrl, upcjfuConfig);
      promiseArray.push(upc2jfu);
    }
    // #endregion

    // #region Promise Response
    Promise.all(promiseArray)
      .then(async res => {
        [item, clubresponse, upcOffers] = res;
        const itemResponseWrapper = {
          clubresponse, upcOffers, sellPrice, upcType, actualCode, client, weight
        };

        if (item === null) {
          // some of the PLU's are mis represented in DB
          // hence, check if it is in PLU mapping above
          scanCodeNew = pluMap[pluCode];
          if (scanCodeNew) {
            context.log('lookup: found item in plu mapping', pluCode, scanCodeNew);
            const itemFromDb = await Item.findOne({ store_id: storeid, item_id: scanCodeNew });
            if (itemFromDb) {
              itemResponseWrapper.item = itemFromDb;
              return itemResponse(context, itemResponseWrapper);
            }
          }
          return noItemResp(context, scanCode, storeid);
        }
        itemResponseWrapper.item = item;
        context.log('itemLookup: found item in DB', item);
        return itemResponse(context, itemResponseWrapper);
      })
      .catch((err) => {
        context.log('itemLookup: promise error:', err);
        context.res = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(err),
        };
        context.log('itemLookup: response', JSON.stringify(err));
        context.done();
      });
  // #endregion
  } catch (err) {
    context.log('itemLookup: unhandled item error', err);
    return serverError(context);
  }
};

// #region Item Found
const itemResponse = async (context, itemResponseWrapper) => {
  // item, clubresponse, upcOffers, sellPrice, upcType, actualCode, client, weight) => {
  try {
    // will append 0's if the scanCode is not in 14 digits
    const {
      item, clubresponse, upcOffers, upcType, actualCode, client, weight
    } = itemResponseWrapper;
    let { sellPrice } = itemResponseWrapper;
    let imageItemId = actualCode.padStart(14, '0');
    imageItemId = item.bpn_no || imageItemId;
    item.image_url = image_url.replace('item_id', imageItemId);

    item.ext_description = item.ext_description.toUpperCase();
    item.pos_description = item.pos_description.toUpperCase();
    context.log('itemlookup: sellPrice, weight, client:', sellPrice, client, weight);

    context.log('itemlookup sellPrice and weight:-', sellPrice, weight, client);

    if (weight && client === 'snp3pl') {
      // for code 128 barcodes extract weight and calculate price by multiplying
      item.weight = weight.toString();
      sellPrice = parseFloat(item.sell_price * weight);
    } else if (sellPrice == null) {
      // regular packaged items
      sellPrice = parseFloat(item.sell_price);
      sellPrice /= parseFloat(item.sell_multiple);
      sellPrice = parseFloat((sellPrice).toFixed(2));
    } else {
      // upc type 2 items. we need weight to calculate the cluboffer
      // if upc type 2 with price embedded. retrieve weight from the price
      item.weight = (sellPrice / item.sell_price).toFixed(2);
    }

    item.sell_price = sellPrice;
    item.regular_price = sellPrice; // to keep it sink with view cart response
    item.scan_code = actualCode;
    item.upc_type = upcType;

    if (item.sellby_unit) {
      let sellByWeight;
      // type 2 items are price embedded
      if (actualCode.startsWith('002')) {
        sellByWeight = 'P';
      } else if (item.weight_item) {
        sellByWeight = 'W';
      } else {
        sellByWeight = 'I';
      }
      item.sellByWeight = sellByWeight;
    }
    return attachOffersToItem(context, item, clubresponse, upcOffers, sellPrice);

  } catch (err) {
    context.log('itemLookup: unhandled item error', err);
    return serverError(context);
  }
};
// #endregion

const attachOffersToItem = (context, item, clubresponse, upcOffers, sellPrice) => {
  try {
    let strikePrice = false,
      clubOffers = [];
    if (clubresponse && clubresponse.length) {
      ({ strikePrice, clubOffers } = clubPriceDiscount(context, item, clubresponse, sellPrice));
    }

    // when strikeThroughPrice is true // strike the sell_price and show promoOfferPrice
    item.strikeThroughPrice = strikePrice;
    item.clubPrice = clubOffers;
    item.jfuOfferCount = (upcOffers && upcOffers.data) ? upcOffers.data.offerCount : 0;

    if (item.jfuOfferCount > 0) {
      const jfuOffers = [];

      Object.keys(upcOffers.data.offers).forEach(ofr => {
        jfuOffers.push(upcOffers.data.offers[ofr]);
      });
      item.jfuOffers = jfuOffers;
    }

    const itemObj = {
      ack: '0',
      data: item,
      message: 'Item found successfully',
    };

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: itemObj,
    };

    context.log('itemLookup: response body', JSON.stringify(itemObj));
    context.done();
  } catch (err) {
    context.log('itemLookup: unhandled item error', err);
    return serverError(context);
  }
};

// #region No Item Found
// eslint-disable-next-line no-shadow
const noItemResp = (context, scanCode, storeid) => {
  const errorResponse = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      ack: '1',
      errors: [{
        code: '4004',
        message: MESSAGE_ITEM_NOT_SUPPORTED,
        type: 'SNG_database',
        category: 'item_not_supported',
        vendor: 'SNG backend',
      }],
    },
  };
  if (offerCodes.indexOf(scanCode) > -1) {
    errorResponse.body.errors[0].message = MESSAGE_ITEM_NOT_SUPPORTED;
    context.res = errorResponse;
    // Bulk items starts with this code. (ex ALmonds, and other nuts)
  } else if (scanCode.startsWith(bulkItems)) {
    errorResponse.body.errors[0].message = 'Bulk Items, Please note down the PLU and use Digital scale to purchase';
    context.res = errorResponse;
  } else {
    errorResponse.body.errors[0].message = MESSAGE_ITEM_NOT_SUPPORTED;
    context.log(`itemLookup: No item found with id: ${scanCode} in Store: ${storeid}`);
    context.res = errorResponse;
  }
  context.log('itemLookup: response', JSON.stringify(context.res));
  context.done();
};
// #endregion

const groupItemQuery = async (context, scanCodes, storeid) => {
  context.log('itemLookup: arra of items:', scanCodes);
  try {
    const groupItems = await multiItemLookup(context, storeid, scanCodes);
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        ack: '0',
        data: groupItems
      }
    };
    context.done();
  } catch (err) {
    context.log('itemLookup: unhandled item error', err);
    return serverError(context);
  }
};

module.exports = (context, req) => {
  context.log('itemLookup: request', JSON.parse(JSON.stringify(req.query)),
    JSON.parse(JSON.stringify(req.headers)));

  const reqQuery = req.query;
  const scanCode = reqQuery.scan_code;
  const { storeid } = reqQuery;

  const { oktatoken } = req.headers;
  const client = req.headers['x-swy-client-id'];
  const reqBody = req.body;

  if (!storeid
      || (!scanCode && client !== 'snp3pl')
      || (client === 'snp3pl' && (!reqBody || !reqBody.scanCodes || !reqBody.scanCodes.length))) {
    context.log('itemLookup: Invalid req', req);
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        ack: '1',
        code: 4000,
        message: 'Invalid request',
        category: 'Malformed request',
        vendor: 'Scan And Pay',
      },
    };
    context.done();
  } else if (client === 'snp3pl') {
    groupItemQuery(context, reqBody.scanCodes, storeid);
  } else {
    itemLookup(context, reqQuery, client, oktatoken);
  }
};
