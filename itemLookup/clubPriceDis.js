'use strict';

const clubPriceCal = (club, item, context) => {
    //context.log("yo1", item);
    const { promoFactor, promoMethod, promoPrice, promoMaxQty, promoMinQty, cms_flag } = club;

    const sellPrice = item.sell_price;
    let clubOffer = {}
    clubOffer.rawOfferPrice = promoPrice;

    let clubPrice = sellPrice;
    let clubDiscount = "";
    let clubDiscount1 = "false";
    switch (promoMethod) {
        //#region NE
        case "NE":
            //#region Buy some Get some Free
            if (promoPrice === 0) {
                clubDiscount1 = `of Equal or lesser value. Mix and Match`;
                if (cms_flag) {

                    if (promoMinQty === 2 && promoMaxQty === 0) {
                        clubDiscount = `Buy 1 Get 1 FREE`
                    }
                } else {
                    if (promoMaxQty === promoMinQty) {
                        clubDiscount = `Buy ${promoMinQty} Get ${promoMaxQty} FREE`
                    } else if (promoMinQty > 0) {

                        clubDiscount = `Buy ${promoMinQty - promoMaxQty} Get ${promoMaxQty} FREE`
                    } else if (promoMaxQty === 2) {
                        clubDiscount = `Buy 1 Get 1 FREE` //for copient bogo is represented like this

                    }
                }

            }
            //#endregion

            //#region Buy any no. at this price
            else if (promoMaxQty === 0) {
                if (promoMinQty <= 1) {                         //what if when minQty is 0
                    clubDiscount = `Get ${promoFactor} for $${promoPrice}`;
                    clubPrice = promoFactor >= 1 ? (promoPrice / promoFactor) : promoPrice;
                } else {
                    clubDiscount = `Must Buy ${promoMinQty} or more to Get $${promoPrice} ea`;
                    clubDiscount1 = `of Equal or lesser value. Mix and Match`
                }
            }
            //#endregion

            //#region Buy LimitAmount at this price;
            else if (promoMaxQty > 0) {

                if (promoMinQty === 0) {
                    clubDiscount = `Get ${promoFactor} for $${promoPrice}`;//`you saved sell price pp/pf`
                    clubPrice = promoFactor >= 1 ? promoPrice / promoFactor : promoPrice;
                } else {
                    clubDiscount = `Must Buy ${promoMinQty} or more to Get $${promoPrice} ea , limit ${promoMaxQty}`;
                    clubDiscount1 = `of Equal or lesser value. Mix and Match`
                }
            }
            //#endregion
            break;
        //#endregion
        
        //#region CE
        case "CE":
            let limitStr = promoMaxQty > 0 ? `, limit ${promoMaxQty}` : ``; //if there is limit iposed concant this str with actual msg.

            if (promoMinQty > 1) {
                clubDiscount = `Buy ${promoMinQty} and save $${(promoPrice).toFixed(2)} ea${limitStr}` //promoMinQty * promoPrice
                clubDiscount1 = `of Equal or lesser value. Mix and Match`
            }
            else if (promoMinQty === 1 && promoMaxQty > 0) {
                clubDiscount = `Save $${promoPrice} ea${limitStr}`;
                clubPrice = (sellPrice - promoPrice);
            }
            else {
                clubDiscount = `Save $${promoPrice} ea`;
                clubPrice = (sellPrice - promoPrice);
            }

            break;
        //#endregion
        
        //#region NW
        case "NW":

            if (promoMinQty > 1) {
                clubDiscount = `Buy ${promoMinQty} or more lbs to Get $${promoPrice} per lb`;
                clubPrice = promoPrice;
            }
            else {
                //for gs1 barcodes the weight will be null
                let weight = item.weight || 1;

                clubDiscount = `Save $${(sellPrice - (promoPrice * weight)).toFixed(2)}`;
                clubPrice = parseFloat((promoPrice * weight).toFixed(2));

            }
            break;
        //#endregion

        //#region PE
        case "PE":

            if (promoMaxQty > 0 && promoMinQty != 0) {
                clubDiscount = `Buy ${promoMinQty - promoMaxQty} and Get ${promoMinQty - promoMaxQty} for ${promoPrice}% Off`;
                clubDiscount1 = `of Equal or lesser value. Mix and Match`
            }
            else if(promoMinQty <= 1 && promoMaxQty <= 1){ //(promoMinQty === 0 && promoMaxQty === 1)
                clubDiscount = `Save ${promoPrice}% ea` //`Get ${promoPrice}% Off on ea item`;
                clubPrice = Math.floor((sellPrice - (sellPrice * (promoPrice / 100))) * 100) / 100; //for PE round it to floor
            } 
            else if ((promoMinQty >= 1 && promoMaxQty === 0)) {
                clubDiscount = `Must Buy ${promoMinQty} or more to Get ${promoPrice}% ea`;
                clubDiscount1 = `of Equal or lesser value. Mix and Match`
            }
            break;
        //#endregion
    }
    clubOffer.offerMessage = clubDiscount;
    clubOffer.offerMsg1 = clubDiscount1;
    //only round to celing when the price was calculated. 
    clubOffer.promoPrice = ((sellPrice == clubPrice) || (clubPrice == promoPrice)) ? 
                            clubPrice : Math.ceil(clubPrice * 100) / 100;

    context.log("itemLookup : clubPriceDis :-", clubOffer);
    
    return clubOffer;

}

module.exports = clubPriceCal;