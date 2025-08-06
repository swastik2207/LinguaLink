const express=require('express');
const authMiddleware=require('../../middleware/authmiddleware');
const {getStreamToken}=require('../controllers/chat-controller')

const router=express.Router();

router.get('/token',authMiddleware,getStreamToken);



module.exports=router;