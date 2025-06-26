import mongoose, { Document, Schema, Model } from 'mongoose'

export interface ITopic extends Document {
  name: string
  category: string
  source: 'external' | 'user' | 'popular'
  trending: boolean
  usageCount: number
  lastUsed: Date
  createdAt: Date
  updatedAt: Date
  incrementUsage(): void
}

export interface ITopicModel extends Model<ITopic> {
  getByCategory(category: string): Promise<ITopic[]>
  getTrending(): Promise<ITopic[]>
  getPopularByCategory(category: string): Promise<ITopic[]>
  getUserTopicsByCategory(category: string): Promise<ITopic[]>
  getDefaultByCategory(category: string): Promise<ITopic[]>
  getUserPopularByCategory(category: string): Promise<ITopic[]>
}

const topicSchema = new Schema<ITopic>({
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
})

// Compound index for category and usage
topicSchema.index({ category: 1, usageCount: -1 })
topicSchema.index({ trending: 1, usageCount: -1 })
topicSchema.index({ source: 1, usageCount: -1 })
topicSchema.index({ name: 'text' })

// Method to increment usage
topicSchema.methods.incrementUsage = function(): void {
  this.usageCount += 1
  this.lastUsed = new Date()
}

// Static method to get topics by category
topicSchema.statics.getByCategory = function(category: string): Promise<ITopic[]> {
  return this.find({ category }).sort({ trending: -1, usageCount: -1 }).exec()
}

// Static method to get trending topics
topicSchema.statics.getTrending = function(): Promise<ITopic[]> {
  return this.find({ trending: true }).sort({ usageCount: -1 }).limit(20).exec()
}

// Static method to get popular topics by category (default + user with high usage)
topicSchema.statics.getPopularByCategory = function(category: string): Promise<ITopic[]> {
  return this.find({ 
    category, 
    source: 'popular' 
  }).sort({ usageCount: -1 }).limit(10).exec()
}

// Static method to get user topics by category
topicSchema.statics.getUserTopicsByCategory = function(category: string): Promise<ITopic[]> {
  return this.find({ 
    category, 
    source: 'user' 
  }).sort({ usageCount: -1, createdAt: -1 }).exec()
}

// Static method to get default topics by category (seed data)
topicSchema.statics.getDefaultByCategory = function(category: string): Promise<ITopic[]> {
  return this.find({ 
    category, 
    source: 'popular' 
  }).sort({ name: 1 }).exec()
}

// Static method to get user-driven popular topics by category (high usage user topics)
topicSchema.statics.getUserPopularByCategory = function(category: string): Promise<ITopic[]> {
  return this.find({ 
    category, 
    source: 'user',
    usageCount: { $gt: 0 }
  }).sort({ usageCount: -1 }).limit(10).exec()
}

export default mongoose.model<ITopic, ITopicModel>('Topic', topicSchema) 