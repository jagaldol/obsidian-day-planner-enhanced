/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import { derived, get, type Writable } from "svelte/store";

import { dateRangeContextKey, viewTypeMultiDay } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { ComponentContext, DateRange } from "../types";
import type { Moment } from "../util/obsidian-moment";
import * as r from "../util/range";

import MultiDayGrid from "./components/multi-day/multi-day-grid.svelte";
import { useDateRanges } from "./hooks/use-date-ranges";

type LeafWithHeaderUpdate = WorkspaceLeaf & {
  updateHeader?: () => void;
};

type ViewWithTitleEl = {
  titleEl?: HTMLElement;
};

export default class MultiDayView extends ItemView {
  private static readonly defaultDisplayText = "Multi-Day View";
  navigation = true;
  private multiDayComponent?: Record<string, unknown>;
  private dateRange?: DateRange;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settings: Writable<DayPlannerSettings>,
    private readonly componentContext: ComponentContext,
    private readonly dateRanges: ReturnType<typeof useDateRanges>,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return viewTypeMultiDay;
  }

  getDisplayText(): string {
    if (!this.dateRange) {
      return MultiDayView.defaultDisplayText;
    }

    const currentDateRange = get(this.dateRange);

    if (!currentDateRange) {
      return MultiDayView.defaultDisplayText;
    }

    return r.toString(get(this.dateRange));
  }

  getIcon() {
    return "table-2";
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];
    const currentSettings = get(this.settings);

    const range = r.createRange(
      currentSettings.multiDayRange,
      currentSettings.firstDayOfWeek,
    );

    this.dateRange = this.dateRanges.trackRange(range);
    this.register(this.dateRange.subscribe(this.updateTabTitleAndHeader));

    const relevantSettingsSignal = derived(this.settings, ($settings) => {
      return {
        multiDayRange: $settings.multiDayRange,
        firstDayOfWeek: $settings.firstDayOfWeek,
      };
    });

    // todo: remove manual state synchronization
    const initialSettings = get(this.settings);
    let previousMultiDayRange = initialSettings.multiDayRange;
    let previousFirstDayOfWeek = initialSettings.firstDayOfWeek;

    this.register(
      relevantSettingsSignal.subscribe((next) => {
        if (
          next.multiDayRange !== previousMultiDayRange ||
          next.firstDayOfWeek !== previousFirstDayOfWeek
        ) {
          previousMultiDayRange = next.multiDayRange;
          previousFirstDayOfWeek = next.firstDayOfWeek;

          this.dateRange?.set(
            r.createRange(next.multiDayRange, next.firstDayOfWeek),
          );
        }
      }),
    );

    const context = new Map([
      ...this.componentContext,
      [dateRangeContextKey, this.dateRange],
    ]);

    this.multiDayComponent = mount(MultiDayGrid, {
      target: contentEl,
      context,
    });
  }

  async onClose() {
    if (this.multiDayComponent) {
      await unmount(this.multiDayComponent);
    }

    this.dateRange?.untrack();
  }

  private updateTabTitleAndHeader = (range: Moment[]) => {
    const newText = r.toString(range);

    (this as ViewWithTitleEl).titleEl?.setText(newText);
    (this.leaf as LeafWithHeaderUpdate).updateHeader?.();
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
