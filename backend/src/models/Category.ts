import mongoose, { Document, Schema, Model } from 'mongoose'

export interface ICategory extends Document {
  name: string
  source: 'external' | 'user' | 'popular'
  trending: boolean
  usageCount: number
  lastUsed: Date
  createdAt: Date
  updatedAt: Date
  incrementUsage(): void
}

export interface ICategoryModel extends Model<ICategory> {
  getTrending(): Promise<ICategory[]>
  getPopular(): Promise<ICategory[]>
  getUserCategories(): Promise<ICategory[]>
  getDefault(): Promise<ICategory[]>
  getUserPopular(): Promise<ICategory[]>
}

const categorySchema = new Schema<ICategory>({
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
})

// Index for efficient queries
categorySchema.index({ trending: 1, usageCount: -1 })
categorySchema.index({ source: 1, usageCount: -1 })
categorySchema.index({ name: 'text' })

// Method to increment usage
categorySchema.methods.incrementUsage = function(): void {
  this.usageCount += 1
  this.lastUsed = new Date()
}

// Static method to get trending categories
categorySchema.statics.getTrending = function(): Promise<ICategory[]> {
  return this.find({ trending: true }).sort({ usageCount: -1 }).limit(10).exec()
}

// Static method to get popular categories (default + user with high usage)
categorySchema.statics.getPopular = function(): Promise<ICategory[]> {
  return this.find({ source: 'popular' }).sort({ usageCount: -1 }).limit(20).exec()
}

// Static method to get user categories
categorySchema.statics.getUserCategories = function(): Promise<ICategory[]> {
  return this.find({ source: 'user' }).sort({ usageCount: -1, createdAt: -1 }).exec()
}

// Static method to get default categories (seed data)
categorySchema.statics.getDefault = function(): Promise<ICategory[]> {
  return this.find({ source: 'popular' }).sort({ name: 1 }).exec()
}

// Static method to get user-driven popular categories (high usage user categories)
categorySchema.statics.getUserPopular = function(): Promise<ICategory[]> {
  return this.find({ 
    source: 'user',
    usageCount: { $gt: 0 }
  }).sort({ usageCount: -1 }).limit(20).exec()
}

export default mongoose.model<ICategory, ICategoryModel>('Category', categorySchema) 