export const throttle = <T extends (...args: any[]) => void>(fn: T, ms: number) => {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last > ms) {
      last = now;
      fn(...args);
    }
  };
};