import { Document, Model } from 'mongoose';
export interface IUser extends Document {
    sessionId: string;
    preferences: {
        category: string;
        topic: string;
        ageRange: string;
        language: string;
        country: string;
        university?: string;
    };
    isSearching: boolean;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;
    updateLastActive(): void;
}
export interface IUserModel extends Model<IUser> {
    findMatches(preferences: any, excludeSessionId: string): Promise<IUser[]>;
    cleanupInactive(): Promise<any>;
}
declare const _default: IUserModel;
export default _default;
//# sourceMappingURL=User.d.ts.map