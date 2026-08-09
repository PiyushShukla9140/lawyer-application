export class ApiError extends Error {
  public statusCode: number;
  public data: any;
  public success: boolean;
  public errors: any[];

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    // why somethinf went wrong is written?
    // if the caller doesnt define any value this will be used as default error
    errors: any[] = [],
    stack: string = ''
  ) {
    super(message);
    //super(message): Invokes the parent Error class constructor, setting up the standard error message property
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/*1. Core Definition
What it is: ApiError is a custom error-handling class in Node.js/Express that extends JavaScript's built-in Error class.

Core Philosophy: Standardized Error Responses. Instead of throwing generic JavaScript errors or manually constructing error response objects inside every controller, this class formats all operational backend errors into a consistent structure.

extends Error: Inherits core JavaScript error capabilities (like .message and .stack).

Property Annotations:

  statusCode: Holds the HTTP status code (e.g., 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error).

  data: Holds optional response data (set to null on errors).

  success: A boolean flag hardcoded to false so the frontend instantly knows the operation failed.

  errors: An array for detailed validation logs (e.g., multiple form validation failure messages).



Default Values: If the caller doesn't provide a message, it defaults to 'Something went wrong'. errors defaults to an empty array [].

  super(message): Invokes the parent Error class constructor, setting up the standard error message property.

  this.success = false: Guarantees that every API error response explicitly sets success: false.

Custom Stack (if (stack)): Allows passing a custom call stack if re-throwing an error captured elsewhere.

Error.captureStackTrace(this, this.constructor): A V8 engine method (Node.js) that generates a clean stack trace. It creates the .stack property on the instance while omitting the ApiError constructor frame itself, pointing directly to the line of code in your controller where new ApiError(...) was thrown.
*/