/**
 * Firebase Migration Hook for FinSync
 * Handles automatic migration on app startup
 */

import { useEffect, useState } from 'react';
import { firebaseMigrationService } from '../services/firebase';
import type { MigrationResult, MigrationProgress } from '../services/firebase';

export interface UseMigrationResult {
  isMigrating: boolean;
  migrationComplete: boolean;
  migrationResult: MigrationResult | null;
  migrationProgress: MigrationProgress | null;
  error: string | null;
}

export function useFirebaseMigration(): UseMigrationResult {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAndMigrate = async () => {
      try {
        // Check if migration has already been performed
        const isMigrated = await firebaseMigrationService.isMigrated();
        
        if (isMigrated) {
          setMigrationComplete(true);
          return;
        }

        // Start migration
        setIsMigrating(true);
        console.log('Starting Firebase migration...');

        const result = await firebaseMigrationService.migrateToFirebase((progress) => {
          setMigrationProgress(progress);
          console.log(`Migration progress: ${progress.currentStep} (${progress.completed}/${progress.total})`);
        });

        setMigrationResult(result);
        setMigrationComplete(true);

        if (result.success) {
          console.log('Migration completed successfully!', result);
        } else {
          console.error('Migration completed with errors:', result.errors);
          setError(result.errors.join(', '));
        }
      } catch (err) {
        console.error('Migration failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown migration error');
      } finally {
        setIsMigrating(false);
      }
    };

    checkAndMigrate();
  }, []);

  return {
    isMigrating,
    migrationComplete,
    migrationResult,
    migrationProgress,
    error,
  };
}

export default useFirebaseMigration;