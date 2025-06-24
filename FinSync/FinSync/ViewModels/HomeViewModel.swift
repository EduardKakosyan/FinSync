//
//  HomeViewModel.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import Foundation
import Combine

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var selectedPeriod: TimePeriod = .week
    @Published var spendingData: SpendingData = .mock
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let dataService: DataServiceProtocol
    private var cancellables = Set<AnyCancellable>()
    
    init(dataService: DataServiceProtocol = MockDataService()) {
        self.dataService = dataService
        setupBindings()
    }
    
    private func setupBindings() {
        // This will be implemented in the CODE phase
    }
    
    func updatePeriod(_ period: TimePeriod) async {
        // This will be implemented in the CODE phase
    }
    
    private func loadSpendingData() async {
        // This will be implemented in the CODE phase
    }
}