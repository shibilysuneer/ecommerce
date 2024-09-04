const mongoose=require('mongoose')

const categorySchema =new mongoose.Schema({
    categoryName:{
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
    stock:{
        type:Number,
        required:true

    },
    sale:{
        type:Number,
        required:true

    },
    is_blocked:{
        type:Boolean,
        default:false
    }
   
})

module.exports = mongoose.model('Category', categorySchema)