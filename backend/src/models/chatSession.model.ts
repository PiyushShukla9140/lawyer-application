import {model,Schema,Types,Document} from "mongoose"

export interface chatSession extends Document{
    _id: Types.ObjectId;
    version:Types.ObjectId;
    createdAt:Date;
}


const chatSessionSchema = new Schema<chatSession>({
    version:{
        type:Schema.Types.ObjectId,
        ref:"DocVersion",
        required:true,
        index:true
    }

},{timestamps:{createdAt:true,updatedAt:false}})


export const chatSession = model<chatSession>("chatSession",chatSessionSchema)