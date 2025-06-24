//
//  CameraService.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-24.
//

import Foundation
import UIKit
import AVFoundation

protocol CameraServiceProtocol {
    func checkCameraPermission() async -> CameraPermissionStatus
    func requestCameraPermission() async -> Bool
    func saveReceiptImage(_ image: UIImage) async throws -> String
    func loadReceiptImage(from path: String) -> UIImage?
}

class CameraService: CameraServiceProtocol {
    
    func checkCameraPermission() async -> CameraPermissionStatus {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .notDetermined:
            return .notDetermined
        case .authorized:
            return .granted
        case .denied:
            return .denied
        case .restricted:
            return .restricted
        @unknown default:
            return .denied
        }
    }
    
    func requestCameraPermission() async -> Bool {
        return await withCheckedContinuation { continuation in
            AVCaptureDevice.requestAccess(for: .video) { granted in
                continuation.resume(returning: granted)
            }
        }
    }
    
    func saveReceiptImage(_ image: UIImage) async throws -> String {
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            throw CameraError.saveFailed
        }
        
        let filename = "receipt_\(UUID().uuidString).jpg"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, 
                                                   in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(filename)
        
        do {
            try imageData.write(to: fileURL)
            return filename
        } catch {
            throw CameraError.saveFailed
        }
    }
    
    func loadReceiptImage(from path: String) -> UIImage? {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, 
                                                   in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(path)
        return UIImage(contentsOfFile: fileURL.path)
    }
}

class MockCameraService: CameraServiceProtocol {
    var shouldGrantPermission = true
    var shouldFailSave = false
    var permissionStatus: CameraPermissionStatus = .notDetermined
    
    func checkCameraPermission() async -> CameraPermissionStatus {
        return permissionStatus
    }
    
    func requestCameraPermission() async -> Bool {
        if shouldGrantPermission {
            permissionStatus = .granted
        } else {
            permissionStatus = .denied
        }
        return shouldGrantPermission
    }
    
    func saveReceiptImage(_ image: UIImage) async throws -> String {
        if shouldFailSave {
            throw CameraError.saveFailed
        }
        return "mock_receipt_\(UUID().uuidString).jpg"
    }
    
    func loadReceiptImage(from path: String) -> UIImage? {
        // Return a simple 1x1 red image for testing
        UIGraphicsBeginImageContext(CGSize(width: 1, height: 1))
        UIColor.red.setFill()
        UIRectFill(CGRect(x: 0, y: 0, width: 1, height: 1))
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return image
    }
}