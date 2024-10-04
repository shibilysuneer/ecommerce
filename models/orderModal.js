const mongoose = require ('mongoose')

const orderSchema = new mongoose.Schema({
    orderId:{
        type:String,
        required:true,
        unique:true
    },
    userId: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        type: {
            fname: String,
            lname:String,
            phone: String,
            house: String,
            street: String,
            city: String,
            state: String,
            zip: String,
            district: String,
            default: Boolean
        },
        required: true
    },
    cartItems: [{
        productId: {
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        qty: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        images:{
            type:[String],
         },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'shipped', 'delivered','returned', 'canceled'],
            default: 'pending'
        },
        offerPercentage: {
             type: Number 
            }, // Add this field to store the offer percentage
        offerAmount: {
             type: Number 
            }, 
       is_cancel:{
            type:Boolean,
            default:false
        },
        returnReason: String
    }],
    subtotal: {
        type: Number,
        required: true
    },
    shipping: {
        type: Number,
        required: true,
        default: 50 
    },
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash-on-delivery', 'razorpay','wallet'],
        required: true
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    couponDiscount: { // New field for storing the total coupon discount
        type: Number,
        default: 0
    },
    couponApplied: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
module.exports = mongoose.model('Order', orderSchema);
