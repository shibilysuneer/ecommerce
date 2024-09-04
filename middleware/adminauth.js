const islogin = async(req,res,next)=>{
    try{

        if(!req.session.userId){
         return  res.redirect('/admin/login')
        }
        next()
    }catch(error){
        console.log(error.message)
    }
}

const islogout = async(req,res,next)=>{
     try{
        if(req.session.userId){
            res.redirect('/admin/dashboard')
        }else{
            next()
        }
        

     }catch(error){
        console.log(error.message)
     }
}

module.exports = {
    islogin,
    islogout
} 