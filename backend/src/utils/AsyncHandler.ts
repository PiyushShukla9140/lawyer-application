import {Request,Response,NextFunction,RequestHandler} from "express"


type AsyncRequestHandler = (
    req:Request,
    res:Response,
    next:NextFunction
)=>Promise<any>
    



export const asyncHandler  = (requestHandler:AsyncRequestHandler) : RequestHandler=>{
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
}

//What it is: Promise.resolve(value) is a built-in static method on the JavaScript Promise object that instantly creates and returns a Promise that is already fulfilled (resolved) with the given value.

//Core Philosophy: It acts as a bridge to normalize non-promise values (primitives, plain objects, sync values) or foreign "thenable" objects into standard native Promises.


