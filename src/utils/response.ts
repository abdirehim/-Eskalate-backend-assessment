import { Response } from 'express';
import { BaseResponse, PaginatedResponse } from '../types';

/**
 * Send a success response
 */
export const sendSuccess = <T>(
    res: Response,
    message: string,
    data: T | null = null,
    statusCode: number = 200
): void => {
    const response: BaseResponse<T> = {
        Success: true,
        Message: message,
        Object: data,
        Errors: null,
    };
    res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
export const sendError = (
    res: Response,
    message: string,
    errors: string[] = [],
    statusCode: number = 400
): void => {
    const response: BaseResponse = {
        Success: false,
        Message: message,
        Object: null,
        Errors: errors.length > 0 ? errors : [message],
    };
    res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 */
export const sendPaginated = <T>(
    res: Response,
    message: string,
    data: T[],
    pageNumber: number,
    pageSize: number,
    totalSize: number
): void => {
    const response: PaginatedResponse<T> = {
        Success: true,
        Message: message,
        Object: data,
        PageNumber: pageNumber,
        PageSize: pageSize,
        TotalSize: totalSize,
        Errors: null,
    };
    res.status(200).json(response);
};
