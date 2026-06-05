/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import type { Component } from "svelte";

import { viewTypeTimeTracker } from "../constants";
import type { ComponentContext } from "../types";

import TimeTrackerWithControls from "./components/time-tracker-with-controls.svelte";

export default class TimeTrackerView extends ItemView {
  private component?: Component;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly componentContext: ComponentContext,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return viewTypeTimeTracker;
  }

  getDisplayText(): string {
    return "Time Tracker";
  }

  getIcon() {
    return "timer";
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];

    contentEl.addClass("planner-flex-container");

    // @ts-expect-error
    this.component = mount(TimeTrackerWithControls, {
      target: contentEl,
      context: this.componentContext,
    });
  }

  async onClose() {
    if (this.component) {
      await unmount(this.component);
    }
  }
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
