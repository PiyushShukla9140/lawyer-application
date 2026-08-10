import {Types,model,Schema,Document} from "mongoose"


export enum role{
    User="User",
    Assistant="Assistant"
}


export interface chatMessage extends Document{
    _id: Types.ObjectId;
    session:Types.ObjectId;
    sender:Types.ObjectId;
    role:role;
    content:string;
    createdAt:Date;
}


const chatMessageSchema = new Schema<chatMessage>({
    session:{
        type:Schema.Types.ObjectId,
        ref:"chatSession",
        required:true,
        index:true
    },
    sender:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true
    },
    role:{
        type:String,
        enum:Object.values(role),
        required:true
    },
    content:{
        type:String,
        required:true
    }
},{timestamps:{createdAt:true,updatedAt:false}});


export const chatMessage = model("chatMessage",chatMessageSchema)