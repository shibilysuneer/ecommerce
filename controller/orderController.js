const Order = require('../models/orderModal')
const Cart = require('../models/cartModal')
const User = require("../models/userModel");
const Product = require('../models/prodectModel')
const Coupon = require('../models/couponModal')
const Wallet = require('../models/walletModal')
const mongoose = require("mongoose");

const generateOrderId = () => {
    const prefix = "ORD";
    const timestamp =  Date.now() % 1000000; 
    const randomPart =  Math.floor(100 + Math.random() * 900); // Random 3-digit number

    const orderId = `${prefix}-${timestamp}-${randomPart}`;
    console.log('generated Id:',orderId);
    return orderId
    
}

const placeOrder = async(req,res)=>{
    try {
        const { addressId, paymentMethod, terms,couponId } = req.body;
        const userId = req.session.userId;
        console.log('req.body::',req.body);

        if (!terms) {
            return res.redirect('/checkout?error=terms');
        }

        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        if (!cart || cart.cartItems.length === 0) {
            return res.redirect('/checkout');
        }


        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/login');
        }

        const selectedAddress = user.address.id(addressId);
        if (!selectedAddress) {
            return res.redirect('/checkout');
        }

        let subtotal = cart.cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
        const shipping = 50;
        let total = subtotal + shipping; // Add flat shipping fee
        let discountAmount = 0; // Initialize discount amount
        let couponApplied = false;
       
        let coupon = null;
        if (couponId) {
            coupon = await Coupon.findById(couponId);
            console.log('couponCode=',couponId);
            console.log('coupon=',coupon);

            if (coupon) {
                const currentDate = new Date();

                // Check if coupon is valid
                if (currentDate >= coupon.validFrom && currentDate <= coupon.expiryDate && coupon.isActive) {
                   
                        // Check if coupon is already used by the user
                        if (coupon.usedBy.includes(userId)) {
                            return res.status(400).json({ message: 'You have already used this coupon' });
                        }
                        
                            discountAmount = (subtotal * coupon.discount) / 100; // Percentage discount
    
                            // Apply the discount
                            // discountAmount = coupon.discount;
                            total -= discountAmount;
                            couponApplied = true;

                            // Push user ID to usedBy array
                            coupon.usedBy.push(userId);
                            await coupon.save();
                        
                    
                            console.log('Subtotal:', subtotal);
                            console.log('Discount Amount:', discountAmount);
                            console.log('Total after discount:', total);
                            
                    // discountAmount = coupon.discount;
                    // total -= discountAmount;
                    // couponApplied = true;
                } else {
                    console.log('Coupon is invalid or expired');
                    return res.redirect('/checkout'); // Coupon invalid or expired, redirect to checkout
                }
            } else {
                console.log('Coupon not found');
                return res.redirect('/checkout'); // If coupon not found, redirect to checkout
            }
        }
        const cartItems = cart.cartItems.map(item => {
            const offerPercentage = item.offerPercentage;
            const originalPrice =Math.ceil(item.price/(1-offerPercentage/100));
            const offeramount = originalPrice - item.price;

            console.log('offerPercentage',offerPercentage);
            console.log('originalPrice',originalPrice);
            console.log('offeramount',offeramount);

            return {
                productId: item.productId,
                qty: item.qty,
                price: item.price,
                images: item.productId.images, // Assuming images are in the Product model
                status: 'pending',
                offerPercentage,
                offerAmount: offeramount,
                is_cancel: false
            };
        })
        console.log('CARTITEMS:',cartItems);

        // Ensure total is not less than zero
        if (total < 0) total = 0;

        const orderId = generateOrderId();

        // Create the order
        const newOrder = new Order({
            orderId,
            userId,
            address: selectedAddress,
            cartItems,
            subtotal,
            shipping: 50,
            total,
            paymentMethod,
            coupon: coupon ? coupon._id : null, // Store the coupon ID if applied
            couponApplied, // Boolean value to check if coupon was applied
            couponDiscount:discountAmount
        });

        await newOrder.save();

        // Clear the cart after successful order placement
        for (let item of cart.cartItems) {
                 const product = await Product.findById(item.productId);
                 product.stocks = Math.max(0, product.stocks - item.qty);
                 await product.save();
             }
    
             await Cart.findOneAndUpdate({ userId }, { $set: { cartItems: [], } });

        res.redirect('/order-success');

        } catch (error) {
            console.error('Error placing order:', error);
            res.status(500).send('Internal Server Error');        
    }
}
const loadOrderSuccess= async(req,res)=> {
    try {
        const userId = req.session.userId;
        console.log('userId',userId);
        

        // Fetch the most recent order for the user
        const order = await Order.findOne({ userId })
        .sort({ createdAt: -1 })
        .populate('cartItems.productId')
        .populate('coupon');

        if (!order) {
            return res.redirect('/checkout');
        }
        console.log('Fetched Order:',order);
        console.log('Coupon:', order.coupon);
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
        
    //    console.log('orders:',orders);
       
        
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
        const refundAmount = item.price * item.qty; // Calculate the refund amount
        order.total -= refundAmount;

        const product = await Product.findById(item.productId);
        if (product) {
            product.stocks = parseInt(product.stocks) + item.qty; // Restock the quantity
            await product.save();
        }
        const allItemsCanceled = order.cartItems.every(i => i.status === 'canceled');
        if (allItemsCanceled) {
            order.status = 'canceled';
        }

        console.log('Looking for wallet for user:', order.userId);
        let wallet = await Wallet.findOne({ userId:order.userId });
        if (!wallet) {
            console.log('Wallet not found, creating a new one');
            wallet = new Wallet({
                userId: order.userId,
                balance: 0,
                transactions: []
            });        }
            console.log('UserId:', order.userId); 
        // Refund the amount to the user's wallet
        wallet.balance += refundAmount;
        wallet.transactions.push({
            type: 'credit',
            amount: refundAmount,
            description: `Refund for canceled item(s) in order ${orderId}`,
            date: new Date(),
        });
        console.log('Refund Amount:', refundAmount);
        // Save the wallet and order
        await wallet.save();
  

        
        await order.save();
        console.log('Order canceled and refund processed');

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
const returnOrder= async(req,res) => {
    try {
        const { orderId, itemId } = req.params;
        const { status,returnReason } = req.body;
        const userId = req.session.userId;
        console.log('req.body==',req.body);
        
        if (status !== 'returned') {
            return res.status(400).send('Invalid status for return');
        }
         // Find the order by ID
         const order = await Order.findById(orderId);
         if (!order) {
             return res.status(404).send('Order not found');
         }
 
         // Find the item in the order
         const item = order.cartItems.id(itemId);  // Use .id() to get the subdocument
         if (!item) {
             return res.status(404).send('Item not found in the order');
         }
          // Check if the current status is 'delivered'
        if (item.status === 'delivered') {
            item.status = status;  // Update status to 'returned'
            // item.returnReason = returnReason;
            item.returnReason = returnReason;

            const refundAmount = item.price * item.qty;

            let wallet = await Wallet.findOne({ userId }).exec();
            if (!wallet) {
                wallet = new Wallet({ userId, balance: 0, transactions: [] });
            }
            wallet.balance += refundAmount;
            wallet.transactions.push({
                type: 'credit',
                amount: refundAmount,
                description: `Refund for returned product (Order ID: ${orderId}, Item ID: ${itemId})`,
                orderId: order._id,
                date: new Date(),
            });
            await wallet.save();

            await order.save();  // Save the updated order
            res.redirect(`/orderDetails/${orderId}`);  // Redirect back to the order details page
        } else {
            res.status(400).send('Item is not eligible for return');
        }

    } catch (error) {
        console.log('Error updating order status:', error.message);
        res.status(500).send('Internal Server Error');
    }
}
const applyCoupon = async(req,res)=> {
    const {couponCode,subtotal} = req.body;
    try {
        const coupon = await Coupon.findOne({ couponCode: couponCode, isActive: true });
console.log('coupon',coupon);

        if (!coupon) {
            return res.status(400).json({ message: 'Invalid or inactive coupon' });
        }

        const currentDate = new Date();

        // Check if the coupon is within the valid date range
        if (currentDate < coupon.validFrom || currentDate > coupon.expiryDate) {
            return res.status(400).json({ message: 'Coupon is expired or not yet active' });
        }
          let discountAmount;
         let shipping=50
        discountAmount = (subtotal * coupon.discount) / 100;
        
  
          // Calculate the new total after discount
          const newTotal = subtotal - discountAmount+shipping;
          console.log('Coupon:', coupon);
console.log('Subtotal:', subtotal);
console.log('Calculated Discount Amount:', discountAmount);
console.log('coupon.discount',coupon.discount);



         res.json({
            success: true,
            discountAmount: discountAmount,
            newTotal: newTotal > 0 ? newTotal : 0, // Ensure the total doesn't go below 0
            couponId: coupon._id // Send the coupon ID for later use when placing the order
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Server error' });
    
    }

}
module.exports = {
    placeOrder,
    applyCoupon,
    loadOrderSuccess,
    loadOrderHistory,
    cancelOrder,
    orderDetails,
    returnOrder
}