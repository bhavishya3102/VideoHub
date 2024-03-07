import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

// $group operator in aggregate pipeline-
//The $group stage also allows you to perform various operations 
//on the documents within each group.use accumulators
// various accumulators are- $sum ,$max ,$min ,$avg,$count etc

// Assuming a collection of "orders" with "product_category" and "total_price" fields

// const pipeline = [
//     {
//       $group: {
//         _id: "$product_category", // Group by product category -- i.e group key
//         total_sales: { $sum: "$total_price" }, // Calculate total sales per category
//       },
//     },
//   ];
  
  // Execute the aggregation and retrieve results
  // (results will show documents with _id as category and total_sales for each)

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;
    const {userId}=req.user;

    if(!content){
        return new ApiError(400,"content are missing")
    }

    const tweet=await Tweet.create({
        content:content,
        owner:userId,
        })

        if(!tweet){
            return  new ApiError(400,"failed to create the tweet")
        }

        return res.status(200).json(new ApiResponse(200,"successful created the tweet"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    //one user can have multiple tweets and each tweet have
    // no of likes to show this we use aggregate pipeline 
    // use lookup function .. and the user is same and 
    // tweets are different in getUser tweets 

    const  {userId}= req.params;
    if(!userId){
        throw new ApiError(400,"invalid user id");
    }

    const tweet=await Tweet.aggregate([
        {
            $match:{owner:new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"likes"
        }
    },{
        $addFields:{
            tweetlikes:{$sum:"$likes"}
        }
    },{
        $project:{
            _id:1,
            content:1,
            owner:1,
            createdAt:1,
            updatedAt:1,
            tweetlikes:1
        }
    }
    ])

const tweetuser=await User.findById(userId,{
    username:true,
    email:true,
    fullName:true,
    avatar:true
});

const tweetdetails={
    tweet,
    tweetuser
}
return res.status(200).json(new ApiResponse(200,tweetdetails,"get tweet details of user"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetid}=req.params;
    const {content}=req.body;

    if(!tweetid){
        return ApiError(400, "No Tweet ID Provided");
    }
    const updatetweet=await Tweet.findByIdAndUpdate({_id:tweetid,owner:req.user._id},{
        content:content
    },{new:true});

    const updatedtweet=await Tweet.findById(tweetid);

    return ApiResponse(200,updatedtweet,"Updated Tweet")

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetid}=req.params;
    // delete likes of tweet
    await Like.deleteMany({tweet:tweetid});
    // delete tweet itself
    await Tweet.findByIdAndDelete({_id:tweetid,owner:req.user._id});

return res.status(200).json(new ApiResponse(200,null,"delete tweet successfull"))


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
