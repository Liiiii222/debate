import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
})

const topicSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  category: Joi.string().trim().min(1).max(100).required()
})

// Updated to match what PartnerPreferences.tsx actually sends:
// - ageRange: string (required, e.g. "Any age" or "18-25")
// - languages: array of strings (optional, empty = any)
// - countries: array of strings (optional, empty = any)
// - debateFormats: array of strings (required)
// - category and topic come from earlier steps
const userPreferencesSchema = Joi.object({
  category: Joi.string().trim().min(1).max(100).required(),
  topic: Joi.string().trim().min(1).max(200).required(),
  ageRange: Joi.string().trim().min(1).max(20).required(),
  languages: Joi.array().items(Joi.string().trim().max(50)).optional().default([]),
  countries: Joi.array().items(Joi.string().trim().max(100)).optional().default([]),
  university: Joi.string().optional().allow(''),
  debateFormats: Joi.array().items(Joi.string().trim()).min(1).required()
})

export const validateCategory = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = categorySchema.validate(req.body)
  if (error) {
    res.status(400).json({ success: false, error: error.details[0].message })
    return
  }
  next()
}

export const validateTopic = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = topicSchema.validate(req.body)
  if (error) {
    res.status(400).json({ success: false, error: error.details[0].message })
    return
  }
  next()
}

export const validateUserPreferences = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = userPreferencesSchema.validate(req.body)
  if (error) {
    res.status(400).json({ success: false, error: error.details[0].message })
    return
  }
  next()
}

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body)
    if (error) {
      res.status(400).json({ success: false, error: error.details[0].message })
      return
    }
    next()
  }
}

