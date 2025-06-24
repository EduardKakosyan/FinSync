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
        // Auto-load data when period changes
        $selectedPeriod
            .removeDuplicates()
            .dropFirst() // Skip initial value to avoid double loading
            .sink { [weak self] period in
                Task { @MainActor in
                    await self?.loadSpendingData()
                }
            }
            .store(in: &cancellables)
    }
    
    func updatePeriod(_ period: TimePeriod) async {
        guard selectedPeriod != period else { return }
        
        selectedPeriod = period
        await loadSpendingData()
    }
    
    private func loadSpendingData() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let data = try await dataService.fetchSpendingData(for: selectedPeriod)
            spendingData = data
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
}