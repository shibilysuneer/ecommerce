require('dotenv').config()

const mongoose=require('mongoose')

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

const express=require("express")  
const app = express()
const path=require('path')
const PORT = process.env.PORT || 3000;

// const methodOverride = require('method-override');
// app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname,'public')))
app.set('views',path.join(__dirname,'views'))

// user routes
const userroute = require("./routes/userRoute")
app.use("/",userroute)

// admin routes
const adminRoute = require("./routes/adminRoute")
app.use("/admin",adminRoute)



app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
    // console.log(`http://localhost:3000`);
})
   