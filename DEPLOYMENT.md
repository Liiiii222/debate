# Deployment Guide - Debate Web Application

This guide covers deploying the Debate web application to production environments.

## 🚀 Frontend Deployment (Vercel)

### 1. Prepare Frontend
```bash
cd frontend
npm run build
```

### 2. Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts to connect your repository
4. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your backend URL

### 3. Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## 🔧 Backend Deployment (Render/Railway)

### Option 1: Render

1. **Connect Repository**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Select the `backend` directory

2. **Configure Service**
   - **Name**: `debate-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free or Paid

3. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/debate-app
   FRONTEND_URL=https://your-frontend-url.vercel.app
   NEWS_API_KEY=your_news_api_key
   ```

### Option 2: Railway

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` directory

2. **Configure Service**
   - Railway will auto-detect Node.js
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

3. **Environment Variables**
   - Add the same environment variables as Render

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create Cluster**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create a free cluster
   - Choose your preferred region

2. **Database Access**
   - Create a database user
   - Set username and password
   - Add IP address `0.0.0.0/0` for all access

3. **Network Access**
   - Add your deployment platform's IP range
   - Or use `0.0.0.0/0` for development

4. **Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/debate-app
   ```

### Initialize Database

After deployment, run the database initialization:

```bash
# Local development
cd backend
npm run init-db

# Production (via deployment platform console)
npm run init-db
```

## 🔌 External API Setup

### NewsAPI
1. Sign up at [newsapi.org](https://newsapi.org)
2. Get your API key
3. Add to environment variables: `NEWS_API_KEY=your_key`

### Reddit API (Optional)
1. Go to [reddit.com/prefs/apps](https://reddit.com/prefs/apps)
2. Create a new app
3. Add credentials to environment variables

## 📊 Monitoring & Logs

### Render
- View logs in the Render dashboard
- Set up uptime monitoring
- Configure alerts

### Railway
- View logs in Railway dashboard
- Set up health checks
- Monitor resource usage

### Vercel
- View deployment logs
- Set up analytics
- Monitor performance

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files
- Use deployment platform's secret management
- Rotate API keys regularly

### CORS Configuration
```typescript
// In backend/src/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))
```

### Rate Limiting
- Already configured in the application
- Adjust limits based on your needs

## 🧪 Testing Deployment

### Health Check
```bash
curl https://your-backend-url.com/health
```

### API Endpoints
```bash
# Test categories endpoint
curl https://your-backend-url.com/api/categories

# Test matchmaking stats
curl https://your-backend-url.com/api/matchmaking/stats
```

### Frontend Integration
1. Update `NEXT_PUBLIC_API_URL` in frontend
2. Test the complete user flow
3. Verify real-time features work

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        env:
          RENDER_TOKEN: ${{ secrets.RENDER_TOKEN }}
        run: |
          # Add deployment commands

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          # Add deployment commands
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `FRONTEND_URL` environment variable
   - Verify CORS configuration

2. **Database Connection**
   - Check MongoDB connection string
   - Verify network access settings

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **API Key Issues**
   - Verify external API keys are valid
   - Check rate limits

### Debug Commands

```bash
# Check backend logs
# Use your deployment platform's log viewer

# Test database connection
curl -X GET https://your-backend-url.com/health

# Test API endpoints
curl -X GET https://your-backend-url.com/api/categories
```

## 📈 Performance Optimization

### Backend
- Enable compression (already configured)
- Use CDN for static assets
- Implement caching strategies

### Frontend
- Optimize images
- Use Next.js Image component
- Enable gzip compression

### Database
- Create proper indexes (already configured)
- Monitor query performance
- Use connection pooling

## 🔄 Updates & Maintenance

### Regular Tasks
1. Update dependencies monthly
2. Monitor API usage and costs
3. Review and rotate API keys
4. Check security advisories

### Backup Strategy
- MongoDB Atlas provides automatic backups
- Export data regularly for additional safety

---

**Need help?** Check the main README.md or create an issue in the repository. 