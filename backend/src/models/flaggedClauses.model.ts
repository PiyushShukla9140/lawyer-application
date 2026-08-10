import {model,Schema,Types,Document} from "mongoose"

export interface IflaggedClause extends Document{
    _id: Types.ObjectId;
    analysis:Types.ObjectId;
    clauseTitle:String;
    severity:String;
    originalText:string;
    riskExplanation:string;
    isResolved:boolean;
    recommendingFix:string;
}

const flaggedClauseSchema = new Schema<IflaggedClause>({
    analysis:{
        type:Schema.Types.ObjectId,
        ref:"legalAnalysis",
        required:true,
        index:true
    },
    clauseTitle:{
        type:String,
        required:true,
    },
    severity:{
        type:String,
        required:true
    },
    originalText:{
        type:String,
        required:true
    },
    riskExplanation:{
        type:String,
        required:true
    },
    isResolved:{
        type:Boolean,
        required:true,
        default:false
    },
    recommendingFix:{
        type:String,
        required:true
    }

});

export const flaggedClause = model<IflaggedClause>("flaggedClause",flaggedClauseSchema);

 