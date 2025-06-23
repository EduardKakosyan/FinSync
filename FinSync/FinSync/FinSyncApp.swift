//
//  FinSyncApp.swift
//  FinSync
//
//  Created by Eduard Kakosyan on 2025-06-23.
//

import SwiftUI

@main
struct FinSyncApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
