import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
console.log("mark")
    if(!name || !description){
        return new ApiError(400, 'Please provide all fields')
    }
    console.log(name)
console.log(description)

    const userid=req.user._id;

    const playlist=await Playlist.create({
        name,
        description,
        videos:[],
        owner:userid,
    })

    console.log(playlist);

    if(!playlist){
        return new ApiError(401,"Failed to create playlist")
    }

    return res.status(200).json(new ApiResponse(200,playlist ,"Created a playlist successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;
console.log(userId)
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
        return new ApiError(400,"Invalid User ID")
    }
console.log("mark1")

// we get  all the playlists of user and get the 
//all videos of each playlist in the result

const playlist_detail=await Playlist.aggregate([
    {
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        }
    },{
        $lookup:{
            from:"videos",
            localField:"videos",
            foreignField:"_id",
            as:"videoinfo",
            pipeline:[
                {
                    $project:{
                        videoFile:1,title:1,description:1,
                        thumbnail:1,views:1
                    }
                }
            ]
        }
    },{
        $project:{
         description:1,
         name:1,
         createdAt:1,
         videoinfo:"$videoinfo"
        }
    }
])
console.log("mark2")


console.log("mark3")


const ownerdetail=await User.findById(userId,{
  username:true,email:true,fullName:true,avatar:true  
})

const finaldata={
    playlist_detail,
    ownerdetail,
   
}

return res.status(200).json(new ApiResponse(200,finaldata,"successfully get the playlist"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        return new ApiError(400,'Invalid playlist Id')
    }
const playlistdetail=await Playlist.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(playlistId)
        }
    },{
        $lookup:{
            from:"videos",
            localField:"videos",
            foreignField:"_id",
            as:"videoinfo",
            pipeline:[
                {
                    $project:{
                        videoFile:1,
                        thumbnail:1,
                        title:1,
                        description:1,
                        duration:1,
                        views:1
                    }
                }
            ]
        }
    },{
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"ownerinfo",
            pipeline:[
                {
                    $project:{
                        username:1,
                        email:1,
                        fullName:1,
                        avatar:1
                    }
                }
            ]
        }
    },{
        $project:{
          name:1,
          description:1,
          ownerinfo:{
            $first:"$ownerinfo"
        },
        videosinfo:"$videoinfo",
          createdAt:1  
        }
    }
])

if(!playlistdetail){
    return new ApiError(400,"Playlist not found!")
}

return res.status(200).json(new ApiResponse(200,playlistdetail,"Successfully get playlist detail!"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    console.log(playlistId)
    console.log(videoId)

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        return new ApiError(400, "Invalid ID")
    }

    const playlist=await Playlist.findByIdAndUpdate(playlistId,{
        $push:{videos:videoId}
    },{new:true});

    if(!playlist){
        return new ApiError(404,"Playlist not found");
    }
    return res.status(200).json(new ApiResponse(200,playlist,"Added Video to the playlist"));
}
);


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        return new ApiError(400, "Invalid ID")
    }

    const playlist=await Playlist.findByIdAndUpdate(playlistId,{
        $pull:{videos:videoId}
    },{new:true});

    if(!playlist){
        return new ApiError(404,"Playlist not found");
    }
    return res.status(200).json(new ApiResponse(200,playlist,"Delete Video from the playlist"));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        return new ApiError(400, "Invalid ID")
    }

    const userid=req.user._id;

    const playlist=await Playlist.findById(playlistId);

    if(playlist.owner.toString!==userid.toString){
        return new ApiError(400,"You do not have permission to perform this action");
    }

    try{
await Playlist.findByIdAndDelete(playlistId);

return res.status(200).json(new ApiResponse(200,null,"successfully delete the playlist"))
    }catch(error){
return new ApiError(400,"server error")
    }

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        return new ApiError(400, "Invalid ID")
    }
    
    if(!name || !description){
        return new ApiError(400,"required fields are missing")
    }

    const playlist =await Playlist.findByIdAndUpdate(playlistId,{
        name:name,
        description:description
    },{new:true})

    if(!playlist){
        return new ApiError(400, "Playlist does not exist")
    }

    return res.status(200).json(new ApiResponse(200,playlist,"Updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
