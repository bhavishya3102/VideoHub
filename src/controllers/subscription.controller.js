import mongoose, { isValidObjectId, mongo } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription-- unsubscribe the channel

const userid=req.user._id;

if(!isValidObjectId(channelId)){
    return new ApiError(400,"Invalid channnel id");
}
// delete the subscription if exist 
const subscriptionremove=await Subscription.findOneAndDelete({
    subscriber:userid,
    channel:channelId
})

if(subscriptionremove){
    return new ApiResponse(200,"Unsubscribed successfully",{channelId});
}

if(!subscriptionremove){
    // create the subscripiton
    const subscription=await Subscription.create({
        subscriber:userid,
        channel:channelId
    },{new:true})

    

    if(!subscription){
        return ApiError(400,"Failed to save subscription ");
    }
return  new ApiResponse(201,subscription,"Subscribed Successfully");

}

});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
// get all the subscribers of the channel
  const userchannelsubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "userinfo",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        usercount: {
          $size: "$userinfo",
        },
        userdetails: "$userinfo",
      },
    },
    {
      $project: {
        channel: 1,
        userdetails: 1,
        usercount: 1,
        createdAt: 1,
      },
    },
  ]);


  if(!userchannelsubscribers.length){
    return new ApiError(400,"No Channel Found!");
  }

  return new ApiResponse(200,userchannelsubscribers,"Channel Subscribers List");
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  // get all the subscribbed channel of a particular channel

  const subscribedChannels=await Subscription.aggregate([
    {
        $match:{
            subscriber:new mongoose.Types.ObjectId(subscriberId)
        }
    },{
        $lookup:{
            from:"users",
            localField:"channel",
            foreignField:"_id",
            as:"channelinfo",
            pipeline:[
                {
                    $project:
                    {
                        username: 1,
                        email: 1,
                        fullName: 1,
                        avatar: 1,
                    }
                }
            ]
        }
    },{
        $addFields:{
            channelcount:{
                $size: "$channelinfo"
            },
            channeldetails:"$channelinfo"
        }
    },{
        $project:{
            subscriber:1,
            channelcount:1,
            channeldetails:1,
            createdAt:1
        }
    }
  ])

  if(!subscribedChannels.length){
    return new ApiError(400,"No  such user is subscribed to any channels.")
  }

  return new ApiResponse(200,subscribedChannels,"get all subscribed channels")
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
