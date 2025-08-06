const express = require('express');
const router = express.Router();

const { registerUser, loginUser , logoutUser,onboard } = require('../controllers/userfunction-controller.js');
const authMiddleware = require('../../middleware/authmiddleware.js');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout',authMiddleware, logoutUser);
router.post('/onboarding',authMiddleware,onboard);


router.get('/checkAuth', authMiddleware, (req, res) => {
        res.status(200).json({success:true,user:req.user});
});



module.exports = router; 