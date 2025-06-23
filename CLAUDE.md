# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinSync is a personal financial tracking application for Apple's ecosystem (iOS/macOS) targeting a single developer/user in Nova Scotia, Canada. The app focuses on semi-automatic financial management without banking API integrations.

## Architecture

### Technology Stack
- **Frontend**: SwiftUI (unified codebase for Mac/iOS)
- **Backend**: Firebase (authentication, Firestore database, cloud functions)
- **Local Storage**: Core Data with CloudKit sync
- **AI/ML**: VisionKit for document scanning, Core ML for receipt processing, Firebase ML for text recognition
- **Notifications**: UserNotifications framework with UNCalendarNotificationTrigger

### Core Data Models
- **Transaction**: amount, date, category, description, receipt_id
- **Category**: name, color, budget_limit, parent_category
- **Account**: name, type, balance, currency
- **Receipt**: image_data, ocr_text, extraction_confidence
- **Investment**: symbol, shares, purchase_price, current_value

## Development Status

This is a new project in the planning phase. No code has been implemented yet. The codebase currently contains only documentation files (README.md and ProjectOverview.md).

## Development Commands

Since this is a SwiftUI project, the following commands will be relevant once development begins:

### Building and Running
```bash
# Open Xcode project
open FinSync.xcodeproj

# Build for iOS Simulator
xcodebuild -project FinSync.xcodeproj -scheme FinSync-iOS -destination 'platform=iOS Simulator,name=iPhone 15'

# Build for macOS
xcodebuild -project FinSync.xcodeproj -scheme FinSync-macOS -destination 'platform=macOS'
```

### Testing
```bash
# Run unit tests
xcodebuild test -project FinSync.xcodeproj -scheme FinSync-iOS -destination 'platform=iOS Simulator,name=iPhone 15'

# Run UI tests
xcodebuild test -project FinSync.xcodeproj -scheme FinSync-macOS -destination 'platform=macOS'

# Generate code coverage
xcodebuild test -project FinSync.xcodeproj -scheme FinSync-iOS -destination 'platform=iOS Simulator,name=iPhone 15' -enableCodeCoverage YES
```

### Code Quality
```bash
# Run SwiftLint
swiftlint

# Auto-fix SwiftLint issues
swiftlint --fix
```

## Key Features to Implement

1. **Manual Transaction Entry**: Quick entry interface with category management
2. **Receipt Scanning**: VisionKit integration with OCR processing
3. **Investment Tracking**: Portfolio management with manual price updates
4. **Smart Reminders**: Contextual notifications for expense entry
5. **Analytics**: Spending trends and budget tracking

## Development Phases

1. **Foundation** (4-6 weeks): Core infrastructure, basic transaction CRUD
2. **Receipt Intelligence** (4-5 weeks): Scanning and OCR implementation
3. **Smart Automation** (3-4 weeks): Notification and reminder system
4. **Analytics** (4-5 weeks): Data visualization and insights
5. **Investment Tracking** (3-4 weeks): Portfolio management
6. **Polish** (2-3 weeks): Performance optimization and security

## Security Considerations

- Local encryption for Core Data
- Biometric authentication (Face ID/Touch ID)
- Firebase security rules for user-based data access
- PIPEDA compliance for Canadian privacy laws
- End-to-end encryption for sensitive financial data

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

## Firebase Configuration

When setting up Firebase:
- Enable Firestore for real-time sync
- Configure authentication (email/password, Apple Sign-In)
- Set up Cloud Functions for backend processing
- Enable Firebase ML for enhanced OCR accuracy