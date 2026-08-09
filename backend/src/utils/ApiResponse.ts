export class ApiResponse<T> {
  public statusCode: number;
  public data: T;
  public message: string;
  public success: boolean;

  constructor(statusCode: number, data: T, message: string = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}



/**
 What it is: <T> stands for a Generic Type Parameter (where T traditionally stands for "Type"
 Ensures data keeps its strict type definitions when consumed by your Axios client / custom hooks.
 */