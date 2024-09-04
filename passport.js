const passport = require('passport')
const User = require('./models/userModel');
const GoogleStrategy = require('passport-google-oauth2').Strategy
const env = require('dotenv').config()  


passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL:'http://localhost:3000/auth/google/callback',
    // passReqToCallback:true
},
// function(request,accesstoken,refreshToken,profile,done){
//     return done(null,profile) 
// }

async (accesstoken,refreshToken,profile,done)=>{
    try {
        let user = await User.findOne({googleId:profile.id})
        if(user){
            return done(null,user)
        }else{

            const fullName = profile.displayName || '';
            const nameParts = fullName.split(' ');
            const fname = nameParts[0] || '';
            const lname = nameParts.slice(1).join(' ') || '';


            user = new User({
                fname: fname,
                lname: lname,
                email:profile.emails[0].value,
                googleId:profile.id,
            })
            await user.save();
            return done(null,user)
        }
    } catch (error) {
        return done(error,null)
    }
}

));
passport.serializeUser((user,done) => {
    done(null,user.id)
})
passport.deserializeUser((id,done) => {
   User.findById(id)
    .then(user=>{
        if (!user) {
            return done(new Error('User not found'), null);
        }
        done(null,user)
    })
   .catch(err => {
    done(err,null)
   })
})
module.exports = passport;