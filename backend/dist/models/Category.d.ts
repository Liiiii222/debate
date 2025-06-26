import { Document, Model } from 'mongoose';
export interface ICategory extends Document {
    name: string;
    source: 'external' | 'user' | 'popular';
    trending: boolean;
    usageCount: number;
    lastUsed: Date;
    createdAt: Date;
    updatedAt: Date;
    incrementUsage(): void;
}
export interface ICategoryModel extends Model<ICategory> {
    getTrending(): Promise<ICategory[]>;
    getPopular(): Promise<ICategory[]>;
    getUserCategories(): Promise<ICategory[]>;
    getDefault(): Promise<ICategory[]>;
    getUserPopular(): Promise<ICategory[]>;
}
declare const _default: ICategoryModel;
export default _default;
//# sourceMappingURL=Category.d.ts.map