import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validateCategory: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateTopic: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateUserPreferences: (req: Request, res: Response, next: NextFunction) => void;
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map