# FinSync - Personal Financial Tracking App

A React Native (Expo) application for personal financial tracking and management, designed for semi-automatic financial management across mobile platforms.

## Features

- **Transaction Management**: Add, edit, and categorize income and expenses
- **Receipt Scanning**: Capture and process receipts with OCR (coming soon)
- **Investment Tracking**: Monitor your portfolio performance
- **Analytics & Insights**: Visual spending trends and financial analytics
- **Smart Reminders**: Intelligent notifications for expense tracking
- **Cross-Platform**: Built with React Native for iOS and Android

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v7
- **Animations**: React Native Reanimated
- **Storage**: AsyncStorage
- **Charts**: React Native Chart Kit
- **Icons**: Expo Vector Icons
- **Testing**: Jest, React Native Testing Library
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- iOS Simulator or Android emulator

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd FinSync
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on specific platforms:
   ```bash
   npm run ios      # iOS simulator
   npm run android  # Android emulator
   npm run web      # Web browser
   ```

## Development Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run dev` - Run type checking and linting before starting

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── common/       # Common components
│   ├── transaction/  # Transaction-specific components
│   ├── receipt/      # Receipt-related components
│   ├── investment/   # Investment components
│   └── analytics/    # Analytics components
├── screens/          # Screen components
│   ├── home/         # Home screen
│   ├── transaction/  # Transaction screens
│   ├── receipt/      # Receipt screens
│   ├── investment/   # Investment screens
│   ├── analytics/    # Analytics screens
│   └── settings/     # Settings screens
├── services/         # Business logic and API calls
│   ├── storage/      # Local storage service
│   ├── camera/       # Camera and image processing
│   ├── ocr/          # OCR processing
│   └── sync/         # Data synchronization
├── navigation/       # Navigation configuration
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── store/            # State management
├── types/            # TypeScript type definitions
└── constants/        # App constants and configuration
```

## Core Features Implementation

### Phase 1: Foundation ✅
- [x] Basic app structure with navigation
- [x] TypeScript configuration
- [x] Core data models and types
- [x] Basic transaction entry screens
- [x] Development tooling (ESLint, Prettier, Jest)

### Phase 2: Receipt Intelligence (Planned)
- [ ] Camera integration with Expo Camera
- [ ] OCR text extraction
- [ ] Receipt data parsing
- [ ] Receipt archive and search

### Phase 3: Smart Automation (Planned)
- [ ] Notification system
- [ ] Smart reminders
- [ ] Contextual alerts
- [ ] User preference management

### Phase 4: Analytics and Insights (Planned)
- [ ] Data visualization with charts
- [ ] Spending trend analysis
- [ ] Budget tracking
- [ ] Financial health scoring

### Phase 5: Investment Tracking (Planned)
- [ ] Portfolio management
- [ ] Performance calculations
- [ ] Asset allocation visualization
- [ ] ROI reporting

## Testing

The project uses Jest and React Native Testing Library for testing:

```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## Code Quality

- **ESLint**: Enforces code quality and style rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks for quality checks (to be added)

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Run `npm run dev` before committing to ensure code quality
4. Update documentation as needed

## License

Private project for personal use.

## Architecture Notes

This app follows a modular architecture with:
- Feature-based organization
- TypeScript for type safety
- React Navigation for routing
- AsyncStorage for local persistence
- Expo managed workflow for easier development

The app is designed to be privacy-first with local data storage and optional cloud sync capabilities.