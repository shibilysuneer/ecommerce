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
            enum: ['pending', 'confirmed', 'shipped', 'delivered','returned', 'canceled',"returnRequest","returnRejected"],
            default: 'pending'
        },
        offerPercentage: {
             type: Number 
            }, 
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
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },paymentAttempts: {
        type: Number,
        default: 0
      },
    razorpayOrderId:{
        type:String,
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    couponDiscount: { 
        type: Number,
        default: 0
    },
    totalofferdiscount: {
        type:Number,
        required:true,
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
