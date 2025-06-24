//
//  CameraServiceTests.swift
//  FinSyncTests
//
//  Created by Eduard Kakosyan on 2025-06-24.
//

import XCTest
import UIKit
@testable import FinSync

@MainActor
final class CameraServiceTests: XCTestCase {
    private var mockService: MockCameraService!
    
    override func setUp() {
        super.setUp()
        mockService = MockCameraService()
    }
    
    override func tearDown() {
        mockService = nil
        super.tearDown()
    }
    
    // MARK: - Permission Tests
    
    func test_checkCameraPermission_shouldReturnCurrentStatus() async {
        mockService.permissionStatus = .granted
        
        let status = await mockService.checkCameraPermission()
        
        XCTAssertEqual(status, .granted)
    }
    
    func test_requestCameraPermission_whenGranted_shouldReturnTrueAndUpdateStatus() async {
        mockService.shouldGrantPermission = true
        mockService.permissionStatus = .notDetermined
        
        let granted = await mockService.requestCameraPermission()
        
        XCTAssertTrue(granted)
        XCTAssertEqual(mockService.permissionStatus, .granted)
    }
    
    func test_requestCameraPermission_whenDenied_shouldReturnFalseAndUpdateStatus() async {
        mockService.shouldGrantPermission = false
        mockService.permissionStatus = .notDetermined
        
        let granted = await mockService.requestCameraPermission()
        
        XCTAssertFalse(granted)
        XCTAssertEqual(mockService.permissionStatus, .denied)
    }
    
    // MARK: - Image Saving Tests
    
    func test_saveReceiptImage_success_shouldReturnValidPath() async throws {
        let testImage = UIImage(systemName: "photo")!
        mockService.shouldFailSave = false
        
        let imagePath = try await mockService.saveReceiptImage(testImage)
        
        XCTAssertTrue(imagePath.hasPrefix("mock_receipt_"))
        XCTAssertTrue(imagePath.hasSuffix(".jpg"))
    }
    
    func test_saveReceiptImage_failure_shouldThrowError() async {
        let testImage = UIImage(systemName: "photo")!
        mockService.shouldFailSave = true
        
        do {
            _ = try await mockService.saveReceiptImage(testImage)
            XCTFail("Expected error to be thrown")
        } catch {
            XCTAssertTrue(error is CameraError)
            XCTAssertEqual(error as? CameraError, .saveFailed)
        }
    }
    
    func test_saveReceiptImage_multipleImages_shouldReturnUniquePaths() async throws {
        let testImage = UIImage(systemName: "photo")!
        mockService.shouldFailSave = false
        
        let path1 = try await mockService.saveReceiptImage(testImage)
        let path2 = try await mockService.saveReceiptImage(testImage)
        
        XCTAssertNotEqual(path1, path2)
    }
    
    // MARK: - Image Loading Tests
    
    func test_loadReceiptImage_shouldReturnValidImage() {
        let imagePath = "test_receipt.jpg"
        
        let loadedImage = mockService.loadReceiptImage(from: imagePath)
        
        XCTAssertNotNil(loadedImage)
    }
    
    func test_loadReceiptImage_shouldReturnConsistentImage() {
        let imagePath = "test_receipt.jpg"
        
        let image1 = mockService.loadReceiptImage(from: imagePath)
        let image2 = mockService.loadReceiptImage(from: imagePath)
        
        XCTAssertNotNil(image1)
        XCTAssertNotNil(image2)
        XCTAssertEqual(image1?.size, image2?.size)
    }
}

// MARK: - Real CameraService Tests

@MainActor
final class RealCameraServiceTests: XCTestCase {
    private var cameraService: CameraService!
    
    override func setUp() {
        super.setUp()
        cameraService = CameraService()
    }
    
    override func tearDown() {
        cameraService = nil
        super.tearDown()
    }
    
    func test_checkCameraPermission_shouldReturnValidStatus() async {
        let status = await cameraService.checkCameraPermission()
        
        // Should be one of the valid permission states
        let validStates: [CameraPermissionStatus] = [.notDetermined, .granted, .denied, .restricted]
        XCTAssertTrue(validStates.contains(status))
    }
    
    func test_saveReceiptImage_withValidImage_shouldCreateFile() async throws {
        // Create a simple test image
        UIGraphicsBeginImageContext(CGSize(width: 100, height: 100))
        UIColor.blue.setFill()
        UIRectFill(CGRect(x: 0, y: 0, width: 100, height: 100))
        let testImage = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        
        let imagePath = try await cameraService.saveReceiptImage(testImage)
        
        XCTAssertTrue(imagePath.hasPrefix("receipt_"))
        XCTAssertTrue(imagePath.hasSuffix(".jpg"))
        
        // Verify we can load the saved image
        let loadedImage = cameraService.loadReceiptImage(from: imagePath)
        XCTAssertNotNil(loadedImage)
        
        // Clean up - remove the test file
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(imagePath)
        try? FileManager.default.removeItem(at: fileURL)
    }
    
    func test_loadReceiptImage_withNonexistentPath_shouldReturnNil() {
        let nonexistentPath = "nonexistent_receipt.jpg"
        
        let loadedImage = cameraService.loadReceiptImage(from: nonexistentPath)
        
        XCTAssertNil(loadedImage)
    }
}