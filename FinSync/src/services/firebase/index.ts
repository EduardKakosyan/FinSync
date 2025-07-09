/**
 * Firebase Services Export
 * Central export for all Firebase services
 */

export { default as firebaseApp, db, storage, auth, functions } from './FirebaseConfig';
export { firebaseTransactionService } from './FirebaseTransactionService';
export { firebaseCategoryService } from './FirebaseCategoryService';
export { firebaseAccountService } from './FirebaseAccountService';
export { firebaseMigrationService } from './FirebaseMigrationService';

// Re-export types
export type { FirebaseTransaction } from './FirebaseTransactionService';
export type { FirebaseCategory } from './FirebaseCategoryService';
export type { FirebaseAccount } from './FirebaseAccountService';
export type { MigrationProgress, MigrationResult } from './FirebaseMigrationService';