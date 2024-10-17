const Product = require('../models/prodectModel')
const Wishlist = require('../models/wishlistModal')
const User = require('../models/userModel');


const loadWishlist = async(req,res) =>{
    try {
        const userId = req.session.userId;
        const wishlist = await Wishlist.findOne({user:userId}).populate('products')
        const wishlistItems = wishlist ? wishlist.products : [];
        const user = req.session.userId ? await User.findById(req.session.userId) : null;

        res.render('wishlist',{wishlistItems,user})
    } catch (error) {
        // res.status(500).send('Server Error');
        res.redirect("/pageNotfound")
    }
}
const addWishlist=async(req,res) => {
    try {
        const {productId} =req.body;        
        const userId = req.session.userId;

        let wishlist = await Wishlist.findOne({user:userId})
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, products: [] });
        }
        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
            return res.json({ success: true });
        } else {
            return res.json({ success: false, message: 'Product is already in the wishlist.' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
}
const removeWishlist = async(req,res) => {
    try {
        const { productId } = req.body;        
        const userId = req.session.userId;

      let wishlist = await Wishlist.findOne({ user: userId });
        if (wishlist) {
            wishlist.products = wishlist.products.filter(id => id.toString() !== productId);

            await wishlist.save();
            return res.redirect('/wishlist');
        } else {
            return res.status(404).send('Wishlist not found.');
        }
    } catch (error) {
        return res.status(500).send('Server error.');
    }
}
module.exports={
    loadWishlist,
    addWishlist,
    removeWishlist
}