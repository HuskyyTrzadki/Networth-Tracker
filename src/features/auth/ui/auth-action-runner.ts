export type AuthActionRunnerConfig<TResult> = Readonly<{
  before: () => void;
  run: () => Promise<TResult>;
  onSuccess?: (result: TResult) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
  after: () => void;
}>;

export async function runAuthAction<TResult>(
  config: AuthActionRunnerConfig<TResult>
): Promise<void> {
  config.before();

  try {
    const result = await config.run();
    await config.onSuccess?.(result);
  } catch (error) {
    await config.onError?.(error);
  } finally {
    config.after();
  }
}
