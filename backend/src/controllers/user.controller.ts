import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/user.model";
import jwt, { JwtPayload } from "jsonwebtoken";
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
        throw new ApiError(400,"All fields are required")
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

    let profileImage = null;

    if (profileImageLocalPath) {
        profileImage = await uploadOnCloudinary(profileImageLocalPath);
    }

    

    const user = await User.create({
        fullName,
        email,
        password,
        workspace:workspaceId,
        profileImage: profileImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select('-password -refreshToken');

    if(!createdUser){
        throw new ApiError(500,"Error while creating the user in database")
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

    if (!password || (!username && !email)) {
        throw new ApiError(400, "Email/Username and password are required");
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

const logoutUser = asyncHandler(async(req:Request,res:Response)=>{
    await User.findByIdAndUpdate(req.user?._id,{
        $unset:{
            refreshToken:1
        },
    },{new:true})


    return res
        .status(200)
        .clearCookie('accessToken', cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
});


const getCurrentUser = asyncHandler(async(req:Request,res:Response)=>{
    return res.status(201)
    .json(new ApiResponse(201,req.user,"User fetched Successfully"));
})

const refreshAccessToken = asyncHandler(async(req:Request,res:Response)=>{
    // Step 1: receive the incoming refresh token
    // Step 2: check whther the toke is there or not
    // Step 3: now use try and catch block
    // Step 4: In try bock first verify the coming token using jwt.verify
    // Step 5: now find the user with decoked token
    // Step 6: if user is nor found throw error
    // Step 7: chekc that the decoded token coming is eqal to the user token or not using if else
    // Step 8: now generate the access token and new refresh token using the function
    // Step 9: return the response

    // accesing the refresh token
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request: Missing refresh token");
    }

    try {
        const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret"
        ) as JwtPayload;

        const user = await User.findById(decodedToken?._id);

        if (!user) {
        throw new ApiError(401, "Refresh token expired or invalid user");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or has been used");
        }

        const { accessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefreshToken(user._id.toString());

        return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(
            200,
            { accessToken, refreshToken: newRefreshToken },
            "Access token refreshed"
            )
        );
    } catch (error: any) {
        throw new ApiError(401, error?.message || "Refresh token expired or invalid");
    }
})




export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken

}
