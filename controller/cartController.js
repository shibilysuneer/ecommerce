const Product = require('../models/prodectModel')
const User = require("../models/userModel");
const Category = require('../models/categoryModal')
const Brand =require('../models/brandModal')
const Cart = require('../models/cartModal')
const Order = require('../models/orderModal')
const mongoose = require("mongoose")
const {ObjectId}=require('mongodb')

const loadCart = async(req,res)=>{
    try {
       
        const userId = new mongoose.Types.ObjectId(req.session.userId);
        console.log('userId==',req.session.userId);
        if (!userId) {
            return res.redirect('/login');
        }
        const cart = await Cart.findOne({ userId }).populate({
            path: 'cartItems.productId',
            select: 'productName images' 
        });
        if (!cart) {
            return res.render('cart', { cartItems: [], subtotal: 0 });
        }

        const cartItems = cart.cartItems.map(item => ({
            product: item.productId, 
            quantity: item.qty,
            price: item.price
        }));
        const subtotal = cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0)
         console.log("cart=",cartItems);
         console.log("subtotal", subtotal);

        res.render('cart', { cartItems,subtotal });
        
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
}
 const addtoCart=async(req,res)=>{
    try {

        
        const { productId, qty } = req.body;
        const userId = req.session.userId

        // console.log('session:=',req.session.id);
        //  console.log('userID:',userId);
        //  console.log('productId:',productId);
        //  console.log(qty);
        
        if (!userId) {
             return res.status(401).send('User not authenticated');
        }
        // Convert userId to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

       
        const product = await Product.findById(productId);
        console.log("product",product);
        
        if (!product) {
            return res.status(404).send('Product not found');

        }
        const availableStock = parseInt(product.stocks);
        const requestedQty = parseInt(qty);
        const maxQtyPerPerson = 10;

        if (requestedQty > availableStock) {
            return res.status(400).send(' Only ${availableStock} items left in stock.');
        }
         
         let cart = await Cart.findOne({userId: userObjectId }); 
         if (cart) {
             // If the cart exists, update the quantity or add the product
             const itemIndex = cart.cartItems.findIndex(p => p.productId.toString()  === productId);
             if (itemIndex > -1) {
                const currentQty = cart.cartItems[itemIndex].qty;
                const newQty = currentQty + requestedQty;
                // const newQty = Math.min(cart.cartItems[itemIndex].qty + requestedQty, maxQtyPerPerson);
                if (newQty > availableStock) {
                    cart.cartItems[itemIndex].qty = availableStock;
                    await cart.save();
                    return res.status(400).send(`Cannot add more than ${availableStock} items to the cart.`);
                }else{
                    cart.cartItems[itemIndex].qty = newQty;

                }
                // cart.cartItems[itemIndex].qty = newQty;

              } else {
               
                const addQty = Math.min(requestedQty, Math.min(maxQtyPerPerson, availableStock));
                cart.cartItems.push({ productId, qty: addQty, price: product.productPrice, images: product.images });
             }
             await cart.save();
             console.log("cart",cart);
             
            } else {
                
                const addQty = Math.min(requestedQty, Math.min(maxQtyPerPerson, availableStock));
            cart = new Cart({
                userId: userObjectId,
                cartItems: [{ productId, qty: addQty, price: product.productPrice, images: product.images }]
                });
                await cart.save();   
            }
            res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}
const removeCartProduct = async(req,res) =>{
    try {
        const {productId}=req.body
        const userId = req.session.userId;

        const cart = await Cart.findOne({userId})
        if(cart){
            cart.cartItems = cart.cartItems.filter(item => item.productId.toString() !== productId)

            await cart.save();
        }
        res.redirect('/cart');

    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).send('Server Error');
    }
}
 const loadCheckout =async(req,res) => {
    try {
       const userId = req.session.userId;
        if(!userId){
            console.error("UserId not found in this session");
            res.redirect('/login')           
           }
        const cart = await Cart.findOne({ userId }).populate({
            path: 'cartItems.productId',
            select: 'productName price'
        })
        const user = await User.findById(userId).populate('address')
        // const addresses = user ? user.address : [];
        if(!user){
            console.error("User data not found")
            res.redirect('/login')           
        }
        const addresses = user.address
        let defaultAddress = null;

        if (addresses.length > 0) {
            defaultAddress = addresses.find(address => address.isDefault) || addresses[0];
        }
        // console.log('address--',addresses);
        // console.log('Default Address:', defaultAddress);

        if (!cart) {
            return res.render('checkout', { cartItems: [], subtotal: 0, shipping: 0, total: 0, addresses, defaultAddress });
        }

        const cartItems = cart.cartItems 
        let subtotal = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);

        
        console.log('subtotal---',subtotal);
    
        const shipping = 50;
        const total = subtotal + shipping;

        res.render('checkout', { cartItems, subtotal, shipping, total,addresses ,defaultAddress})
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
  const updateCart = async(req,res)=> {
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
                // const updatedQty = Math.min(Math.max(parseInt(quantity), 1), 10);
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
const saveNewAddress = async(req,res)=> {
    const{fname,lname,number,street,house,city,state,district,zip}=req.body

    try {
        const newaddress ={
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
        const userId =req.session.userId
        await User.findByIdAndUpdate(userId,{$push:{address:newaddress}})
        res.redirect('/checkout')
    } catch (error) {
        console.log(error.message);
        res.redirect('/checkout')

    }
}

module.exports = {
    loadCart,
    addtoCart,
    removeCartProduct,
    loadCheckout,
    updateCart,
    saveNewAddress,
    
   
}