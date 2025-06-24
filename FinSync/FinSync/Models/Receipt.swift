//
//  Receipt.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-24.
//

import Foundation
import UIKit

struct Receipt: Identifiable, Codable {
    let id: UUID
    let imagePath: String
    let dateCreated: Date
    let amount: Decimal?
    let merchantName: String?
    let category: String?
    
    init(id: UUID = UUID(), 
         imagePath: String, 
         dateCreated: Date = Date(),
         amount: Decimal? = nil,
         merchantName: String? = nil,
         category: String? = nil) {
        self.id = id
        self.imagePath = imagePath
        self.dateCreated = dateCreated
        self.amount = amount
        self.merchantName = merchantName
        self.category = category
    }
    
    static let mock = Receipt(
        imagePath: "mock_receipt_001.jpg",
        amount: Decimal(45.67),
        merchantName: "Coffee Shop",
        category: "Food"
    )
}

enum CameraError: LocalizedError {
    case accessDenied
    case cameraUnavailable
    case captureFailed
    case saveFailed
    
    var errorDescription: String? {
        switch self {
        case .accessDenied:
            return "Camera access denied. Please enable camera permissions in Settings."
        case .cameraUnavailable:
            return "Camera is not available on this device."
        case .captureFailed:
            return "Failed to capture receipt image."
        case .saveFailed:
            return "Failed to save receipt image."
        }
    }
}

enum CameraPermissionStatus {
    case notDetermined
    case granted
    case denied
    case restricted
}