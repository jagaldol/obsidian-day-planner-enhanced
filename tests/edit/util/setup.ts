import type { Moment } from "moment/moment";
import moment from "moment/moment";
import { writable } from "svelte/store";
import { vi } from "vitest";

import type { PeriodicNotes } from "../../../src/service/periodic-notes";
import { WorkspaceFacade } from "../../../src/service/workspace-facade";
import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../../src/settings";
import type { LocalTask, RemoteTask } from "../../../src/task-types";
import type { PointerDateTime } from "../../../src/types";
import { useEditContext } from "../../../src/ui/hooks/use-edit/use-edit-context";

import { baseTasks } from "./fixtures";

const noop = () => undefined;

function createProps({
  remoteTasks,
  tasks,
  settings,
}: {
  remoteTasks: RemoteTask[];
  tasks: LocalTask[];
  settings: DayPlannerSettings;
}) {
  const onUpdate = vi.fn().mockResolvedValue(true);
  const onEditAborted = vi.fn();
  const workspaceFacade = vi.fn() as unknown as WorkspaceFacade;

  return {
    settings: writable(settings),
    onUpdate,
    onEditAborted,
    workspaceFacade,
    abortEditTrigger: writable(),
    localTasks: writable(tasks),
    remoteTasks: writable(remoteTasks),
    pointerDateTime: writable<PointerDateTime>({
      dateTime: moment("2023-01-01 00:00"),
      type: "dateTime",
    }),
    periodicNotes: {
      getDateFromPath: vi.fn(() => null),
      getDailyNoteSettings: vi.fn(() => ({
        format: "YYYY-MM-DD",
        folder: ".",
      })),
    } as unknown as PeriodicNotes,
  };
}

export function setUp({
  remoteTasks = [],
  tasks = baseTasks,
  settings = defaultSettingsForTests,
}: {
  remoteTasks?: RemoteTask[];
  tasks?: LocalTask[];
  settings?: DayPlannerSettings;
} = {}) {
  const props = createProps({ remoteTasks, tasks, settings });
  const {
    handlers,
    dayToDisplayedTasks,
    getDisplayedTasksForTimeline,
    getDisplayedAllDayTasksForMultiDayRow,
    confirmEdit,
  } = useEditContext(props);

  // this prevents the store from resetting;
  dayToDisplayedTasks.subscribe(noop);
  getDisplayedAllDayTasksForMultiDayRow.subscribe(noop);

  function moveCursorTo(
    dateTime: Moment,
    type: "date" | "dateTime" = "dateTime",
  ) {
    props.pointerDateTime.set({
      dateTime,
      type,
    });
  }

  return {
    handlers,
    moveCursorTo,
    dayToDisplayedTasks,
    getDisplayedTasksForTimeline,
    getDisplayedAllDayTasksForMultiDayRow,
    confirmEdit,
    props,
  };
}
