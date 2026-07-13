type TimeTrackerViewActions = {
  openSilently: () => Promise<void>;
  detach: () => Promise<void>;
};

type TimeTrackerViewOperation = () => Promise<void>;

export function createTimeTrackerViewSynchronizer(
  actions: TimeTrackerViewActions,
) {
  let queue = Promise.resolve();

  const enqueue = (next: TimeTrackerViewOperation) => {
    const operation = queue.then(next);

    queue = operation.catch(() => undefined);

    return operation;
  };

  return {
    enqueue,
    sync: (enabled: boolean) =>
      enqueue(enabled ? actions.openSilently : actions.detach),
  };
}

export function createTimeTrackerCommandCheck(props: {
  isEnabled: () => boolean;
  execute: () => void;
}) {
  const { isEnabled, execute } = props;

  return (checking: boolean) => {
    if (!isEnabled()) {
      return false;
    }

    if (!checking) {
      execute();
    }

    return true;
  };
}
