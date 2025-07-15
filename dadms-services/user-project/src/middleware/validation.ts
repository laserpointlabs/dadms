import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';

/**
 * Middleware for validating request body against Joi schema
 */
export const validateBody = (schema: ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body);

        if (error) {
            res.status(400).json({
                success: false,
                error: 'Validation Error',
                message: error.details[0].message,
                timestamp: new Date().toISOString()
            });
            return;
        }

        next();
    };
};

/**
 * Middleware for validating request params against Joi schema
 */
export const validateParams = (schema: ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.params);

        if (error) {
            res.status(400).json({
                success: false,
                error: 'Validation Error',
                message: error.details[0].message,
                timestamp: new Date().toISOString()
            });
            return;
        }

        next();
    };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error('Global error handler:', err);

    // Default error response
    const response = {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
        response.error = 'Validation Error';
        response.message = err.message;
        res.status(400).json(response);
        return;
    }

    if (err.name === 'UnauthorizedError') {
        response.error = 'Unauthorized';
        response.message = 'Authentication required';
        res.status(401).json(response);
        return;
    }

    // Generic server error
    res.status(500).json(response);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
}; 