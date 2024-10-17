const Razorpay = require('razorpay');
const Order = require("../models/orderModal")
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

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    console.log('Amount in paise:', amount);


    const options = {
      amount: amount * 100,
      currency: currency,
      receipt: `order_rcptid_${Math.floor(Math.random() * 10000)}`,
      payment_capture: 1,
    };

    console.log('Creating Razorpay order with options:', options);

    const razorpayOrder = await razorpayInstance.orders.create(options);
    console.log('Razorpay order created', razorpayOrder);
 
    res.json({ order: razorpayOrder, key_id: process.env.RAZORPAY_ID_KEY });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).send('Server Error');
  }
}

const verifyPayment = async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    console.log('req.body###', req.body);

    
    console.log('razorpayOrderId....', razorpayOrderId);

    const secret = process.env.RAZORPAY_SECRET_KEY;
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpaySignature) {
      
      console.log('Payment verified successfully');

      res.json({ message: 'Payment verified', success: true });
    } else {
    
      res.status(400).json({ message: 'Payment verification failed', success: false });
    }

  } catch (error) {
    console.error('Error during payment verification:', error);
    res.status(500).send('Server Error');
  }
};

const loadCoupon = async (req, res) => {
  try {
    const cartTotal = req.session.cartTotal || 0;
    console.log('cartTotal', cartTotal);
    const userId = req.session.userId;

    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: new Date() },
      minimumPrice: { $lte: cartTotal },
      usedBy: { $ne: userId }
    })
    const user = req.session.userId ? await User.findById(req.session.userId) : null;

    console.log(coupons, 'coupons');

    res.render('coupon', { coupons,user })
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server Error');
  }
}
const paymentFailure = async (req, res) => {
  // console.log("order id ...... >", req.body)
  try {
    const { order_id, userId } = req.body;
    console.log(req.body, ':::req.body');

    // Find the order by order_id
    const order = await Order.findOne({ orderId: order_id});
    console.log('uuuuuu;;;', order);

     
    if (order) {
      // Update payment status to 'pending'
      order.paymentStatus = 'pending';

      await order.save();

      // Optionally, you can send a response back to the client
      return res.json({ success: true, message: 'Payment status updated to pending.' });
    } else {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
// ------------------------------------------------------------
const repayment = async(req,res) => {
    // const { orderId } = req.body;
    // console.log('req.body=',req.body);
    const orderId = req.params.orderId;
    console.log('orderId',orderId);
    

    try {
    const order = await Order.findById(orderId);
    console.log('order hkjgjkg',order);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }
    // / If payment is pending, create a new Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: order.total * 100, // amount in paise
      currency: 'INR',
      receipt: `order_${order._id}`,
      payment_capture: 1 // Auto capture
    });

    // Update the order with the new Razorpay order ID and increment payment attempts
    order.razorpayOrderId = razorpayOrder.id;
    order.paymentAttempts += 1;
    await order.save();

     // Send the Razorpay key and required details to frontend
     res.json({
      amount: order.total * 100, // Amount in paise
      currency: "INR",
      orderId: order._id, // Your order ID
      name: "Your Store Name",
      success: true,
      order, razorpayOrderId: razorpayOrder.id
      // razorpayKey: process.env.RAZORPAY_KEY_ID,
      // order
    });
  } catch (error) {
    console.error('Error initiating repayment:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate repayment' });
  }
}
// ------------------------------------------------------------------------
const verifyRepayment =async(req,res) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature,orderId } = req.body;
console.log('req.body',req.body);

  console.log('razorpayOrderId....??', razorpayOrderId);
  // Find the existing order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const secret = process.env.RAZORPAY_SECRET_KEY;
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
  
console.log('expectedSignature',expectedSignature);

  if (expectedSignature === razorpaySignature) {
    try {
   // Update order payment status to 'Paid'
order.paymentStatus = 'paid';
// order.razorpay = { paymentId, razorpayOrderId, signature };

await order.save();

res.json({ success: true, message: 'Payment verified successfully!' });
}catch (err) {
console.error('Failed to update order:', err);
res.status(500).json({ message: 'Failed to update order status' });
}
} else {
res.status(400).json({ message: 'Payment verification failed' });
}
}
const paymentFailed = async(req,res) => {
  res.render('paymentFailed'); 
}
module.exports = {
  createRazorpayOrder,
  verifyPayment,
  loadCoupon,
  paymentFailure,
  repayment,
  verifyRepayment,
  paymentFailed

}
