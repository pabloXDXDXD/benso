export async function withRetry<T>(
  fn: () => PromiseLike<{ data: T | null; error: unknown }>,
  attempts = 3,
): Promise<{ data: T | null; error: unknown }> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const result = await fn();
    if (!result.error) return result;
    lastError = result.error;
    if (attempt < attempts - 1) {
      const delayMs = 500 * Math.pow(2, attempt); // 500ms, 1000ms
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return { data: null, error: lastError };
}
