import {model,Schema,Types, Document} from "mongoose"


export interface IVersion extends Document{
    _id: Types.ObjectId;
    document:Types.ObjectId;
    versionNumber:number;
    fileUrl:string;
    extractedText:string;
    createdAt:Date;
}

const docVersionSchema = new Schema<IVersion>({
    document:{
        type:Schema.Types.ObjectId,
        ref:"Document",
        required:[true,"Document version is required"],
        index:true

    },
    versionNumber:{
        type:Number,
        required:[true,"version Number is required"]
    },
    fileUrl:{
        type:String,
        required:[true,"File url is required"]

    },
    extractedText:{
        type:String,
        required:true

    }

},{timestamps: {createdAt:true,updatedAt:false}})


export const DocVersion = model<IVersion>("DocVersion",docVersionSchema)