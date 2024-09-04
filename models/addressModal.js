const mongoose=require('mongoose')

const addressSchema =new mongoose.Schema({
    fname:{
        type:String,
        // required:true
     },
     lname:{
        type:String,
        // required:true
     },
     number:{
        type:String,
        // required:true
    },
    house:{
        type:String,
        // required:true

    },
    street:{
        type:String,
        // required:true

    },
    city:{
        type:String,
        // required:true

    },
    state:{
        type:String, 
        // required:true

    },
    country: {
        type: String,
        // required: true
    },
    zip: {
        type: String,
        // required: true
    },
    district:{
        type:String,

    },
    isDefault:{
        type:Boolean,
        default:false
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        default:null
      //   required:true
     }
    
})

module.exports =  addressSchema