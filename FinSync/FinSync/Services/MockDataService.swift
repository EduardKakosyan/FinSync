//
//  MockDataService.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import Foundation

protocol DataServiceProtocol {
    func fetchSpendingData(for period: TimePeriod) async throws -> SpendingData
}

enum DataServiceError: LocalizedError {
    case networkFailure
    case invalidPeriod
    case dataCorrupted
    
    var errorDescription: String? {
        switch self {
        case .networkFailure:
            return "Failed to load spending data"
        case .invalidPeriod:
            return "Invalid time period selected"
        case .dataCorrupted:
            return "Spending data is corrupted"
        }
    }
}

final class MockDataService: DataServiceProtocol {
    private var shouldSimulateError = false
    private var simulatedDelay: TimeInterval = 0.1
    
    func fetchSpendingData(for period: TimePeriod) async throws -> SpendingData {
        // Simulate network delay
        try await Task.sleep(nanoseconds: UInt64(simulatedDelay * 1_000_000_000))
        
        if shouldSimulateError {
            throw DataServiceError.networkFailure
        }
        
        switch period {
        case .day:
            return .mockDaily
        case .week:
            return .mock
        case .month:
            return .mockMonthly
        }
    }
    
    // Test helpers
    func simulateError(_ shouldError: Bool = true) {
        shouldSimulateError = shouldError
    }
    
    func setSimulatedDelay(_ delay: TimeInterval) {
        simulatedDelay = delay
    }
}