//
//  TimePeriodTests.swift
//  FinSyncTests
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import XCTest
@testable import FinSync

final class TimePeriodTests: XCTestCase {
    
    // MARK: - Enum Cases Tests
    
    func test_timePeriod_shouldHaveAllExpectedCases() {
        let allCases = TimePeriod.allCases
        
        XCTAssertEqual(allCases.count, 3)
        XCTAssertTrue(allCases.contains(.day))
        XCTAssertTrue(allCases.contains(.week))
        XCTAssertTrue(allCases.contains(.month))
    }
    
    func test_timePeriod_rawValues_shouldBeCorrect() {
        XCTAssertEqual(TimePeriod.day.rawValue, "Day")
        XCTAssertEqual(TimePeriod.week.rawValue, "Week")
        XCTAssertEqual(TimePeriod.month.rawValue, "Month")
    }
    
    // MARK: - Identifiable Protocol Tests
    
    func test_timePeriod_id_shouldEqualRawValue() {
        XCTAssertEqual(TimePeriod.day.id, "Day")
        XCTAssertEqual(TimePeriod.week.id, "Week")
        XCTAssertEqual(TimePeriod.month.id, "Month")
    }
    
    func test_timePeriod_ids_shouldBeUnique() {
        let allCases = TimePeriod.allCases
        let ids = allCases.map { $0.id }
        let uniqueIds = Set(ids)
        
        XCTAssertEqual(ids.count, uniqueIds.count)
    }
    
    // MARK: - String Initialization Tests
    
    func test_timePeriod_initFromString_shouldWorkCorrectly() {
        XCTAssertEqual(TimePeriod(rawValue: "Day"), .day)
        XCTAssertEqual(TimePeriod(rawValue: "Week"), .week)
        XCTAssertEqual(TimePeriod(rawValue: "Month"), .month)
    }
    
    func test_timePeriod_initFromInvalidString_shouldReturnNil() {
        XCTAssertNil(TimePeriod(rawValue: "Year"))
        XCTAssertNil(TimePeriod(rawValue: "day"))  // Case sensitive
        XCTAssertNil(TimePeriod(rawValue: ""))
        XCTAssertNil(TimePeriod(rawValue: "Invalid"))
    }
    
    // MARK: - CaseIterable Protocol Tests
    
    func test_timePeriod_allCases_shouldBeInExpectedOrder() {
        let allCases = TimePeriod.allCases
        
        XCTAssertEqual(allCases[0], .day)
        XCTAssertEqual(allCases[1], .week)
        XCTAssertEqual(allCases[2], .month)
    }
    
    func test_timePeriod_allCases_shouldNotBeEmpty() {
        XCTAssertFalse(TimePeriod.allCases.isEmpty)
    }
    
    // MARK: - Equatable Tests
    
    func test_timePeriod_equality_shouldWorkCorrectly() {
        XCTAssertEqual(TimePeriod.day, TimePeriod.day)
        XCTAssertEqual(TimePeriod.week, TimePeriod.week)
        XCTAssertEqual(TimePeriod.month, TimePeriod.month)
        
        XCTAssertNotEqual(TimePeriod.day, TimePeriod.week)
        XCTAssertNotEqual(TimePeriod.week, TimePeriod.month)
        XCTAssertNotEqual(TimePeriod.day, TimePeriod.month)
    }
    
    // MARK: - Hashable Tests
    
    func test_timePeriod_hashable_shouldWorkInSets() {
        let periodSet: Set<TimePeriod> = [.day, .week, .month, .day]
        
        XCTAssertEqual(periodSet.count, 3)
        XCTAssertTrue(periodSet.contains(.day))
        XCTAssertTrue(periodSet.contains(.week))
        XCTAssertTrue(periodSet.contains(.month))
    }
    
    func test_timePeriod_hashable_shouldWorkInDictionaries() {
        let periodCounts: [TimePeriod: Int] = [
            .day: 1,
            .week: 7,
            .month: 30
        ]
        
        XCTAssertEqual(periodCounts[.day], 1)
        XCTAssertEqual(periodCounts[.week], 7)
        XCTAssertEqual(periodCounts[.month], 30)
    }
    
    // MARK: - String Representation Tests
    
    func test_timePeriod_stringInterpolation_shouldUseRawValue() {
        let dayString = "\(TimePeriod.day.rawValue)"
        let weekString = "\(TimePeriod.week.rawValue)"
        let monthString = "\(TimePeriod.month.rawValue)"
        
        XCTAssertEqual(dayString, "Day")
        XCTAssertEqual(weekString, "Week")
        XCTAssertEqual(monthString, "Month")
    }
    
    // MARK: - Performance Tests
    
    func test_timePeriod_allCasesAccess_shouldBePerformant() {
        measure {
            for _ in 0..<10000 {
                _ = TimePeriod.allCases
            }
        }
    }
    
    func test_timePeriod_rawValueAccess_shouldBePerformant() {
        let periods = TimePeriod.allCases
        
        measure {
            for _ in 0..<10000 {
                for period in periods {
                    _ = period.rawValue
                }
            }
        }
    }
    
    // MARK: - Codable Tests (Future-proofing)
    
    func test_timePeriod_shouldBeEncodableAsString() {
        // This test assumes TimePeriod might become Codable in the future
        let day = TimePeriod.day
        let week = TimePeriod.week
        let month = TimePeriod.month
        
        // Test that raw values are stable for potential JSON encoding
        XCTAssertEqual(day.rawValue, "Day")
        XCTAssertEqual(week.rawValue, "Week")
        XCTAssertEqual(month.rawValue, "Month")
    }
}