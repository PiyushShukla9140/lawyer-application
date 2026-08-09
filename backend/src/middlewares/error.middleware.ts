import { Request, Response, NextFunction } from 'express';
import { ApiError } from "../utils/ApiError";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // If error is not an instance of custom ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    statusCode: error.statusCode,
    message: error.message,
    success: false,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};


/*
1. Core Definition
What it is: This file exports a centralized Express Error-Handling Middleware (errorHandler) that intercepts every error thrown or passed via next(err) in your application.

Core Philosophy: Global Exception Catching & Normalization. Express requires four arguments (err, req, res, next) to recognize a function as an error middleware. This handler ensures every error—whether a database failure, validation crash, or custom ApiError—is transformed into a clean, unified JSON structure before reaching the client.

2. Code Breakdown (Step-by-Step)
Express Error Signature
TypeScript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;
Four-Parameter Signature: Express requires (err, req, res, next) to register a function as an error middleware. If you remove next or err, Express treats it as a standard request route middleware instead.

let error = err;: Re-assigns the incoming error to a mutable variable so it can be transformed if needed.

Normalizing Unknown Errors to ApiError
TypeScript
  // If error is not an instance of custom ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }
Instance Check (instanceof ApiError):

If the error was explicitly thrown using throw new ApiError(404, "User not found"), it passes straight through untouched.

If the error comes from third-party libraries (e.g., Mongoose validation failure, JWT expired, JSON parsing syntax error), it won't be an instance of ApiError.

Standardization: It grabs the existing status code (or defaults to 500) and message (or defaults to 'Internal Server Error'), then wraps it inside a fresh ApiError instance while preserving the original call stack (err.stack).

Constructing the JSON Payload & Environment Shielding
TypeScript
  const response = {
    statusCode: error.statusCode,
    message: error.message,
    success: false,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};
Consistent Response Contract: Guarantees the frontend receives the same root keys every time: statusCode, message, success: false, and errors.

Conditional Stack Trace (...(process.env.NODE_ENV === 'development' && { stack: error.stack })):

Development Mode: Spreads the stack trace into the JSON response to help you debug database queries and file locations directly in Postman/browser.

Production Mode: Evaluates to false, leaving the stack trace out entirely. This prevents leaking sensitive backend file paths, database structure, or internal library logic to malicious users.

res.status(...).json(...): Sends the finalized HTTP status code and JSON object.

3. How to Register This in Your Express App
To make Express route all thrown errors to this middleware, it must be registered after all your routes in app.ts / server.ts:

TypeScript
import express from 'express';
import userRouter from './routes/user.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());

// Routes
app.use('/api/v1/users', userRouter);

// ⚠️ REGISTER LAST: Error handler must come AFTER all routes
app.use(errorHandler);
 */