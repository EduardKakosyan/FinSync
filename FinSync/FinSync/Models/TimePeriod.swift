//
//  TimePeriod.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import Foundation

enum TimePeriod: String, CaseIterable, Identifiable {
    case day = "Day"
    case week = "Week"
    case month = "Month"
    
    var id: String { rawValue }
}