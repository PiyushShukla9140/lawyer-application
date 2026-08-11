// step 1: token payload interface which extends the jwt payload (payload: contains user and metadata)
//.               TokenPayload Interface: Extends jsonwebtoken's native JwtPayload type.
//                It strongly types the decoded payload data (_id, email, workspace, role) so TypeScript provides full autocomplete when reading decodedToken._id.
// step 2: now we are going to create the verifyJWT function 
// step 2.1: this will be an async function which will have these three parameters, req,res,next and their types from the express(Request,Response,NextFunction)
// Step 2.2: now receive the token from bearer header or cookies in the req(for eg: const token = req.cookies?.accessToken)
//           Dual Extraction Strategy: Flexibly looks for the Access Token in two standard places:
//           req.cookies?.accessToken (secure, HTTP-only cookie).
//           req.header('Authorization') using standard Bearer format (Bearer <token>), stripping out the "Bearer " prefix.
// Step 2.3: if no token then return 401 apierror
// Step 2.4: Cryptographic Verification & Database Lookup
//              jwt.verify(token, secret): Decodes the token and checks its signature and expiration date (exp). If the token is tampered with or expired, jwt.verify throws an error, jumping straight to the catch block.
//              Database Fetch (.select('-password')): Fetches the user document matching decodedToken._id while explicitly excluding the password field from the result.
//              User Validation: Ensures the user account wasn't deleted from MongoDB after the token was issued.
// Step 2.5: Attaching User to Request & Releasing Control
//             req.user = user;: Attaches the authenticated user document to Express's req object. Any downstream controller or middleware running after verifyJWT can immediately read req.user without re-querying MongoDB.
//             next();: Calls next() to hand execution over to the actual route controller.


import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '../models/user.model';

interface TokenPayload extends JwtPayload {
  _id: string;
  email: string;
  workspace: string;
  role: string;
}

export const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Bearer Header or Cookies
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Token is missing.',
      });
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;

    // 🔒 Security Check: Never fall back to a hardcoded string
    if (!secret) {
    throw new Error("FATAL ERROR: ACCESS_TOKEN_SECRET is not defined in environment variables.");
    }

    const decodedToken = jwt.verify(token, secret) as TokenPayload;

    // Retrieve user details excluding sensitive data
    const user = await User.findById(decodedToken._id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token. User not found.',
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error?.message || 'Invalid or expired token',
    });
  }
};

