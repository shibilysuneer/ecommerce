const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    qty: {
        type: Number,
        // required: true,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        // required: true
    } ,
    discountedPrice: {  // Add this field for the discounted price
        type: Number,
        required: false
    },
    offerPercentage: {  // Add this field for the offer percentage
        type: Number,
        required: false
    }
});

const cartSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cartItems: [cartItemSchema],  
    totalPrice: {
        type: Number,
        // required: true,
        default: 0
    },
    totalPriceWithCoupon: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('Cart', cartSchema);



