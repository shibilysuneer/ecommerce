 const User = require("../models/userModel");



const islogin = async(req,res,next)=>{
    try{
        if(!req.session.userId){
         return   res.redirect('/login');
        }
        const user = await User.findById(req.session.userId);

        if (user.is_blocked) {
            // Optionally destroy session
            req.session.destroy(() => {
                res.redirect('/login?message=Admin%20blocked%20your%20account'); // Redirect to a blocked page or any other page
            });
            return;
        }
        next();
        }catch(error){
        console.log(error.message)
    }
}

const islogout = async (req,res,next)=>{
    try{
        if(req.session.userId){ 
          res.redirect('/home');
        }else{
            next();
        }
        

    }catch(error){
        console.log(error.message)
    }
}


module.exports = {
    islogin,
    islogout,
}