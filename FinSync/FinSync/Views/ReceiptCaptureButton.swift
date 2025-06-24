//
//  ReceiptCaptureButton.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-24.
//

import SwiftUI
import UIKit

struct ReceiptCaptureButton: View {
    @StateObject private var viewModel = ReceiptCaptureViewModel()
    
    var body: some View {
        VStack {
            Spacer()
            
            HStack {
                Spacer()
                
                Button(action: {
                    Task {
                        await viewModel.requestCameraAccess()
                    }
                }) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 56, height: 56)
                        .background(Color.blue)
                        .clipShape(Circle())
                        .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
                }
                .accessibilityLabel("Capture Receipt")
                .accessibilityHint("Opens camera to capture a receipt image")
                .accessibilityIdentifier("receipt-capture-button")
                .disabled(viewModel.isProcessing)
                .opacity(viewModel.isProcessing ? 0.6 : 1.0)
                
                if viewModel.isProcessing {
                    ProgressView()
                        .scaleEffect(0.8)
                        .padding(.leading, 8)
                }
            }
            .padding(.trailing, 16)
            .padding(.bottom, 32)
        }
        .sheet(isPresented: $viewModel.isShowingCamera) {
            CameraView(viewModel: viewModel)
        }
        .alert("Camera Error", isPresented: .constant(viewModel.errorMessage != nil)) {
            if viewModel.permissionStatus == .denied {
                Button("Settings") {
                    viewModel.openSettings()
                }
                Button("Cancel") {
                    viewModel.clearError()
                }
            } else {
                Button("OK") {
                    viewModel.clearError()
                }
            }
        } message: {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
            }
        }
        .task {
            await viewModel.checkCameraPermission()
        }
    }
}

struct CameraView: UIViewControllerRepresentable {
    let viewModel: ReceiptCaptureViewModel
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .camera
        picker.cameraDevice = .rear
        picker.cameraCaptureMode = .photo
        picker.allowsEditing = true
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(viewModel: viewModel)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let viewModel: ReceiptCaptureViewModel
        
        init(viewModel: ReceiptCaptureViewModel) {
            self.viewModel = viewModel
        }
        
        func imagePickerController(_ picker: UIImagePickerController, 
                                 didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            
            let image = info[.editedImage] as? UIImage ?? info[.originalImage] as? UIImage
            
            if let capturedImage = image {
                Task { @MainActor in
                    await viewModel.captureReceipt(image: capturedImage)
                }
            } else {
                Task { @MainActor in
                    viewModel.errorMessage = CameraError.captureFailed.localizedDescription
                    viewModel.dismissCamera()
                }
            }
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            Task { @MainActor in
                viewModel.dismissCamera()
            }
        }
    }
}

#Preview {
    ZStack {
        Color.gray.opacity(0.1)
            .ignoresSafeArea()
        
        ReceiptCaptureButton()
    }
}