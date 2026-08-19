import  express,{Application}  from "express";
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware";
import cookieParser from "cookie-parser"
const app : Application = express();

// middlewares

app.use(cors());

app.use(express.json({limit:"16kb"}))
//url encoder
app.use(express.urlencoded({extended:true,limit:"16kb"}))
// thsis configuration is storing files

app.use(cookieParser())


//routes import 
import router from "./routes/user.routes"
//routes.declaration
// cannot use app.get, we need to bring middleware
// we are going to use app.use
app.use("/api/v1/users",router)

app.use(errorHandler);



export default app;
