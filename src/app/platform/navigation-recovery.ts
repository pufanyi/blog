const RECOVERY_KEY = 'blogDynamicImportRecovery';
const RETRY_WINDOW_MS = 30_000;

interface RecoveryAttempt {
  url: string;
  attemptedAt: number;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

export function isDynamicImportFailure(error: unknown): boolean {
  return /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk .+ failed/i.test(
    errorText(error),
  );
}

export function claimDynamicImportRecovery(
  getStorage: () => Storage,
  url: string,
  error: unknown,
  now = Date.now(),
): boolean {
  if (!isDynamicImportFailure(error)) return false;
  try {
    const storage = getStorage();
    const previous = JSON.parse(storage.getItem(RECOVERY_KEY) ?? 'null') as RecoveryAttempt | null;
    if (
      previous?.url === url &&
      Number.isFinite(previous.attemptedAt) &&
      now - previous.attemptedAt < RETRY_WINDOW_MS
    )
      return false;
    storage.setItem(RECOVERY_KEY, JSON.stringify({ url, attemptedAt: now }));
    return true;
  } catch {
    // Without storage there is no safe way to prevent a reload loop.
    return false;
  }
}
