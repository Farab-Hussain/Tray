# Tray - Consultant Booking Platform

A comprehensive multi-platform application for connecting students with consultants for booking sessions, real-time communication, and payment processing.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.82.1-61DAFB)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)

## 📱 Platforms

- **Mobile App** (React Native) - iOS and Android applications for students and consultants
- **Backend API** (Node.js/Express) - REST API server with Firebase integration
- **Web Dashboard** (Next.js) - Admin and consultant web interface

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- Firebase project with Firestore enabled
- Stripe account
- Cloudinary account (for image storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tray
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run dev
   ```

3. **Mobile App Setup**
   ```bash
   cd app
   npm install
   # Configure .env file
   # iOS: cd ios && pod install
   npm run ios  # or npm run android
   ```

4. **Web Dashboard Setup**
   ```bash
   cd web
   npm install
   cp .env.example .env.local
   # Edit .env.local with your credentials
   npm run dev
   ```

## 📚 Documentation

Comprehensive documentation is available for all aspects of the project:

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete REST API reference with examples
- **[Component Documentation](./COMPONENT_DOCUMENTATION.md)** - React component library with props and usage
- **[Architecture Documentation](./ARCHITECTURE.md)** - System architecture, data flow, and design patterns
- **[Project Analysis](./PROJECT_ANALYSIS.md)** - Complete codebase analysis and usage matrix

### Platform-Specific Documentation
- [Backend README](./backend/README.md) - Backend setup, API details, and deployment
- [Mobile App README](./app/README.md) - Mobile app development guide and configuration
- [Web Dashboard README](./web/README.md) - Web dashboard setup and features

## 🏗️ Project Structure

```
Tray/
├── app/                      # React Native mobile app
│   ├── src/
│   │   ├── Screen/          # Screen components (Auth, Student, Consultant)
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # API service layer
│   │   ├── contexts/       # React Context providers
│   │   ├── navigator/      # Navigation configuration
│   │   └── lib/            # Utilities and configs
│   ├── android/            # Android native code
│   └── ios/                # iOS native code
├── backend/                 # Node.js/Express backend API
│   ├── src/
│   │   ├── routes/         # Express route definitions
│   │   ├── controllers/    # Request/response handlers
│   │   ├── services/       # Business logic layer
│   │   ├── models/         # Data models
│   │   └── middleware/     # Auth and validation middleware
│   └── scripts/            # Utility scripts
├── web/                     # Next.js web dashboard
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   └── utils/              # API client and utilities
├── firebase/                # Firebase configuration
│   ├── firestore.rules     # Firestore security rules
│   └── firestore.indexes.json
└── docs/                    # Additional documentation
```

## 🔑 Key Features

### Core Functionality
- **Multi-role System**: Students, Consultants, and Admins with role-based access control
- **Real-time Communication**: Chat and video/audio calls via WebRTC
- **Payment Processing**: Stripe integration for payments and automated consultant payouts
- **Booking Management**: Complete booking lifecycle with automated reminders
- **Review System**: Rating and review functionality with aggregate calculations
- **Push Notifications**: Firebase Cloud Messaging for real-time updates
- **File Uploads**: Cloudinary integration for profile and service images

### Performance & Scalability
- **Pagination**: Efficient data loading with pagination on all list endpoints
- **Caching**: LRU cache with size limits and automatic cleanup
- **Scheduled Jobs**: Automated reminders and payouts with timeout protection
- **Optimized Queries**: Database query optimization and indexing

### Developer Experience
- **TypeScript**: Full type safety across all platforms
- **Comprehensive Documentation**: API, component, and architecture docs
- **Modular Architecture**: Clean separation of concerns
- **Error Handling**: Robust error handling and logging

## 🛠️ Technology Stack

### Mobile App
- React Native 0.82.1
- TypeScript
- React Navigation 7
- Firebase SDK
- Stripe React Native
- WebRTC

### Backend
- Express.js 5.1.0
- TypeScript
- Firebase Admin SDK
- Stripe
- Cloudinary
- Nodemailer

### Web Dashboard
- Next.js 15.5.4
- React 19
- Tailwind CSS 4
- Firebase Client SDK

## 📖 Getting Started Guides

- [Backend README](./backend/README.md) - Backend setup and API details
- [Mobile App README](./app/README.md) - Mobile app development guide
- [Web Dashboard README](./web/README.md) - Web dashboard setup

## 🔐 Environment Variables

Each platform requires specific environment variables. Create `.env` files in each directory:

### Backend (`.env`)
```env
PORT=4000
NODE_ENV=development
BASE_URL=http://localhost:4000
SERVICE_ACCOUNT_PATH=./path/to/service-account.json
STRIPE_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=...
SMTP_PASSWORD=...
```

### Mobile App (`.env`)
```env
API_URL=http://localhost:4000
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Web Dashboard (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

For detailed environment variable documentation, see:
- [Backend Environment Variables](./backend/README.md#environment-variables)
- [Mobile App Environment Variables](./app/README.md#environment-configuration)
- [Web Dashboard Environment Variables](./web/README.md#environment-variables)

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Mobile App Tests
```bash
cd app
npm test              # Run Jest tests
npm run lint          # Lint code
```

### Web Dashboard Tests
```bash
cd web
npm run lint          # ESLint
```

> **Note**: Test coverage is currently limited. See [Project Analysis](./PROJECT_ANALYSIS.md#85-testing) for recommendations.

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build         # Compile TypeScript
npm run start:prod    # Start production server
```

### Mobile App

**iOS:**
```bash
cd app/ios
pod install
cd ..
npm run ios           # Development
# For production: Open ios/app.xcworkspace in Xcode and archive
```

**Android:**
```bash
cd app/android
./gradlew bundleRelease  # Create AAB
# or
./gradlew assembleRelease # Create APK
```

### Web Dashboard
```bash
cd web
npm run build         # Build production bundle
npm run start         # Start production server
```

### Deployment Checklist
- [ ] Set production environment variables
- [ ] Update Firebase security rules
- [ ] Configure CORS for production domains
- [ ] Set up SSL certificates
- [ ] Configure Stripe production keys
- [ ] Set up monitoring and logging
- [ ] Configure scheduled jobs (cron/Cloud Scheduler)
- [ ] Test all critical user flows

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository** and create a feature branch
2. **Follow code style** - Use TypeScript, follow existing patterns
3. **Write tests** - Add tests for new features
4. **Update documentation** - Update relevant docs if needed
5. **Test thoroughly** - Test on all platforms if applicable
6. **Submit a pull request** - Include description of changes

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Keep components modular and reusable
- Add JSDoc comments for complex functions
- Follow the existing architecture patterns

## 📝 License

[Your License Here]

## 🆘 Support & Troubleshooting

### Common Issues

**Backend won't start:**
- Check Firebase service account path
- Verify all environment variables are set
- Check port 4000 is available

**Mobile app build fails:**
- Run `cd ios && pod install` for iOS
- Clear Gradle cache: `cd android && ./gradlew clean`
- Check Firebase config files are present

**Web dashboard authentication issues:**
- Verify Firebase config in `.env.local`
- Check backend CORS settings
- Ensure backend API URL is correct

### Getting Help
- 📖 Check the [documentation files](#-documentation)
- 🔍 Review the [Project Analysis](./PROJECT_ANALYSIS.md) for code structure
- 🐛 [Open an issue](https://github.com/your-repo/issues) in the repository
- 💬 Check existing issues for similar problems

## 🔄 Recent Updates

### Performance Improvements
- ✅ **Pagination**: Added pagination to all list endpoints (consultants, services, reviews)
- ✅ **Cache Optimization**: Implemented LRU cache with max size limits (1000 entries) and automatic cleanup
- ✅ **Scheduled Jobs**: Enhanced with timeout protection, error handling, and graceful shutdown
- ✅ **Frontend Pagination**: Added "Load More" functionality to mobile app screens

### Documentation
- ✅ **API Documentation**: Complete REST API reference with examples
- ✅ **Component Documentation**: Comprehensive component library documentation
- ✅ **Architecture Documentation**: System architecture, data flow, and design patterns
- ✅ **Project Analysis**: Complete codebase analysis with usage matrix

### Code Quality
- ✅ **Type Safety**: Improved TypeScript types across all platforms
- ✅ **Error Handling**: Enhanced error handling and logging
- ✅ **Code Organization**: Better separation of concerns

## 🗺️ Roadmap

### Planned Features
- [ ] Rate limiting for API endpoints
- [ ] Enhanced test coverage
- [ ] Error boundaries for React components
- [ ] Database query optimization
- [ ] Real-time updates via WebSockets
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Performance Enhancements
- [ ] Code splitting for mobile app
- [ ] Image optimization pipeline
- [ ] CDN integration
- [ ] Database indexing optimization

---

## 📞 Contact & Links

- **Documentation**: See [Architecture Documentation](./ARCHITECTURE.md) and [API Documentation](./API_DOCUMENTATION.md)
- **Issues**: Report bugs and request features via GitHub Issues
- **Contributing**: See [Contributing Guidelines](#-contributing)

---

**Built with ❤️ using React Native, Node.js, and Next.js**

