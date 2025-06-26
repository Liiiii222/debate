"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.validateUserPreferences = exports.validateTopic = exports.validateCategory = void 0;
const joi_1 = __importDefault(require("joi"));
const categorySchema = joi_1.default.object({
    name: joi_1.default.string().trim().min(1).max(100).required()
});
const topicSchema = joi_1.default.object({
    name: joi_1.default.string().trim().min(1).max(200).required(),
    category: joi_1.default.string().trim().min(1).max(100).required()
});
const userPreferencesSchema = joi_1.default.object({
    category: joi_1.default.string().trim().min(1).max(100).required(),
    topic: joi_1.default.string().trim().min(1).max(200).required(),
    ageRange: joi_1.default.string().trim().min(1).max(20).required(),
    language: joi_1.default.string().trim().min(1).max(50).required(),
    country: joi_1.default.string().trim().min(1).max(50).required(),
    university: joi_1.default.string().trim().max(100).optional()
});
const validateCategory = (req, res, next) => {
    const { error } = categorySchema.validate(req.body);
    if (error) {
        res.status(400).json({
            success: false,
            error: error.details[0].message
        });
        return;
    }
    next();
};
exports.validateCategory = validateCategory;
const validateTopic = (req, res, next) => {
    const { error } = topicSchema.validate(req.body);
    if (error) {
        res.status(400).json({
            success: false,
            error: error.details[0].message
        });
        return;
    }
    next();
};
exports.validateTopic = validateTopic;
const validateUserPreferences = (req, res, next) => {
    const { error } = userPreferencesSchema.validate(req.body);
    if (error) {
        res.status(400).json({
            success: false,
            error: error.details[0].message
        });
        return;
    }
    next();
};
exports.validateUserPreferences = validateUserPreferences;
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message
            });
            return;
        }
        next();
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.js.map