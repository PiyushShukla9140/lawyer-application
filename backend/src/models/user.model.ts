import mongoose,{Document,Types,Model}from "mongoose";
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export enum UserRole{
    Owner="Owner",
    Client="Client",
    Admin="Admin",
    Lawyer="Lawyer"

}

export interface User extends Document{
    _id: Types.ObjectId;
    workspace:Types.ObjectId;
    username:string;
    fullName:string;
    email:string;
    password:string;
    profileImage?:string;
    role:UserRole;
    isEmalVerified:boolean;
    acceptedTermsAt?:Date;
    refreshToken?:string
    createdAt:Date;
    updatedAt:Date
}

export interface UserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface UserDocument extends Document, User, UserMethods {}
const userSchema = new mongoose.Schema<UserDocument, Model<UserDocument>, UserMethods>({
    workspace:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Workspace",
        required:[true,"Workspace is required"],
        index:true
    },
    username:{
        type:String,
        required:[true,"username is required"],
        index:true,
        lowercase:true
    },
    fullName:{
        type:String,
        required:[true,"FullName is required"],
        trim:true
    },
    email:{
        type:String,
        unique:true,
        requred:[true,"email is required"],
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        requred:[true,"password is required"],

    },
    profileImage:{
        type:String,
        default:""

    },
    role:{
        type:String,
        enum:Object.values(UserRole),
        default:UserRole.Lawyer

    },
    isEmalVerified:{
        type:Boolean,
        default:false

    },
    acceptedTermsAt:{
        type:Date
    },
    refreshToken:{
        type:String
    }
    

},{timestamps:true})


// pre save hook password hashinh via bcrypt
userSchema.pre<User>("save",async function () {
    if(!this.isModified("password")|| !this.password) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt)
})


/*
Hook Trigger (.pre('save', ...)): Runs automatically right before a user document is saved to MongoDB (via .save() or User.create()).

this.isModified('password') Guard Clause: Crucial optimization and safety check.

If a user updates their email or profile picture, isModified('password') evaluates to false. The hook returns early so it doesn't accidentally re-hash an already hashed password (which would lock the user out forever).

bcrypt.genSalt(10) & bcrypt.hash(): Generates a random salt with 10 calculation rounds and hashes the plain text password asynchronously before storing it in the database.
 */




//Instance Method (isPasswordCorrect)
// Custom Method (UserSchema.methods...): Adds a custom function to every individual user document instance.
userSchema.methods.isPasswordCorrect = async function(password:string):Promise<boolean>{
    if(!this.password) return false

    return await bcrypt.compare(password,this.password)
    /*
    bcrypt.compare(plainTextPassword, hashedPassword): Hashes the incoming plain-text login attempt using the salt embedded in this.password and returns true if they match, or false if they don't.
     */
}


userSchema.methods.generateAccessToken = function():string {
    const secret : Secret = process.env.ACCESS_TOKEN_SECRET || "default access secret"
    const options: SignOptions = {
        expiresIn:(process.env.ACCESS_TOKEN_EXPIRY as any) || "15m"
    }

    return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      workspace: this.workspace,
      role: this.role,
    },
    secret,
    options
  );
}
/*
Access Token Purpose: Short-lived JWT (typically 15 minutes) passed in the Authorization: Bearer <token> header or an HTTP-only cookie for verifying requests to protected API endpoints.
Payload Details: Encodes user identity and authorization metadata (_id, email, workspace, role).
Security Rule: Keep payloads lightweight and never include sensitive fields like password in JWT payloads, as JWTs are easily decoded on the client side.
 */




userSchema.methods.generateRefreshToken = function (): string {
  const secret: Secret = process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret';
  const options: SignOptions = {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY as any) || '7d',
  };

  return jwt.sign(
    {
      _id: this._id,
    },
    secret,
    options
  );
};
/*
Refresh Token Purpose: Long-lived JWT (typically 7 days) stored securely in an HTTP-only cookie or saved in the database.
Minimal Payload: Only contains _id. Its sole job is to allow the frontend to request a new Access Token once the old 15-minute Access Token expires, avoiding forcing the user to log in repeatedly.
 */


export const User = mongoose.model<UserDocument>("User",userSchema)