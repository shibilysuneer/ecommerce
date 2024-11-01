const express = require("express")
const session = require('express-session')
const passport= require('passport')
const path=require('path')
const bodyParser = require('body-parser')
const nocache = require('nocache');
require('dotenv').config();
const config = require("../config/config") 
const usercontroller = require("../controller/userController")
const cartController = require('../controller/cartController')
const shopController = require("../controller/shopController")
const orderController = require('../controller/orderController')
const wishlistController = require('../controller/wishlistController')
const paymentController = require('../controller/paymentController')
const walletcontroller = require('../controller/walletController')
const auth = require('../middleware/userauth')


const user_route = express()

require('../passport')

user_route.use(session({
    secret:process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}))
user_route.use(nocache())

user_route.use(passport.initialize())
user_route.use(passport.session())
user_route.use(express.static(path.join(__dirname,'../public/user')))
user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}))


user_route.set('view engine','ejs')
user_route.set('views','./views/users')


user_route.get('/auth/google',passport.authenticate('google',{scope:
    ['email','profile']
}))
//authcallback
user_route.get( '/auth/google/callback', 
	passport.authenticate( 'google', { 
		failureRedirect: '/failure'
}),
(req,res) => {
    res.redirect('/google/success')
}
);

//Routes
user_route.get('/signup',auth.islogout,usercontroller.signupload)
user_route.post('/signup',usercontroller.insertuser)
user_route.get('/login',auth.islogout,usercontroller.loginload)
user_route.post('/login',usercontroller.verifylogin)
user_route.get('/home',auth.islogin,usercontroller.loadHome)
user_route.get('/google/success',usercontroller.successGoogle); 
//forgotpassword
user_route.get('/forgot-password',usercontroller.getForgotPassPage)
user_route.post('/forgot-email-valid',usercontroller.forgotEmailValid)
user_route.post('/verify-forgot-otp',usercontroller.verifyForgotOtp)
user_route.get('/reset-password',usercontroller.getResetPassword)
 user_route.post('/reset-password',usercontroller.newPassword)

user_route.post('/otp',auth.islogout,usercontroller.verifyOtp)
user_route.get('/logout',auth.islogin,usercontroller.logout)
user_route.get('/productdetails/:id',usercontroller.productdetailsload)
user_route.post('/resend-otp',auth.islogout,usercontroller.resendOtp)
user_route.get('/profile',auth.islogin,usercontroller.loadprofile)
user_route.get('/edit-profile',auth.islogin,usercontroller.loadeditprofile)
user_route.post('/edit-profile',auth.islogin,usercontroller.editProfile)
user_route.get('/change-password',auth.islogin,usercontroller.loadChangePassword)
user_route.post('/change-password',auth.islogin,usercontroller.changePassword)
user_route.get('/add-address',auth.islogin,usercontroller.loadAddAddress)
user_route.post('/add-address',auth.islogin,usercontroller.addAddress)
user_route.get('/edit-address/:id',auth.islogin,usercontroller.loadEditAddress)
user_route.post("/edit-address/:id",auth.islogin,usercontroller.editAddress)
user_route.post('/set-default-address',auth.islogin,usercontroller.defaultAddress)
user_route.delete('/delete-address/:id',auth.islogin,usercontroller.deleteAddress);
user_route.get('/address',auth.islogin,usercontroller.getUserAddressPage)


user_route.get('/cart',auth.islogin,cartController.loadCart)
user_route.post('/cart',auth.islogin,cartController.addtoCart)
user_route.post('/addtobag',auth.islogin,cartController.addToBag)
user_route.post('/cart-remove',auth.islogin,cartController.removeCartProduct)
user_route.get('/checkout',auth.islogin,cartController.loadCheckout)
user_route.post('/update-cart',auth.islogin,cartController.updateCart)
user_route.post('/new-address',auth.islogin,cartController.saveNewAddress)

user_route.get('/shop',shopController.showProducts)
user_route.get('/shop/search',shopController.sortedLists)
user_route.get('/productdetails/:id',shopController.showProductDetails)

user_route.post('/place-order',auth.islogin,orderController.placeOrder)
user_route.post('/apply-coupon',auth.islogin,orderController.applyCoupon)
user_route.post('/remove-coupon',orderController.removeCoupon)
user_route.get('/order-success',orderController.loadOrderSuccess)
user_route.get('/order-history',auth.islogin,orderController.loadOrderHistory)
user_route.post('/cancel/:orderId/:itemId',auth.islogin,orderController.cancelOrder)
user_route.get('/order-details/:orderId',auth.islogin,orderController.orderDetails)
user_route.post("/return-order/:orderId/:itemId",auth.islogin,orderController.returnOrder)
user_route.get('/invoice/:orderId',orderController.downLoadInvoice)

user_route.get('/wishlist',auth.islogin,wishlistController.loadWishlist)
user_route.post('/wishlist',auth.islogin,wishlistController.addWishlist)
user_route.post('/remove-wishlist',auth.islogin,wishlistController.removeWishlist)

user_route.post('/create-razorpay-order',paymentController.createRazorpayOrder)
user_route.post('/verify-payment',paymentController.verifyPayment)
user_route.post('/order-failure',paymentController.paymentFailure)//
user_route.get('/coupon',paymentController.loadCoupon)
user_route.post('/retry-payment/:orderId',paymentController.repayment)//
user_route.post('/verify-repayment',paymentController.verifyRepayment)

user_route.get('/wallet',auth.islogin,walletcontroller.loadWallet)
user_route.post('/wallet-balance',walletcontroller.walletBalance)
user_route.get('/pageNotFound',usercontroller.pageNotFound)
user_route.get('/payment-failed',paymentController.paymentFailed)

module.exports = user_route;