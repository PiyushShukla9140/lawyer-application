import app from "./app";
import dotenv from "dotenv"
import connectDB from "./db";



dotenv.config()

const port = process.env.PORT || 5000




// app.listen(port,()=>{
//     console.log(`The server is running on port ${port}`)
// })
// this step was done to ensure that server is running properly

connectDB().then(()=>{
    app.listen(port,()=>{
        console.log(`The server is running on port ${port}`)
    })
}).catch(
    (err)=>{
        console.log("MongoDB connection error!!", err);
    }
)
