const User = require('../models/userModel')
const islogin = async(req,res,next)=>{
    try{

        if(!req.session.admin){
         return  res.redirect('/admin/login')
        }
        const user =await User.findById(req.session.admin)        
        if(user&&user.is_admin==1){
            next()
        }else{
            return res.redirect('/admin/login')
        }
    }catch(error){
        console.log(error.message)
        res.status(500).send("An internal server error occurred.");
    }
}

const islogout = async(req,res,next)=>{
     try{
        if(req.session.admin){
            res.redirect('/admin/dashboard')
        }else{
            next()
        }
     }catch(error){
        console.log(error.message)
        res.status(500).send("An internal server error occurred.");
     }
}

module.exports = {
    islogin,
    islogout
} 