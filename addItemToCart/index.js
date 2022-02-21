/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
const Joi = require('joi');
const axios = require('axios');
const cartSchema = require('./cartValidation');
const cartItem = require('../models/Cart');
const getAppError = require('../middleware/getAppError');

const itemCartError = process.env.MESSAGE_ITEM_CART_ERROR;
// limit on unique items
let cartLimit = process.env.CART_LIMIT || 15;
// limit on each item
let itemLimit = process.env.ITEM_LIMIT || 50;
const message = `${itemCartError}`;

const genericErrorMessage = process.env.MESSAGE_GENERIC1;

const Retail_URL = process.env.RETAIL_BASE_URL;
const Retail_OCP_KEY = process.env.RETAIL_OPERATIONS_SUBSCRIPTION_KEY;

const addItemToCart = (context, req) => {
  const itemInfo = req.body;
  let store_id = req.headers.storeid;
  let { guid, app = 'scanandgo' } = req.headers;
  app = app.toLowerCase();

  // for 3pl, there is no limit on no. of items
  if (app === '3pl') {
    cartLimit = 500;
    itemLimit = 500;
  }

  context.log('additemtocart: req:', guid, req.body);

  Joi.validate(itemInfo, cartSchema, (err) => {
    // #region Incorrect Body
    if (err || !store_id || !guid) {
      context.log('additemtocart: Invalid req', err);
      addItemToCartResp(context,
        400,
        '1',
        '5000',
        'Invalid req format',
        'Scan_and_pay',
        'generic_error');
      context.done();
    } else if (itemInfo.upc_type.toLowerCase() === 'plu'
    && itemInfo.bag_item === false
    && itemInfo.quantity === 0) {
      addItemToCartResp(context,
        200,
        '0',
        '4000',
        'Item not added to cart as quantity is zero',
        'Scan_and_pay',
        'generic_error');
      context.done();
    } else {
    // #endregion
      store_id = store_id.padStart(4, '0');
      // #region Correct Body format
      const {
        scan_code,
        upc_type,
        bag_item = false,
        quantity,
      } = itemInfo;

      let { item_id } = itemInfo;

      /*
      For upctype2 items, we do not update the quantity
      Add them as new line item
      */
      if ((upc_type.toUpperCase() === 'UPCA' || upc_type.toUpperCase() === 'EAN13')
        && (((scan_code.startsWith('2') && scan_code.length === 12))
          || ((scan_code.startsWith('02') && scan_code.length === 13)))) {
        itemInfo.item_id = scan_code;
        item_id = scan_code;
      }

      cartItem.findOne({
        guid,
        store_id,
        'items.item_id': item_id,
        'items.status': 'active',
      },
      (err, existingItem) => {
        context.log('additemtocart: existing item:', existingItem);
        if (err) {
          dbQueryError(context, err);
        } else if (existingItem == null) {
        // #region No Cart or No Scanned Item
          cartItem
            .findOne({ guid, store_id }, async (err, res) => {
              if (err) {
                dbQueryError(context, err);
              } else if (res == null) {
              // #region No Cart
                // create new cart, only if it's within operation hours
                let operationHours;
                try {
                  operationHours = await getHourStatus(context, store_id);
                } catch (err) {
                  context.log('addItemToCart:- checkStoreHours error:-', err);
                }
                if (app !== '3pl' && !operationHours) {
                  context.res = getAppError(
                    400,
                    1,
                    4004,
                    'Out of Operation Hours',
                    'SNG Error',
                    'out_of_operationHours',
                    'SNG Backend');
                  context.done();
                } else if (quantity > itemLimit) {
                  context.log('additemtocart: over cart limit', quantity);
                  context.res = itemCountError;
                  context.done();
                } else {
                  const newItem = itemUpdate(itemInfo);
                  newItem.added_time_stamp = new Date().getTime();
                  const newCart = {
                    guid,
                    store_id,
                    time_stamp: new Date().getTime(),
                    items: [newItem],
                  };

                  cartItem.create(newCart, (err) => {
                    if (err) {
                      dbQueryError(context, err);
                    } else {
                      addItemToCartResp(context,
                        200,
                        '0',
                        '2000',
                        'Item Added to Cart Successfuly');
                      context.done();
                    }
                  });
                }
              } else {
              // #endregion

                // #region No Scanned Item.
                const { items } = res;
                const cartCount = (items.filter((item) => !item.bag_item)).length;

                if (cartCount === 0) {
                  let operationHours;
                  try {
                    operationHours = await getHourStatus(context, store_id);
                  } catch (err) {
                    context.log('addItemToCart:- checkStoreHours error:-', err);
                  }
                  if (app !== '3pl' && !operationHours) {
                    context.res = getAppError(400,
                      1,
                      4004,
                      'Out of Operation Hours',
                      'SNG Error',
                      'out_of_operationHours',
                      'SNG Backend');
                    context.done();
                  }
                }
                // check cart level and item level limit
                if ((cartCount >= cartLimit || quantity > itemLimit) && !bag_item) {
                  context.log('additemtocart: cart limit reached');
                  context.res = itemCountError;
                  context.done();
                } else {
                  const newItem = itemUpdate(itemInfo);
                  newItem.added_time_stamp = new Date().getTime();

                  cartItem.findOneAndUpdate(
                    { guid, store_id },
                    { $push: { items: newItem } },
                    { $set: { time_stamp: new Date().getTime() } },
                    (err) => {
                      if (err) {
                        dbQueryError(context, err);
                      } else {
                        addItemToCartResp(context,
                          200,
                          '0',
                          '2000',
                          'Item Added to Cart Successfuly');
                        context.done();
                      }
                    },
                  );
                }
              }
              // #endregion
            });
        } else {
        // #endregion

          // #region Cart has the same item
          const itemList = existingItem.items;
          // when updating the same item, only check the item lmit
          if (quantity > itemLimit && !bag_item) {
            context.log('additemtocart: item limit reached', itemInfo);
            context.res = itemCountError;
            context.done();
            return;
          }

          if (itemList.length > 0) {
            // eslint-disable-next-line array-callback-return
            itemList.map((item, index) => {
              if (item.item_id === item_id) {
                const newItem = itemUpdate(itemInfo);
                newItem.added_time_stamp = item.added_time_stamp;
                itemList[index] = newItem;
              }
            });

            cartItem.findOneAndUpdate(
              { guid, store_id },
              { $set: { items: itemList, time_stamp: new Date().getTime() } },
              (err) => {
                if (err) {
                  dbQueryError(context, err);
                } else {
                  addItemToCartResp(context,
                    200,
                    '0',
                    '2000',
                    'Successfuly updated Item');
                  context.done();
                }
              },
            );
          }
        }
        // #endregion
      });
    }
    // #endregion

    // #region Update Item
    const itemUpdate = (itemInfo) => {
      const newItem = {
        item_id: itemInfo.item_id,
        upc_type: itemInfo.upc_type.toLowerCase(),
        scan_code: itemInfo.scan_code,
        quantity: itemInfo.quantity,
        status: 'active',
        last_updated_timestamp: new Date().getTime(),
      };

      if ('promoOfferPrice' in itemInfo) {
        newItem.promoOfferPrice = itemInfo.promoOfferPrice;
      }

      newItem.bag_item = itemInfo.bag_item || false;

      if (itemInfo.upc_type === 'PLU' && 'weight' in itemInfo) {
        newItem.weight = itemInfo.weight;
        newItem.weight_item = true;
        newItem.quantity = 0;
      } else {
        newItem.weight_item = false;
      }
      if ('clubPrice' in itemInfo) {
        newItem.clubPrice = itemInfo.clubPrice;
      }
      if ('jfuOffers' in itemInfo) {
        newItem.jfuOffers = itemInfo.jfuOffers;
      }
      if ('jfuOfferCount' in itemInfo) {
        newItem.jfuOfferCount = itemInfo.jfuOfferCount;
      }
      return newItem;
    };
    // #endregion

    const itemCountError = getAppError(
      400,
      '1',
      4004,
      message,
      'SNG Error',
      'max_item_reached',
      'SNG Backend',
    );
  });
};

const getHourStatus = (context, storeId) => {
  // remove leading 0's
  const checkStoreHoursURL = `${Retail_URL}checkstorehours?storeId=${parseInt(storeId, 10)}`;
  let sngStoreHours = true;
  const headers = {
    headers: { 'Ocp-Apim-Subscription-Key': Retail_OCP_KEY },
  };

  return axios.get(checkStoreHoursURL, headers)
    .then((response) => {
      context.log('additemtocart: operations hours: ', response.data);
      sngStoreHours = response.data.data.sngStoreHours;
      return sngStoreHours;
    })
    .catch((err) => {
      context.log('additemtocart: Error calling checkstorehours', err);
      return sngStoreHours;
    });
};

module.exports = (context, req) => {
  context.log('additemtocart: request:-', JSON.stringify(req.headers), JSON.stringify(req.body));
  addItemToCart(context, req);
};

const addItemToCartResp = (
  context,
  status,
  ack,
  code,
  message,
  vendor = 'Scan_and_pay',
  category = 'generic_response',
) => {
  context.res = {
    headers: { 'Content-Type': 'application/json' },
    status,
    body: {
      ack,
      code,
      message,
      vendor,
      category,
    },
  };
};

const dbQueryError = (context, err) => {
  context.log('additemtocart: query error:', err);
  context.res = getAppError(400,
    '1',
    4004,
    genericErrorMessage,
    'Error fetching database',
    'database_error',
    'SNG Backend');
  context.done();
};
