import mongoose from "mongoose";
import { DB_NAME } from "../constant";


const connectDB = async()=>{
    try{

        // const mongoUri = process.env.MONGODB_URI
        // if(!mongoUri){
        //     throw new Error('MONGO_URI is not defined in environment variables');
        // }
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB Connected!! DB Host: ${connectionInstance.connection.host} `)
    }catch(error){
        console.error(`MongoDB connection error: ${(error as Error).message}`)
        process.exit(1)
    }
}


export default connectDB