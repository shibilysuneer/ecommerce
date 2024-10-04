const mongoose = require('mongoose');
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const Product = require('../models/prodectModel')
const Category = require('../models/categoryModal')
const Brand =require('../models/brandModal')
const Order = require('../models/orderModal')
const Coupon = require('../models/couponModal')
const Wallet = require('../models/walletModal')
const { ProductOffer,CategoryOffer} = require('../models/offerModal')
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
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
            req.session.admin = user._id
         return  res.redirect('/admin/dashboard')                            
        }else{

            
            return res.render('login', { message: 'unauthorized access' });
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
const salesReport = async(req,res)=> {
    try {
        const { startDate, endDate, reportType } = req.query;

        let filter = {};
       
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(new Date(startDate).setHours(00, 00, 00)),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59)),
            };
        }else {
            // Calculate the date range based on reportType if custom date range is not provided
            let now = new Date();
            switch (reportType) {
                case 'daily':
                    filter.createdAt = {
                        $gte: new Date(now.setHours(0, 0, 0, 0)),  // Start of today
                        $lte: new Date(now.setHours(23, 59, 59, 999)) // End of today
                    };
                    break;

                case 'weekly':
                    let startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Get start of week (Sunday)
                    let endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Saturday)
                    filter.createdAt = {
                        $gte: startOfWeek,
                        $lte: new Date(endOfWeek.setHours(23, 59, 59, 999))
                    };
                    break;

                case 'monthly':
                    let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // First day of the current month
                    let endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of the current month
                    filter.createdAt = {
                        $gte: startOfMonth,
                        $lte: new Date(endOfMonth.setHours(23, 59, 59, 999))
                    };
                    break;

                case 'yearly':
                    let startOfYear = new Date(now.getFullYear(), 0, 1); // First day of the current year
                    let endOfYear = new Date(now.getFullYear(), 11, 31); // Last day of the current year
                    filter.createdAt = {
                        $gte: startOfYear,
                        $lte: new Date(endOfYear.setHours(23, 59, 59, 999))
                    };
                    break;

                default:
                    break;
            }
        }

        // Fetch orders based on the filter
        let orders = await Order.find(filter).populate('coupon').lean();

        // Calculate total sales, amount, and discounts
        let totalSales = orders.length;
        let totalAmount = orders.reduce((acc, order) => acc + order.total, 0);
        let totalCouponDiscount = orders.reduce((acc, order) => acc + (order.couponDiscount || 0), 0);

        let totalOfferDiscount = orders.reduce((acc, order) => {
            let offerDiscount = order.cartItems.reduce((itemAcc, item) => itemAcc + (item.offerAmount || 0), 0);
            return acc + offerDiscount;
        }, 0);

        let totalDiscount = totalCouponDiscount + totalOfferDiscount;


        // Render the report view with orders and summary
        res.render('salesreport', {
            orders,
            totalSales,
            totalAmount,
            totalDiscount,
        });
       } catch (error) {
         console.error("Error loading sales report:",error);
         res.status(500).send('Server Error');  
      }
}
const downloadPDF = async(req,res) => {
    try {
        const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');

    // Pipe the document to the response
    doc.pipe(res);

    // Add the header and report title
    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown();
    
    // Add the table headers
    doc.fontSize(12).text('Order ID', { continued: true, width: 150 });
    doc.text('Date', { continued: true, width: 100 });
    doc.text('Total Amount', { continued: true, width: 100 });
    doc.text('Offer Discount', { continued: true, width: 100 });
    doc.text('Coupon Discount', { continued: true, width: 100 });
    doc.text('Payment Method', { width: 100 });
    doc.moveDown();
    
    const orders = await Order.find().lean();
    // Add the order data
    if (orders.length === 0) {
        doc.text('No orders found.');
    } else {
        // Add the order data
        orders.forEach(order => {
            doc.text(order.orderId, { continued: true, width: 150 });
            doc.text(new Date(order.createdAt).toLocaleDateString(), { continued: true, width: 100 });
            doc.text(`₹${order.total.toFixed(2)}`, { continued: true, width: 100 });
            doc.text(`₹${(order.offerAmount || 0).toFixed(2)}`, { continued: true, width: 100 });
            doc.text(`₹${(order.couponDiscount || 0).toFixed(2)}`, { continued: true, width: 100 });
            doc.text(order.paymentMethod, { width: 100 });
            doc.moveDown(); // Add space between orders
        });
    }
    console.log('orders',orders);
    // Finalize the document
    doc.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send('Server Error');
    }  
};
const downloadEXEl = async(req,res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
    
        // Add the header row
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 20 },
            { header: 'Date', key: 'createdAt', width: 15 },
            { header: 'Total Amount', key: 'total', width: 15 },
            { header: 'Offer Discount', key: 'offerAmount', width: 15 },
            { header: 'Coupon Discount', key: 'couponDiscount', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        ];
    
        const orders = await Order.find().lean();

    
        // Add the data rows
        orders.forEach(order => {
            worksheet.addRow({
                orderId: order.orderId,
                createdAt: new Date(order.createdAt).toLocaleDateString(),
                total: `₹${order.total.toFixed(2)}`,
                offerAmount: `₹${(order.offerAmount || 0).toFixed(2)}`,
                couponDiscount: `₹${(order.couponDiscount || 0).toFixed(2)}`,
                paymentMethod: order.paymentMethod
            });
        });
         // Format the numeric columns as currency
         worksheet.getColumn('total').numFmt = '₹#,##0.00'; // Currency format for total amount
         worksheet.getColumn('offerAmount').numFmt = '₹#,##0.00'; // Currency format for offer discount
         worksheet.getColumn('couponDiscount').numFmt = '₹#,##0.00';
    
        // Set the response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
    
        // Write the workbook to the response
        await workbook.xlsx.write(res);
        res.end(); 
    } catch (error) {
        console.error("Error generating EXEL:", error);
        res.status(500).send('Server Error');
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
        // console.log(categoryData);
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
                productDescription:req.body.productDescription,
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
        const categories = await Category.find({});
        const brands = await Brand.find({});
        // console.log('Product--', product);
        // console.log('Categorie--', categories);
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
        const product = await Product.findById(id);

        const updateProduct = {
            productName,
            productCategory,
            productPrice,
            stocks,
            productBrand,
            status,
            images: product.images || []
            }

        if(req.files && req.files.length>0){
            const newImages =req.files.map(file =>file.filename);
            updateProduct.images.push(...newImages)
         }
       
        if (req.body.removedImages) {
            const removedImages = req.body.removedImages.split(','); // Assuming the images are passed as a comma-separated string
            updateProduct.images = updateProduct.images.filter(image => !removedImages.includes(image));
        }

        updateProduct.status = stocks > 0 ? 'In Stock' : 'Out of Stock';


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
        const page = parseInt(req.query.page)||1;
        const limit = 10;
        const skip = (page -1)*limit;
        totalUsers = await User.countDocuments();

        const users = await User.find({})
        .skip(skip)
        .limit(limit);

        const totalPages = Math.ceil(totalUsers / limit);

        res.render('userlist',{users,
            currentPage: page,
            totalPages,
            totalUsers,
            limit})
        
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
            // stock:req.body.stock,
            // sale:req.body.sale
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
        const {categoryName} = req.body
        console.log(req.body);
        const updateProduct = {
            categoryName,
            // stocks,
            // sale
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
            // stock:req.body.stock,
            // sale:req.body.sale
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
        const page = parseInt(req.query.page)||1;
        const limit = 10;
        const skip = (page-1)*limit;

       const totalOrders = await Order.countDocuments()
       const totalPages = Math.ceil(totalOrders/limit)

        const orders = await Order.find()
        .sort({ createdAt : -1})
        .skip(skip)
        .limit(limit)
        .populate('cartItems.productId') 

        res.render('orderList', { orders,
            currentPage:page,
            limit,
            totalOrders,
            totalPages
         });
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
    const loadCoupon = async(req,res) =>{
        try {
            const page = parseInt(req.query.page) || 1; // Get current page or default to 1
            const limit = 10; // Number of coupons per page
            const skip = (page - 1) * limit;

            const totalCoupons = await Coupon.countDocuments();

            const coupons = await Coupon.find()
            .skip(skip)
            .limit(limit);
            const totalPages = Math.ceil(totalCoupons / limit);

            res.render('couponlist',{
                coupons,
                currentPage: page,
                totalPages,
                totalCoupons})
        } catch (error) {
            console.error('Error loading coupon list:', error);
            res.status(500).send('Server Error'); 
        }
    }
const loadAddCoupon = async(req,res) =>{
    try {
        res.render('addcoupon');
    } catch (error) {
        console.error('Error loading addcoupon :', error);
            res.status(500).send('Server Error');
    }
}
const addCoupon =async (req,res) => {
    try {
        const {couponCode,discount,minimumPrice,validFrom,expiryDate} = req.body;
console.log('req.body',req.body);

    const newCoupon = new Coupon({
        couponCode,
        discount,
        minimumPrice,
        validFrom,
        expiryDate,
    })
    console.log('newCoupon',newCoupon);
    
    await newCoupon.save()
    res.redirect('/admin/coupons')
    } catch (error) {
        res.status(500).send('Server Error');
    } 
}
const loadEditCoupon = async(req,res) => {
    try {
        const couponId= req.params.id;
        const coupon = await Coupon.findById(couponId)
        if(!coupon){
            return res.status(404).send('Coupon not found')
        }
        res.render('editcoupon',{coupon})
    } catch (error) {
        console.error('Error loading the coupon for editing:', error);
        res.status(500).send('Server Error');
    }
}
const editCoupon = async(req,res) => {
    try {
        const couponId = req.params.id;
        const {couponCode,discount,minimumPrice,validFrom,expiryDate,isActive} = req.body

        const updateCoupon = await Coupon.findByIdAndUpdate(couponId,{
            couponCode,
            discount,
            minimumPrice,
            validFrom: new Date(validFrom),
            expiryDate: new Date(expiryDate),
            isActive: isActive === 'true',
        },
        { new: true }
    )
    if (!updateCoupon) {
        return res.status(404).send('Coupon not found');
    }
    res.redirect('/admin/coupons');

    } catch (error) {
        console.error('Error updating the coupon:', error);
        res.status(500).send('Server Error');   
    }
}
const blockcoupon = async(req,res)=>{
    try {
        const couponId = req.params.id;
       const coupon = await Coupon.findByIdAndUpdate(couponId,
            {isActive : false},
            {new : true}
        )
        if(!coupon){
            return res.status(404).send('coupon not found')
        }
        res.redirect('/admin/coupons')
    } catch (error) {
        
    }
}
const unblockCoupon = async(req,res) =>{
    try {
        const categoryId = req.params.id;
   const coupon= await Coupon.findByIdAndUpdate(categoryId,
    {isActive : true},
    {new:true}
   )
   if(!coupon){
    return res.status(404).send('Coupon not found')
   }
   res.redirect('/admin/coupons')
    } catch (error) {
        console.error('Error blocking the coupon:', error);
        res.status(500).send('Server Error');
    }     
}
const loadAddProductOffer = async(req,res) => {
    try {
        console.log('reached')
        const products = await Product.find() 
        res.render('addproductoffer',{products})
    } catch (error) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}
const loadAddCategoryOffer = async(req,res)=> {
    try {
        const categories = await Category.find()        
        res.render('addcategoryoffer',{categories})
    } catch (error) {
        console.error(err);
        res.status(500).send("Server Error")
    }
}
const loadOffers = async(req,res)=> {
    try {
        // console.log("Fetching product offers...");
        const productOffers = await ProductOffer.find().populate('productId').exec();
        // console.log("Product offers:", productOffers);
        const categoryOffers = await CategoryOffer.find().populate('categoryId').exec();
        // console.log("Category offers:", categoryOffers);

        res.render('offerlist',{
            productOffers,
            categoryOffers
        })
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).send('Server Error'); 
    }
}

const addProductOffer = async(req,res)=> {
    try {
        const {offerName,productId,offerPercentage} = req.body;

        const product = await Product.findById(productId)
        if(!product){
            return res.status(400).send('product not found')
        }
        const newoffer = new ProductOffer({
            offerName,
            productId,
            productName: product.productName,
            offerPercentage
        })
        await newoffer.save();
        res.redirect('/admin/offers');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error adding product offer');
    }
}
const blockProductOffer = async(req,res) => {
    try {
        const { offerId } = req.params;
        await ProductOffer.findByIdAndUpdate(offerId, { isActive: false });
        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error blocking product offer:', error);
        res.status(500).send('Server Error');
    }

}
const unblockProductOffer = async (req, res) => {
    try {
        const { offerId } = req.params; // Assuming the ID is passed in the URL
        await ProductOffer.findByIdAndUpdate(offerId, { isActive: true });
        res.redirect('/admin/offers'); // Redirect back to the offer list
    } catch (error) {
        console.error('Error unblocking product offer:', error);
        res.status(500).send('Server Error');
    }
};
const editProductOffer = async (req, res) => {
    try {
        const { offerId } = req.params; // Assuming the ID is passed in the URL
        const offer = await ProductOffer.findById(offerId);
        res.render('editproductoffer', { offer }); // Render the edit form with offer data
    } catch (error) {
        console.error('Error fetching product offer for edit:', error);
        res.status(500).send('Server Error');
    }
};
const updateProductOffer = async (req, res) => {
    try {
        const { offerId } = req.params;
        const { offerName, offerPercentage } = req.body; // Get data from the form
        await ProductOffer.findByIdAndUpdate(offerId, { offerName, offerPercentage });
        res.redirect('/admin/offers'); 
    } catch (error) {
        console.error('Error updating product offer:', error);
        res.status(500).send('Server Error');
    }
};

const addcategoryoffer = async(req,res) => {
    try {
        const {offerName,categoryId,offerPercentage} = req.body;
        const category = await Category.findById(categoryId)
        if(!category){
           return res.status(400).send('category not found')
        }
        console.log('category',category);
        
        const newoffer = new CategoryOffer({
            offerName,
            categoryId,
            categoryName:category.categoryName,
            offerPercentage
        })
        console.log('newoffer',newoffer);
        
        await newoffer.save();
        res.redirect('/admin/offers');
    } catch (error) {
        console.error('error in addcategory',error);
        res.status(500).send("Server Error")
    }
}
const blockCategoryOffer = async(req,res) =>{
    try {
        const {offerId} = req.params;
        await CategoryOffer.findByIdAndUpdate(offerId,{isActive:false})
        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error blocking product offer:', error);
        res.status(500).send('Server Error');
    }
}
const unblockCategoryOffer = async(req,res) => {
    try {
        const {offerId} = req.params;
        await CategoryOffer.findByIdAndUpdate(offerId,{isActive:true});
        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error unblocking product offer:', error);
        res.status(500).send('Server Error'); 
    }
}
const editCategoryOffer = async(req,res) => {
    try {
        const {offerId} = req.params;
    const offer = await CategoryOffer.findById(offerId)
    res.render('editcategoryoffer',{offer})
    } catch (error) {
        console.error('Error fetching category offer for edit:', error);
        res.status(500).send('Server Error');
    }
}
const updateCategoryOffer = async(req,res) =>{
    try {
        const { offerId } = req.params;
        const { offerName, offerPercentage } = req.body; 
        await CategoryOffer.findByIdAndUpdate(offerId, { offerName, offerPercentage });
        res.redirect('/admin/offers');  
    } catch (error) {
        console.error('Error updating category offer:', error);
        res.status(500).send('Server Error');
    }
}
module.exports = {
    loadlogin,
    verifyAdmin,
    loadDashboard,
    salesReport,
    downloadPDF,
    downloadEXEl,
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
    itemDetails,
    loadCoupon,
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    blockcoupon,
    unblockCoupon,
    loadAddProductOffer,
    loadOffers,
    loadAddCategoryOffer,
    addProductOffer,
    blockProductOffer,
    unblockProductOffer,
    editProductOffer,
    updateProductOffer,
    addcategoryoffer,
    blockCategoryOffer,
    unblockCategoryOffer,
    editCategoryOffer,
    updateCategoryOffer

    

    
   
}