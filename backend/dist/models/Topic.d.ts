import { Document, Model } from 'mongoose';
export interface ITopic extends Document {
    name: string;
    category: string;
    source: 'external' | 'user' | 'popular';
    trending: boolean;
    usageCount: number;
    lastUsed: Date;
    createdAt: Date;
    updatedAt: Date;
    incrementUsage(): void;
}
export interface ITopicModel extends Model<ITopic> {
    getByCategory(category: string): Promise<ITopic[]>;
    getTrending(): Promise<ITopic[]>;
    getPopularByCategory(category: string): Promise<ITopic[]>;
    getUserTopicsByCategory(category: string): Promise<ITopic[]>;
    getDefaultByCategory(category: string): Promise<ITopic[]>;
    getUserPopularByCategory(category: string): Promise<ITopic[]>;
}
declare const _default: ITopicModel;
export default _default;
//# sourceMappingURL=Topic.d.ts.map