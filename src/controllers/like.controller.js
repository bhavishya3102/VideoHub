import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
if(!isValidObjectId(videoId)){
    return new ApiError(400,"Invalid video id");
}

const userid=req.user._id;

// find the like by  this user and video and delete
const deletelike=await Like.findOneAndDelete({
    video:videoId,
    likedBy:userid
})

if(deletelike){
    return new ApiResponse(200,"Unliked Video",true);
}
if(!deletelike){
    const likedvideo=await Like.create({
        video:videoId,
        likedBy:userid
    })

    const like=await Like.findById(likedvideo._id);

    if(!like){
        return  new ApiError(500,"Something went");
    }

    return  new ApiResponse(201,like,"Liked Video");
}


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        return new ApiError(400,"Invalid comment id");
    }
    
    const userid=req.user._id;
    
    // find the like by  this user and video and delete
    const deletelike=await Like.findOneAndDelete({
        comment:commentId,
        likedBy:userid
    })
    
    if(deletelike){
        return new ApiResponse(200,"Unliked Comment",true);
    }
    if(!deletelike){
        const likedcomment=await Like.create({
            comment:commentId,
            likedBy:userid
        })
    
        const like=await Like.findById(likedcomment._id);
    
        if(!like){
            return  new ApiError(500,"Something went");
        }
    
        return  new ApiResponse(200,like,"Liked Comment");
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        return new ApiError(400,"Invalid tweet id");
    }
    
    const userid=req.user._id;
    
    // find the like by  this user and video and delete
    const deletelike=await Like.findOneAndDelete({
        tweet:tweetId,
        likedBy:userid
    })
    
    if(deletelike){
        return new ApiResponse(200,"Unliked Tweet",true);
    }
    if(!deletelike){
        const likedtweet=await Like.create({
            tweet:tweetId,
            likedBy:userid
        })
    
        const like=await Like.findById(likedtweet._id);
    
        if(!like){
            return  new ApiError(500,"Something went");
        }
    
        return  new ApiResponse(201,like,"Liked Tweet");
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userid=req.user._id;

    const allLikedVideos=await Like.findOne({likedBy:userid}).populate({
        path:"video",
        select:"videoFile thumbnail title description duration views",
        populate:{
            path:"owner",
            select:"username email fullName avatar"
        }
    }).exec();

    if(!allLikedVideos.length){
        return new ApiError(400,"you haven't liked any videos")
    }

    return new ApiResponse(200,allLikedVideos,"get all liked videos")

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}