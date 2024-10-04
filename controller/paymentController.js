const Razorpay = require('razorpay');
const order = require("../models/orderModal")
const Cart = require('../models/cartModal')
const User = require("../models/userModel");
const Product = require('../models/prodectModel')
const Coupon = require('../models/couponModal')
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require("mongoose")


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
})

const createRazorpayOrder = async(req,res) =>{
  try {
    const { amount,currency = 'INR'  } = req.body;
    console.log('Amount in paise:', amount);

  
  const options = {
    amount: amount * 100, 
    currency: currency ,
    receipt: `order_rcptid_${Math.floor(Math.random() * 10000)}`, 
    payment_capture: 1, 
};


    const order = await razorpayInstance.orders.create(options);
    res.json({order,key_id:process.env.RAZORPAY_ID_KEY});
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).send('Server Error');
  }

}
const verifyPayment = async (req, res) => {
  try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
console.log('req.body',req.body);

      const generated_signature = crypto
          .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
          .update(razorpay_order_id + "|" + razorpay_payment_id)
          .digest('hex');

      if (generated_signature === razorpay_signature) {
          await order.updateOne(
              { razorpayOrderId: razorpay_order_id }, 
              { $set: { paymentStatus: 'Paid', paymentId: razorpay_payment_id } }
          );

          res.redirect('/orderSuccess');
          console.log('Payment verified successfully');

      } else {
          console.log('Payment verification failed');
          res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }

  } catch (error) {
      console.error('Error during payment verification:', error);
      res.status(500).send('Server Error');
  }
};
const loadCoupon = async(req,res)=>{
  try {
    const cartTotal = req.session.cartTotal || 0;
    console.log('cartTotal',cartTotal);
    
    const coupons = await Coupon.find({
      isActive:true,
      expiryDate:{$gt:new Date()},
      minimumPrice: { $lte: cartTotal }
    })
    res.render('coupon',{coupons})
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server Error');
  }
}
module.exports={
    createRazorpayOrder,
    verifyPayment,
    loadCoupon
}
