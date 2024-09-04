const mongoose = require('mongoose');
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const Product = require('../models/prodectModel')
const Category = require('../models/categoryModal')
const Brand =require('../models/brandModal')
const Order = require('../models/orderModal')
const fs = require('fs');
const path = require('path');
//  const securepassword = async (password)=>{
//      try{
//          const passwordhash = await bcrypt.hash(password,10)
//          return passwordhash;

//      }catch(error){
//          console.log(error.message)
//      }
//  }


const loadlogin = async(req,res) => {
    try{
        res.render('login')

    }catch(error){
        console.log(error.message)
    }
}

const verifyAdmin=async(req,res) => {
    
    try{
       const {email,password}=req.body
       const user=await User.findOne({email})
       if(user){
        const match = await bcrypt.compare(password,user.password)
        if(match && user.is_admin == 1){
            req.session.userId = user._id
         return  res.redirect('/admin/dashboard')                            
        }else{

            
            return res.render('login', { message: 'Invalid Email and Password' });
        }
       }else{

        return res.render('login', { message: 'Invalid Email and Password' });

       }
    }catch(error){
        console.log(error.message);
        // res.status(500).send('Internal Server Error');

    }
}

const loadDashboard=async(req,res)=>{
    try{
      res.render('dashboard')
    }catch(error){
        console.log(error.message);
    }
}
const loadProductList= async(req,res) => {
    try{
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
        const skip = (page - 1) * limit; // Calculate the number of items to skip
       
        const totalProducts = await Product.countDocuments();

        const products = await Product.find({})
        .populate('productCategory', 'categoryName') 
        .populate('productBrand', 'brandName') 
        .skip(skip)
        .limit(limit)
        .exec();
        const totalPages = Math.ceil(totalProducts / limit); // Calculate the total number of pages
        // console.log("prod",products);
        res.render('products',{status : true, products,currentPage: page,
            totalPages,})

    }catch(error){
        console.log(error.message);
        res.render('products', { status: false, products: [], currentPage: 1, totalPages: 1 });
    }
}



const loadaddProduct=async (req,res) => {
    try {
        const categoryData = await Category.find({})
        console.log(categoryData);
        const brandData = await Brand.find({})
        res.render('addProduct',{categories:categoryData,brands:brandData})

    } catch (error) {
        console.log(error.message);
        res.json({status : false, message : "Error products not getting"})
    }
}

const addProduct = async (req,res) => {
    console.log("body",req.body);
        try {
             const { productCategory, productBrand } = req.body;
            if (!productCategory || !productBrand) {
             return res.status(400).json({ status: false, message: "Category and brand are required" });
             }
             const category = await Category.findById(productCategory).select('_id categoryName');
             const brand = await Brand.findById(productBrand).select('_id brandName');

         if (!category || !brand) {
             return res.status(400).json({ status: false, message: "Invalid category or brand" });
         }
            // console.log(req.files);
            const images = req.files.map(file => file.filename);
              // console.log(images);
           
            const product = new Product({
                productName: req.body.productName,
                productCategory: category._id,
                productPrice: req.body.productPrice,
                productBrand:brand._id, 
                stocks: req.body.stocks,
                status: req.body.status,
                images:images,
                productReview: req.body.productReview,
                productDescription:req.body.productDescription
            });
            console.log("product",product);
            
             await product.save();
        res.redirect('/admin/products');
        
        } catch (error) {
            console.log(error.message);
        }
}
const loadProducts = async(req,res)=>{
    try {
        res.render('products',)
        
    } catch (error) {
        console.log(error.message);
    }
}
const loadeditProduct = async(req,res) => {
    try {
        const id = req.params.id
        const product = await Product.findById(id)
        .populate('productCategory')
        .populate('productBrand')
        const categories = await Category.find();
        const brands = await Brand.find();
        console.log('Product--', product);
        console.log('Categorie--', categories);
        res.render('editProduct',{product,categories,brands})
        // console.log(product);
    } catch (error) {
        console.log(error.message);
    }
}
const editProduct = async(req,res) => {
    try{
        const id = req.params.id;

        const {productName,productCategory,productPrice,stocks,productBrand,status} = req.body
        console.log(req.body);
        const updateProduct = {
            productName,
            productCategory,
            productPrice,
            stocks,
            productBrand,
            status
        }


        if(req.files && req.files.length>0){
            const images =req.files.map(file =>file.filename);
            updateProduct.images = images
        }
        if (stocks > 0) {
            updateProduct.status = 'In Stock';
        } else {
            updateProduct.status = 'Out of Stock';
        }

        await Product.findByIdAndUpdate(id,updateProduct,{ new: true });
        res.redirect('/admin/products')
    }catch(error){
        console.log(error.message);
    }
}

const blockProduct= async(req,res) => { 
    try{
        const id = req.params.id;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).send('invalid')
        }
       const product= await Product.findOne({_id:id})
       const newstate=!product.is_blocked
     const updateResult=  await Product.updateOne({_id:id},{$set:{is_blocked:newstate}})
     console.log(updateResult);
       if(updateResult.modifiedCount>0){
        res.redirect('/admin/products')
       }else{
       res.status(500).send('fail')
       }
    }catch(error){
        console.log(error.message);
    }
}


const deleteproduct = async(req,res) => {
    try{
        console.log("hgjhghj");
        const id = req.params.id;
        console.log(id);

        const deleteData=await Product.findByIdAndDelete(id);
        if(deleteData){
            res.redirect('/admin/products')
        }else{
            console.log('not found');
        }
    }catch(error){
        console.log(error.message);
    }
}
const loadUserlist = async(req,res) => {
    console.log(req.body);
    try{
        const users = await User.find({})
        res.render('userlist',{users})
        
    } catch (error) {
        console.log(error.message);
    
    }
}
const blockuser= async(req,res) => {
   
    try{
        const id = req.params.id;
       const userdata= await User.findOne({_id:id})
       const userstate=!userdata.is_blocked
     const hidestate=  await User.updateOne({_id:id},{$set:{is_blocked:userstate}})
     console.log(hidestate);
       if(hidestate.matchedCount>0){
        res.redirect('/admin/userlist')
       }else{
       res.send('not found');
       }
    }catch(error){
        console.log(error.message);
    }
}
const loadCategorylist = async(req,res) => {
    try{
      const categories=  await Category.find({})
      console.log(categories);
      res.render('categorylist',{categories})
    }catch(error){
        console.log(error.message);
    }
}

const loadaddCategory = async (req,res) => {
    try{
       res.render('addcategory')
    }catch(error){
        console.log(error.message);
    }
}
const addCategory = async (req,res) => {
    console.log(req.body);

    try{
        const images = req.files.map(file => file.filename);
            console.log(images);
        const category = new Category ({
            categoryName:req.body.categoryName,
            image:images,
            stock:req.body.stock,
            sale:req.body.sale
        })
        await category.save()
        res.redirect('/admin/categorylist')
    }catch(error){
        console.log(error.message);
    }
}
const loadeditCategory = async(req,res) => {
    try {
        const id = req.params.id
        const category = await Category.findById(id)
        res.render('editcategory',{category})
        console.log(category);
    } catch (error) {
        console.log(error.message);
    }
}
const editCategory = async(req,res) => {
    try{
        const id = req.params.id;
        const {categoryName,stocks,sale} = req.body
        console.log(req.body);
        const updateProduct = {
            categoryName,
            stocks,
            sale
        }
        const images = req.files.map(file => file.filename);
            console.log(images);

        await Category.findByIdAndUpdate(id,updateProduct);
        res.redirect('/admin/categorylist')
    }catch(error){
        console.log(error.message);
    }
}
const blockCategory= async(req,res) => { 
   
    try{
        const id = req.params.id;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).send('invalid')
        }
       const category= await Category.findOne({_id:id})
       const newstate=!category.is_blocked
     const hidestate=  await Category.updateOne({_id:id},{$set:{is_blocked:newstate}})
     console.log(hidestate);
       if(hidestate.modifiedCount>0){
        res.redirect('/admin/categorylist')
       }else{
       res.status(500).send('fail')
       }
    }catch(error){
        console.log(error.message);
    }
}

const loadbrandlist= async(req,res) => {
    try{
        const brands=  await Brand.find({})
        console.log(brands);
        res.render('brandlist',{brands})
    }catch(error){
        console.log(error.message);
    }
}
const loadaddBrand = async (req,res) => {
    try{
       res.render('addbrand')
    }catch(error){
        console.log(error.message);
    }
}
const addbrand =async(req,res) =>{
    try{
        const brand = new Brand ({
            brandName:req.body.brandName,
            image:req.body.image,
            stock:req.body.stock,
            sale:req.body.sale
        })
        await brand.save()
        res.redirect('/admin/brandlist')
    }catch(error){
        console.log(error.message);
    }
}
const loadeditBrand = async(req,res) => {
    try {
        const id = req.params.id
        const brand = await Brand.findById(id)
        res.render('editbrand',{brand})
        console.log(brand);
    } catch (error) {
        console.log(error.message);
    }
}
const editBrand = async(req,res) => {
    try{
        const id = req.params.id;
        const updates = req.body;

        await Brand.findByIdAndUpdate(id, updates, { new: true });
        res.redirect('/admin/brandlist')
    }catch(error){
        console.log(error.message);
    }
}

const logout = async(req,res) => {
   try {
    req.session.destroy()
    res.redirect('/admin/login')
   }catch(error){
    console.log(error.message);
   }
}
const order = async(req,res) => {
    try {
        const orders = await Order.find()
        .sort({ createdAt : -1})
        .populate('cartItems.productId'); // Populate product details
        res.render('orderList', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
}
const changeStatus = async(req,res)=> {
    try {
         const { status } = req.body;
        const {  orderId, itemId } = req.params;
        console.log(itemId);
        

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).send('Order not found');

        const item = order.cartItems.id(itemId);
        console.log(item);
        
        if (!item) return res.status(404).send('Item not found');

        item.status = status;
        await order.save();
        res.redirect('/admin/orderList');
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    }
}
const cancelOrderItem = async(req,res) => {
    try {
        const { orderId, itemId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            console.error('Order not found with ID:', orderId);
            return res.status(404).send('Order not found');
        }

        const item = order.cartItems.id(itemId);
        if (!item) {
            console.error('Item not found with ID:', itemId);
            return res.status(404).send('Item not found');
        }
       
        item.status = 'canceled'; // Mark the item as canceled
        // item.cancel = true; 
        await order.save();

        res.redirect('/admin/orderList');
    } catch (error) {
        console.error('Error canceling order item:', error);
        res.status(500).send('Internal Server Error');
    }
}
const itemDetails = async(req,res) => {
    try {
        const { orderId, itemId } = req.params;
        const order = await Order.findById(orderId).populate('cartItems.productId');
        const item = order.cartItems.id(itemId);
        if (!order || !item) {
            return res.status(404).send('Order or item not found');
        }
        res.render('itemDetails', { order, item })
    } catch (error) {
        console.log(error.message);
        
    }
}
    

module.exports = {
    loadlogin,
    verifyAdmin,
    loadDashboard,
    loadProducts,
    loadaddProduct,
    addProduct,
    loadProductList,
    loadeditProduct,
    editProduct,
    deleteproduct,
    loadUserlist,
    blockuser,
    loadCategorylist,
    loadaddCategory,
    addCategory,
    loadbrandlist,
    loadaddBrand,
    addbrand,
    loadeditCategory,
    editCategory,
    loadeditBrand,
    editBrand,
    blockCategory,
    blockProduct,
    logout,
    order,
    changeStatus,
    cancelOrderItem,
    itemDetails

    
   
}