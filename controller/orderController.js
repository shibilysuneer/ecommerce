const Order = require('../models/orderModal')
const Cart = require('../models/cartModal')
const User = require("../models/userModel");
const Product = require('../models/prodectModel')
const mongoose = require("mongoose")

const generateOrderId = () => {
    const prefix = "ORD";
    const timestamp =  Date.now() % 1000000; 
    const randomPart =  Math.floor(100 + Math.random() * 900); // Random 3-digit number

    const orderId = `${prefix}-${timestamp}-${randomPart}`;
    console.log('generated Id:',orderId);
    return orderId
    
}

const orderSuccess = async(req,res)=>{
    try {
        const { addressId, paymentMethod, terms } = req.body;
        const userId = req.session.userId;
        //console.log('userid:',userId);
        
        if (!userId) {
            return res.redirect('/login');
        }

        // Validate terms acceptance
        if (!terms) {
            return res.redirect('/checkout?error=terms');
        }

        // Validate and fetch cart items
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        if (!cart || cart.cartItems.length === 0) {
            return res.redirect('/checkout');
        }

        // Fetch user and address details
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/login');
        }

        const selectedAddress = user.address.id(addressId);
        if (!selectedAddress) {
            return res.redirect('/checkout');
        }

        // Calculate order total
        let subtotal = cart.cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
        const shipping = 50;
        const total = subtotal + shipping;

        const orderId = generateOrderId();

        console.log('Creating order with ID:', orderId);


        // Create new order
        const newOrder = new Order({
            orderId,
            userId,
            address: selectedAddress,
            cartItems: cart.cartItems,
            subtotal,
            shipping,
            total,
            paymentMethod
        });

        await newOrder.save();
        console.log('Order saved successfully:', newOrder)

        for (let item of cart.cartItems) {
            const product = await Product.findById(item.productId);
            product.stocks = Math.max(0, product.stocks - item.qty);
            await product.save();
        }

        // Clear cart
        await Cart.findOneAndUpdate({ userId }, { $set: { cartItems: [] } });

        res.redirect('/orderSuccess');

        } catch (error) {
            console.error('Error placing order:', error);
            res.status(500).send('Internal Server Error');        
    }
}
const loadOrderSuccess= async(req,res)=> {
    try {
        const userId = req.session.userId;

        // Fetch the most recent order for the user
        const order = await Order.findOne({ userId }).sort({ createdAt: -1 }).populate('cartItems.productId');

        if (!order) {
            return res.redirect('/checkout');
        }
        res.render('orderSuccess',{order})
    } catch (error) {

        console.log('Error loading order success page:', error.message);
        res.status(500).send('Internal Server Error');        
    }
}
const loadOrderHistory = async(req,res) => {
    try {
        const userId = req.session.userId; // Assuming user ID is stored in session

        const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate("cartItems.productId")
       console.log('orders:',orders);
       
        
        res.render('orderHistory', { orders });
    } catch (error) {
        console.log('Error fetching order history:', error.message);
        res.status(500).send('Internal Server Error');
    }
}
const cancelOrder = async(req,res) =>{
    try {
        const { orderId, itemId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const item = order.cartItems.id(itemId);
       

        if (!item) {
            return res.status(404).send('Item not found in the order');
        }
      
        if (item.status === 'canceled') {
            return res.status(400).send('Item is already canceled');
        }
        
        item.status = 'canceled';
        order.total -= item.price * item.qty;

        const product = await Product.findById(item.productId);
        if (product) {
            product.stocks = parseInt(product.stocks) + item.qty; // Restock the quantity
            await product.save();
        }

        const allItemsCanceled = order.cartItems.every(i => i.status === 'canceled');
        if (allItemsCanceled) {
            order.status = 'canceled';
        }

        
        await order.save();

        res.redirect(`/orderDetails/${orderId}`);
    } catch (error) {
        console.log('Error canceling order:', error.message);
        res.status(500).send('Internal Server Error');  
    }
}

const orderDetails = async(req,res)=> {
    try {
        const orderId = req.params.orderId;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).send('Invalid order ID');
        }
        const order = await Order.findById(orderId).populate('cartItems.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('orderDetails', { order });
    } catch (error) {
        console.log('Error fetching order details:', error.message);
        res.status(500).send('Internal Server Error'); 
    }
}
module.exports = {
    orderSuccess,
    loadOrderSuccess,
    loadOrderHistory,
    cancelOrder,
    // updateStatus,
    orderDetails
}