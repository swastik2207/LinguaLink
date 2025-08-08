
const User = require("../models/User");
const FriendRequest =require('../models/FriendRequest')
const {sendNotification} = require('../services/notificationService');

const getRecommendedUsers=async(req, res)=> {
    try {
        const currentUserId = req.user.id;
        const currentUser = req.user;

        const recommendedUsers = await User.find({
            $and: [
              { _id: { $ne: currentUserId } }, //exclude current user
              { _id: { $nin: currentUser.friends } }, // exclude current user's friends
              { isOnboarded: true },
            ],
          });
          res.status(200).json(recommendedUsers);
    }
    catch(error){
        console.error("Error in getRecommendedUsers controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }


};

 const getMyFriends = async (req, res)=> {
    try {
        const user = await User.findById(req.user.id)
          .select("friends")
          .populate("friends", "fullname profilePic nativeLanguage learningLanguage");
    
        res.status(200).json(user.friends);
      } catch (error) {
        console.error("Error in getMyFriends controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
      }
};

const sendFriendRequest = async (req, res)=> {
   try{
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (recipient.friends.includes(myId)) {
        return res.status(400).json({ message: "You are already friends with this user" });
    }

     // check if a req already exists
     const existingRequest = await FriendRequest.findOne({
        $or: [
          { sender: myId, recipient: recipientId },
          { sender: recipientId, recipient: myId },
        ],
      });
  
      if (existingRequest) {
        return res
          .status(400)
          .json({ message: "A friend request already exists between you and this user" });
      }
      const friendRequest = await FriendRequest.create({
        sender: myId,
        recipient: recipientId,
      });


      const receipentUserMailId = recipient.email;
      await sendNotification(receipentUserMailId, "New Friend Request", `You have received a new friend request from ${req.user.fullname}. Please check your friend requests.`)
    

  
      res.status(201).json(friendRequest);
   }
   catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const AcceptFriendRequest = async (req, res)=> {

    try {
        const { id: requestId } = req.params;
    
        const friendRequest = await FriendRequest.findById(requestId);
    
        if (!friendRequest) {
          return res.status(404).json({ message: "Friend request not found" });
        }
        console.log("Friend Request Recipient:", friendRequest.recipient.toString());
        console.log("Current User ID (req.user.id):", req.user.id);
        console.log("Type of req.user.id:", typeof req.user.id);
        
        // Verify the current user is the recipient
        if (friendRequest.recipient.toString() !== req.user.id) {
          return res.status(403).json({ message: "You are not authorized to accept this request" });
        }
    
        friendRequest.status = "accepted";
        await friendRequest.save();
    
        // add each user to the other's friends array
        // $addToSet: adds elements to an array only if they do not already exist.
        await User.findByIdAndUpdate(friendRequest.sender, {
          $addToSet: { friends: friendRequest.recipient },
        });
    
        await User.findByIdAndUpdate(friendRequest.recipient, {
          $addToSet: { friends: friendRequest.sender },
        });
    
        res.status(200).json({ message: "Friend request accepted" });
      } catch (error) {
        console.log("Error in acceptFriendRequest controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
      }
}

const getFriendRequest = async (req, res)=> {
    try {
        const incomingReqs = await FriendRequest.find({
          recipient: req.user.id,
          status: "pending",
        }).populate("sender", "fullname profilePic nativeLanguage learningLanguage");

       // “Replace the sender field (which is just a user ID) 
       // with the actual user document, but only include fullName,
       //  profilePic, nativeLanguage, and learningLanguage fields.”

        const acceptedReqs = await FriendRequest.find({
          sender: req.user.id,
          status: "accepted",
        }).populate("recipient", "fullName profilePic");
    
        res.status(200).json({ incomingReqs, acceptedReqs });
      } catch (error) {
        console.log("Error in getPendingFriendRequests controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
      }
}
//reject
const getOutgoingFriendReqs = async (req, res)=> {
    try {
        const outgoingRequests = await FriendRequest.find({
          sender: req.user.id,
          status: "pending",
        }).populate("recipient", "fullname profilePic nativeLanguage learningLanguage");
    
        res.status(200).json(outgoingRequests);
      } catch (error) {
        console.log("Error in getOutgoingFriendReqs controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
      }
}

// const UpdateProfile=async(req,res)=>{
//   try {
//     const userId = req.user.id; // from verifyToken middleware

//     const updates = {
//         fullname: req.body.fullname,
//         bio: req.body.bio,
//         profilePic: req.body.profilePic,
//         nativeLanguage: req.body.nativeLanguage,
//         learningLanguage: req.body.learningLanguage,
//         location: req.body.location,
//     };

//     // Remove undefined or empty values (optional)
//     Object.keys(updates).forEach(
//         key => updates[key] === undefined && delete updates[key]
//     );

//     const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         { $set: updates },
//         { new: true, runValidators: true }
//     );

//     res.status(200).json(updatedUser);
// } catch (error) {
//     console.error("Error updating profile:", error);
//     res.status(500).json({ message: "Failed to update profile" });
// }
// }
module.exports={
    getRecommendedUsers,
    getMyFriends,
    sendFriendRequest,
    AcceptFriendRequest,
    getFriendRequest,
    getOutgoingFriendReqs,
}