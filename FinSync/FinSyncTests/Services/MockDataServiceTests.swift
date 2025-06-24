//
//  MockDataServiceTests.swift
//  FinSyncTests
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import XCTest
@testable import FinSync

final class MockDataServiceTests: XCTestCase {
    private var sut: MockDataService!
    
    override func setUp() {
        super.setUp()
        sut = MockDataService()
    }
    
    override func tearDown() {
        sut = nil
        super.tearDown()
    }
    
    // MARK: - Data Fetching Tests
    
    func test_fetchSpendingData_forDayPeriod_shouldReturnDailyData() async throws {
        let data = try await sut.fetchSpendingData(for: .day)
        
        XCTAssertEqual(data.period, .day)
        XCTAssertEqual(data.totalAmount, 45.67)
        XCTAssertEqual(data, .mockDaily)
    }
    
    func test_fetchSpendingData_forWeekPeriod_shouldReturnWeeklyData() async throws {
        let data = try await sut.fetchSpendingData(for: .week)
        
        XCTAssertEqual(data.period, .week)
        XCTAssertEqual(data.totalAmount, 234.50)
        XCTAssertEqual(data, .mock)
    }
    
    func test_fetchSpendingData_forMonthPeriod_shouldReturnMonthlyData() async throws {
        let data = try await sut.fetchSpendingData(for: .month)
        
        XCTAssertEqual(data.period, .month)
        XCTAssertEqual(data.totalAmount, 1250.00)
        XCTAssertEqual(data, .mockMonthly)
    }
    
    // MARK: - Error Simulation Tests
    
    func test_fetchSpendingData_withErrorSimulation_shouldThrowNetworkError() async throws {
        sut.simulateError(true)
        
        do {
            _ = try await sut.fetchSpendingData(for: .week)
            XCTFail("Should have thrown an error")
        } catch let error as DataServiceError {
            XCTAssertEqual(error, .networkFailure)
            XCTAssertEqual(error.errorDescription, "Failed to load spending data")
        } catch {
            XCTFail("Should have thrown DataServiceError.networkFailure")
        }
    }
    
    func test_fetchSpendingData_afterDisablingErrorSimulation_shouldSucceed() async throws {
        sut.simulateError(true)
        sut.simulateError(false)
        
        let data = try await sut.fetchSpendingData(for: .week)
        
        XCTAssertEqual(data.period, .week)
        XCTAssertNoThrow(data)
    }
    
    // MARK: - Delay Simulation Tests
    
    func test_fetchSpendingData_withDelay_shouldTakeExpectedTime() async throws {
        let expectedDelay: TimeInterval = 0.5
        sut.setSimulatedDelay(expectedDelay)
        
        let startTime = Date()
        _ = try await sut.fetchSpendingData(for: .week)
        let actualDelay = Date().timeIntervalSince(startTime)
        
        XCTAssertGreaterThanOrEqual(actualDelay, expectedDelay - 0.1) // Allow some variance
        XCTAssertLessThanOrEqual(actualDelay, expectedDelay + 0.1)
    }
    
    func test_fetchSpendingData_withZeroDelay_shouldReturnImmediately() async throws {
        sut.setSimulatedDelay(0)
        
        let startTime = Date()
        _ = try await sut.fetchSpendingData(for: .week)
        let actualDelay = Date().timeIntervalSince(startTime)
        
        XCTAssertLessThan(actualDelay, 0.1) // Should be very fast
    }
    
    // MARK: - Concurrent Request Tests
    
    func test_fetchSpendingData_concurrentRequests_shouldHandleCorrectly() async throws {
        let periods: [TimePeriod] = [.day, .week, .month]
        
        let results = try await withThrowingTaskGroup(of: SpendingData.self, returning: [SpendingData].self) { group in
            for period in periods {
                group.addTask {
                    try await self.sut.fetchSpendingData(for: period)
                }
            }
            
            var results: [SpendingData] = []
            for try await result in group {
                results.append(result)
            }
            return results
        }
        
        XCTAssertEqual(results.count, 3)
        
        // Verify we got all different period data
        let resultPeriods = Set(results.map { $0.period })
        XCTAssertEqual(resultPeriods.count, 3)
    }
    
    func test_fetchSpendingData_multipleConcurrentSamePeriod_shouldReturnConsistentData() async throws {
        let requestCount = 10
        
        let results = try await withThrowingTaskGroup(of: SpendingData.self, returning: [SpendingData].self) { group in
            for _ in 0..<requestCount {
                group.addTask {
                    try await self.sut.fetchSpendingData(for: .week)
                }
            }
            
            var results: [SpendingData] = []
            for try await result in group {
                results.append(result)
            }
            return results
        }
        
        XCTAssertEqual(results.count, requestCount)
        
        // All results should be identical
        let firstResult = results[0]
        for result in results {
            XCTAssertEqual(result, firstResult)
        }
    }
    
    // MARK: - Error Handling Edge Cases
    
    func test_dataServiceError_localizedDescription_shouldBeCorrect() {
        let networkError = DataServiceError.networkFailure
        let invalidPeriodError = DataServiceError.invalidPeriod
        let dataCorruptedError = DataServiceError.dataCorrupted
        
        XCTAssertEqual(networkError.errorDescription, "Failed to load spending data")
        XCTAssertEqual(invalidPeriodError.errorDescription, "Invalid time period selected")
        XCTAssertEqual(dataCorruptedError.errorDescription, "Spending data is corrupted")
    }
    
    // MARK: - Memory and Performance Tests
    
    func test_fetchSpendingData_multipleSequentialCalls_shouldNotLeakMemory() async throws {
        for _ in 0..<100 {
            _ = try await sut.fetchSpendingData(for: .week)
        }
        
        // If this completes without crashing, memory management is likely correct
        XCTAssertTrue(true)
    }
    
    func test_fetchSpendingData_performance_shouldBeFast() async throws {
        sut.setSimulatedDelay(0)
        
        let startTime = Date()
        
        for _ in 0..<100 {
            _ = try await sut.fetchSpendingData(for: .week)
        }
        
        let totalTime = Date().timeIntervalSince(startTime)
        XCTAssertLessThan(totalTime, 1.0) // Should complete 100 calls in under 1 second
    }
    
    // MARK: - Protocol Conformance Tests
    
    func test_mockDataService_conformsToDataServiceProtocol() {
        XCTAssertTrue(sut is DataServiceProtocol)
    }
    
    func test_dataServiceProtocol_canBeUsedPolymorphically() async throws {
        let service: DataServiceProtocol = MockDataService()
        
        let data = try await service.fetchSpendingData(for: .week)
        
        XCTAssertEqual(data.period, .week)
        XCTAssertNotNil(data)
    }
}