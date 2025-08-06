const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const {Schema} = mongoose;

const userSchema = new Schema({
    fullname:{
        type: String,
        required: true,
        trim: true,
        minLength:3,
        maxlength: 50
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /.+\@.+\..+/,
        immutable: true
    },
    password:{
        type: String,
        required: true,
        minLength:6,
        trim: true,
    },
    bio: {
        type: String,
        default: "",
    },
    profilePic: {
        type: String,
        default: "",
    },
    nativeLanguage:{
        type: String,
        default: "",
    },
    learningLanguage:{
        type: String,
        default: "",
    },
    location:{
        type: String,
        default: "",
    },
    isOnboarded:{
        type:Boolean,
        default:false,
    },
    friends:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
        }

    ]

},{timestamps:true});


const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;