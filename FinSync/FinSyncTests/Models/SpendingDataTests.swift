//
//  SpendingDataTests.swift
//  FinSyncTests
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import XCTest
@testable import FinSync

final class SpendingDataTests: XCTestCase {
    
    // MARK: - Mock Data Validation Tests
    
    func test_mockData_shouldHaveValidStructure() {
        let mockData = SpendingData.mock
        
        XCTAssertEqual(mockData.period, .week)
        XCTAssertEqual(mockData.totalAmount, 234.50)
        XCTAssertEqual(mockData.categories.count, 3)
        XCTAssertFalse(mockData.categories.isEmpty)
    }
    
    func test_mockDailyData_shouldHaveCorrectPeriod() {
        let mockData = SpendingData.mockDaily
        
        XCTAssertEqual(mockData.period, .day)
        XCTAssertEqual(mockData.totalAmount, 45.67)
        XCTAssertGreaterThan(mockData.categories.count, 0)
    }
    
    func test_mockMonthlyData_shouldHaveCorrectPeriod() {
        let mockData = SpendingData.mockMonthly
        
        XCTAssertEqual(mockData.period, .month)
        XCTAssertEqual(mockData.totalAmount, 1250.00)
        XCTAssertGreaterThan(mockData.categories.count, 0)
    }
    
    // MARK: - Data Integrity Tests
    
    func test_spendingCategories_shouldHaveUniqueIds() {
        let mockData = SpendingData.mock
        let ids = mockData.categories.map { $0.id }
        let uniqueIds = Set(ids)
        
        XCTAssertEqual(ids.count, uniqueIds.count)
    }
    
    func test_spendingCategories_shouldHaveValidAmounts() {
        let testData = [SpendingData.mock, SpendingData.mockDaily, SpendingData.mockMonthly]
        
        for data in testData {
            XCTAssertGreaterThanOrEqual(data.totalAmount, 0)
            
            for category in data.categories {
                XCTAssertGreaterThanOrEqual(category.amount, 0)
                XCTAssertFalse(category.name.isEmpty)
            }
        }
    }
    
    func test_spendingCategories_shouldHaveNonEmptyNames() {
        let testData = [SpendingData.mock, SpendingData.mockDaily, SpendingData.mockMonthly]
        
        for data in testData {
            for category in data.categories {
                XCTAssertFalse(category.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }
    
    // MARK: - Equatable Tests
    
    func test_spendingData_equatable_shouldWorkCorrectly() {
        let data1 = SpendingData.mock
        let data2 = SpendingData.mock
        
        XCTAssertEqual(data1, data2)
    }
    
    func test_spendingData_equatable_shouldDetectDifferences() {
        let data1 = SpendingData.mock
        let data2 = SpendingData.mockDaily
        
        XCTAssertNotEqual(data1, data2)
    }
    
    func test_spendingCategory_equatable_shouldWorkCorrectly() {
        let category1 = SpendingCategory(name: "Food", amount: 100.0, color: .green)
        let category2 = SpendingCategory(name: "Food", amount: 100.0, color: .green)
        
        // Should be equal despite different UUIDs (Equatable implementation should ignore ID)
        XCTAssertEqual(category1, category2)
    }
    
    func test_spendingCategory_equatable_shouldDetectDifferences() {
        let category1 = SpendingCategory(name: "Food", amount: 100.0, color: .green)
        let category2 = SpendingCategory(name: "Transport", amount: 100.0, color: .green)
        
        XCTAssertNotEqual(category1, category2)
    }
    
    // MARK: - Edge Cases Tests
    
    func test_spendingData_withEmptyCategories_shouldBeValid() {
        let emptyData = SpendingData(
            totalAmount: 0,
            categories: [],
            period: .day
        )
        
        XCTAssertEqual(emptyData.totalAmount, 0)
        XCTAssertTrue(emptyData.categories.isEmpty)
        XCTAssertEqual(emptyData.period, .day)
    }
    
    func test_spendingData_withZeroAmounts_shouldBeValid() {
        let zeroData = SpendingData(
            totalAmount: 0,
            categories: [
                SpendingCategory(name: "Food", amount: 0, color: .green)
            ],
            period: .week
        )
        
        XCTAssertEqual(zeroData.totalAmount, 0)
        XCTAssertEqual(zeroData.categories.first?.amount, 0)
    }
    
    // MARK: - Performance Tests
    
    func test_mockDataCreation_shouldBePerformant() {
        measure {
            for _ in 0..<1000 {
                _ = SpendingData.mock
                _ = SpendingData.mockDaily
                _ = SpendingData.mockMonthly
            }
        }
    }
    
    func test_categoriesAccess_shouldBePerformant() {
        let mockData = SpendingData.mock
        
        measure {
            for _ in 0..<1000 {
                _ = mockData.categories.map { $0.name }
                _ = mockData.categories.map { $0.amount }
            }
        }
    }
}