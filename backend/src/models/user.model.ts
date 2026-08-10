import mongoose,{Document,Types}from "mongoose";

export enum UserRole{
    Owner="Owner",
    Client="Client",
    Admin="Admin",
    Lawyer="Lawyer"

}

export interface User extends Document{
    _id: Types.ObjectId;
    workspace:Types.ObjectId;
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

const userSchema = new mongoose.Schema<User>({
    workspace:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Workspace",
        required:[true,"Workspace is required"],
        index:true
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


export const User = mongoose.model<User>("User",userSchema)