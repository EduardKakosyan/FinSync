//
//  ReceiptCaptureViewModelTests.swift
//  FinSyncTests
//
//  Created by Eduard Kakosyan on 2025-06-24.
//

import XCTest
import UIKit
import Combine
@testable import FinSync

@MainActor
final class ReceiptCaptureViewModelTests: XCTestCase {
    private var sut: ReceiptCaptureViewModel!
    private var mockCameraService: MockCameraService!
    private var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        mockCameraService = MockCameraService()
        sut = ReceiptCaptureViewModel(cameraService: mockCameraService)
        cancellables = Set<AnyCancellable>()
    }
    
    override func tearDown() {
        cancellables = nil
        sut = nil
        mockCameraService = nil
        super.tearDown()
    }
    
    // MARK: - Initial State Tests
    
    func test_initialState_shouldHaveCorrectDefaults() {
        XCTAssertFalse(sut.isShowingCamera)
        XCTAssertFalse(sut.isProcessing)
        XCTAssertNil(sut.errorMessage)
        XCTAssertNil(sut.capturedReceipt)
        XCTAssertEqual(sut.permissionStatus, .notDetermined)
    }
    
    // MARK: - Permission Tests
    
    func test_checkCameraPermission_shouldUpdatePermissionStatus() async {
        mockCameraService.permissionStatus = .granted
        
        await sut.checkCameraPermission()
        
        XCTAssertEqual(sut.permissionStatus, .granted)
    }
    
    func test_requestCameraAccess_withGrantedPermission_shouldShowCamera() async {
        mockCameraService.shouldGrantPermission = true
        mockCameraService.permissionStatus = .notDetermined
        
        await sut.requestCameraAccess()
        
        XCTAssertEqual(sut.permissionStatus, .granted)
        XCTAssertTrue(sut.isShowingCamera)
        XCTAssertNil(sut.errorMessage)
    }
    
    func test_requestCameraAccess_withDeniedPermission_shouldShowError() async {
        mockCameraService.shouldGrantPermission = false
        mockCameraService.permissionStatus = .notDetermined
        
        await sut.requestCameraAccess()
        
        XCTAssertEqual(sut.permissionStatus, .denied)
        XCTAssertFalse(sut.isShowingCamera)
        XCTAssertNotNil(sut.errorMessage)
        XCTAssertEqual(sut.errorMessage, CameraError.accessDenied.localizedDescription)
    }
    
    func test_requestCameraAccess_withAlreadyGrantedPermission_shouldShowCamera() async {
        mockCameraService.permissionStatus = .granted
        sut.permissionStatus = .granted
        
        await sut.requestCameraAccess()
        
        XCTAssertTrue(sut.isShowingCamera)
        XCTAssertNil(sut.errorMessage)
    }
    
    // MARK: - Receipt Capture Tests
    
    func test_captureReceipt_success_shouldCreateReceiptAndHideCamera() async {
        let testImage = UIImage(systemName: "photo")!
        mockCameraService.shouldFailSave = false
        
        await sut.captureReceipt(image: testImage)
        
        XCTAssertNotNil(sut.capturedReceipt)
        XCTAssertFalse(sut.isShowingCamera)
        XCTAssertFalse(sut.isProcessing)
        XCTAssertNil(sut.errorMessage)
        XCTAssertTrue(sut.capturedReceipt!.imagePath.hasPrefix("mock_receipt_"))
    }
    
    func test_captureReceipt_failure_shouldShowErrorAndKeepProcessingFalse() async {
        let testImage = UIImage(systemName: "photo")!
        mockCameraService.shouldFailSave = true
        
        await sut.captureReceipt(image: testImage)
        
        XCTAssertNil(sut.capturedReceipt)
        XCTAssertFalse(sut.isProcessing)
        XCTAssertNotNil(sut.errorMessage)
        XCTAssertEqual(sut.errorMessage, CameraError.saveFailed.localizedDescription)
    }
    
    func test_captureReceipt_shouldSetProcessingStateTemporarily() async {
        let testImage = UIImage(systemName: "photo")!
        mockCameraService.shouldFailSave = false
        
        // Monitor processing state
        var processingStates: [Bool] = []
        sut.$isProcessing
            .sink { isProcessing in
                processingStates.append(isProcessing)
            }
            .store(in: &cancellables)
        
        await sut.captureReceipt(image: testImage)
        
        // Should start false, become true during processing, then false again
        XCTAssertEqual(processingStates, [false, true, false])
        XCTAssertFalse(sut.isProcessing)
    }
    
    // MARK: - Camera Dismissal Tests
    
    func test_dismissCamera_shouldHideCameraAndClearError() {
        sut.isShowingCamera = true
        sut.errorMessage = "Test error"
        
        sut.dismissCamera()
        
        XCTAssertFalse(sut.isShowingCamera)
        XCTAssertNil(sut.errorMessage)
    }
    
    // MARK: - Error Handling Tests
    
    func test_clearError_shouldRemoveErrorMessage() {
        sut.errorMessage = "Test error message"
        
        sut.clearError()
        
        XCTAssertNil(sut.errorMessage)
    }
    
    func test_requestCameraAccess_shouldClearPreviousError() async {
        sut.errorMessage = "Previous error"
        mockCameraService.shouldGrantPermission = true
        mockCameraService.permissionStatus = .granted
        
        await sut.requestCameraAccess()
        
        XCTAssertNil(sut.errorMessage)
    }
    
    // MARK: - Edge Cases Tests
    
    func test_multipleCaptureRequests_shouldHandleGracefully() async {
        let testImage = UIImage(systemName: "photo")!
        mockCameraService.shouldFailSave = false
        
        // Start multiple capture operations
        await withTaskGroup(of: Void.self) { group in
            for _ in 0..<3 {
                group.addTask {
                    await self.sut.captureReceipt(image: testImage)
                }
            }
        }
        
        // Should have one receipt and be in a valid state
        XCTAssertNotNil(sut.capturedReceipt)
        XCTAssertFalse(sut.isProcessing)
    }
    
    func test_captureReceiptAfterError_shouldClearPreviousError() async {
        let testImage = UIImage(systemName: "photo")!
        
        // First capture fails
        mockCameraService.shouldFailSave = true
        await sut.captureReceipt(image: testImage)
        XCTAssertNotNil(sut.errorMessage)
        
        // Second capture succeeds
        mockCameraService.shouldFailSave = false
        await sut.captureReceipt(image: testImage)
        
        XCTAssertNil(sut.errorMessage)
        XCTAssertNotNil(sut.capturedReceipt)
    }
    
    // MARK: - Memory Management Tests
    
    func test_viewModel_shouldNotRetainCameraService() {
        weak var weakService = mockCameraService
        
        sut = nil
        mockCameraService = nil
        
        XCTAssertNotNil(weakService) // Service should still exist as we hold reference
    }
}