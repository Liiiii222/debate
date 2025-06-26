import { Document, Model } from 'mongoose';
export type DebateFormat = 'Video' | 'Voice' | 'Text';
export interface IDebateInvitation extends Document {
    inviterSessionId: string;
    inviteeSessionId: string;
    category: string;
    topic: string;
    debateFormat: DebateFormat;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    accept(): Promise<void>;
    decline(): Promise<void>;
    expire(): Promise<void>;
}
export interface IDebateInvitationModel extends Model<IDebateInvitation> {
    findPendingInvitations(inviteeSessionId: string): Promise<IDebateInvitation[]>;
    findActiveInvitations(sessionId: string): Promise<IDebateInvitation[]>;
    cleanupExpired(): Promise<any>;
}
declare const _default: IDebateInvitationModel;
export default _default;
//# sourceMappingURL=DebateInvitation.d.ts.map