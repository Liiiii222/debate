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
const topicSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    category: {
        type: String,
        required: true,
        trim: true
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
topicSchema.index({ category: 1, usageCount: -1 });
topicSchema.index({ trending: 1, usageCount: -1 });
topicSchema.index({ source: 1, usageCount: -1 });
topicSchema.index({ name: 'text' });
topicSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    this.lastUsed = new Date();
};
topicSchema.statics.getByCategory = function (category) {
    return this.find({ category }).sort({ trending: -1, usageCount: -1 }).exec();
};
topicSchema.statics.getTrending = function () {
    return this.find({ trending: true }).sort({ usageCount: -1 }).limit(20).exec();
};
topicSchema.statics.getPopularByCategory = function (category) {
    return this.find({
        category,
        source: 'popular'
    }).sort({ usageCount: -1 }).limit(10).exec();
};
topicSchema.statics.getUserTopicsByCategory = function (category) {
    return this.find({
        category,
        source: 'user'
    }).sort({ usageCount: -1, createdAt: -1 }).exec();
};
topicSchema.statics.getDefaultByCategory = function (category) {
    return this.find({
        category,
        source: 'popular'
    }).sort({ name: 1 }).exec();
};
topicSchema.statics.getUserPopularByCategory = function (category) {
    return this.find({
        category,
        source: 'user',
        usageCount: { $gt: 0 }
    }).sort({ usageCount: -1 }).limit(10).exec();
};
exports.default = mongoose_1.default.model('Topic', topicSchema);
//# sourceMappingURL=Topic.js.map