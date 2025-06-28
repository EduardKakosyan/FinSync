# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinSync is a personal financial tracking application built with React Native and Expo, targeting iOS and Android platforms for a single developer/user in Nova Scotia, Canada. The app focuses on semi-automatic financial management without banking API integrations.

## Architecture

### Technology Stack
- **Frontend**: React Native with Expo Router for navigation
- **Backend**: Firebase (authentication, Firestore database, cloud functions)
- **Local Storage**: AsyncStorage with React Native
- **AI/ML**: Expo Camera for document scanning, Firebase ML for text recognition
- **Charts**: Victory Native for data visualization
- **State Management**: React Context + custom hooks
- **Testing**: Jest with React Native Testing Library

### Core Data Models
- **Transaction**: amount, date, category, description, receipt_id
- **Category**: name, color, budget_limit, parent_category  
- **Account**: name, type, balance, currency
- **Receipt**: image_data, ocr_text, extraction_confidence
- **Investment**: symbol, shares, purchase_price, current_value

## Development Status

This project has been migrated from SwiftUI to React Native. The core React Native setup is complete with:
- ✅ Expo SDK 53 configuration
- ✅ iOS build working
- ✅ Android build configured  
- ✅ TypeScript setup with path mapping
- ✅ ESLint and Prettier configuration
- ✅ Jest testing framework
- ✅ Victory Native for charts
- ⚠️ Some TypeScript implementation details need refinement

## Development Commands

### Building and Running
```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator  
npm run android

# Build for production
npm run build

# Run web version
npm run web
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality
```bash
# Run TypeScript checks
npm run typecheck

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is formatted
npm run format:check
```

### Development Workflow
```bash
# Full development check (recommended before commits)
npm run dev
```

## Key Features to Implement

1. **Manual Transaction Entry**: Quick entry interface with category management
2. **Receipt Scanning**: Expo Camera integration with OCR processing  
3. **Investment Tracking**: Portfolio management with manual price updates
4. **Smart Reminders**: Local notifications for expense entry
5. **Analytics**: Spending trends and budget tracking with Victory Native charts

## Development Phases

1. **Foundation** (4-6 weeks): Core infrastructure, basic transaction CRUD
2. **Receipt Intelligence** (4-5 weeks): Camera scanning and OCR implementation
3. **Smart Automation** (3-4 weeks): Notification and reminder system
4. **Analytics** (4-5 weeks): Data visualization with Victory Native
5. **Investment Tracking** (3-4 weeks): Portfolio management
6. **Polish** (2-3 weeks): Performance optimization and security

## Security Considerations

- AsyncStorage encryption for sensitive data
- Biometric authentication (Face ID/Touch ID) via Expo LocalAuthentication
- Firebase security rules for user-based data access
- PIPEDA compliance for Canadian privacy laws
- Secure image storage for receipt data

## CODE-SIM Development Workflow

**CRITICAL**: All AI agents must follow this exact 6-phase cycle for every feature:

1. **PLAN** → Analyze requirements without coding
2. **SIMULATE** → Walk through solution architecture  
3. **TEST** → Write comprehensive failing tests
4. **CODE** → Implement minimum code to pass tests
5. **VERIFY** → Ensure all tests pass with 80%+ coverage
6. **DEBUG** → Review and optimize implementation

Each phase must conclude with user notification in format:
`✅ [PHASE] phase completed for [Feature Name]`

## GitHub Workflow

- No direct pushes to main branch
- All changes via Pull Requests
- CI/CD pipeline checks: build, tests, coverage, linting
- Conventional commit format required
- Minimum 80% test coverage enforced

## File Structure

```
FinSync/
├── app/                    # Expo Router pages
├── src/
│   ├── components/         # Reusable React components
│   ├── screens/           # Screen components
│   ├── services/          # Business logic and API calls
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── constants/         # App constants
│   └── hooks/             # Custom React hooks
├── assets/                # Images, fonts, etc.
├── __tests__/             # Test files
└── ...config files
```

## TypeScript Configuration

- Path mapping configured with `@/` alias pointing to `src/`
- Strict mode enabled
- Import resolution configured for React Native modules

## Important Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use async/await instead of Promise chains
- Prefer const/let over var
- Use ES modules (import/export) syntax

### React Native Best Practices
- Use Expo managed workflow
- Leverage Expo modules for device features
- Follow React Native performance guidelines
- Use React Native Testing Library for testing
- Implement proper error boundaries

### Testing Requirements
- Write tests for all business logic
- Use React Native Testing Library for component tests
- Maintain 80%+ code coverage
- Test both happy path and error scenarios

## Commands for Claude Code

When working on this project, use these commands:

```bash
# Check project health
npm run typecheck && npm run lint && npm test

# Start development
npm start

# Build for testing
npm run build

# Full quality check
npm run dev
```

## Firebase Configuration

When setting up Firebase:
- Enable Firestore for real-time sync
- Configure authentication (email/password, Apple/Google Sign-In)
- Set up Cloud Functions for backend processing  
- Enable Firebase ML for enhanced OCR accuracy
- Configure security rules for user-based data access