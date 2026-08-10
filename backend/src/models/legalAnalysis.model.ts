import {model,Schema,Types,Document} from "mongoose"


export enum overallRisk{
    Low = "Low",
    Medium = "Medium",
    High = "High"
}


export interface legalAnalysis extends Document{
    _id: Types.ObjectId;
    documentVersion:Types.ObjectId;
    overallRisk:overallRisk;
    executiveSummary:string;
    createdAt:Date;
    updatedAt:Date;
}


const legalAnalysisSchema = new Schema<legalAnalysis>({
    documentVersion:{
        type:Schema.Types.ObjectId,
        ref:"DocVersion",
        required:[true,"Document version is required"],
        index:true
    },
    overallRisk:{
        type:String,
        enum:Object.values(overallRisk),
        required:true
    },
    executiveSummary:{
        type:String,
        required:true
    }
},{timestamps:true});


export const legalAnalysis = model<legalAnalysis>("legalAnalysis",legalAnalysisSchema)