# Debate Web Application

A real-time debate matching web application that connects users with like-minded individuals for meaningful discussions on trending topics.

## 🎯 Features

- **Smart Matchmaking**: Find debate partners based on category, topic, and preferences
- **Trending Topics**: Real-time trending topics from NewsAPI, Reddit, and other sources
- **Real-time Communication**: Live debate rooms with Socket.IO
- **Fallback Options**: AI debate partner, wait for match, or start over
- **User Preferences**: Age range, language, country, and university matching
- **Responsive Design**: Modern UI with Tailwind CSS and Framer Motion

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.IO Client** for real-time communication
- **React Hook Form** for form handling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time features
- **Joi** for validation
- **Axios** for external API calls

### External APIs
- **NewsAPI.org** for trending news topics
- **Reddit API** for social media trends
- **Twitter/X API** (placeholder for authentication)
- **Google Trends API** (placeholder for setup)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or cloud)
- Git

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd debate
npm run install:all
```

### 2. Environment Setup

Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/debate-app
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
NEWS_API_KEY=your_news_api_key_here
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5000
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📁 Project Structure

```
debate/
├── frontend/                 # Next.js frontend
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── package.json
│   └── ...
├── backend/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── socket/         # Socket.IO handlers
│   │   └── index.ts        # Server entry point
│   └── package.json
└── package.json            # Root package.json
```

## 🔧 API Endpoints

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id/usage` - Increment usage count

### Topics
- `GET /api/topics?category=name` - Get topics by category
- `POST /api/topics` - Create new topic
- `PUT /api/topics/:id/usage` - Increment usage count

### Matchmaking
- `POST /api/matchmaking` - Find debate partner
- `PUT /api/matchmaking/:sessionId/active` - Update activity
- `DELETE /api/matchmaking/:sessionId` - End session

### Trending
- `GET /api/trending/news` - NewsAPI trending topics
- `GET /api/trending/reddit` - Reddit trending topics
- `GET /api/trending/all` - All trending topics

## 🎮 How It Works

1. **Landing Page**: Users see the welcome message and click "Choose a Category"
2. **Category Selection**: Browse trending, popular, and user categories
3. **Topic Selection**: Choose from trending, popular, or user topics within the category
4. **Partner Preferences**: Set age range, language, country, and university preferences
5. **Matchmaking**: System finds compatible partners or offers fallback options
6. **Real-time Debate**: Join debate rooms with live messaging and reactions

## 🔌 External API Setup

### NewsAPI
1. Sign up at [newsapi.org](https://newsapi.org)
2. Get your API key
3. Add to backend `.env`: `NEWS_API_KEY=your_key`

### Reddit
- Currently uses public Reddit API (no auth required)
- For higher rate limits, set up Reddit app credentials

### Twitter/X & Google Trends
- Placeholder implementations ready for API keys
- Follow respective platform documentation for setup

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
```

### Backend (Render/Railway)
```bash
cd backend
npm run build
# Deploy to Render or Railway
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure production MongoDB URI
- Add all external API keys
- Set `FRONTEND_URL` to production frontend URL

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

## 📊 Database Schema

### Categories
- `name`: String (unique)
- `source`: 'external' | 'user' | 'popular'
- `trending`: Boolean
- `usageCount`: Number
- `lastUsed`: Date

### Topics
- `name`: String
- `category`: String
- `source`: 'external' | 'user' | 'popular'
- `trending`: Boolean
- `usageCount`: Number
- `lastUsed`: Date

### Users
- `sessionId`: String (unique)
- `preferences`: Object (category, topic, ageRange, language, country, university)
- `isSearching`: Boolean
- `lastActive`: Date

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ for meaningful debates and discussions** 