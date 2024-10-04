 const User = require("../models/userModel");

const islogin = async(req,res,next)=>{
    try{
        if(!req.session.userId){
         return   res.redirect('/login');
        }
        const user = await User.findById(req.session.userId);

        if (user.is_blocked) {

            req.session.destroy(() => {
                res.redirect('/login?message=Admin%20blocked%20your%20account'); 
            });
            return;
        }
        next();
        }catch(error){
        console.log(error.message)
        res.status(500).send("An internal error occurred");
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
        res.status(500).send("An internal error occurred");
    }
}


module.exports = {
    islogin,
    islogout,
}