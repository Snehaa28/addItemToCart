const { ClubPrice } = require('../models/ClubPrice');

module.exports = (context, storeId, itemId) => {
  return new Promise((resolve, reject) => {
    const queryFilter = {
      store_id: storeId,
      item_id: itemId
    };
    ClubPrice
      .find(queryFilter)
      .then(clubPrices => {

        const offers = [];
        let firstOfferDate;
        let today = new Date();
        today.setHours(0, 0, 0, 0); // to make it equal to the local date (PST)
        today = today.toISOString();

        clubPrices.forEach(clubPrice => {
          const {
            promoPriceFactor,
            promoMethod,
            promoPrice,
            maxQty,
            minQty,
            offerId,
            cms_flag,
            firstEffectiveDate,
            lastEffectiveDate
          } = clubPrice;

          // const startDate = (item.firstEffectiveDate).toISOString();
          const startMil = (new Date(firstEffectiveDate)).getTime();

          // const endDate = (item.lastEffectiveDate).toISOString();
          const endMil = (new Date(lastEffectiveDate)).getTime();

          const todyMil = (new Date(today)).getTime();
          let offer = {};

          if (startMil <= todyMil && todyMil <= endMil) {

            offer = {
              promoFactor: promoPriceFactor,
              promoMethod,
              promoPrice,
              promoMaxQty: maxQty,
              promoMinQty: minQty,
              offerId,
              cms_flag
            };

            // A valid offer is already present in the array we will send to the client
            if (offers[0]) {
              // If the next valid offer found has the same attributes
              // and has a firstEffectiveDate greater than the previous offer's firstEffectiveDate, 
              if ((offers[0].promoMethod === promoMethod
                  && offers[0].promoFactor === promoPriceFactor
                  && offers[0].promoMinQty === minQty)
                  && firstOfferDate < startMil
              ) {
                // Remove the old offer from the array
                offers.shift();

                // Push the newer offer into the array
                offers.push(offer);
              } else {
                // Push the distinct offer into the array
                offers.push(offer);
              }
            } else {
              offers.push(offer);
            }
            firstOfferDate = startMil;
          }
        });
        context.log('clubPriceLookUp: offers', offers);
        resolve(offers);
      })
      .catch(err => {
        reject(err);
      });
  });
};
