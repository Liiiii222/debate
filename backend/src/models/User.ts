import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IUser extends Document {
  sessionId: string
  // Persistent profile info fields
  age?: number
  country?: string
  language?: string
  preferences: {
    category: string
    topic: string
    ageRange: string
    language: string
    country: string
    university?: string
  }
  isSearching: boolean
  lastActive: Date
  createdAt: Date
  updatedAt: Date
  updateLastActive(): void
}

export interface IUserModel extends Model<IUser> {
  findMatches(preferences: any, excludeSessionId: string): Promise<IUser[]>
  cleanupInactive(): Promise<any>
}

const userSchema = new Schema<IUser>({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  // Persistent profile info fields
  age: {
    type: Number,
    required: false
  },
  country: {
    type: String,
    required: false
  },
  language: {
    type: String,
    required: false
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
})

// Indexes for efficient matchmaking queries
userSchema.index({ 'preferences.category': 1, 'preferences.topic': 1 })
userSchema.index({ 'preferences.ageRange': 1 })
userSchema.index({ 'preferences.language': 1 })
userSchema.index({ 'preferences.country': 1 })
userSchema.index({ isSearching: 1, lastActive: -1 })

// Method to update last active time
userSchema.methods.updateLastActive = function(): void {
  this.lastActive = new Date()
}

// Static method to find potential matches
userSchema.statics.findMatches = function(preferences: any, excludeSessionId: string): Promise<IUser[]> {
  const { category, topic, ageRange, language, country, university } = preferences
  
  const matchQuery: any = {
    sessionId: { $ne: excludeSessionId },
    isSearching: true,
    'preferences.category': category,
    'preferences.topic': topic,
    lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Active in last 5 minutes
  }

  // Add optional preference matches
  if (ageRange && ageRange !== 'Any age') {
    matchQuery['preferences.ageRange'] = ageRange
  }
  
  if (language && language !== 'Any language') {
    matchQuery['preferences.language'] = language
  }
  
  if (country && country !== 'Any country') {
    matchQuery['preferences.country'] = country
  }
  
  if (university && university !== 'No preference') {
    matchQuery['preferences.university'] = university
  }

  return this.find(matchQuery).sort({ lastActive: -1 }).limit(10).exec()
}

// Static method to clean up inactive users
userSchema.statics.cleanupInactive = function(): Promise<any> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  return this.updateMany(
    { lastActive: { $lt: fiveMinutesAgo } },
    { $set: { isSearching: false } }
  ).exec()
}

export default mongoose.model<IUser, IUserModel>('User', userSchema) 