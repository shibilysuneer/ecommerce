const mongoose=require('mongoose')

const brandSchema =new mongoose.Schema({
    brandName:{
        type:String,
        required:true
     },
     image:{
     type:[String]
    // required:true
    // },
    // is_blocked:{
    //     type:Boolean
     },
    // stock:{
    //     type:Number,
    //  required:true

    // },
    // sale:{
    //     type:Number,
    //  required:true

    // }
    
})

module.exports = mongoose.model('Brand', brandSchema)