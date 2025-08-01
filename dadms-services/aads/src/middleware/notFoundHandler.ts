import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        error: {
            message: `Route ${req.originalUrl} not found`,
            statusCode: 404,
            timestamp: new Date().toISOString(),
            path: req.path
        }
    });
}; 