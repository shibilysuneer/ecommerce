const express = require('express')
const admin_route = express()

const session = require('express-session')
const config = require('../config/config')
const path=require('path')


admin_route.use(express.static(path.join(__dirname,'../public/admin')))


admin_route.use(session({secret:config.sessionsecret,
    saveUninitialized: true,
    resave: false
}))


const auth = require('../middleware/adminauth')

const admincontroller = require('../controller/adminController')
const upload = require('../middleware/multer')

const bodyParser = require('body-parser')
admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')


admin_route.get('/login',auth.islogout,admincontroller.loadlogin)
admin_route.post('/login',admincontroller.verifyAdmin)
admin_route.get('/dashboard',auth.islogin,admincontroller.loadDashboard)
// admin_route.get('/products',admincontroller.loadProducts)
admin_route.get('/addProduct',auth.islogin,admincontroller.loadaddProduct)
admin_route.post('/addProduct',upload.array('images',3),admincontroller.addProduct)

admin_route.get('/products',auth.islogin,admincontroller.loadProductList)
admin_route.get('/editProduct/:id',auth.islogin,admincontroller.loadeditProduct)
admin_route.post('/editProduct/:id',upload.array('images',3),admincontroller.editProduct)

admin_route.post('/pblock/:id', auth.islogin,admincontroller.blockProduct)

admin_route.get('/deleteproduct/:id', auth.islogin,admincontroller.deleteproduct)
admin_route.get('/userlist',auth.islogin,admincontroller.loadUserlist)

admin_route.post('/block/:id', auth.islogin,admincontroller.blockuser)

admin_route.get('/categorylist',auth.islogin,admincontroller.loadCategorylist) 
admin_route.get('/addcategory',auth.islogin,admincontroller.loadaddCategory)
admin_route.post('/addcategory',upload.array('images',3),admincontroller.addCategory)
admin_route.get('/editcategory/:id',auth.islogin,admincontroller.loadeditCategory)
admin_route.post('/editcategory/:id',upload.array('images',3),admincontroller.editCategory)

admin_route.post('/cblock/:id', auth.islogin,admincontroller.blockCategory)

admin_route.get('/brandlist', auth.islogin,admincontroller.loadbrandlist)
admin_route.get('/addbrand', auth.islogin,admincontroller.loadaddBrand)
admin_route.post('/addbrand', auth.islogin,admincontroller.addbrand)
admin_route.get('/editbrand/:id', auth.islogin,admincontroller.loadeditBrand)
admin_route.post('/editbrand/:id', auth.islogin,admincontroller.editBrand)
admin_route.get('/logout',auth.islogin,admincontroller.logout)

admin_route.get('/orderList', auth.islogin,admincontroller.order)
admin_route.post('/orders/:orderId/items/:itemId/status', auth.islogin,admincontroller.changeStatus)
admin_route.post('/orders/:orderId/items/:itemId/cancel', auth.islogin,admincontroller.cancelOrderItem)
admin_route.get('/orders/:orderId/items/:itemId',admincontroller.itemDetails)

module.exports = admin_route;





