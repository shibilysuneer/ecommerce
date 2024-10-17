const User = require("../models/userModel");
const Product = require('../models/prodectModel')
const Category = require('../models/categoryModal')
const Brand =require('../models/brandModal')
const { ProductOffer, CategoryOffer } = require('../models/offerModal')


const showProducts = async(req,res) => {
    try {
        // const Products = await Product.find({})
        // res.render('shop',{Products})
        const search = req.query.search;
        const sort = req.query.sort;
        const page = parseInt(req.query.page)||1;
        const limit = parseInt(req.query.limit)||9;

        let sortOption = {};
        let filterOPtion = {}; 

        if(search){
            filterOPtion = {
                $or:[
                    {productName: {$regex: new RegExp(search, 'i')}},
                    {productDescription: { $regex:  new RegExp(search, 'i') } }
                ]
            }
        }
        switch (sort){
            case 'popularity':
                sortOption = { popularity: -1 };
                break;
            case 'price-asc':
                sortOption = { productPrice: 1 };
                break;
            case 'price-desc':
                sortOption = { productPrice: -1 };
                break;
            case 'averageRating':
                sortOption = { averageRating: -1 };
                break;
            case 'featured':
                sortOption = { isFeatured: -1 };
                break;
            case 'newArrivals':
                sortOption = { createdAt: -1 };
                break;
            case 'az':
                sortOption = { productName: 1 };
                break;
            case 'za':
                sortOption = { productName: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        const totalProducts = await Product.countDocuments(filterOPtion);
        const totalPages = Math.ceil(totalProducts/limit)

        const Products = await Product.find(filterOPtion)
        .sort(sortOption)
        .skip((page-1)*limit)
        .limit(limit);

        const categories = await Category.find();
        const brands = await Brand.find()
        // console.log('Fetched Categories:', categories);
//   ---- -------------------------------------------------------
        const updatedProducts = await Promise.all(Products.map(async (product) => {
            const productOffer = await ProductOffer.findOne({ productId: product._id, isActive: true });
            const categoryOffer = await CategoryOffer.findOne({ categoryId: product.productCategory, isActive: true });
            
            let finalPrice = product.productPrice;
            let bestOffer = null;

            if (productOffer && categoryOffer) {
                if (productOffer.offerPercentage >= categoryOffer.offerPercentage) {
                    finalPrice = product.productPrice - (product.productPrice * productOffer.offerPercentage / 100);
                    bestOffer = productOffer; 
                } else {
                    finalPrice = product.productPrice - (product.productPrice * categoryOffer.offerPercentage / 100);
                    bestOffer = categoryOffer; 
                }
            } else if (productOffer) {
                finalPrice = product.productPrice - (product.productPrice * productOffer.offerPercentage / 100);
                bestOffer = productOffer;
            } else if (categoryOffer) {
                finalPrice = product.productPrice - (product.productPrice * categoryOffer.offerPercentage / 100);
                bestOffer = categoryOffer;
            }
            
            product.finalPrice = finalPrice;
            product.bestOffer = bestOffer;
            return product;
        }));
        const user = req.session.userId ? await User.findById(req.session.userId) : null;

// ---------------------------------------------------------------
        res.render('shop', { user,Products:updatedProducts,categories,brands ,currentPage: page,totalPages,limit,selectedCategory: req.query.category || '',  
            selectedBrand: req.query.brandId || ''   });
    } catch (error) {
        console.log(error.message);
        // res.status(500).send('Internal Server Error');
        res.redirect("/pageNotfound")
    }
}
const sortedLists = async(req,res)=>{
    // console.log("gfg",req.query);
    const categoryId = req.query.category
    const brandId = req.query.brandId;
    // console.log("brand ID:", brandId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    try{
        const categories = await Category.find();
        //  console.log('categories:',categories);
         const brands = await Brand.find()
        //  console.log('brands:',brands);

         const query = {};
         if (categoryId) {
             query.productCategory = categoryId;
         }
         if (brandId) {
             query.productBrand = brandId;
         }

          const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
        
        const products = await Product.find(query)
        .skip((page - 1) * limit)
        .limit(limit);
       // console.log("Products found:", products);
       const user = req.session.userId ? await User.findById(req.session.userId) : null;

        
        res.render('shop', { Products: products ,categories:categories,brands:brands,
            user,
            currentPage: page,
            totalPages: totalPages,
            limit: limit,
            selectedCategory: categoryId,
            selectedBrand: brandId});
    }
    catch(err){
        console.log(err);       
    }
}
const showProductDetails =async(req,res) => {
    try{
       const productId = req.params.id;
    //    console.log(`Product ID:-- ${productId}`);
       const product = await Product.findById(productId).populate('productCategory', 'categoryName');
    // console.log('product---',product);
    const user = req.session.userId ? await User.findById(req.session.userId) : null;

     
       if (!product) {
        return res.status(404).send('Product not found');
    }

      res.render('productdetails',{product,user}) 
     }catch(error){
      console.log(error.message);
      res.redirect("/pageNotfound")
    }
  }
module.exports = {
    showProducts,
    sortedLists,
    showProductDetails
    
}