//
//  HomeView.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                VStack(spacing: 20) {
                    TimePeriodSelector(
                        selectedPeriod: $viewModel.selectedPeriod,
                        onPeriodChanged: { period in
                            Task {
                                await viewModel.updatePeriod(period)
                            }
                        }
                    )
                    .accessibilityIdentifier("time-period-selector")
                    
                    if viewModel.isLoading {
                        ProgressView("Loading...")
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else if let errorMessage = viewModel.errorMessage {
                        ErrorView(message: errorMessage) {
                            Task {
                                await viewModel.updatePeriod(viewModel.selectedPeriod)
                            }
                        }
                    } else {
                        SpendingCardView(spendingData: viewModel.spendingData)
                            .accessibilityIdentifier("spending-card")
                        
                        CategoryBreakdownView(categories: viewModel.spendingData.categories)
                            .accessibilityIdentifier("category-breakdown")
                    }
                    
                    Spacer()
                }
                .padding()
                
                // Floating receipt capture button
                ReceiptCaptureButton()
            }
            .navigationTitle("FinSync")
        }
    }
}

struct TimePeriodSelector: View {
    @Binding var selectedPeriod: TimePeriod
    let onPeriodChanged: (TimePeriod) -> Void
    
    var body: some View {
        Picker("Time Period", selection: $selectedPeriod) {
            ForEach(TimePeriod.allCases) { period in
                Text(period.rawValue)
                    .tag(period)
            }
        }
        .pickerStyle(.segmented)
        .onChange(of: selectedPeriod) { _, newPeriod in
            onPeriodChanged(newPeriod)
        }
    }
}

struct SpendingCardView: View {
    let spendingData: SpendingData
    
    var body: some View {
        VStack(spacing: 12) {
            Text("Total Spending")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text(spendingData.totalAmount, format: .currency(code: "CAD"))
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .accessibilityIdentifier("spending-amount")
            
            Text("for \(spendingData.period.rawValue.lowercased())")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .background(.background)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
    }
}

struct CategoryBreakdownView: View {
    let categories: [SpendingCategory]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Categories")
                .font(.headline)
                .padding(.horizontal)
            
            if categories.isEmpty {
                Text("No spending data available")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                List(categories) { category in
                    CategoryRowView(category: category)
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                }
                .listStyle(.plain)
                .frame(maxHeight: 200)
            }
        }
    }
}

struct CategoryRowView: View {
    let category: SpendingCategory
    
    var body: some View {
        HStack {
            Circle()
                .fill(category.color)
                .frame(width: 12, height: 12)
            
            Text(category.name)
                .font(.body)
            
            Spacer()
            
            Text(category.amount, format: .currency(code: "CAD"))
                .font(.body.weight(.medium))
        }
        .padding(.vertical, 4)
    }
}

struct ErrorView: View {
    let message: String
    let onRetry: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.orange)
            
            Text("Error")
                .font(.headline)
            
            Text(message)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
            
            Button("Retry", action: onRetry)
                .buttonStyle(.bordered)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    HomeView()
}