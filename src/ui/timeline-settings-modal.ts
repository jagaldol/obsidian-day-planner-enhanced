import { Array } from "effect";
import { App, Modal, SettingGroup } from "obsidian";
import { get, type Writable } from "svelte/store";
import { isOneOf } from "typed-assert";

import {
  type DayPlannerSettings,
  firstDayOfWeekOptions,
  firstDaysOfWeek,
  hideTasksMetadataDescription,
  hideTimeRangeInSingleLineDescription,
  timelineZoomLevelOptions,
} from "../settings";

const startHourOptions = Object.fromEntries(
  Array.range(0, 12).map((it) => [it, String(it)]),
);
export function createTimelineSettingsModalOpener(
  app: App,
  settingsStore: Writable<DayPlannerSettings>,
) {
  const current = () => get(settingsStore);

  return () => {
    const modal = new Modal(app).setTitle("Timeline settings");
    const { contentEl } = modal;

    new SettingGroup(contentEl)
      .addSetting((setting) =>
        setting.setName("Start hour").addDropdown((dropdown) =>
          dropdown
            .addOptions(startHourOptions)
            .setValue(String(current().startHour))
            .onChange((value) => {
              settingsStore.update((previous) => ({
                ...previous,
                startHour: Number(value),
              }));
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Zoom").addDropdown((dropdown) =>
          dropdown
            .addOptions(timelineZoomLevelOptions)
            .setValue(String(current().zoomLevel))
            .onChange((value) => {
              settingsStore.update((previous) => ({
                ...previous,
                zoomLevel: Number(value),
              }));
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("First day of week").addDropdown((dropdown) =>
          dropdown
            .addOptions(firstDayOfWeekOptions)
            .setValue(current().firstDayOfWeek)
            .onChange((value) => {
              isOneOf(value, firstDaysOfWeek);
              settingsStore.update((previous) => ({
                ...previous,
                firstDayOfWeek: value,
              }));
            }),
        ),
      );

    new SettingGroup(contentEl)
      .setHeading("Timeline")
      .addSetting((setting) =>
        setting.setName("Auto-scroll to now").addToggle((toggle) =>
          toggle.setValue(current().centerNeedle).onChange((value) => {
            settingsStore.update((previous) => ({
              ...previous,
              centerNeedle: value,
            }));
          }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show completed tasks").addToggle((toggle) =>
          toggle.setValue(current().showCompletedTasks).onChange((value) => {
            settingsStore.update((previous) => ({
              ...previous,
              showCompletedTasks: value,
            }));
          }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show full list content").addToggle((toggle) =>
          toggle
            .setValue(current().showSubtasksInTaskBlocks)
            .onChange((value) => {
              settingsStore.update((previous) => ({
                ...previous,
                showSubtasksInTaskBlocks: value,
              }));
            }),
        ),
      );

    new SettingGroup(contentEl)
      .setHeading("Enhanced features")
      .addSetting((setting) =>
        setting
          .setName("Hide Tasks metadata in planner")
          .setDesc(hideTasksMetadataDescription)
          .addToggle((toggle) =>
            toggle.setValue(current().hideTasksMetadata).onChange((value) => {
              settingsStore.update((previous) => ({
                ...previous,
                hideTasksMetadata: value,
              }));
            }),
          ),
      )
      .addSetting((setting) =>
        setting
          .setName("Hide time range in single-line blocks")
          .setDesc(hideTimeRangeInSingleLineDescription)
          .addToggle((toggle) =>
            toggle
              .setValue(current().hideTimeRangeInSingleLine)
              .onChange((value) => {
                settingsStore.update((previous) => ({
                  ...previous,
                  hideTimeRangeInSingleLine: value,
                }));
              }),
          ),
      );

    contentEl.createDiv("modal-button-container", (buttonsEl) => {
      buttonsEl
        .createEl("button", { cls: "mod-cta", text: "Close" })
        .addEventListener("click", () => {
          modal.close();
        });
    });

    modal.onClose = () => {
      contentEl.empty();
    };

    modal.open();
  };
}

export type OpenTimelineSettingsModal = ReturnType<
  typeof createTimelineSettingsModalOpener
>;
