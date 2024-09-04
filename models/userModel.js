const mongoose = require("mongoose")
const addressSchema = require("./addressModal")

const userSchema =new mongoose.Schema({

    fname:{
        type:String,
        required:true
    },
    lname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:false
    },
    password:{
        type:String,
        required:false
    },
    
    otpCreatedat:{
        type:Date
    },
    blockUntil:{
        type:Date
    },
    is_admin:{
        type:Number,
        default:0
    },
    is_blocked:{
        type:Boolean,
        default:false
    },
    address:[addressSchema],
    defaultAddress:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Address'
    },
    googleId:{
        type:String,
        uiunique:true
    },
    cart:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Cart'
    }]


    
})
module.exports = mongoose.model('User',userSchema)
