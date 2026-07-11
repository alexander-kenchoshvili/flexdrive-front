type PageReadyWaiter = {
  path: string;
  resolve: () => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

const PAGE_READY_FALLBACK_MS = 10_000;

let pendingPath: string | null = null;
let readyPath: string | null = null;
const waiters = new Set<PageReadyWaiter>();

const settleWaiter = (waiter: PageReadyWaiter) => {
  clearTimeout(waiter.timeoutId);
  waiters.delete(waiter);
  waiter.resolve();
};

export const markPagePending = (path: string) => {
  pendingPath = path;
};

export const markPageReady = (path: string) => {
  if (pendingPath === path) {
    pendingPath = null;
  }
  readyPath = path;

  for (const waiter of waiters) {
    if (waiter.path === path) {
      settleWaiter(waiter);
    }
  }
};

export const waitForPageReady = (path: string) => {
  if (!import.meta.client || (readyPath === path && pendingPath !== path)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const waiter: PageReadyWaiter = {
      path,
      resolve,
      timeoutId: setTimeout(() => settleWaiter(waiter), PAGE_READY_FALLBACK_MS),
    };

    waiters.add(waiter);
  });
};
