import  express,{Application}  from "express";
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware";
const app : Application = express();

// middlewares

app.use(cors());
app.use(express.json())


// healthcheck route

app.use(errorHandler);


export default app;
