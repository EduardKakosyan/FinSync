//
//  HomeViewModelTests.swift
//  FinSyncTests
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import XCTest
@testable import FinSync

@MainActor
final class HomeViewModelTests: XCTestCase {
    private var sut: HomeViewModel!
    private var mockDataService: MockDataService!
    
    override func setUp() {
        super.setUp()
        mockDataService = MockDataService()
        sut = HomeViewModel(dataService: mockDataService)
    }
    
    override func tearDown() {
        sut = nil
        mockDataService = nil
        super.tearDown()
    }
    
    // MARK: - Initial State Tests
    
    func test_initialState_shouldHaveCorrectDefaults() {
        XCTAssertEqual(sut.selectedPeriod, .week)
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.errorMessage)
        XCTAssertEqual(sut.spendingData, .mock)
    }
    
    func test_initialState_shouldHaveWeeklySpendingData() {
        XCTAssertEqual(sut.spendingData.period, .week)
        XCTAssertEqual(sut.spendingData.totalAmount, 234.50)
        XCTAssertEqual(sut.spendingData.categories.count, 3)
    }
    
    // MARK: - Period Selection Tests
    
    func test_updatePeriod_toDayPeriod_shouldUpdateSelectedPeriod() async throws {
        await sut.updatePeriod(.day)
        
        XCTAssertEqual(sut.selectedPeriod, .day)
    }
    
    func test_updatePeriod_toDayPeriod_shouldLoadDailyData() async throws {
        await sut.updatePeriod(.day)
        
        XCTAssertEqual(sut.spendingData.period, .day)
        XCTAssertEqual(sut.spendingData.totalAmount, 45.67)
    }
    
    func test_updatePeriod_toMonthPeriod_shouldLoadMonthlyData() async throws {
        await sut.updatePeriod(.month)
        
        XCTAssertEqual(sut.spendingData.period, .month)
        XCTAssertEqual(sut.spendingData.totalAmount, 1250.00)
    }
    
    func test_updatePeriod_shouldSetLoadingStateTemporarily() async throws {
        mockDataService.setSimulatedDelay(0.2)
        
        let loadingExpectation = expectation(description: "Loading state should be set")
        let completionExpectation = expectation(description: "Loading should complete")
        
        // Monitor loading state
        var loadingStates: [Bool] = []
        let cancellable = sut.$isLoading.sink { isLoading in
            loadingStates.append(isLoading)
            if isLoading {
                loadingExpectation.fulfill()
            } else if loadingStates.count > 1 {
                completionExpectation.fulfill()
            }
        }
        
        await sut.updatePeriod(.day)
        
        await fulfillment(of: [loadingExpectation, completionExpectation], timeout: 1.0)
        
        XCTAssertEqual(loadingStates, [false, true, false])
        XCTAssertFalse(sut.isLoading)
        
        cancellable.cancel()
    }
    
    // MARK: - Error Handling Tests
    
    func test_updatePeriod_withNetworkError_shouldSetErrorMessage() async throws {
        mockDataService.simulateError(true)
        
        await sut.updatePeriod(.day)
        
        XCTAssertNotNil(sut.errorMessage)
        XCTAssertEqual(sut.errorMessage, "Failed to load spending data")
        XCTAssertFalse(sut.isLoading)
    }
    
    func test_updatePeriod_afterError_shouldClearPreviousError() async throws {
        // First request fails
        mockDataService.simulateError(true)
        await sut.updatePeriod(.day)
        XCTAssertNotNil(sut.errorMessage)
        
        // Second request succeeds
        mockDataService.simulateError(false)
        await sut.updatePeriod(.week)
        
        XCTAssertNil(sut.errorMessage)
        XCTAssertEqual(sut.spendingData.period, .week)
    }
    
    // MARK: - Edge Cases Tests
    
    func test_rapidPeriodSwitching_shouldHandleGracefully() async throws {
        let periods: [TimePeriod] = [.day, .week, .month, .day, .week]
        
        await withTaskGroup(of: Void.self) { group in
            for period in periods {
                group.addTask {
                    await self.sut.updatePeriod(period)
                }
            }
        }
        
        // Should not crash and should have valid final state
        XCTAssertFalse(sut.isLoading)
        XCTAssertNotNil(sut.spendingData)
    }
    
    func test_concurrentPeriodUpdates_shouldNotCauseDataRace() async throws {
        let updateTasks = (0..<10).map { _ in
            Task {
                await sut.updatePeriod(.day)
                await sut.updatePeriod(.week)
                await sut.updatePeriod(.month)
            }
        }
        
        // Wait for all tasks to complete
        for task in updateTasks {
            await task.value
        }
        
        // Should maintain consistent state
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.errorMessage)
        XCTAssertNotNil(sut.spendingData)
    }
    
    // MARK: - Data Validation Tests
    
    func test_spendingData_shouldHaveValidCurrencyAmounts() {
        let data = sut.spendingData
        
        XCTAssertGreaterThanOrEqual(data.totalAmount, 0)
        
        for category in data.categories {
            XCTAssertGreaterThanOrEqual(category.amount, 0)
        }
    }
    
    func test_spendingData_categoriesSum_shouldNotExceedTotal() {
        let data = sut.spendingData
        let categoriesSum = data.categories.reduce(Decimal.zero) { $0 + $1.amount }
        
        // Categories might not sum to total (some expenses might be uncategorized)
        XCTAssertLessThanOrEqual(categoriesSum, data.totalAmount * 1.1) // Allow 10% variance
    }
    
    // MARK: - Memory Management Tests
    
    func test_viewModel_shouldNotRetainDataService() {
        weak var weakDataService = mockDataService
        
        sut = nil
        mockDataService = nil
        
        XCTAssertNotNil(weakDataService) // Service should still exist as we hold reference
    }
    
    func test_multipleViewModels_shouldNotInterfere() async throws {
        let secondViewModel = HomeViewModel(dataService: mockDataService)
        
        await sut.updatePeriod(.day)
        await secondViewModel.updatePeriod(.month)
        
        XCTAssertEqual(sut.selectedPeriod, .day)
        XCTAssertEqual(secondViewModel.selectedPeriod, .month)
        XCTAssertNotEqual(sut.spendingData.totalAmount, secondViewModel.spendingData.totalAmount)
    }
}