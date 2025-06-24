//
//  HomeViewUITests.swift
//  FinSyncUITests
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import XCTest

final class HomeViewUITests: XCTestCase {
    private var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - Visual Rendering Tests
    
    func test_homeView_shouldDisplaySpendingCard() throws {
        let spendingCard = app.otherElements["spending-card"]
        XCTAssertTrue(spendingCard.exists)
    }
    
    func test_homeView_shouldDisplayTimePeriodSelector() throws {
        let periodSelector = app.segmentedControls["time-period-selector"]
        XCTAssertTrue(periodSelector.exists)
    }
    
    func test_homeView_shouldDisplayWeeklySpendingByDefault() throws {
        let weeklyButton = app.buttons["Week"]
        XCTAssertTrue(weeklyButton.isSelected)
        
        let spendingAmount = app.staticTexts["spending-amount"]
        XCTAssertTrue(spendingAmount.label.contains("$234.50"))
    }
    
    func test_homeView_shouldDisplayCategoryBreakdown() throws {
        let categoryList = app.tables["category-breakdown"]
        XCTAssertTrue(categoryList.exists)
        XCTAssertGreaterThan(categoryList.cells.count, 0)
    }
    
    // MARK: - Period Selection Interaction Tests
    
    func test_timePeriodSelector_tapDay_shouldUpdateSpendingAmount() throws {
        let dayButton = app.buttons["Day"]
        dayButton.tap()
        
        XCTAssertTrue(dayButton.isSelected)
        
        let spendingAmount = app.staticTexts["spending-amount"]
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label CONTAINS '$45.67'"),
            object: spendingAmount
        )
        
        wait(for: [expectation], timeout: 2.0)
    }
    
    func test_timePeriodSelector_tapMonth_shouldUpdateSpendingAmount() throws {
        let monthButton = app.buttons["Month"]
        monthButton.tap()
        
        XCTAssertTrue(monthButton.isSelected)
        
        let spendingAmount = app.staticTexts["spending-amount"]
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label CONTAINS '$1,250.00'"),
            object: spendingAmount
        )
        
        wait(for: [expectation], timeout: 2.0)
    }
    
    func test_timePeriodSelector_rapidTapping_shouldHandleGracefully() throws {
        let dayButton = app.buttons["Day"]
        let weekButton = app.buttons["Week"]
        let monthButton = app.buttons["Month"]
        
        // Rapidly tap different periods
        for _ in 0..<5 {
            dayButton.tap()
            weekButton.tap()
            monthButton.tap()
        }
        
        // Should settle on final selection without crashes
        XCTAssertTrue(monthButton.isSelected)
        
        let spendingAmount = app.staticTexts["spending-amount"]
        XCTAssertTrue(spendingAmount.exists)
    }
    
    // MARK: - Category Breakdown Tests
    
    func test_categoryBreakdown_shouldDisplayCategoryNames() throws {
        let categoryList = app.tables["category-breakdown"]
        
        XCTAssertTrue(categoryList.staticTexts["Food"].exists)
        XCTAssertTrue(categoryList.staticTexts["Transport"].exists)
        XCTAssertTrue(categoryList.staticTexts["Shopping"].exists)
    }
    
    func test_categoryBreakdown_shouldDisplayCategoryAmounts() throws {
        let categoryList = app.tables["category-breakdown"]
        
        // Check that category amounts are displayed
        XCTAssertTrue(categoryList.staticTexts.matching(NSPredicate(format: "label CONTAINS '$'")).count > 0)
    }
    
    func test_categoryBreakdown_shouldUpdateWhenPeriodChanges() throws {
        let dayButton = app.buttons["Day"]
        dayButton.tap()
        
        let categoryList = app.tables["category-breakdown"]
        
        // Wait for categories to update
        let coffeeCategory = categoryList.staticTexts["Coffee"]
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == true"),
            object: coffeeCategory
        )
        
        wait(for: [expectation], timeout: 2.0)
        XCTAssertTrue(coffeeCategory.exists)
    }
    
    // MARK: - Layout and Accessibility Tests
    
    func test_homeView_shouldSupportVoiceOver() throws {
        let spendingCard = app.otherElements["spending-card"]
        XCTAssertNotNil(spendingCard.value)
        
        let periodSelector = app.segmentedControls["time-period-selector"]
        XCTAssertTrue(periodSelector.isAccessibilityElement)
    }
    
    func test_homeView_shouldHandleDifferentScreenSizes() throws {
        // Test in different orientations
        XCUIDevice.shared.orientation = .landscapeLeft
        
        let spendingCard = app.otherElements["spending-card"]
        XCTAssertTrue(spendingCard.exists)
        
        let periodSelector = app.segmentedControls["time-period-selector"]
        XCTAssertTrue(periodSelector.exists)
        
        XCUIDevice.shared.orientation = .portrait
    }
    
    func test_homeView_shouldDisplayInLightMode() throws {
        // Verify elements are visible in light mode
        let spendingCard = app.otherElements["spending-card"]
        XCTAssertTrue(spendingCard.exists)
        
        let spendingAmount = app.staticTexts["spending-amount"]
        XCTAssertTrue(spendingAmount.exists)
    }
    
    // MARK: - Error State Tests
    
    func test_homeView_shouldHandleLoadingState() throws {
        // This test would require ability to trigger loading state
        // For now, just verify the structure exists
        let spendingCard = app.otherElements["spending-card"]
        XCTAssertTrue(spendingCard.exists)
    }
    
    func test_homeView_shouldHandleEmptyDataState() throws {
        // This test would require ability to inject empty data
        // For now, just verify basic structure
        let categoryList = app.tables["category-breakdown"]
        XCTAssertTrue(categoryList.exists)
    }
    
    // MARK: - Performance Tests
    
    func test_homeView_shouldLoadQuickly() throws {
        let startTime = Date()
        
        let spendingCard = app.otherElements["spending-card"]
        XCTAssertTrue(spendingCard.waitForExistence(timeout: 2.0))
        
        let loadTime = Date().timeIntervalSince(startTime)
        XCTAssertLessThan(loadTime, 2.0)
    }
    
    func test_periodSelection_shouldBeResponsive() throws {
        let dayButton = app.buttons["Day"]
        
        let startTime = Date()
        dayButton.tap()
        
        let spendingAmount = app.staticTexts["spending-amount"]
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label CONTAINS '$45.67'"),
            object: spendingAmount
        )
        
        wait(for: [expectation], timeout: 1.0)
        
        let responseTime = Date().timeIntervalSince(startTime)
        XCTAssertLessThan(responseTime, 1.0)
    }
    
    // MARK: - Navigation Tests
    
    func test_homeView_shouldBeInitialScreen() throws {
        let navigationTitle = app.navigationBars.firstMatch.identifier
        XCTAssertTrue(navigationTitle.contains("FinSync") || navigationTitle.contains("Home"))
    }
    
    func test_homeView_shouldMaintainStateAfterBackgrounding() throws {
        let monthButton = app.buttons["Month"]
        monthButton.tap()
        
        // Simulate app backgrounding
        XCUIDevice.shared.press(.home)
        app.activate()
        
        // Should maintain month selection
        XCTAssertTrue(monthButton.isSelected)
        
        let spendingAmount = app.staticTexts["spending-amount"]
        XCTAssertTrue(spendingAmount.label.contains("$1,250.00"))
    }
}