const User = require("../models/User");
// const validate = require("../utils/validator");
const {upsertStreamUser}=require('../../config/Stream')
const bcrypt= require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require('../../config/redis'); 

const registerUser = async (req, res) =>{
    try{
          const { fullname , email,password } = req.body;
          if (!email || !password||!fullname) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if(password.length<6){
            return res.status(400).json({ error: "Password should be more than 5 characters" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!emailRegex.test(email))
            return res.status(400).json({ error: "Invalid email" });

        const user_exist = await User.findOne({ email:email });

           if (user_exist) {
            return res.status(409).json({
              message: "User already exists"
            });
          }

          const index=Math.floor(Math.random()*100)+1;
          const randomAvatar = `https://avatar.iran.liara.run/public/${index}.png`;
          
        
          req.body.password= await bcrypt.hash(password, 10);
          req.body.role = "user"; // Default role for new users

          const user = await User.create({
              fullname,
              email,
              password : req.body.password,
              profilePic:randomAvatar||" ",
          });

          
          await upsertStreamUser({
            id:user._id.toString(),
            name:user.fullname,
            image:user.profilePic
          })
          
          const token= jwt.sign({UserId:user._id}, process.env.JWT_SECRET, { expiresIn: '1h' });
          res.cookie("token", token, {maxAge: 3600000,httpOnly:true,secure:false});
          res.status(201).json({
            user:user,
            message: "User registered successfully",
          }
          );
    }
    catch (error) {
        console.error("Error in registerUser:", error);
        return res.status(400).json({ error: error.message });
    }
}



const loginUser = async (req, res) => {
    try {
        console.log("Login request received:", req.body);
        console.log("Request body:", req.body);
        const { email, password } = req.body;     

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        console.log(email);

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password,user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid password" });
        }
        const token = jwt.sign({ UserId: user._id}, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie("token", token, { maxAge: 3600000 ,httpOnly: true,secure: false, sameSite: "lax"});
        res.status(201).json({
            user:user,
            message: "Login successful",
        });
    }
    catch (error) {
        console.error("Error in loginUser:", error);
        return res.status(400).json({ error: error.message });
    }
}


const logoutUser = async (req, res) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(400).json({ error: "No token found" });
    }

    const payload = jwt.decode(token);
    if (!payload || !payload.exp) {
      return res.status(400).json({ error: "Invalid token" });
    }

    // Ensure Redis client is connected
    if (!redisClient.isOpen) 
    await redisClient.connect();

    // Block the token by storing it in Redis
    await redisClient.set(`token:${token}`, 'Blocked');
    await redisClient.expireAt(`token:${token}`, payload.exp);

    // Clear the cookie
    res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true });
    
    return res.status(200).send("Logout successful");

  } catch (error) {
    console.error("Error in logoutUser:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


const onboard =async(req,res)=>{
    try{
        const userId=req.user._id;
        const {fullname,bio,nativeLanguage,learningLanguage,location}=req.body;
        if (!fullname || !bio || !nativeLanguage || !learningLanguage || !location) {
            return res.status(400).json({
              message: "All fields are required",
              missingFields: [
                !fullname && "fullName",
                !bio && "bio",
                !nativeLanguage && "nativeLanguage",
                !learningLanguage && "learningLanguage",
                !location && "location",
              ].filter(Boolean),
            });
          }
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
              ...req.body,
              isOnboarded: true,
            },
            { new: true }
          );


          if (!updatedUser) 
          return res.status(404).json({ message: "User not found" });

          //UPDATE USERS INFO IN STREAM
          try {
            await upsert({
              id: updatedUser._id.toString(),
              name: updatedUser.fullname,
              image: updatedUser.profilePic || "",
            });
            console.log(`Stream user updated after onboarding for ${updatedUser.fullname}`);
          } catch (streamError) {
            console.log("Error updating Stream user during onboarding:", streamError.message);
          }
      
          res.status(200).json({ success: true, user: updatedUser });
        } catch (error) {
          console.error("Onboarding error:", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
}


module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    onboard
};
