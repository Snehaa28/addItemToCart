/*
  Given all the club offers for the item, this function removes duplicates and applies the offer with proper message
*/
const clubpriceDis = require('./clubPriceDis');

module.exports = (context, item, clubresponse, sellPrice) => {
  const clubOffers = [];

  let clubCal;
  clubresponse.forEach(offer => {
    if (clubOffers[0]) {
    // remove duplicate offers
      if ((clubOffers[0].promoFactor === offer.promoFactor)
        && (clubOffers[0].promoMethod === offer.promoMethod)
        && (clubOffers[0].promoMinQty === offer.promoMinQty)) {
        return;
      }
    }
    // eslint-disable-next-line prefer-object-spread
    clubCal = Object.assign({}, offer, clubpriceDis(offer, item, context));

    if (clubCal.promoPrice > -1) {
      clubOffers.push(clubCal);
    }
  });

  /*
  if there is only one club offer and if it is not conditional offer:
  (ex. BOGO, Must buy..), show the promoOfferPrice.
  */

  let strikePrice = false;
  if (clubOffers.length === 1) {
    // check if offer less than actual price && offer is from cms
    if (clubOffers[0] && clubOffers[0].promoPrice < item.sell_price && clubOffers[0].cms_flag) {
      strikePrice = true;
      item.promoOfferPrice = clubOffers[0].promoPrice;

      if (clubOffers[0].promoPrice < sellPrice) {
        clubOffers[0].saved = `You saved $${(sellPrice - clubOffers[0].promoPrice).toFixed(2)} with club card`;
      }
    }
  }
  return {
    clubOffers,
    strikePrice
  };
};
