"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100
    },
    source: {
        type: String,
        enum: ['external', 'user', 'popular'],
        default: 'user'
    },
    trending: {
        type: Boolean,
        default: false
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
categorySchema.index({ trending: 1, usageCount: -1 });
categorySchema.index({ source: 1, usageCount: -1 });
categorySchema.index({ name: 'text' });
categorySchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    this.lastUsed = new Date();
};
categorySchema.statics.getTrending = function () {
    return this.find({ trending: true }).sort({ usageCount: -1 }).limit(10).exec();
};
categorySchema.statics.getPopular = function () {
    return this.find({ source: 'popular' }).sort({ usageCount: -1 }).limit(20).exec();
};
categorySchema.statics.getUserCategories = function () {
    return this.find({ source: 'user' }).sort({ usageCount: -1, createdAt: -1 }).exec();
};
categorySchema.statics.getDefault = function () {
    return this.find({ source: 'popular' }).sort({ name: 1 }).exec();
};
categorySchema.statics.getUserPopular = function () {
    return this.find({
        source: 'user',
        usageCount: { $gt: 0 }
    }).sort({ usageCount: -1 }).limit(20).exec();
};
exports.default = mongoose_1.default.model('Category', categorySchema);
//# sourceMappingURL=Category.js.map