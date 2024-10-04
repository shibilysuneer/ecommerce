const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
   
    validFrom: {
        type: Date,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    minimumPrice: {
        type: Number,
        required: true
    },
    usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    discountType: {
         type: String, 
         enum: ['percentage', 'flat'], 
         
        } 

});

module.exports = mongoose.model('Coupon', couponSchema);
