const User = require("../models/userModel");
const Product = require('../models/prodectModel')
const Category = require('../models/categoryModal')
const Brand =require('../models/brandModal')


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
        res.render('shop', { Products,categories,brands ,currentPage: page,totalPages,limit});
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
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
        
        res.render('shop', { Products: products ,categories:categories,brands:brands,
            currentPage: page,
            totalPages: totalPages,
            limit: limit});
    }
    catch(err){
        console.log(err);       
    }
}
const showProductDetails =async(req,res) => {
    try{
       const productId = req.params.id;
       console.log(`Product ID:-- ${productId}`);
       const product = await Product.findById(productId).populate('productCategory', 'categoryName');
    // console.log('product---',product);
     
       if (!product) {
        return res.status(404).send('Product not found');
    }

      res.render('productdetails',{product}) 
     }catch(error){
      console.log(error.message);
    }
  }
module.exports = {
    showProducts,
    sortedLists,
    showProductDetails
    
}