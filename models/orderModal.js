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
            enum: ['pending', 'confirmed', 'shipped', 'delivered', 'canceled'],
            default: 'pending'
        },
       is_cancel:{
            type:Boolean,
            default:false
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    shipping: {
        type: Number,
        required: true,
        default: 50 // Assuming a flat rate for simplicity
    },
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash-on-delivery', 'paypal', 'check'],
        required: true
    },
    // status: {
    //     type: String,
    //     enum: ['pending', 'confirmed', 'shipped', 'delivered', 'canceled'],
    //     default: 'pending'
    // },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
module.exports = mongoose.model('Order', orderSchema);
