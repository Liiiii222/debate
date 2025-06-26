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
const userSchema = new mongoose_1.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    preferences: {
        category: {
            type: String,
            required: true
        },
        topic: {
            type: String,
            required: true
        },
        ageRange: {
            type: String,
            required: true
        },
        language: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        university: {
            type: String,
            required: false
        }
    },
    isSearching: {
        type: Boolean,
        default: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
userSchema.index({ 'preferences.category': 1, 'preferences.topic': 1 });
userSchema.index({ 'preferences.ageRange': 1 });
userSchema.index({ 'preferences.language': 1 });
userSchema.index({ 'preferences.country': 1 });
userSchema.index({ isSearching: 1, lastActive: -1 });
userSchema.methods.updateLastActive = function () {
    this.lastActive = new Date();
};
userSchema.statics.findMatches = function (preferences, excludeSessionId) {
    const { category, topic, ageRange, language, country, university } = preferences;
    const matchQuery = {
        sessionId: { $ne: excludeSessionId },
        isSearching: true,
        'preferences.category': category,
        'preferences.topic': topic,
        lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    };
    if (ageRange && ageRange !== 'Any age') {
        matchQuery['preferences.ageRange'] = ageRange;
    }
    if (language && language !== 'Any language') {
        matchQuery['preferences.language'] = language;
    }
    if (country && country !== 'Any country') {
        matchQuery['preferences.country'] = country;
    }
    if (university && university !== 'No preference') {
        matchQuery['preferences.university'] = university;
    }
    return this.find(matchQuery).sort({ lastActive: -1 }).limit(10).exec();
};
userSchema.statics.cleanupInactive = function () {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.updateMany({ lastActive: { $lt: fiveMinutesAgo } }, { $set: { isSearching: false } }).exec();
};
exports.default = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map