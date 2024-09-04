const mongoose=require('mongoose')

const productSchema =new mongoose.Schema({
    productName:{
        type:String,
         required:true
     }, 
     productCategory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        default:null
      
     },
     productDescription:{
        type:String,
      
     },
     productPrice:{
        type:Number,
        required:true
     },
     productBrand:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null
     },
    stocks:{
        type:Number,
        required:true
     },
     images:{
        type:[String],
     },
     status:{
      type:String,
      required:true   
     },
     is_blocked:{
      type:Boolean,
      default:false
     },
     popularity:{
      type:Number
     },
     averageRating:{
      type:Number
     },
     createdAt: {
         type: Date,
         default: Date.now
     },
     isFeatured: {
         type: Boolean,
         default: false
     }

})
module.exports = mongoose.model('Product', productSchema)