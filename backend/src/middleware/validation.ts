import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

// Validation schemas
const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
})

const topicSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  category: Joi.string().trim().min(1).max(100).required()
})

const userPreferencesSchema = Joi.object({
  category: Joi.string().trim().min(1).max(100).required(),
  topic: Joi.string().trim().min(1).max(200).required(),
  ageRange: Joi.string().trim().min(1).max(20).required(),
  language: Joi.string().trim().min(1).max(50).required(),
  country: Joi.string().trim().min(1).max(50).required(),
  university: Joi.string().trim().max(100).optional()
})

// Validation middleware functions
export const validateCategory = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = categorySchema.validate(req.body)
  
  if (error) {
    res.status(400).json({
      success: false,
      error: error.details[0].message
    })
    return
  }
  
  next()
}

export const validateTopic = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = topicSchema.validate(req.body)
  
  if (error) {
    res.status(400).json({
      success: false,
      error: error.details[0].message
    })
    return
  }
  
  next()
}

export const validateUserPreferences = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = userPreferencesSchema.validate(req.body)
  
  if (error) {
    res.status(400).json({
      success: false,
      error: error.details[0].message
    })
    return
  }
  
  next()
}

// Generic validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body)
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      })
      return
    }
    
    next()
  }
} 