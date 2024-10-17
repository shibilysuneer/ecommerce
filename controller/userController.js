const User = require("../models/userModel");
const Product = require('../models/prodectModel')
const { ProductOffer, CategoryOffer } = require('../models/offerModal')
const bcrypt = require("bcrypt");
const env = require('dotenv').config()  ///c
const nodemailer = require('nodemailer')
const mongoose = require("mongoose")
const { ObjectId } = require('mongodb')
// const session = require('express-session')

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash;

  } catch (error) {
    console.log(error.message)
  }
}

const signupload = async (req, res) => {
  try {
    res.render('signup')

  } catch (error) {
    console.log(error.message)
    res.redirect("/pageNotfound")
  }
}




function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'verify your account',
      text: `your OTP is ${otp}`,
      html: `<b>Your OTP:${otp}</b>`
    })
    return info.accepted.length > 0

  } catch (error) {
    console.error('Error sending email', error);
    return false
  }
}

const insertuser = async (req, res) => {
  try {
    const { fname, lname, mobile, email, password } = req.body

    const findUser = await User.findOne({ email })
    if (findUser) {
      return res.render('signup', { message: 'User already exist' })
    }
    const otp = generateOtp()
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json('email-error')
    }
    req.session.userOtp = otp;
    req.session.userData = { fname, lname, mobile, email, password }

    res.render('otp')
    console.log('OTP sent', otp);
  } catch (error) {
    console.error('signup error', error);
  }
}
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp);
    if (otp === req.session.userOtp) {
      const user = req.session.userData
      const passwordHash = await securePassword(user.password)
      const saveUserData = new User({
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        mobile: user.mobile,
        password: passwordHash,
      })
      await saveUserData.save();
      req.session.userId = saveUserData._id;
      res.json({ success: true, redirectUrl: '/home' })
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' })
    }

  } catch (error) {
    console.log(error.message);
    res.redirect("/pageNotfound")
  }
}
const resendOtp = async (req, res) => {
  try {
    const email = req.session.userData;
    // console.log(req.session);
    // console.log(req.session.userData);
    // console.log(email,'qwe');
    
    if (!email) {
      return res.status(400).json({ success: false, message: "Email not found in session" })
    }
    
    const otp = generateOtp()
    
    req.session.userOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp)
    if (emailSent) {
      console.log('Resend OTP:', otp);
      res.status(200).json({ success: true, message: 'OTP successffull' })
    } else {
      res.status(500).json({ success: false, message: 'failed' })
    }
  } catch (error) {
    console.log(error.messsage);
    res.redirect("/pageNotfound")
  }
}


const loginload = async (req, res) => {
  try {
    if (req.session.userId) {
      return res.redirect('/home');
    }
    const message = req.query.message || '';
    const user = req.session.userId ? await User.findById(req.session.userId) : null;

    res.render('login', { message,user:user });
  } catch (error) {
    res.redirect("/pageNotfound")
    console.log(error.message);
  }
}

const verifylogin = async (req, res) => {

  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: email })
    if (!user) {
      return res.render('login', { message: 'User not found' })
    }
    if (user.is_blocked) {
      return res.render('login', { message: 'User is blocked by admin' })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.render('login', { message: 'Invalid Email and Password' })

    }
    req.session.userId = user._id;
    return res.redirect('/home')
  } catch (error) {
    console.log(error.message);
    return res.render('login', { message: 'login failed please try again' })
  }
}
const getForgotPassPage = async(req,res)=>{
  try {
    res.render('forgotPassword')
  } catch (error) {
    res.redirect("/pageNotfound")
  }
}
const forgotEmailValid = async(req,res)=> {
  try {
    const {email} = req.body;
    console.log('email',email);
    
    const user = await User.findOne({email:email})
    if(user){
      const otp = generateOtp();      
      const emailSent = await sendVerificationEmail(email,otp);
      if(emailSent){
        req.session.userOtp = otp;
        req.session.userData = email;
        res.render('forgotpass-otp')
        console.log('OTP:',otp);
        
      }else{
        res.json({success:false,message:'failed to send otp'})
      }
    }else {
      res.redirect('/forgotPassword?invalid')
  }
  } catch (error) {
    console.log(error,'not found');
    res.redirect("/pageNotfound")
  }
}
const verifyForgotOtp= async(req,res) => {
  try {
    const enteredotp = req.body.otp;
    console.log('enteredotp',enteredotp);
    if(enteredotp == req.session.userOtp){
      res.json({success:true,redirectUrl:'/reset-password'})
    }else{
      res.json({success:false,message:'OTP not matching'})
    }
  } catch (error) {
    res.status(500).json({success:false,message:'An error occured'})
    console.log(error.message);
    
  }
}
const getResetPassword = async(req,res) => {
  try {
    res.render('resetPassword')
  } catch (error) {
    console.log(error.message);
    
  }
}
const newPassword = async(req,res) => {
  try {
    const {newPass1 ,newPass2} =req.body;
    const email = req.session.userData
    if(newPass1==newPass2){
      const passwordHash = await securePassword(newPass1);
      await User.updateOne(
        {email:email},
        {$set:{password:passwordHash}}
      )
      res.redirect('/login')
    }else{
      res.render('resetPassword',{message:'Password not match'})
    }
  } catch (error) {
    console.log(error.message);
    
  }
}






const loadHome = async (req, res) => {
  try {
    console.log('User after Google auth:', req.user);
    console.log('Session after Google auth:', req.session);

    const user = req.session.userId ? await User.findById(req.session.userId) : null;

    const Products = await Product.find({})
    // console.log('products:--',Products); // Debugging statement

    res.render('home', {
       Products,
       user:user
      })
  } catch (error) {
    console.log('Error fetching products:', error.message);
    // res.status(500).send('Server Error');
    res.redirect("/pageNotfound")

  }
}


const loadauth = (req, res) => {
  res.render('signup')
}
const successGoogle = async (req, res) => {
  try {
    console.log(req.session.passport.user);
    req.session.userId = req.session.passport.user
    const Products = await Product.find({});
    console.log('Products after Google auth: ', Products);

    res.render('home', { Products });
  } catch (error) {
    console.error('Error fetching products after Google auth:', error.message);
    res.status(500).send('Server Error');
  }
}
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log(err.message);
        res.send('error logging out')
      }
      res.redirect('/login')
    })

  } catch (error) {
    console.log(error.message);
    res.redirect("/pageNotfound")
  }
}


const productdetailsload = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId)
    const productOffer = await ProductOffer.findOne({ productId: product._id, isActive: true });
    const categoryoffer = await CategoryOffer.findOne({ categoryId: product.productCategory, isActive: true })
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
    const user = req.session.userId ? await User.findById(req.session.userId) : null;

    res.render('productdetails', { product, finalPrice, productOffer, categoryoffer, bestOffer ,user})
  } catch (error) {
    console.log(error.message);
    res.redirect("/pageNotfound")
  }
}
const loadprofile = async (req, res) => {
  try {
    console.log(req.session.id);
    const id = req.session.userId
    const user = await User.findOne(new ObjectId(id))
    console.log(user);
    res.render('profile', { user })

  } catch (error) {
    console.log(error.message);
    res.redirect("/pageNotfound")
  }
}
const loadeditprofile = async (req, res) => {
  try {
    console.log(req.session.id);
    const id = req.session.userId;
    const user = await User.findOne(new ObjectId(id));
    console.log(user);
    res.render('editProfile', { user });
  } catch (error) {
    console.log(error.message);
    // res.status(500).send('Server Error');
    res.redirect("/pageNotfound")
  }
};
const editProfile = async (req, res) => {
  try {
    const id = req.session.userId
    const updateData = {
      fname: req.body.fname,
      email: req.body.email,
      mobile: req.body.mobile
    }
    await User.updateOne({ _id: new ObjectId(id) }, { $set: updateData })
    res.redirect('/profile')
  } catch (error) {
    console.log(error.message);
  }
}
const loadChangePassword = async (req, res) => {
  try {
    const user = req.session.userId ? await User.findById(req.session.userId) : null;

    res.render('changepassword', { successMessage: null, errorMessage: null ,user})
  } catch (error) {
    console.log(error.message);
    res.render('changepassword', { successMessage: null, errorMessage: 'Error loading the page' });
  }
}
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect('/login');
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.render('changepassword', { successMessage: null, errorMessage: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      res.render('changepassword', { successMessage: null, errorMessage: 'Incorrect current password' });
    }
    if (newPassword !== confirmPassword) {
      return res.render('changepassword', { successMessage: null, errorMessage: 'Passwords do not match' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.render('changepassword', { successMessage: 'Password changed successfully', errorMessage: null });
  } catch (error) {
    console.error(error.message);
    res.render('changepassword', { errorMessage: 'Something went wrong, please try again' });
  }
}
const loadAddAddress = async (req, res) => {
  try {
    const user = req.session.userId ? await User.findById(req.session.userId) : null;
    res.render('addAddress',{user})
  } catch (error) {
    console.log(error.message);
    res.redirect("/pageNotfound")
  }
}
const addAddress = async (req, res) => {
  const { fname, lname, number, country, house, street, zip, message, city, district, state } = req.body;
  // console.log(req.body);

  const userId = req.session.userId
  console.log(userId);

  if (!house || !street || !zip) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }


  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const newAddress = ({
      _id: new mongoose.Types.ObjectId(),
      fname,
      lname,
      number,
      country,
      house,
      street,
      zip,
      message,
      city,
      district,
      state,
      userId: userId

    })
    user.address.push(newAddress);

    await user.save()
    res.redirect('/address')
  } catch (error) {
    console.log(error.message);
    // res.status(500).send('Internal Server Error');
    res.redirect("/pageNotfound")
  }
}


const defaultAddress = async (req, res) => {
  const { addressIndex } = req.body;
  const userId = req.session.userId;
  try {
    const user = await User.findById(userId);

    if (user) {
      // Set all addresses' isDefault to false
      user.address.forEach((address, index) => {
        address.isDefault = index === parseInt(addressIndex, 10);
      });

      await user.save();
      res.status(200).send('Default address updated');
    } else {
      res.status(404).send('User not found');
    }

  } catch (error) {
    res.status(500).send('Server error');
  }
}
const getUserAddressPage = async (req, res) => {
  const userId = req.session.userId;
  try {
    const user = await User.findById(userId).populate('address');
    if (!user) {
      return res.status(404).send('User not found');
    }
    const defaultAddress = user.address.find(address => address.isDefault);
    console.log('defaultadd:', defaultAddress);

    res.render('address', { user: user, defaultAddress: defaultAddress });
  } catch (error) {
    console.error('Error retrieving user data:', error);
    res.status(500).send('Server error');
  }
};
const loadEditAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const addressId = req.params.id;

    console.log('User ID:', userId);
    // console.log('Address ID:', addressId);


    const user = await User.findById(userId);
    const address = user.address.id(addressId);
    if (address) {
      res.render('editAddress', { address,user });
    } else {
      res.status(404).send('Address not found');
    }
  } catch (error) {
    console.error('Error loading address for editing:', error);
    // res.status(500).send('Server error');
    res.redirect("/pageNotfound")
  }
}
const editAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const addressId = req.params.id;
    const { fname, lname, house, street, city, district, state, number, zip } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    const address = user.address.id(addressId);
    if (!address) {
      return res.status(404).send('Address not found');
    }

    address.fname = fname || address.fname;
    address.lname = lname || address.lname;
    address.house = house || address.house;
    address.street = street || address.street;
    address.city = city || address.city;
    address.district = district || address.district;
    address.state = state || address.state;
    address.number = number || address.number;
    address.zip = zip || address.zip;

    await user.save();
    res.redirect('/address');
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).send('Server error');
  }
}
const deleteAddress = async (req, res) => {
  const addressId = req.params.id;
  const userId = req.session.userId;

  console.log('Address ID:', addressId);

  try {
    const user = await User.findById(userId);
    console.log("useradd", user);

    if (!user) {
      return res.status(404).send('User not found');
    }

    user.address = user.address.filter(address => address._id.toString() !== addressId);

    await user.save(); // Save the user with the updated addresses array

    res.redirect('/address');
  } catch (error) {
    console.error('Error deleting address:', error);
    // res.status(500).send('Server error');
    res.redirect("/pageNotfound")
  }
}

const pageNotFound = async (req, res) => {
  try {
      res.render('404', { url: req.url })
  }
  catch (error) {
      console.log(error, 'page not found error');
      res.redirect("/pageNotfound")
  }
}

module.exports = {
  signupload,
  insertuser,
  loginload,
  verifylogin,
  getForgotPassPage,
  forgotEmailValid,
  verifyForgotOtp,
  getResetPassword,
  newPassword,
  loadHome,
  loadauth,
  successGoogle,
  verifyOtp,
  resendOtp,
  logout,
  productdetailsload,
  loadprofile,
  loadeditprofile,
  editProfile,
  loadChangePassword,
  changePassword,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  defaultAddress,
  deleteAddress,
  getUserAddressPage,
  pageNotFound


}