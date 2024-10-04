const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const walletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0, // Default balance set to 0
  },
  transactions: [
    {
      type: {
        type: String,
        enum: ['credit', 'debit'], // Whether the transaction is credit or debit
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      description: {
        type: String, // Optional description of the transaction
      },
      orderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Order',
        required:false
    },
      date: {
        type: Date,
        default: Date.now, // Date of transaction
      },
    },
  ]
  
});

module.exports = mongoose.model('Wallet', walletSchema);
