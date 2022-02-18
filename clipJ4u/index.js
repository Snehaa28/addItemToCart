'use strict';

const axios = require("axios");
const j4u = require('../models/J4U');
const hostName = require('../middleware/hostName');
const host = hostName();
const baseUrl = (host.includes('0.0.0.0') || host.includes('localhost')) ? `http://${host}` : `https://${host}`;
const clipOffer = process.env.clipOffer;

const clipFunc = (context, req) => {

    const { upcid, oktatoken, storeid } = req.headers;
    context.log("clipper req", req);
    if ( !oktatoken && !req.body.offers) {
        context.res = {
            status: 200,
            body: {
                ack: "1",
                message: "Invalid request"
            }
        }
        context.done();
    }

    try{
    const config = {
        headers: {
            "content-type": "application/json",

            "swy_sso_token": oktatoken,

            "x-swy_api_key": "emjou",

            "x-swy_banner": "safeway",

            "x-swy_version": 1.0,

            "x-swyconsumerdirectorypro": oktatoken,
        }
    }

    const clipperUrl = clipOffer + `?storeId=${storeid}`;
    var items = [];
    let offerCount = 0;
    var offers = req.body.offers;
    Object.keys(offers).forEach(ofr => {
        var clipItem =
        {
            "clipType": "C", 
            "itemId": offers[ofr].offerId,
            "itemType": offers[ofr].offerPgm
        }
        var listItem =
        {
            "clipType": "L", 
            "itemId": offers[ofr].offerId,
            "itemType": offers[ofr].offerPgm
        }

        items.push(clipItem);
        items.push(listItem);

        offerCount++;
    });

    axios.post(clipperUrl, {"items": items}, config)
        .then(res => {
            if (res.data.items[1] && !res.data.items[1].errorCd) {
                context.log("Offers clipped", res.data);
                resBody.body.message = offerCount > 1 ? `${offerCount} Offers clipped` : `${offerCount} Offer clipped`
                context.res = resBody
            } else {
                context.log("resposne from j4u clipper function", res);
                resBody.body.message = "Error while applying offer"
                context.res = resBody;
            }
            context.done();

        })
        .catch(err => {
            context.log("Error calling upc to j4u", err);
            context.res = {
                status: 200,
                body: {
                    ack: "1",
                    message: "Error calling clipper url",
                    category: "Backend Error"
                }
            }
            context.done();
        })

    var resBody = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
            ack: "0"
        }
    }
}  catch(err){
    context.log("Error before calling clipper Url", err);
    context.res = {
        status: 200,
        body: {
            ack: "1",
            message: "Error before calling clipper url",
            category: "Backend Error"
        }
    }
    context.done();
}



}

module.exports = clipFunc;

