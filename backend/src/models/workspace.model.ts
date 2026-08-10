import {Schema,Model,Document, model,Types} from "mongoose";

export interface WorkSpace extends Document{
    _id: Types.ObjectId;
    name:string;
    createdAt:Date;
    updatedAt:Date;
}

const workSpaceSchema = new Schema<WorkSpace>({
    name:{
        type: String,
        required: [true,"Workspace name is required"],
        trim: true,
    }
})


export const WorkSpace = model<WorkSpace>("Workspace",workSpaceSchema)