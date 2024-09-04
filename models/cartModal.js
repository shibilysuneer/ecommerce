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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
// Middleware to calculate totalPrice before saving
// cartSchema.pre('save', function(next) {
//     this.totalPrice = this.cartItems.reduce((total, item) => {
//         return total + (item.price * item.qty);
//     }, 0);
//     this.updatedAt = Date.now();
//     next();
// });

module.exports = mongoose.model('Cart', cartSchema);



