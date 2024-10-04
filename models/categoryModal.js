const mongoose=require('mongoose')

const categorySchema =new mongoose.Schema({
    categoryName:{
        type:String,
        required:true
     },
     image:{
     type:[String]
    
    },
    stock:{
        type:Number,
        // required:true

    },
    sale:{
        type:Number,
        // required:true

    },
    offerPercentage:{
        type:Number,
        default:0
    },
    is_blocked:{
        type:Boolean,
        default:false
    }
   
})

module.exports = mongoose.model('Category', categorySchema)