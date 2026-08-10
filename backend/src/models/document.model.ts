import { Schema,Types, model, Document as MongooseDocument } from "mongoose";


export interface IDocument extends MongooseDocument{
    _id: Types.ObjectId;
    workspace:Types.ObjectId;
    title:string;
    createdAt:Date;
    updatedAt:Date;

}


const documentSchema = new Schema<IDocument>({
    workspace:{
        type:Schema.Types.ObjectId,
        ref:"Workspace",
        required: [true, 'Workspace reference is required'],
        index: true,
    },
    title:{
        type:String,
        required: [true, 'Title reference is required'],
        trim:true

    }
},{timestamps:true})



export const LegalDocument = model<IDocument>("Document",documentSchema)