# FinSync Development Rules - Cursor AI

## Project Structure

```
FinSync/
├── FinSync/
│   ├── App/
│   │   ├── FinSyncApp.swift
│   │   └── ContentView.swift
│   ├── Features/
│   │   ├── Home/
│   │   │   ├── Views/
│   │   │   │   ├── HomeView.swift
│   │   │   │   ├── SpendingCardView.swift
│   │   │   │   └── TimePeriodSelector.swift
│   │   │   ├── ViewModels/
│   │   │   │   └── HomeViewModel.swift
│   │   │   └── Models/
│   │   │       └── SpendingData.swift
│   │   ├── ReceiptCapture/
│   │   │   ├── Views/
│   │   │   │   └── ReceiptCaptureButton.swift
│   │   │   └── ViewModels/
│   │   │       └── ReceiptCaptureViewModel.swift
│   │   └── Analytics/
│   │       ├── Views/
│   │       │   ├── SpendingChart.swift
│   │       │   └── SavingsChart.swift
│   │       └── ViewModels/
│   │           └── AnalyticsViewModel.swift
│   ├── Core/
│   │   ├── Services/
│   │   │   └── MockDataService.swift
│   │   └── Extensions/
│   │       └── Color+Extensions.swift
│   └── Resources/
│       └── Assets.xcassets
├── FinSyncTests/
├── FinSyncUITests/
└── FinSync.xcodeproj
```

## SwiftUI Architecture Requirements

### MVVM Pattern
- All views must use corresponding ViewModels
- ViewModels must conform to ObservableObject
- Use @Published for reactive state management
- No business logic in Views - delegate to ViewModels

### View Structure
```swift
struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    
    var body: some View {
        // SwiftUI implementation
    }
}
```

### ViewModel Structure
```swift
@MainActor
final class HomeViewModel: ObservableObject {
    @Published var spendingData: SpendingData = .mock
    @Published var selectedPeriod: TimePeriod = .week
    
    // Business logic methods
}
```

## CODE-SIM Development Workflow

### MANDATORY: Follow this exact sequence for EVERY feature

#### 1. PLAN Phase
- Write detailed feature requirements in comments
- Define data models and view hierarchy
- Identify dependencies and mock data needs
- Document expected user interactions
- **NOTIFY USER**: "PLAN phase completed for [Feature Name]"

#### 2. SIMULATE Phase  
- Walk through user journey step-by-step
- Identify potential edge cases and error states
- Design view transitions and state changes
- Validate approach against SwiftUI best practices
- **NOTIFY USER**: "SIMULATE phase completed for [Feature Name]"

#### 3. TEST Phase
- Write failing unit tests for ViewModels
- Write failing UI tests for view rendering
- Include edge cases and error scenarios
- Add snapshot tests for visual consistency
- **NOTIFY USER**: "TEST phase completed - [X] tests written for [Feature Name]"

#### 4. CODE Phase
- Implement minimum code to pass tests
- Follow SwiftUI and iOS design guidelines
- Use Apple's naming conventions
- Implement proper error handling
- **NOTIFY USER**: "CODE phase completed for [Feature Name]"

#### 5. VERIFY Phase
- Run all tests and confirm they pass
- Check test coverage meets minimum 80%
- Verify UI matches design requirements
- **NOTIFY USER**: "VERIFY phase completed - all tests passing for [Feature Name]"

#### 6. DEBUG Phase
- Review code for potential issues
- Optimize performance if needed
- Ensure accessibility compliance
- **NOTIFY USER**: "DEBUG phase completed for [Feature Name]"

## Testing Standards

### Unit Testing
```swift
@testable import FinSync
import XCTest

final class HomeViewModelTests: XCTestCase {
    private var sut: HomeViewModel!
    
    override func setUp() {
        super.setUp()
        sut = HomeViewModel()
    }
    
    func test_initialState_shouldHaveCorrectDefaults() {
        // Test implementation
    }
}
```

### UI Testing
```swift
import XCTest

final class HomeViewUITests: XCTestCase {
    private var app: XCUIApplication!
    
    override func setUp() {
        super.setUp()
        app = XCUIApplication()
        app.launch()
    }
    
    func test_homeView_displaysSpendingData() {
        // UI test implementation
    }
}
```

### Test Coverage Requirements
- Minimum 80% code coverage
- All ViewModels must have 90%+ coverage
- Critical user paths must have E2E tests
- Visual regression tests for all views

## Mock Data Requirements

### SpendingData Model
```swift
struct SpendingData {
    let dailySpending: Decimal
    let weeklySpending: Decimal
    let monthlySpending: Decimal
    let categories: [SpendingCategory]
    
    static let mock = SpendingData(
        dailySpending: 45.67,
        weeklySpending: 234.50,
        monthlySpending: 1250.00,
        categories: SpendingCategory.mockCategories
    )
}
```

## SwiftUI Best Practices

### View Composition
- Break complex views into smaller components
- Use ViewBuilder for conditional content
- Implement proper accessibility labels
- Follow Apple's layout guidelines

### State Management
- Use @State for local view state
- Use @StateObject for view-owned objects
- Use @ObservedObject for injected objects
- Minimize state dependencies

### Performance
- Use LazyVStack/LazyHStack for large lists
- Implement proper view identity with .id()
- Avoid expensive operations in body
- Use @ViewBuilder for conditional content

### Styling
- Create reusable style modifiers
- Use consistent spacing and colors
- Follow iOS design guidelines
- Support both light and dark modes

## Error Handling

### ViewModel Error States
```swift
enum HomeViewError: LocalizedError {
    case dataLoadingFailed
    case invalidTimePeriod
    
    var errorDescription: String? {
        switch self {
        case .dataLoadingFailed:
            return "Failed to load spending data"
        case .invalidTimePeriod:
            return "Invalid time period selected"
        }
    }
}
```

## Commit Requirements

### Conventional Commits Format
```
type(scope): description

feat(home): add spending data display with time period selector
fix(charts): resolve chart rendering issue on iPad
test(home): add unit tests for HomeViewModel
docs(readme): update setup instructions
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `test`: Adding tests
- `refactor`: Code refactoring
- `docs`: Documentation
- `style`: Code style changes
- `chore`: Maintenance tasks

## Development Constraints

### NEVER
- Skip the CODE-SIM workflow phases
- Write code without corresponding tests
- Commit directly to main branch
- Ignore test failures
- Use force unwrapping without null checks
- Hardcode values that should be configurable

### ALWAYS
- Follow the 6-phase CODE-SIM cycle
- Write tests before implementation
- Use proper error handling
- Include accessibility support
- Follow SwiftUI best practices
- Notify user after each phase completion
- Maintain minimum 80% test coverage

## Phase Completion Notifications

Use this exact format for phase notifications:
```
✅ [PHASE] phase completed for [Feature Name]
- [Key accomplishments/metrics]
- Ready to proceed to [Next Phase]
```

Example:
```
✅ TEST phase completed for Home Screen Spending Display
- 12 unit tests written for HomeViewModel
- 5 UI tests written for HomeView
- Edge cases covered: empty data, network errors, invalid periods
- Ready to proceed to CODE phase
```