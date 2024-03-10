import mongoose, { mongo } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    // get the totalvideos,totalsubscribers,totalcomments on all videos,
    // total likes on all videos,total likes of all comments of all videos
   
    const userId =req.user._id;

    const videochannelstats=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
            }
        },// lookup the comments of the videos
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"totalComments"
            }

        },// total likes of the videos
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"totallikes"
            }

        },// calculate totalvideos,totalcomments,totallikes

        {
            $group:{
                _id:null,
                totalvideos:{$sum:1},
                totalcomments:{$sum:{$size:"$totalComments"}},
                totallikes:{$sum:{$size:"$totallikes"}}
            }

        }
    ])

    const subscriberstats=await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(userId)
            }
        },{
            $group:{
                _id:null,
                totalsubscribers:{$sum:1}
            }
        }
    ])
    

    const likesOnVideoCommentsStats=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"totalcomments"

            }
        },// every comments have some likes so we get the commment id from the comment
        // and so we use unwind operator to seperate each document on the 
        // basis of totalcomments array 

        {
            $unwind:"$totalcomments"
        },
        {
            $lookup:{
                from:"likes",
                localField:"totalcomments._id",
                foreignField:"comment",
                as:"totallikesofcomments"
            }
        },{
            $group:{
                _id:null,
                totallikesofcomments:{$sum:{$size:"$totallikesofcomments"}}

            }
        }
    ])

    const stats={
        ...videochannelstats[0],
        ...subscriberstats[0],
        ...likesOnVideoCommentsStats[0]
    }

    return res.status(200).json(new ApiResponse(200,stats,"Successfully fetched statistics"))


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userid=req.user._id;
    const allvideos=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userid)
            }
        },{
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"totalcomments"
            }
        },{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"totallikes"
            }
        },{// get the all likes and all comments of each video

            $addFields:{
                totallikes:{
                    $size:"$totallikes"
                },
                totalcomments:{
                    $size:"$totalcomments"
                }
            }
        }
    ])


    if(!allvideos){
        return new ApiError(400,"cannot get all the videos")
    }

    return  res.status(200).json(new ApiResponse(200,allvideos,"get all the videos of channel"))


})

export {
    getChannelStats, 
    getChannelVideos
    }