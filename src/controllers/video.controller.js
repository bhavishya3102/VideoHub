import mongoose, {Mongoose, isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { Like } from "../models/like.model.js"
import { v2 as cloudinary } from "cloudinary";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  
    // pagination--
    const sortTypeNum = Number(sortType)
    const pageNum = Number(page)
    const limitNum = Number(limit)

    // 1. Build filter object based on query parameters (if applicable)
    let filter = {};
    if (userId) {
      filter.owner = userId;
    }
  
    // 2. Handle sorting criteria (optional)
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortTypeNum === 'desc' ? -1 : 1;
    } else {
      sort = { createdAt: -1 }; // Default sort by creation date (descending)
    }
  
    // 3. Apply pagination
    const skip = (pageNum - 1) * limitNum;
  
    try {
      // 4. Fetch videos with filtering, sorting, and pagination
      const videos = await Video.find(filter, null, { sort, skip, limit })
        .populate({
          path: 'owner',
          select: '-password -refreshToken' // Exclude sensitive fields
        });
  
      // 5. Handle successful response
      res.status(200).json(new ApiResponse(200, videos, true, 'Successfully fetched videos'));
    } catch (error) {
      console.error(error);
      res.status(500).json(new ApiResponse(500, null, false, 'Error fetching videos'));
    }
  });
  

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
 const userid=req.user._id;

 const userdetails=await User.findById(userid);
 if(!userdetails){
    return new ApiError(400,"user is not found",false);
 }

 if(!title || !description){
    return new ApiError(400,"required fields are missing")
 }
    // TODO: get video, upload to cloudinary, create video
    const videofilepath=req.files.videoFile[0].path;
    if(!videofilepath){
        return new ApiError(400,"No file uploaded",false);
    }
    const videourl=await uploadOnCloudinary(videofilepath);

    const thumbnailpath=req.files.thumbnail[0].path;
    if(!thumbnailpath){
        return new ApiError(400,"Thumnail is missing",false);
    }

    const thumbnailurl=await uploadOnCloudinary(thumbnailpath);

const uploadvideo=await Video.create({
    videoFile:videourl.secure_url,
    thumbnail:thumbnailurl.secure_url,
    title:title,
    description:description,
    duration:videourl.duration,
    owner:userid
})

const videodetails=await Video.findById(uploadvideo._id);

return res.status(200).json(
    new ApiResponse(200,videodetails,"video added successfully")
)


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

const userid=req.user._id;

    // we have to count the no of
    // likes (different Model)and comments(different Model) of the particular video
    // so we use lookup and add fields using aggregate pipeline

    const videodetails=await Video.aggregate([
      {
        $match:{ _id :new mongoose.Types.ObjectId(videoId)}
      },
      {
        $lookup:{
          from:"users",
          localField:"owner",
          foreignField:"_id",
          as:"users",
          pipeline:[
            {
              $project:{
                username:1,
                email:1,
                fullName:1
              }
            }
          ]
        }
      },
      {
        $lookup:{
          from:"comments",
          localField:"_id",
          foreignField:"video",
          as:"comments"
        }
      },{
        $lookup:{
          from:"likes",
          localField:"_id",
          foreignField:"video",
          as:"likes"
        }
      },{
        $addFields:{
          commentcount:{ $sum:"$comments"},
          likecount:{ $sum: "$likes"},
          owner:{$first:"$users"}
        }
      },
      {
         $project:{
          videoFile:1,
          thumbnail:1,
          title:1,
          description:1,
          duration:1,
          views:1,
          owner:1,
          commentcount:1,
          likecount:1

         }
      }
    ])

    
if(!videodetails){
  return new ApiError(400,"can't fetch the video");
}

// update watch history in user model
// console.log(videodetails[0].owner._id.toHexString())
// console.log(userid)

await User.findByIdAndUpdate(videodetails[0].owner._id.toHexString(),{
  $pull:{
    watchHistory:videoId
  }
},{new:true})

return res.status(200).json(new ApiResponse(200,videodetails,"video detail fetched successfull"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const updates=req.body;
    
console.log(updates) //{ title: 'Update Reactjs' }
    const  video = await Video.findById(videoId);

    for(const key in updates ){
      video[key]=updates[key]; // value of each property
    }

    // to update single file in multer

    if(req.file){
      const thumbnailpath=req.file.path;
      const thumbnailImage=await uploadOnCloudinary(thumbnailpath);
      video.thumbnail=thumbnailImage.secure_url;
    }

  console.log(req.file.path)

    // save the updates changes 
 await video.save();

    const updatevideodetails=await Video.findById(videoId);

    return  res.status(200).json(new ApiResponse(200,updatevideodetails, "video updated successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
// steps-
// first of all delete the likes of all the comments in the video
// delete the likes of the video
// delete  the comments of the video
//  then you can delete the video itself
// then delete the video  and thumbnail in the cloudinary


const videodetail=await Video.findById(videoId)
// get all the comments  of this video
const comments=await Comment.find({video:videoId})

for(const comment  of comments){
// delete likes of the comment
// each comment is like by different user so we use delete Many

await Like.deleteMany({comment:comment._id})
}

// delete the likes of the video
// particular video is like by different user
await Like.deleteMany({video:videoId})

// delete the comments of the video
await  Comment.deleteMany({video:videoId})

// delete video itself
await Video.findByIdAndDelete({video:videoId})

// delete from cloudinary
const videourl=videodetail.videoFile;
const thumbnailurl=videodetail.thumbnail;

// https://res.cloudinary.com/your-cloud-name/image/upload/v1677903032/sample_video.mp4
// The value of getPublicIdOfVideo after applying the code would be:

// "sample_video"

// Here's the breakdown:

// Splitting by "/":

// videoUrl.split("/") splits the URL by forward slashes, resulting in an array like this:
// [
//   "https:",
//   "res.cloudinary.com",
//   "your-cloud-name",
//   "image",
//   "upload",
//   "v1677903032",
//   "sample_video.mp4"
// ]
// Extracting Last Element:

// .pop() extracts the last element from the array, which is: "sample_video.mp4"
// Splitting by ".":

// .split(".")[0] splits the extracted element by the dot, resulting in:
// ["sample_video", "mp4"]
// Taking the First Element:

// Taking the first element ([0]) of the split array gives us the public ID: "sample_video"


if(videourl){
const videopublicid=videourl.split("/").pop().split(".")[0];
await cloudinary.uploader.destroy(videopublicid,{resource_type:"auto",invalidate:true})
}


if(thumbnailurl){
  const thumbnailpublicid=thumbnailurl.split("/").pop().split(".")[0];
  await cloudinary.uploader.destroy(thumbnailpublicid,{resource_type:"auto",invalidate:true})
  }

  return res.status(200).json(new ApiResponse(200, "Video Deleted Successfully"));

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

const videodetail=await Video.findById(videoId);
    const updatestatus=videodetail.isPublished?false:true;
    const toggleStatusInVideo=await Video.findByIdAndUpdate(videoId,{
isPublished:updatestatus
    },{new:true})

    
return res.status(200).json(new ApiResponse(200,"publish status updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
