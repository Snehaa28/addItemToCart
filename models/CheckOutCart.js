const mongoose = require('mongoose');

const BooleanAndFalse = {
	type: Boolean,
	required: false
};
const StringAndFalse = {
	type: String,
	required: false

};
const checkoutCartSchema = mongoose.Schema({
	batch_id: StringAndFalse,

	order_id: {
		type: String,
		required: true
	},
	checkout: BooleanAndFalse,
	
	vpos: BooleanAndFalse,
	
	device_id: StringAndFalse,

	platform: StringAndFalse,

	version: StringAndFalse,

	clubcard_nbr: StringAndFalse,

	store_id: StringAndFalse,

	guid: StringAndFalse,

	transaction_status: StringAndFalse,

	terminal_number: StringAndFalse,

	transaction_id: StringAndFalse,

	audit: BooleanAndFalse,

	auditTime: {
		type: Date,
		required: false
	}
})

const CheckOutCart = mongoose.model("CheckOutCart", checkoutCartSchema, "checkoutOrder");

module.exports = CheckOutCart;