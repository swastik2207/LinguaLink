const express = require("express");
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors= require('cors');

const path = require('path');
dotenv.config();
const userAuthRoutes = require('./routes/userAuth');
const userRoutes = require('./routes/userRoute');
const chatRoutes=require('./routes/chatRoute');
const app=express();
const connectDB = require('../config/db');
const redisClient = require('../config/redis');
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}
))
app.use(cookieParser()); //extracts raw cookie data from the HTTP request header into a JavaScript object that’s easy to use in your code.
app.use(express.json()); // to convert JSON body to JS object



try {
    console.log("Mounting userAuthRoutes...");
    app.use('/user', userAuthRoutes);
    console.log("Mounting userRoutes...");
    app.use('/users', userRoutes);
    console.log("Mounting chatRoutes...");
    app.use('/chat', chatRoutes);
    
    // If you have other routes, log them similarly
} catch (err) {
    console.error("🚨 Route loading error:", err.message);
    console.error("Stack Trace:", err.stack);
}

const InitializeConnection = async()=>{
    try{
        await Promise.all([connectDB(),redisClient.connect()]);
        console.log('Redis connected successfully');
     
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
    })
    }   
    catch(err){
        console.error('connection error:', err);
    }
}
InitializeConnection();