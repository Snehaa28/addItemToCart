'use strict';

const clubPriceLookUp = require('./clubPriceLookUp');

const clubPrices = (context, req) => {

    if (!req.query.itemId && !req.query.storeId) {
        context.log("clubPrices: missing storeid or itemId");
        context.res = {
            status: 200,
            body: {
                ack: "1",
                message: "Params missing."
            }
        }
        context.done();
    }

    clubPriceLookUp(context, req.query.storeId, req.query.itemId)
        .then((offers) => {
            if (!offers.length) {
                context.res = {
                    status: 200,
                    body: {
                        ack: "1",
                        message: "No offers Found for this product"
                    }
                }
                context.done();
                return;
            }
            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: {
                    ack: "0",
                    data: offers
                }
            };
            context.done();
        })
        .catch(err => {
            context.log("clubPrices: error checking club price", err);
            context.res = {
                status: 200,
                body: {
                    ack: "1",
                    message: "Error while checking club price."
                }
            }
            context.done();
        });
};

module.exports = function (context, req) {
    clubPrices(context, req);
};;