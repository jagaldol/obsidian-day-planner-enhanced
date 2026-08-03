import type { ConfirmationModalProps } from "./confirmation-modal";

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

export function getTimeTrackerDisableConfirmation(
  activeClockCount: number,
): ConfirmationModalProps | undefined {
  if (activeClockCount <= 0) {
    return undefined;
  }

  const text =
    activeClockCount === 1
      ? "1 active clock is still running. Its record will remain open, but clock controls will be hidden until you enable Time Tracker again."
      : `${activeClockCount} active clocks are still running. Their records will remain open, but clock controls will be hidden until you enable Time Tracker again.`;

  return {
    cta: "Disable",
    text,
    title: "Disable Time Tracker?",
    variant: "warning",
  };
}
