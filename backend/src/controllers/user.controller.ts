import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/user.model";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Response,Request } from "express";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary";


// Options for HttpOnly secure cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

const registerUser  = asyncHandler(async(req:Request,res:Response)=>{
    const {email,fullName,username,password,workspaceId} = req.body;

    // Step 1: Get the user details from the req.body
    // Step 2: Check whether the username is empty
    // Step 3: Check whether the fullName is empty
    // Step 4: check whether the email field is empty
    // Step 5: check whtther the user exists or not 
    // Step 6: generate the profile image local path
    // Step 7: now create the user using User.create method form mongo db
    // Step 8: check whether the user is created or not
    // Step 9: return response

    if([username,email,fullName,password,workspaceId].some((field)=>field.trim()==="")){
        return new ApiError(400,"All fields are required")
    }

    const existingUser = await User.findOne({
        $or:[{username},{email}]
    })


    if(existingUser){
        throw new ApiError(409,"User with this email or username already exists");
    }


    // Narrow req.files type to a keyed object of Multer files so TypeScript recognizes 'profileImage'
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const profileImageLocalPath = files?.profileImage?.[0]?.path;

    const profileImage = await uploadOnCloudinary(profileImageLocalPath);

    const user = await User.create({
        fullName,
        email,
        password,
        workspace:workspaceId
    })

    const createdUser = await User.findById(user._id).select('-password -refreshToken');

    if(!createdUser){
        return new ApiError(500,"Error while creating the user in database")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,createdUser,"User signed up successfully"))
});

const generateAccessAndRefreshToken = async(userId:string)=>{
    try{
        const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User does not exist');
    }

    // first we need to create another interface userMethods in the user model, so typescript knows what kind of method is needed

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };

    }catch(error){
        throw new ApiError(
            500,
            'Something went wrong while generating access and refresh tokens'
        );
    }
}

const loginUser = asyncHandler(async(req:Request,res:Response)=>{
    const {username,email,password} = req.body

    if(username.trim()||password.trim()===""){
        throw new ApiError(404,"Username or password is required")
    }

    const user = await User.findOne({
        $or:[
            {email},{username}
        ]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const correctPassword = await user.isPasswordCorrect(password);

    if(!correctPassword){
        throw new ApiError(401,"Invalid user password")
    }

    const {refreshToken,accessToken} = await generateAccessAndRefreshToken(user._id.toString());

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        'User logged in successfully'
      )
    );


})

export {
    registerUser,

}
