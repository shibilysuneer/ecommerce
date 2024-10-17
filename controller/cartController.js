const Product = require('../models/prodectModel')
const User = require("../models/userModel");
const Category = require('../models/categoryModal')
const Brand = require('../models/brandModal')
const Cart = require('../models/cartModal')
const Order = require('../models/orderModal')
const Coupon = require('../models/couponModal')
const { ProductOffer, CategoryOffer } = require('../models/offerModal')
require('dotenv').config();
const mongoose = require("mongoose")

const loadCart = async (req, res) => {
    try {
        const userId = req.session.userId;

        const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) })
            .populate({
                path: 'cartItems.productId',
                select: 'productName images offerPercentage price productCategory',
                populate: {
                    path: 'productCategory', // Make sure category is populated
                    select: 'categoryName' // Only get the offer percentage for the category
                }
            })

        if (!cart) {
            req.session.cartTotal = 0;
            return res.render('cart', { cartItems: [], subtotal: 0, error: req.query.error });
        }

        // console.log('cart', cart);

        const cartItems = await Promise.all(cart.cartItems.map(async (item) => {
            return {
                product: item.productId,
                quantity: item.qty || 0,
                price: item.price,
                discountedPrice:item.discountedPrice,
                offerPercentage: item.offerPercentage//  maxOfferPercentage
            };
        }));

        // console.log('asdfghjk', cartItems);



        const subtotal = cartItems.reduce((total, item) => {
            const itemTotal = item.price * item.quantity;
            // console.log("cartItems=", item.price);

            // Total for this item after discount
            return total + (isNaN(itemTotal) ? 0 : itemTotal);
        }, 0);
        // console.log("cartItems=", cart.cartItems);
        // console.log("subtotal", subtotal);
        req.session.cartTotal = subtotal;
        //  next();
        req.session.cartTotal = subtotal;
        const user = req.session.userId ? await User.findById(req.session.userId) : null;

        res.render('cart', { cartItems, subtotal, error: req.query.error,user });

    } catch (error) {
        console.log(error.message);
        // res.status(500).send('Server Error');
        res.redirect("/pageNotfound")
    }
}
const addtoCart = async (req, res) => {
    try {
        const { productId, qty } = req.body;
        const userId = req.session.userId

        const userObjectId = new mongoose.Types.ObjectId(userId);


        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const productOffer = await ProductOffer.findOne({ productId, isActive: true });
        console.log('productOffer', productOffer);
        const categoryoffer = await CategoryOffer.findOne({
            categoryId: product.productCategory, // Use the populated category
            isActive: true
        });
        //--------------------------------------------------------------------
        let finalPrice = product.productPrice;
        let bestOffer = null;

        if (productOffer && categoryoffer) {
            if (productOffer.offerPercentage >= categoryoffer.offerPercentage) {
                finalPrice = product.productPrice - (product.productPrice * productOffer.offerPercentage / 100);
                bestOffer = productOffer; // Product offer is better
            } else {
                finalPrice = product.productPrice - (product.productPrice * categoryoffer.offerPercentage / 100);
                bestOffer = categoryoffer; // Category offer is better
            }
        } else if (productOffer) {
            finalPrice = product.productPrice - (product.productPrice * productOffer.offerPercentage / 100);
            bestOffer = productOffer;
        } else if (categoryoffer) {
            finalPrice = product.productPrice - (product.productPrice * categoryoffer.offerPercentage / 100);
            bestOffer = categoryoffer;
        }
        //----------------------------------------------------------------------

        console.log('Category Offer:', categoryoffer);
        console.log('productOffer', productOffer);
        console.log('bestOffer', bestOffer);


        let discountedPrice = product.productPrice - finalPrice;
        console.log('qwert-----', discountedPrice)


        const availableStock = parseInt(product.stocks);
        const requestedQty = parseInt(qty);
        const maxQtyPerPerson = 10;

        if (requestedQty > availableStock) {
            return res.status(400).json({ success: false, availableStock, message: `Only ${availableStock} items left in stock.` });
        }

        let cart = await Cart.findOne({ userId: userObjectId });

        const addQty = Math.min(requestedQty, Math.min(maxQtyPerPerson, availableStock));
        if (cart) {
            const itemIndex = cart.cartItems.findIndex(p => p.productId.toString() === productId);
            if (itemIndex > -1) {
                cart.cartItems[itemIndex].qty += addQty;
                if (cart.cartItems[itemIndex].qty > availableStock) {
                    cart.cartItems[itemIndex].qty = availableStock;
                    await cart.save();
                    return res.status(400).json({ success: false, message: `Cannot add more than ${availableStock} items to the cart.` });
                }
            } else {
                cart.cartItems.push({
                    productId,
                    qty: addQty,
                    price: finalPrice,
                    discountedPrice: discountedPrice,
                    offerPercentage:bestOffer ? bestOffer.offerPercentage : 0
                });
                console.log('New product added to cart:', cart.cartItems);
            }
        } else {
            cart = new Cart({
                userId: userObjectId,
                cartItems: [{
                    productId,
                    qty: addQty,
                    price: finalPrice,
                    discountedPrice: discountedPrice,
                    offerPercentage: bestOffer ? bestOffer.offerPercentage : 0 
                }]
            });
            console.log('New cart created for user:', cart);
        }


        await cart.save();
        console.log('cart::', cart);


        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        // res.status(500).send('Server Error');
        res.redirect("/pageNotfound")
    }
}
const removeCartProduct = async (req, res) => {
    try {
        const { productId } = req.body
        const userId = req.session.userId;

        const cart = await Cart.findOne({ userId })
        if (cart) {
            cart.cartItems = cart.cartItems.filter(item => item.productId.toString() !== productId)

            await cart.save();
        }
        res.redirect('/cart');

    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).send('Server Error');
    }
}
const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;
        const error = req.query.error;
        if (!userId) {
            console.error("UserId not found in this session");
            res.redirect('/login')
        }
        const cart = await Cart.findOne({ userId }).populate({
            path: 'cartItems.productId',
            select: 'productName price'
        })
        const user = await User.findById(userId).populate('address')

        const addresses = user.address
        let defaultAddress = null;

        if (addresses.length > 0) {
            defaultAddress = addresses.find(address => address.isDefault) || addresses[0];
        }

        const cartItems = cart ? cart.cartItems : [];
        let subtotal = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
        console.log('subtotal---', subtotal);

        const shipping = 50;
        const total = subtotal + shipping
        const coupons = await Coupon.find()
        
        const order = await Order.findOne({ userId }).sort({ createdAt: -1 })

        res.render('checkout', { 
             cartItems,
             subtotal, 
             shipping,
             total,
             addresses,
             defaultAddress,
             user: user,
             razorpayId: process.env.RAZORPAY_ID_KEY,
             coupons,
             error,
             order
             })
    } catch (error) {
        console.log(error.message);
        // res.status(500).send('Internal Server Error');
        res.redirect("/pageNotfound")
    }
}
const updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const cart = await Cart.findOne({ userId: userObjectId });

        if (cart) {
            const itemIndex = cart.cartItems.findIndex(p => p.productId.toString() === productId);

            if (itemIndex > -1) {
                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).json({ success: false, message: 'Product not found' });
                }
                const availableStock = parseInt(product.stocks);
                const updatedQty = Math.min(Math.max(parseInt(quantity), 1), 10);

                if (updatedQty > availableStock) {
                    return res.status(200).json({
                        success: false,
                        message: `Only ${availableStock} items left in stock.`,
                        availableStock: availableStock
                    });
                }
                cart.cartItems[itemIndex].qty = updatedQty
                await cart.save();

                return res.json({ success: true, message: 'Cart updated successfully' });
            } else {
                res.status(404).json({ success: false, message: 'Product not found in cart' });
            }
        } else {
            res.status(404).json({ success: false, message: 'Cart not found' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }

}
const saveNewAddress = async (req, res) => {
    const { fname, lname, number, street, house, city, state, district, zip } = req.body

    try {
        const newaddress = {
            fname,
            lname,
            number,
            street,
            house,
            city,
            state,
            district,
            zip
        }
        const userId = req.session.userId
        await User.findByIdAndUpdate(userId, { $push: { address: newaddress } })
        res.redirect('/checkout')
    } catch (error) {
        console.log(error.message);
        res.redirect('/checkout')

    }
}
const addToBag = async (req, res) => {
    try {
        // console.log('add to bag')
        const { productId } = req.body;
        const qty = 1;
        // console.log('body', req.body)
        const product = await Product.findById(productId)
        // console.log('product', product)

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (product.stocks < qty) {
            return res.status(400).json({ success: false, message: 'Not enough stock available' });
        }
        //-----------------------------------------------------
        const productOffer = await ProductOffer.findOne({ productId, isActive: true });
        // console.log('productOffer', productOffer);
        const categoryoffer = await CategoryOffer.findOne({
            categoryId: product.productCategory, // Use the populated category
            isActive: true
        });
        let finalPrice = product.productPrice;
        let bestOffer = null;

        if (productOffer && categoryoffer) {
            if (productOffer.offerPercentage >= categoryoffer.offerPercentage) {
                finalPrice = product.productPrice - (product.productPrice * productOffer.offerPercentage / 100);
                bestOffer = productOffer; // Product offer is better
            } else {
                finalPrice = product.productPrice - (product.productPrice * categoryoffer.offerPercentage / 100);
                bestOffer = categoryoffer; // Category offer is better
            }
        } else if (productOffer) {
            finalPrice = product.productPrice - (product.productPrice * productOffer.offerPercentage / 100);
            bestOffer = productOffer;
        } else if (categoryoffer) {
            finalPrice = product.productPrice - (product.productPrice * categoryoffer.offerPercentage / 100);
            bestOffer = categoryoffer;
        }
        let discountedPrice = product.productPrice - finalPrice;

        //-----------------------------------------------------
        const userId = req.session.userId;

        const userObjectId = userId
        // console.log(typeof userId)
        // console.log('userObjectId', userObjectId)

        if (!userId) {
            console.log('User is not logged in');
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
        let cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) })
        // console.log('cart', cart)


        if (!cart) {
            cart = new Cart({ userId: new mongoose.Types.ObjectId(userId), cartItems: [] })
        }
        const ItemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId)
        if (ItemIndex >= 0) {
            cart.cartItems[ItemIndex].qty += qty;

        } else {
            cart.cartItems.push({ productId,
                 qty,
                 price:finalPrice ,
                 discountedPrice: discountedPrice,
                 offerPercentage:  bestOffer ? bestOffer.offerPercentage : 0
                });
        }
        // console.log('cart', cart)
        await cart.save();
        return res.json({ success: true, message: 'Product added to cart' });

    } catch (error) {
        console.error('Error in addToBag:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }

}


module.exports = {
    loadCart,
    addtoCart,
    removeCartProduct,
    loadCheckout,
    updateCart,
    saveNewAddress,
    addToBag,



}