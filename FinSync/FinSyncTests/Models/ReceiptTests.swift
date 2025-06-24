//
//  ReceiptTests.swift
//  FinSyncTests
//
//  Created by Eduard Kakosyan on 2025-06-24.
//

import XCTest
@testable import FinSync

final class ReceiptTests: XCTestCase {
    
    // MARK: - Initialization Tests
    
    func test_receipt_initialization_withAllParameters_shouldSetCorrectValues() {
        let id = UUID()
        let imagePath = "test_receipt.jpg"
        let dateCreated = Date()
        let amount = Decimal(123.45)
        let merchantName = "Test Store"
        let category = "Shopping"
        
        let receipt = Receipt(
            id: id,
            imagePath: imagePath,
            dateCreated: dateCreated,
            amount: amount,
            merchantName: merchantName,
            category: category
        )
        
        XCTAssertEqual(receipt.id, id)
        XCTAssertEqual(receipt.imagePath, imagePath)
        XCTAssertEqual(receipt.dateCreated, dateCreated)
        XCTAssertEqual(receipt.amount, amount)
        XCTAssertEqual(receipt.merchantName, merchantName)
        XCTAssertEqual(receipt.category, category)
    }
    
    func test_receipt_initialization_withMinimalParameters_shouldSetDefaults() {
        let imagePath = "minimal_receipt.jpg"
        
        let receipt = Receipt(imagePath: imagePath)
        
        XCTAssertNotNil(receipt.id)
        XCTAssertEqual(receipt.imagePath, imagePath)
        XCTAssertNotNil(receipt.dateCreated)
        XCTAssertNil(receipt.amount)
        XCTAssertNil(receipt.merchantName)
        XCTAssertNil(receipt.category)
    }
    
    func test_receipt_initialization_shouldGenerateUniqueIDs() {
        let receipt1 = Receipt(imagePath: "receipt1.jpg")
        let receipt2 = Receipt(imagePath: "receipt2.jpg")
        
        XCTAssertNotEqual(receipt1.id, receipt2.id)
    }
    
    // MARK: - Mock Data Tests
    
    func test_mockReceipt_shouldHaveValidData() {
        let mockReceipt = Receipt.mock
        
        XCTAssertEqual(mockReceipt.imagePath, "mock_receipt_001.jpg")
        XCTAssertEqual(mockReceipt.amount, Decimal(45.67))
        XCTAssertEqual(mockReceipt.merchantName, "Coffee Shop")
        XCTAssertEqual(mockReceipt.category, "Food")
        XCTAssertNotNil(mockReceipt.id)
        XCTAssertNotNil(mockReceipt.dateCreated)
    }
    
    // MARK: - Codable Tests
    
    func test_receipt_codable_shouldEncodeAndDecodeCorrectly() throws {
        let originalReceipt = Receipt(
            imagePath: "test_receipt.jpg",
            amount: Decimal(99.99),
            merchantName: "Test Merchant",
            category: "Test Category"
        )
        
        let encodedData = try JSONEncoder().encode(originalReceipt)
        let decodedReceipt = try JSONDecoder().decode(Receipt.self, from: encodedData)
        
        XCTAssertEqual(decodedReceipt.id, originalReceipt.id)
        XCTAssertEqual(decodedReceipt.imagePath, originalReceipt.imagePath)
        XCTAssertEqual(decodedReceipt.amount, originalReceipt.amount)
        XCTAssertEqual(decodedReceipt.merchantName, originalReceipt.merchantName)
        XCTAssertEqual(decodedReceipt.category, originalReceipt.category)
    }
}

// MARK: - CameraError Tests

final class CameraErrorTests: XCTestCase {
    
    func test_cameraErrors_shouldHaveCorrectDescriptions() {
        XCTAssertEqual(
            CameraError.accessDenied.localizedDescription,
            "Camera access denied. Please enable camera permissions in Settings."
        )
        
        XCTAssertEqual(
            CameraError.cameraUnavailable.localizedDescription,
            "Camera is not available on this device."
        )
        
        XCTAssertEqual(
            CameraError.captureFailed.localizedDescription,
            "Failed to capture receipt image."
        )
        
        XCTAssertEqual(
            CameraError.saveFailed.localizedDescription,
            "Failed to save receipt image."
        )
    }
}

// MARK: - CameraPermissionStatus Tests

final class CameraPermissionStatusTests: XCTestCase {
    
    func test_cameraPermissionStatus_shouldHaveAllCases() {
        let allCases: [CameraPermissionStatus] = [
            .notDetermined,
            .granted,
            .denied,
            .restricted
        ]
        
        XCTAssertEqual(allCases.count, 4)
    }
}