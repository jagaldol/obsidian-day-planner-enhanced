<script lang="ts">
  import { SettingGroup } from "obsidian";
  import { isOneOf } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import {
    firstDayOfWeekOptions,
    firstDaysOfWeek,
    hideTasksMetadataDescription,
    hideTimeRangeInSingleLineDescription,
    showActiveClockInStatusBarDescription,
    timelineZoomLevelOptions,
  } from "../../settings";
  import { range } from "../../util/collection";

  const { settings, setTimeTrackerEnabled } = getObsidianContext();

  const startHourOptions = Object.fromEntries(
    range(0, 13).map((it) => [it, String(it)]),
  );
</script>

<div
  class="settings"
  {@attach (el: HTMLDivElement) => {
    el.empty();

    new SettingGroup(el)
      .addSetting((setting) =>
        setting.setName("Start hour").addDropdown((dropdown) =>
          dropdown
            .addOptions(startHourOptions)
            .setValue(String($settings.startHour))
            .onChange((value) => {
              $settings = {
                ...$settings,
                startHour: Number(value),
              };
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Zoom").addDropdown((dropdown) =>
          dropdown
            .addOptions(timelineZoomLevelOptions)
            .setValue(String($settings.zoomLevel))
            .onChange((value) => {
              $settings = {
                ...$settings,
                zoomLevel: Number(value),
              };
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("First day of week").addDropdown((dropdown) =>
          dropdown
            .addOptions(firstDayOfWeekOptions)
            .setValue($settings.firstDayOfWeek)
            .onChange((value) => {
              isOneOf(value, firstDaysOfWeek);
              $settings = {
                ...$settings,
                firstDayOfWeek: value,
              };
            }),
        ),
      );

    new SettingGroup(el)
      .setHeading("Timeline")
      .addSetting((setting) =>
        setting.setName("Auto-scroll to now").addToggle((toggle) =>
          toggle.setValue($settings.centerNeedle).onChange((value) => {
            $settings = {
              ...$settings,
              centerNeedle: value,
            };
          }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show completed tasks").addToggle((toggle) =>
          toggle.setValue($settings.showCompletedTasks).onChange((value) => {
            $settings = {
              ...$settings,
              showCompletedTasks: value,
            };
          }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show full list content").addToggle((toggle) =>
          toggle
            .setValue($settings.showSubtasksInTaskBlocks)
            .onChange((value) => {
              $settings = {
                ...$settings,
                showSubtasksInTaskBlocks: value,
              };
            }),
        ),
      )
      .addSetting((setting) =>
        setting
          .setName("Hide time range in single-line blocks")
          .setDesc(hideTimeRangeInSingleLineDescription)
          .addToggle((toggle) =>
            toggle
              .setValue($settings.hideTimeRangeInSingleLine)
              .onChange((value) => {
                $settings = {
                  ...$settings,
                  hideTimeRangeInSingleLine: value,
                };
              }),
          ),
      );

    new SettingGroup(el).setHeading("Tasks integration").addSetting((setting) =>
      setting
        .setName("Hide Tasks metadata")
        .setDesc(hideTasksMetadataDescription)
        .addToggle((toggle) =>
          toggle.setValue($settings.hideTasksMetadata).onChange((value) => {
            $settings = {
              ...$settings,
              hideTasksMetadata: value,
            };
          }),
        ),
    );

    new SettingGroup(el)
      .setHeading("Time tracking")
      .addSetting((setting) =>
        setting
          .setName("Enable time tracker")
          .setDesc("Existing time records are kept unchanged")
          .addToggle((toggle) =>
            toggle
              .setValue($settings.enableTimeTracker)
              .onChange(async (value) => {
                const applied = await setTimeTrackerEnabled(value);

                if (!applied) {
                  toggle.setValue(!value);
                }
              }),
          ),
      )
      .addSetting((setting) =>
        setting
          .setName("Show active clock and 'Clock in' button")
          .setDesc(showActiveClockInStatusBarDescription)
          .addToggle((toggle) =>
            toggle
              .setValue($settings.showActiveClockInStatusBar)
              .setDisabled(!$settings.enableTimeTracker)
              .onChange((value) => {
                $settings = {
                  ...$settings,
                  showActiveClockInStatusBar: value,
                };
              }),
          ),
      );

    return () => {
      el.empty();
    };
  }}
></div>

<style>
  .settings {
    --planner-timeline-settings-font-size: var(--nav-item-size);
    --setting-items-padding: var(--size-4-2);
    --setting-group-heading-size: var(--planner-timeline-settings-font-size);
  }

  .settings :global(.setting-group .setting-item) {
    padding: var(--size-4-2) var(--size-4-4);
  }

  .settings :global(.setting-group .setting-item-heading) {
    padding: 0 var(--size-4-2);
  }

  .settings :global(.setting-group + .setting-group) {
    margin-top: var(--size-4-4);
  }

  .settings :global(.setting-item-name) {
    font-size: var(--planner-timeline-settings-font-size);
  }
</style>
