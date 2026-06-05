/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { App } from "obsidian";

/**
 * Tasks API v1 interface
 *
 * Source: https://publish.obsidian.md/tasks/Advanced/Tasks+Api
 */
export interface TasksApiV1 {
  /**
   * Executes the 'Tasks: Toggle task done' command on the supplied line string
   *
   * @param line The markdown string of the task line being toggled
   * @param path The path to the file containing line
   * @returns The updated line string, which will contain two lines
   *          if a recurring task was completed.
   */
  executeToggleTaskDoneCommand: (line: string, path: string) => string;

  /**
   * Opens the Tasks UI and returns the Markdown string for the task entered.
   *
   * @returns {Promise<string>} A promise that contains the Markdown string for the task entered or
   * an empty string, if data entry was cancelled.
   */
  createTaskLineModal(): Promise<string>;
}

type AppWithTasksPlugin = App & {
  plugins: {
    plugins: Record<string, { apiV1?: TasksApiV1 } | undefined>;
  };
};

export const createGetTasksApi = (app: App) => (): TasksApiV1 | undefined => {
  return (app as AppWithTasksPlugin).plugins.plugins["obsidian-tasks-plugin"]
    ?.apiV1;
};
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
