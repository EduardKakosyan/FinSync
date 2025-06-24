//
//  ReceiptCaptureViewModel.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-24.
//

import Foundation
import UIKit
import Combine

@MainActor
class ReceiptCaptureViewModel: ObservableObject {
    @Published var isShowingCamera = false
    @Published var isProcessing = false
    @Published var errorMessage: String?
    @Published var capturedReceipt: Receipt?
    @Published var permissionStatus: CameraPermissionStatus = .notDetermined
    
    private let cameraService: CameraServiceProtocol
    private var cancellables = Set<AnyCancellable>()
    
    init(cameraService: CameraServiceProtocol = CameraService()) {
        self.cameraService = cameraService
    }
    
    func checkCameraPermission() async {
        permissionStatus = await cameraService.checkCameraPermission()
    }
    
    func requestCameraAccess() async {
        errorMessage = nil
        
        if permissionStatus == .notDetermined {
            let granted = await cameraService.requestCameraPermission()
            permissionStatus = granted ? .granted : .denied
        }
        
        if permissionStatus == .granted {
            isShowingCamera = true
        } else {
            errorMessage = CameraError.accessDenied.localizedDescription
        }
    }
    
    func captureReceipt(image: UIImage) async {
        isProcessing = true
        errorMessage = nil
        
        do {
            let imagePath = try await cameraService.saveReceiptImage(image)
            let receipt = Receipt(imagePath: imagePath)
            capturedReceipt = receipt
            isShowingCamera = false
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isProcessing = false
    }
    
    func dismissCamera() {
        isShowingCamera = false
        errorMessage = nil
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    func openSettings() {
        guard let settingsUrl = URL(string: UIApplication.openSettingsURLString),
              UIApplication.shared.canOpenURL(settingsUrl) else {
            return
        }
        UIApplication.shared.open(settingsUrl)
    }
}