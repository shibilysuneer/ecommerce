const Order = require('../models/orderModal')
const Cart = require('../models/cartModal')
const User = require("../models/userModel");
const Product = require('../models/prodectModel')
const Coupon = require('../models/couponModal')
const Wallet = require('../models/walletModal')
const mongoose = require("mongoose");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


const generateOrderId = () => {
    const prefix = "ORD";
    const timestamp = Date.now() % 1000000;
    const randomPart = Math.floor(100 + Math.random() * 900); // Random 3-digit number

    const orderId = `${prefix}-${timestamp}-${randomPart}`;
    // console.log('generated Id:', orderId);
    return orderId

}

const placeOrder = async (req, res) => {
    try {

        const { addressId, paymentMethod, razorpayOrderId, razorpaySignature, terms, couponId } = req.body;
        const userId = req.session.userId;
        console.log('req.body::///', req.body);

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
        let total = subtotal + shipping;
        let discountAmount = 0;
        let couponApplied = false;

        let coupon = null;
        if (couponId) {
            coupon = await Coupon.findById(couponId);
            // console.log('couponCode=', couponId);
            console.log('coupon=', coupon);

            if (coupon) {
                const currentDate = new Date();

                // Check if coupon is valid
                if (currentDate >= coupon.validFrom && currentDate <= coupon.expiryDate && coupon.isActive) {

                    // if (coupon.usedBy.includes(userId)) {
                    //     return res.redirect(`/checkout?error=coupon-used`);
                    // }

                    discountAmount = (subtotal * coupon.discount) / 100;

                    // Apply the discount
                    total -= discountAmount;
                    couponApplied = true;

                    // Push user ID to usedBy array
                    coupon.usedBy.push(userId);
                    await coupon.save();


                    console.log('Subtotal:', subtotal);
                    console.log('Discount Amount:', discountAmount);
                    console.log('Total after discount:', total);


                }

            }

        }
        const cartItems = cart.cartItems.map(item => {
            const offerPercentage = item.offerPercentage;
            const originalPrice = Math.ceil(item.price / (1 - offerPercentage / 100));
            const offeramount = originalPrice - item.price;

            console.log('offerPercentage', offerPercentage);
            console.log('originalPrice', originalPrice);
            console.log('offeramount', offeramount);

            return {
                productId: item.productId,
                qty: item.qty,
                price: item.price,
                images: item.productId.images,
                status: 'pending',
                offerPercentage,
                offerAmount: offeramount,
                is_cancel: false
            };
        })
        console.log('CARTITEMS:', cartItems);

        // Ensure total is not less than zero
        if (total < 0) total = 0;
        const totalofferdiscount = cartItems.reduce((total, item) => total + item.offerAmount, 0)

        const orderId = generateOrderId();

        let paymentStatus = 'pending'
        if ((paymentMethod === 'razorpay' && razorpaySignature !== '') || paymentMethod === 'wallet') {
            paymentStatus = 'paid'
            console.log('success')
        } else if (paymentMethod === 'cash-on-delivery' && total <= 1000) {
            paymentStatus = 'pending';
        }
        const expectedDeliveryDate = new Date();
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

        // Create the order
        const newOrder = new Order({
            orderId,
            userId,
            address: selectedAddress,
            cartItems,
            totalofferdiscount,
            subtotal,
            shipping: 50,
            total,
            paymentMethod,
            coupon: coupon ? coupon._id : null,
            couponApplied,
            couponDiscount: discountAmount,
            paymentStatus,
            razorpayOrderId: razorpayOrderId ? razorpayOrderId : '',
            expectedDeliveryDate
        });

        await newOrder.save();
        console.log('newwwwwww', newOrder);


        // Clear the cart after successful order placement
        for (let item of cart.cartItems) {
            const product = await Product.findById(item.productId);
            product.stocks = Math.max(0, product.stocks - item.qty);
            await product.save();
        }

        await Cart.findOneAndUpdate({ userId }, { $set: { cartItems: [], } });

        if (paymentStatus === 'paid'||paymentMethod === 'cash-on-delivery') {
            return res.redirect('/order-success');
        }

        if (razorpaySignature === '') {
            console.log('faileeed')
            return res.redirect('/payment-failed')
        }

        // res.redirect('/order-success');

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Internal Server Error');
    }
}
const loadOrderSuccess = async (req, res) => {
    try {
        const userId = req.session.userId;

        // Fetch the most recent order for the user
        const order = await Order.findOne({ userId })
            .sort({ createdAt: -1 })
            .populate('cartItems.productId')
            .populate('coupon');

        if (!order) {
            return res.redirect('/checkout');
        }
        const user = req.session.userId ? await User.findById(req.session.userId) : null;

        // console.log('Fetched Order:', order);
        // console.log('Coupon:', order.coupon);
        res.render('orderSuccess', { order, user })
    } catch (error) {

        console.log('Error loading order success page:', error.message);
        res.status(500).send('Internal Server Error');
    }
}
const loadOrderHistory = async (req, res) => {
    try {
        const userId = req.session.userId; 

        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate("cartItems.productId")
//  ----------------------------------------------
            for (let order of orders) {
                if (order.paymentMethod === 'cash-on-delivery') { 
                    let isPaid = false;
    
                    for (let item of order.cartItems) {
                        // Check if the item's status is one of the statuses that should mark the payment as 'paid'
                        if (['delivered', 'returned', 'canceled', 'returnRequest', 'returnRejected'].includes(item.status)) {
                            isPaid = true; 
                            break; 
                        }
                    }
                        order.paymentStatus = isPaid ? 'paid' : 'pending';
                    await order.save(); 
                }
            }
// -----------------------------------------------------------
        const user = req.session.userId ? await User.findById(req.session.userId) : null;

        res.render('orderHistory', { orders, user });
    } catch (error) {
        console.log('Error fetching order history:', error.message);
        // res.status(500).send('Internal Server Error');
        res.redirect("/pageNotfound")
    }
}
const cancelOrder = async (req, res) => {
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
        let refundAmount = item.price * item.qty;
        console.log('refund amou', refundAmount);
        if (order.couponApplied === true) {
            const itemsLength = order.cartItems.length;
            console.log('array len', itemsLength);

            const couponDistributionPrice = (order.couponDiscount / itemsLength);
            console.log('each distributed price coupon', couponDistributionPrice);

            refundAmount -= couponDistributionPrice
            console.log('refund amou', refundAmount);

        }
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
        let wallet = await Wallet.findOne({ userId: order.userId });
        if (!wallet) {
            console.log('Wallet not found, creating a new one');
            wallet = new Wallet({
                userId: order.userId,
                balance: 0,
                transactions: []
            });
        }
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
        await wallet.save();



        await order.save();
        console.log('Order canceled and refund processed');

        res.redirect(`/order-details/${orderId}`);
    } catch (error) {
        console.log('Error canceling order:', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const orderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).send('Invalid order ID');
        }
        const order = await Order.findById(orderId).populate('cartItems.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const user = req.session.userId ? await User.findById(req.session.userId) : null;

        res.render('orderDetails', { order, razorpay_key_id: razorpayKeyId, user });
    } catch (error) {
        console.log('Error fetching order details:', error.message);
        // res.status(500).send('Internal Server Error');
        res.redirect("/pageNotfound")
    }
}
const returnOrder = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { status, returnReason } = req.body;
        const userId = req.session.userId;
        console.log('req.body==', req.body);

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
            item.status = 'returnRequest';  // Update status to 'returned'
            item.returnReason = returnReason;


            await order.save();  // Save the updated order
            res.redirect(`/order-details/${orderId}`);  // Redirect back to the order details page
        } else {
            res.status(400).send('Item is not eligible for return');
        }

    } catch (error) {
        console.log('Error updating order status:', error.message);
        res.status(500).send('Internal Server Error');
    }
}
const applyCoupon = async (req, res) => {
    const { couponCode, subtotal } = req.body;

    try {
        const coupon = await Coupon.findOne({ couponCode: couponCode, isActive: true });
        console.log('coupon', coupon);

        if (!coupon) {
            return res.status(400).json({ message: 'Invalid or inactive coupon' });
        }

        const currentDate = new Date();

        // Check if the coupon is within the valid date range
        if (currentDate < coupon.validFrom || currentDate > coupon.expiryDate) {
            return res.status(400).json({ message: 'Coupon is expired or not yet active' });
        }
        if (coupon.usedBy.includes(req.session.userId)) {
            // return res.redirect(`/checkout?error=coupon-used`);
            return res.status(400).json({ message: 'Coupon is already used' });

        }
        console.log(req.session.userId);


        let discountAmount;
        let shipping = 50
        discountAmount = (subtotal * coupon.discount) / 100;


        // Calculate the new total after discount
        const newTotal = subtotal - discountAmount + shipping;
        console.log('Coupon:', coupon);
        console.log('Subtotal:', subtotal);
        console.log('Calculated Discount Amount:', discountAmount);
        console.log('coupon.discount', coupon.discount);

        coupon.usedBy.push(req.session.userId)
        await coupon.save();

        res.json({
            success: true,
            discountAmount: discountAmount,
            newTotal: newTotal > 0 ? newTotal : 0, // Ensure the total doesn't go below 0
            couponId: coupon._id,// Send the coupon ID for later use when placing the order
            // couponApplied: true
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Server error' });

    }

}
const removeCoupon = async (req, res) => {
    const { subtotal } = req.body;
    try {
        const originalSubtotal = parseFloat(subtotal); // You might want to store the original subtotal when applying the coupon

        // Reset any relevant coupon data
        req.session.couponApplied = false; // Adjust based on your session management
        req.session.couponId = null; // Clear the coupon ID if stored

        // Send the response back to the client
        res.json({
            success: true,
            newTotal: originalSubtotal, // Return the original subtotal
        });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
const downLoadInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('userId').populate('cartItems.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const invoiceDir = path.join(__dirname, '../invoices');
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir); // Create the folder if it doesn't exist
        }

        // Create a PDF document
        const doc = new PDFDocument();
        const invoicePath = path.join(invoiceDir, `invoice-${orderId}.pdf`);
        const writeStream = fs.createWriteStream(invoicePath);
        doc.pipe(writeStream);

        // Header
        doc.fontSize(24).text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Order Details
        doc.fontSize(14).text(`Order ID: ${order.orderId}`);
        doc.text(`Date: ${order.createdAt.toDateString()}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Payment Status: ${order.paymentStatus}`);
        doc.moveDown();

        // Shipping Address
        doc.text('Shipping Address:', { underline: true });
        doc.moveDown();
        doc.text(`${order.address.fname} ${order.address.lname}`);
        doc.text(`${order.address.street}, ${order.address.city}`);
        doc.text(`${order.address.state}, ${order.address.zip}`);
        // doc.text(`Phone: ${order.address.phone}`);
        doc.moveDown();

        // Items Header
        doc.text('Order Items:', { underline: true });
        doc.moveDown(1);

        // Items Table Header
        // const tableTop = doc.y;
        const itemX = 50;     // Item column position
        const qtyX = 300;     // Qty column position
        const priceX = 400;   // Price column position
        const totalX = 450;   // Total column position

        const tableTop = doc.y;
        doc.fontSize(12).text('Item', itemX, tableTop);
        doc.text('Qty', qtyX, tableTop);
        doc.text('Price', priceX, tableTop);
        doc.text('Total', totalX, tableTop);
        // doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke(); // Horizontal line
        doc.moveTo(itemX, tableTop + 20).lineTo(totalX + 50, tableTop + 20).stroke(); // Horizontal line
        doc.moveDown(1);

        // Items Details
        order.cartItems.forEach(item => {
            const itemTotal = item.price * item.qty;

            const itemY = doc.y;

            doc.text(item.productId.productName, itemX, itemY);  // Item name in first column
            doc.text(item.qty.toString(), qtyX, itemY);           // Quantity in second column
            doc.text(`₹${item.price.toFixed(2)}`, priceX, itemY); // Price in third column
            doc.text(`₹${itemTotal.toFixed(2)}`, totalX, itemY);
            doc.moveDown();
        });

        // Line for totals
        // doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Horizontal line
        doc.moveTo(itemX, doc.y).lineTo(totalX + 50, doc.y).stroke(); // Horizontal line
        // ---------------------------------------------------------
        // Totals
        doc.moveDown(1.5);

        const labelX = 400; // Position for the label (right alignment)
        const valueX = 460;


        // Subtotal
        doc.text('Subtotal:', labelX, doc.y, { continued: true, align: 'left' });
        doc.text(`₹${order.subtotal.toFixed(2)}`, valueX, doc.y, { align: 'left' });
        doc.moveDown(0.5);


        // Shipping
        doc.text('Shipping:', labelX, doc.y, { continued: true, align: 'left' });
        doc.text(`₹${order.shipping.toFixed(2)}`, valueX, doc.y, { align: 'left' });
        doc.moveDown(0.5);

        // Offer Discount (if applicable)
        if (order.couponApplied) {
            doc.text('CouponDiscount:', labelX, doc.y, { continued: true, align: 'left' });
            doc.text(`-₹${order.couponDiscount.toFixed(2)}`, valueX, doc.y, {align: 'left' });
            doc.moveDown(0.5);
        }
        if (order.totalofferdiscount) {
            doc.text('OfferDiscount:', labelX, doc.y, { continued: true, align: 'left' });
            doc.text(`-₹${order.totalofferdiscount.toFixed(2)}`, valueX, doc.y, { align: 'left' });
            doc.moveDown(0.5);
        }
        // Total
        doc.moveDown(1.5); // Adds space after the total discount
        doc.text('Total:', labelX, doc.y, { continued: true, align: 'left', underline: true });
        doc.text(`₹${order.total.toFixed(2)}`, valueX, doc.y, { align: 'left', underline: true });

        // Finalize the PDF
        doc.end();

        // Wait for the write stream to finish
        writeStream.on('finish', () => {
            // Send the generated PDF as a download
            res.download(invoicePath, (err) => {
                if (err) {
                    console.error('Error downloading the invoice:', err);
                    res.status(500).send('Error downloading the invoice');
                }
            });
        });
    } catch (error) {
        console.error(error);
        // res.status(500).send('Error generating invoice');
        res.redirect("/pageNotfound")
    }
}
module.exports = {
    placeOrder,
    applyCoupon,
    removeCoupon,
    loadOrderSuccess,
    loadOrderHistory,
    cancelOrder,
    orderDetails,
    returnOrder,
    downLoadInvoice
}