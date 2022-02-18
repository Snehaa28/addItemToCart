'use strict';

const axios = require("axios");
const j4u = require('../models/J4U');
const hostName = require('../middleware/hostName');
const host = hostName();
const baseUrl = (host.includes('0.0.0.0') || host.includes('localhost')) ? `http://${host}` : `https://${host}`;
const upc2j4u = process.env.Upc2J4U;

const getAllOffers = (context, req) => {

    const { upcid, oktatoken, storeid } = req.headers;

    if (!upcid && !oktatoken && !storeid) {
        context.log("Invalid req", req);
        context.res = {
            status: 200,
            body: {
                ack: "1",
                message: "Invalid request"
            }
        }
        context.done();
    }
    context.log("upc2jfu log-Request pay load", req);
    let upcInArray = [upcid]
    const upc2offerUrl = upc2j4u + `?storeId=${storeid}&offerPgm=CC-PD`;

    const config = {
        headers: {
            "Content-Type": "application/json",

            "SWY_CLOUD_API_VER": 2.0,

            "X-SWY_VERSION": 1.1,

            "Accept": "application/json",

            "X-SWY_BANNER": "safeway",

            "X-SWY_API_KEY": "0fdb13ac50972b700f8a9e352d8ea123414ae1f1.vons.j4u.iphone", 

            "X-swyConsumerDirectoryPro": oktatoken,

            "Authorization": `Bearer ${oktatoken}`
        }
    }

    var resBody = {
        status: 200,
        headers: {"Content-Type": "application/json"},
        body: {
            ack: "0"
        }
    }

    axios.post(upc2offerUrl, upcInArray, config)
        .then(res => {
            if (res.data[upcid].offers != null) {

                context.log("Found offers", res);
                var offers = JSON.parse(JSON.stringify(res.data[upcid].offers)); 

                resBody.body.offers = offers;//JSON.parse(JSON.stringify(res.data[upcid].offers)); 
                resBody.body.offerCount = Object.keys(res.data[upcid].offers).length;
                context.res = resBody;

            } else {
                resBody.body.offers = "No Offers found for this product"
                context.res = resBody;
            }

            context.log("upc2Offer res", context.res);
            context.done();
            
            return offers;
        })
        .then(offers => {
            if(offers){
                //trigger the clipper url
                const clip_url = `${baseUrl}/api/clipOffer`;
                const clip_config = {
                    headers: {
                        'Ocp-Apim-Subscription-Key': process.env.SNJ_JS_OCP_KEY,
                        'x-functions-key': process.env.SNJ_JS_XFUNCTIONS,
                        'oktatoken': oktatoken,
                        'storeid': 1953 //1296
                    }
                }
                console.log("req for clipper function", offers);
                axios.post(clip_url, {offers}, clip_config)
            }
        })
        .catch(err => {
            context.log("Error calling upc to j4u", err);
            context.res = {
                status: 200,
                body: {
                    ack: "1",
                    message: "Error calling UPC to J4U",
                    category: "Backend Error"
                }
            }
            context.done();
        })
}


module.exports = getAllOffers;
