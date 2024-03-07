import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    // particular video is commented by different users
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const pageno=Number(page);
    const limitno=Number(limit)


   
    const skip=(page-1)*limit;

    // we have to find the total no of likes in video comments
    // so we use aggregate

    const videocomments=await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip:skip

        },{
            $limit:limitno
        },
        {
            $lookup:{
                from:'likes',
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
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
                            fullName:1,
                            email:1
                        }
                    }
                ]
            }

        },{
            $addFields:{
                totallikes:{$size:"$likes"},
                userinfo:{$first: "$users"}
            }
        },{
            $project:{
                _id:1,content:1,video:1,totallikes:1,
                userinfo:1,createdAt:1,updatedAt:1

            }
        }
    ]);


    if(!videocomments){
        return new ApiError(400, "No video comments found.");
    }

    res.status(200).json(new ApiError(200,videocomments,"Video Comments retrieved successfully"));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content,videoId}=req.body;
    const userId=req.user._id;

    if(!content || !videoId){
        return new ApiError(400,"required fields are missing");
        
    }
    if(!userId){
        
        return new ApiError(400,"user is not login");
    }

    const comment=await Comment.create({video:videoId,owner:userId},{
        content:content,
        video:videoId,
        owner:userId
    })
if(!comment){
    return new ApiError(400,"problem in create the comments")
}

return  res.status(201).json(new ApiResponse(200,null,"successfully create the comment"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentid}=req.params;
    const {content}=req.body;
if(!isValidObjectId(commentid)){
return  new ApiError(400,"Invalid comment");

}

const commentdetail=await Comment.findById(commentid);

if(commentdetail.owner.toString()!==req.user._id.toString()){
    return new ApiError(403,"You do not have permission to perform this action on the comment");
}

commentdetail.content=content;
await commentdetail.save();
return res.status(200).json(new ApiResponse(200,commentdetail,"Successfuly updated the comment"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    // delete the all likes of the comments
    // delete comment itself
    
    const {commentid}=req.params;

    if(!isValidObjectId(commentid)){
        return  new ApiError(400,"Invalid comment");
        
        }
    const comment=await Comment.findById(commentid);

    if(comment.owner.toString()!==req.user._id.toString()){
        return new ApiError(403,"You do not have permission to perform this action on the comment");
    }

    try{
        await Like.deleteMany({comment:commentid,video:comment.video});
        await Comment.findByIdAndDelete(commentid);
        return new ApiResponse(200,"Deleted the comment successfully")
        
    }catch(error){
        return new ApiError(400,"error occured in deleting")
        
    }


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }


    
    