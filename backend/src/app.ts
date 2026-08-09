import  express,{Application}  from "express";
import cors from "cors"

const app : Application = express();

// middlewares

app.use(cors());
app.use(express.json())


// healthcheck route


export default app;
