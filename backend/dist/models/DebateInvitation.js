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
const debateInvitationSchema = new mongoose_1.Schema({
    inviterSessionId: {
        type: String,
        required: true,
        index: true
    },
    inviteeSessionId: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    debateFormat: {
        type: String,
        enum: ['Video', 'Voice', 'Text'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    }
}, {
    timestamps: true
});
debateInvitationSchema.index({ inviteeSessionId: 1, status: 1 });
debateInvitationSchema.index({ inviterSessionId: 1, status: 1 });
debateInvitationSchema.index({ status: 1, expiresAt: 1 });
debateInvitationSchema.methods.accept = function () {
    this.status = 'accepted';
    return this.save();
};
debateInvitationSchema.methods.decline = function () {
    this.status = 'declined';
    return this.save();
};
debateInvitationSchema.methods.expire = function () {
    this.status = 'expired';
    return this.save();
};
debateInvitationSchema.statics.findPendingInvitations = function (inviteeSessionId) {
    return this.find({
        inviteeSessionId,
        status: 'pending',
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).exec();
};
debateInvitationSchema.statics.findActiveInvitations = function (sessionId) {
    return this.find({
        $or: [
            { inviterSessionId: sessionId },
            { inviteeSessionId: sessionId }
        ],
        status: { $in: ['pending', 'accepted'] },
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).exec();
};
debateInvitationSchema.statics.cleanupExpired = function () {
    return this.updateMany({
        status: 'pending',
        expiresAt: { $lt: new Date() }
    }, { $set: { status: 'expired' } }).exec();
};
exports.default = mongoose_1.default.model('DebateInvitation', debateInvitationSchema);
//# sourceMappingURL=DebateInvitation.js.map