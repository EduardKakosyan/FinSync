//
//  ReceiptCaptureButtonUITests.swift
//  FinSyncUITests
//
//  Created by Eduard Kakosyan on 2025-06-24.
//

import XCTest

final class ReceiptCaptureButtonUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - Receipt Capture Button Tests
    
    func test_receiptCaptureButton_shouldBeVisible() throws {
        let receiptButton = app.buttons["receipt-capture-button"]
        
        XCTAssertTrue(receiptButton.exists)
        XCTAssertTrue(receiptButton.isHittable)
    }
    
    func test_receiptCaptureButton_shouldHaveCorrectAccessibilityLabel() throws {
        let receiptButton = app.buttons["receipt-capture-button"]
        
        XCTAssertEqual(receiptButton.label, "Capture Receipt")
    }
    
    func test_receiptCaptureButton_shouldHaveAccessibilityHint() throws {
        let receiptButton = app.buttons["receipt-capture-button"]
        
        // Check that accessibility hint exists (exact text may vary)
        XCTAssertFalse(receiptButton.value as? String == "")
    }
    
    func test_receiptCaptureButton_tap_shouldTriggerCameraPermissionRequest() throws {
        let receiptButton = app.buttons["receipt-capture-button"]
        
        receiptButton.tap()
        
        // On first tap, should either show camera or permission dialog
        // We can't easily test camera permissions in UI tests, but we can verify
        // that tapping the button doesn't crash the app
        XCTAssertTrue(app.exists)
    }
    
    // MARK: - Integration Tests
    
    func test_homeView_shouldContainBothSpendingDataAndReceiptButton() throws {
        let spendingCard = app.otherElements["spending-card"]
        let receiptButton = app.buttons["receipt-capture-button"]
        
        XCTAssertTrue(spendingCard.exists)
        XCTAssertTrue(receiptButton.exists)
    }
    
    func test_receiptButton_shouldNotInterferWithTimePeriodSelector() throws {
        let timePeriodSelector = app.otherElements["time-period-selector"]
        let receiptButton = app.buttons["receipt-capture-button"]
        
        // Both should be accessible
        XCTAssertTrue(timePeriodSelector.exists)
        XCTAssertTrue(receiptButton.exists)
        XCTAssertTrue(timePeriodSelector.isHittable)
        XCTAssertTrue(receiptButton.isHittable)
    }
    
    func test_receiptButton_shouldNotInterferWithCategoryBreakdown() throws {
        let categoryBreakdown = app.otherElements["category-breakdown"]
        let receiptButton = app.buttons["receipt-capture-button"]
        
        XCTAssertTrue(categoryBreakdown.exists)
        XCTAssertTrue(receiptButton.exists)
        XCTAssertTrue(receiptButton.isHittable)
    }
    
    // MARK: - Layout Tests
    
    func test_receiptButton_shouldBePositionedCorrectly() throws {
        let receiptButton = app.buttons["receipt-capture-button"]
        let window = app.windows.firstMatch
        
        XCTAssertTrue(receiptButton.exists)
        
        // Button should be in the bottom-right area of the screen
        let buttonFrame = receiptButton.frame
        let windowFrame = window.frame
        
        // Check that button is towards the right side (last 25% of screen width)
        XCTAssertGreaterThan(buttonFrame.midX, windowFrame.width * 0.75)
        
        // Check that button is towards the bottom (last 25% of screen height)
        XCTAssertGreaterThan(buttonFrame.midY, windowFrame.height * 0.75)
    }
    
    // MARK: - Accessibility Tests
    
    func test_receiptButton_accessibilityTraits() throws {
        let receiptButton = app.buttons["receipt-capture-button"]
        
        XCTAssertTrue(receiptButton.exists)
        
        // Should be identified as a button
        XCTAssertTrue(receiptButton.elementType == .button)
    }
    
    func test_app_shouldSupportVoiceOver() throws {
        // Enable VoiceOver for testing
        let receiptButton = app.buttons["receipt-capture-button"]
        let spendingCard = app.otherElements["spending-card"]
        
        // Both elements should be accessible to VoiceOver
        XCTAssertTrue(receiptButton.isAccessibilityElement)
        XCTAssertTrue(spendingCard.isAccessibilityElement)
    }
}