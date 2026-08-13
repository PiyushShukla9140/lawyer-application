import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/user.model";
import { WorkSpace } from "../models/workspace.model";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { Response,Request } from "express";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary";

import { sendEmail } from '../utils/sendEmail';
import { getVerificationEmailHtml } from '../utils/emailTemplate';


import crypto from "crypto"


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

    if([username,email,fullName,password].some((field)=>field.trim()==="")){
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

    let finalWorkspaceId = workspaceId;

    if (!finalWorkspaceId) {
        const defaultWorkspace = await WorkSpace.create({
        name: `${fullName.trim()}'s Workspace`,
        });
        finalWorkspaceId = defaultWorkspace._id;
    }

    

    

    const user = await User.create({
        fullName,
        email,
        username,
        password,
        workspace:finalWorkspaceId,
        profileImage: profileImage?.url || "",
    })

    const verificationToken = user.generateEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${user.email}`;

        // Send verification email asynchronously
        await sendEmail({
        to: user.email,
        subject: 'Verify your SmartBrief Account',
        html: getVerificationEmailHtml(verificationUrl, user.fullName),
    });

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
    const {email,password} = req.body

    if (!password && !email) {
        throw new ApiError(400, "Email/Username and password are required");
    }

    const user = await User.findOne({email})

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
});

// password change handler
const changePassword = asyncHandler(async(req:Request,res:Response)=>{
    const {oldPassword,newPassword} = req.body;
     if(!oldPassword||!newPassword){
        throw new ApiError(400,"Both old password and new passsword are required")
     }

     const user = await User.findById(req.user?._id);
     if(!user){
        throw new ApiError(404,"User not found")
     }

     const isPaaswordCorrect = await user.isPasswordCorrect(oldPassword)
     if(!isPaaswordCorrect){
        throw new ApiError(400,"Invalid old password")
     }


     user.password = newPassword

     await user.save({validateBeforeSave:false})

     return res.status(200)
     .json(new ApiResponse(200,{},"User password changed successfully"))
})
// account details update handler

const updateAccountDetails = asyncHandler(async(req:Request,res:Response)=>{
    const {fullName,email} = req.body;

    if(!fullName && !email){
        throw new ApiError(400,"Either username or email field is required to update acoount details")
    }

    const updateFields : {fullName?:string,email?:string,isEmailVerified?:boolean}={}

    if(fullName) updateFields.fullName = fullName
    if (email && email !== req.user?.email) {
        // Check if new email is already taken
        const existingUser = await User.findOne({ email });
        if (existingUser) {
        throw new ApiError(409, "A user with this email already exists");
        }
        updateFields.email = email;
        updateFields.isEmailVerified = false; // Reset verification status if email changes
    }

    const updatedUser = await User.findByIdAndUpdate(req.user?._id,{
        $set:updateAccountDetails
    },{new:true}).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
});



// profile image update handler
const updateProfileImage = asyncHandler(async(req:Request,res:Response)=>{
    const profileImageLocalPath = req.file?.path
    // multer middleware provides us this req.files 

    if(!profileImageLocalPath){
        throw new ApiError(404,"The profile image file is missing")
    }

    const oldProfileImage = req.user?.profileImage

    const newProfileImage = await uploadOnCloudinary(profileImageLocalPath)

    if (!newProfileImage?.url) {
        throw new ApiError(500, "Error while uploading profile image to Cloudinary");
    }

    const updatedUser = await User.findByIdAndUpdate(req.user?._id,{
        $set: {
            profileImage: newProfileImage.url,
        },
    },{new:true}).select("-password -refreshToken");

    if(oldProfileImage){
        await deleteFromCloudinary(oldProfileImage);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile image updated successfully"));
})





// email verification handler
// There will be two handler fuction of email verification first one is verifying enail and second one is for requesting a new link 

const verifyEmail  = asyncHandler(async(req:Request,res:Response)=>{
    const {token,email} = req.query;

    if(!token||!email||typeof email !== 'string' || typeof token !== 'string'){
        throw new ApiError(400,"Invalid or missing verification query parameters")
    }

    const hashedToken = crypto.createHash("sha256")
                              .update(token as string)
                              .digest("hex")

                              //SHA-256 Hashing: Converts the plain token received from req.query.token into its hex hash.
    const user = await User.findOne({
        email:email.toLowerCase(),
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: new Date() },
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired email verification token");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Email verified successfully"))
})



const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Generate new token via instance method
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${user.email}`;
  // TODO: Trigger email service (e.g., Nodemailer / Resend / SendGrid)


  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${user.email}`;

    await sendEmail({
        to: user.email,
        subject: 'Re-verify your SmartBrief Account',
        html: getVerificationEmailHtml(verificationUrl, user.fullName),
    });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { verificationToken }, // Exposed during development; remove token from response body in production
        "Verification email re-sent successfully"
      )
    );
});




export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    changePassword,
    updateAccountDetails,
    updateProfileImage,
    verifyEmail,
    resendVerificationEmail


}

/*
In computing and cryptography, a hex hash (short for hexadecimal hash) is simply a hash value represented as a string of hexadecimal characters (0–9 and a–f).

1. How It Works
Input Any Data: You pass data (like a string, a file, or a password) through a cryptographic hash function (such as SHA-256 or MD5).

Binary Output: The hash function processes the input and produces a sequence of raw binary bytes (1s and 0s).

Hex Encoding: Since raw binary bytes are unreadable by humans and can cause issues when transmitted in text formats (like JSON, HTTP, or source code), those bytes are converted into hexadecimal notation—where every 8-bit byte is represented by two hexadecimal characters (0–9, a–f).
 */
