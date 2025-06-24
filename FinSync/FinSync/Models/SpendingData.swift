//
//  SpendingData.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import Foundation
import SwiftUI

struct SpendingCategory: Identifiable, Equatable {
    let id = UUID()
    let name: String
    let amount: Decimal
    let color: Color
    
    static func == (lhs: SpendingCategory, rhs: SpendingCategory) -> Bool {
        lhs.name == rhs.name && lhs.amount == rhs.amount
    }
}

struct SpendingData: Equatable {
    let totalAmount: Decimal
    let categories: [SpendingCategory]
    let period: TimePeriod
    
    static let mock = SpendingData(
        totalAmount: 234.50,
        categories: [
            SpendingCategory(name: "Food", amount: 120.78, color: .green),
            SpendingCategory(name: "Transport", amount: 69.22, color: .blue),
            SpendingCategory(name: "Shopping", amount: 44.50, color: .orange)
        ],
        period: .week
    )
    
    static let mockDaily = SpendingData(
        totalAmount: 45.67,
        categories: [
            SpendingCategory(name: "Food", amount: 25.50, color: .green),
            SpendingCategory(name: "Transport", amount: 12.00, color: .blue),
            SpendingCategory(name: "Coffee", amount: 8.17, color: .brown)
        ],
        period: .day
    )
    
    static let mockMonthly = SpendingData(
        totalAmount: 1250.00,
        categories: [
            SpendingCategory(name: "Food", amount: 456.78, color: .green),
            SpendingCategory(name: "Transport", amount: 189.22, color: .blue),
            SpendingCategory(name: "Shopping", amount: 334.50, color: .orange),
            SpendingCategory(name: "Entertainment", amount: 269.50, color: .purple)
        ],
        period: .month
    )
}