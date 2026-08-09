import {Schema,Model,Document, model} from "mongoose";

export interface WorkSpace extends Document{
    name:string;
    createdAt:Date;
    updatedAt:Date;
}

const workSpaceSchema = new Schema({
    name:{
        type: String,
        required: [true,"Workspace name is required"],
        trim: true

    }
})


export const WorkSpace = model<WorkSpace>("Workspace",workSpaceSchema)