/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { produce } from "immer";
import {
  PluginSettingTab,
  type SettingDefinitionItem,
  SettingGroup,
} from "obsidian";
import { type Component, mount, unmount } from "svelte";
import type { Writable } from "svelte/store";
import { isOneOf } from "typed-assert";

import { icons } from "../constants";
import type DayPlanner from "../main";
import {
  type DayPlannerSettings,
  eventFormats,
  firstDaysOfWeek,
} from "../settings";
import Callout from "../ui/components/callout.svelte";

export class DayPlannerSettingsTab extends PluginSettingTab {
  private warningComponent?: Component;

  constructor(
    private readonly plugin: DayPlanner,
    private readonly settingsStore: Writable<DayPlannerSettings>,
  ) {
    super(plugin.app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const settings = this.plugin.settings();
    const definitions: SettingDefinitionItem[] = [
      {
        name: "Restart Obsidian after changing settings",
        desc: "Any change to the settings requires a restart of Obsidian.",
        searchable: false,
      },
      {
        type: "group",
        items: [
          {
            name: "Show release notes after update",
            control: { type: "toggle", key: "releaseNotes" },
          },
          {
            name: "Task notification",
            desc: "Display a notification when a new task is started",
            control: { type: "toggle", key: "showTaskNotification" },
          },
          {
            name: "Center the pointer in the timeline view",
            desc: "Continuously scroll the pointer to the center of the view",
            control: { type: "toggle", key: "centerNeedle" },
          },
          {
            name: "Sort tasks in planner chronologically after edits",
            control: {
              type: "toggle",
              key: "sortTasksInPlanAfterEdit",
            },
          },
          {
            name: "Event format on creation",
            control: {
              type: "dropdown",
              key: "eventFormatOnCreation",
              options: {
                bullet: "Bullet (- New item)",
                task: "Task (- [ ] New item)",
              },
            },
          },
          {
            name: "Timeline zoom level",
            desc: "Higher values give each task more vertical space.",
            control: {
              type: "slider",
              key: "zoomLevel",
              min: 1,
              max: 5,
              step: 1,
            },
          },
          {
            name: "Default task status on creation",
            desc: "Use a custom one-character task status, such as >.",
            visible: () =>
              this.plugin.settings().eventFormatOnCreation === "task",
            render: (setting) => {
              setting.addText((text) =>
                text
                  .setPlaceholder("Empty")
                  .setValue(this.plugin.settings().taskStatusOnCreation)
                  .onChange((value) => {
                    this.updateSettings({
                      taskStatusOnCreation:
                        value.length > 0 ? value.substring(0, 1) : " ",
                    });
                  }),
              );
            },
          },
          {
            name: "Timeline icon",
            desc: "Reopen the timeline pane or restart Obsidian after changing it.",
            control: {
              type: "dropdown",
              key: "timelineIcon",
              defaultValue: "calendar-with-checkmark",
              options: Object.fromEntries(icons.map((icon) => [icon, icon])),
            },
          },
          {
            name: "Start hour",
            desc: "The hour at which the planner starts each day",
            render: (setting) => {
              setting.addDropdown((dropdown) =>
                dropdown
                  .addOptions(
                    Object.fromEntries(
                      Array.from({ length: 13 }, (_, hour) => [
                        String(hour),
                        String(hour),
                      ]),
                    ),
                  )
                  .setValue(String(this.plugin.settings().startHour))
                  .onChange((value) => {
                    this.updateSettings({ startHour: Number(value) });
                  }),
              );
            },
          },
          {
            name: "First day of week",
            control: {
              type: "dropdown",
              key: "firstDayOfWeek",
              options: {
                monday: "Monday",
                sunday: "Sunday",
                saturday: "Saturday",
                friday: "Friday",
              },
            },
          },
        ],
      },
      {
        type: "group",
        heading: "Remote calendars",
        extraButtons: [
          (button) =>
            button
              .setIcon("plus")
              .setTooltip("Add remote calendar")
              .onClick(() => {
                this.settingsStore.update((previous) => ({
                  ...previous,
                  icals: [
                    ...previous.icals,
                    { name: "", email: "", url: "", color: "#ffffff" },
                  ],
                }));
                this.refreshSettings();
              }),
        ],
      },
    ];

    settings.icals.forEach((ical, index) => {
      definitions.push({
        type: "group",
        heading: "Calendar " + (index + 1),
        items: [
          {
            name: "Mark calendar with color",
            render: (setting) => {
              setting.addColorPicker((picker) =>
                picker.setValue(ical.color).onChange((value) => {
                  this.settingsStore.update(
                    produce((draft) => {
                      draft.icals[index].color = value;
                    }),
                  );
                }),
              );
            },
          },
          {
            name: "Prepend this text to events from this calendar",
            render: (setting) => {
              setting.addText((text) =>
                text
                  .setPlaceholder("Displayed name")
                  .setValue(ical.name)
                  .onChange((value) => {
                    this.settingsStore.update(
                      produce((draft) => {
                        draft.icals[index].name = value;
                      }),
                    );
                  }),
              );
            },
          },
          {
            name: "Your email address",
            desc: "Used to show tentative, needs action, and declined markers",
            render: (setting) => {
              setting.addText((text) =>
                text
                  .setPlaceholder("Your email address")
                  .setValue(ical.email ?? "")
                  .onChange((value) => {
                    this.settingsStore.update(
                      produce((draft) => {
                        draft.icals[index].email = value.trim();
                      }),
                    );
                  }),
              );
            },
          },
          {
            name: "Remote calendar URL",
            render: (setting) => {
              setting.addText((text) =>
                text
                  .setPlaceholder("URL")
                  .setValue(ical.url)
                  .onChange((value) => {
                    this.settingsStore.update(
                      produce((draft) => {
                        draft.icals[index].url = value.replace(
                          "webcal://",
                          "https://",
                        );
                      }),
                    );
                  }),
              );
            },
          },
          {
            name: "Delete calendar " + (index + 1),
            searchable: false,
            render: (setting) => {
              setting.addButton((button) =>
                button
                  .setIcon("trash")
                  .setButtonText("Delete calendar " + (index + 1))
                  .onClick(() => {
                    this.settingsStore.update((previous) => ({
                      ...previous,
                      icals: previous.icals.filter(
                        (_calendar, calendarIndex) => calendarIndex !== index,
                      ),
                    }));
                    this.refreshSettings();
                  }),
              );
            },
          },
        ],
      });
    });

    definitions.push({
      type: "group",
      heading: "Date & time formats",
      items: [
        {
          name: "Hour format",
          desc: "Format used in the time ruler",
          render: (setting) => {
            setting.setDesc(
              createFragment((fragment) => {
                fragment.appendText(
                  "Use H for 24 hours or h for 12 hours. Current sample: ",
                );
                setting.addMomentFormat((format) =>
                  format
                    .setValue(this.plugin.settings().hourFormat)
                    .setSampleEl(fragment.createSpan())
                    .onChange((value) => {
                      this.updateSettings({ hourFormat: value.trim() });
                    }),
                );
                fragment.createEl("br");
                fragment.createEl("a", {
                  text: "Format reference",
                  href: "https://momentjs.com/docs/#/displaying/format/",
                  attr: { target: "_blank" },
                });
              }),
            );
          },
        },
        {
          name: "Default timestamp format",
          desc: "Format used when creating or editing tasks",
          render: (setting) => {
            setting.setDesc(
              createFragment((fragment) => {
                fragment.appendText(
                  "Use HH:mm for 24 hours or hh:mm for 12 hours. Current sample: ",
                );
                setting.addMomentFormat((format) =>
                  format
                    .setValue(this.plugin.settings().timestampFormat)
                    .setSampleEl(fragment.createSpan())
                    .onChange((value) => {
                      this.updateSettings({ timestampFormat: value.trim() });
                    }),
                );
                fragment.createEl("br");
                fragment.createEl("a", {
                  text: "Format reference",
                  href: "https://momentjs.com/docs/#/displaying/format/",
                  attr: { target: "_blank" },
                });
              }),
            );
          },
        },
        {
          name: "Date format in timeline header",
          desc: "Date format shown above the timeline",
          render: (setting) => {
            setting.setDesc(
              createFragment((fragment) => {
                fragment.appendText("Current sample: ");
                setting.addMomentFormat((format) =>
                  format
                    .setValue(this.plugin.settings().timelineDateFormat)
                    .setSampleEl(fragment.createSpan())
                    .onChange((value) => {
                      this.updateSettings({ timelineDateFormat: value });
                    }),
                );
                fragment.createEl("br");
                fragment.createEl("a", {
                  text: "Format reference",
                  href: "https://momentjs.com/docs/#/displaying/format/",
                  attr: { target: "_blank" },
                });
              }),
            );
          },
        },
      ],
    });

    definitions.push(
      {
        type: "group",
        heading: "Planner heading",
        items: [
          {
            name: "Planner heading text",
            desc: "Only items under this heading are pulled from daily notes. Leave it empty to pull all items.",
            control: { type: "text", key: "plannerHeading" },
          },
          {
            name: "Planner heading level",
            desc: "Heading level used when creating a planner in a file",
            control: {
              type: "slider",
              key: "plannerHeadingLevel",
              min: 1,
              max: 6,
              step: 1,
            },
          },
        ],
      },
      {
        type: "group",
        heading: "Time tracking",
        items: [
          {
            name: "Enable time tracker",
            desc: "Show time-tracking views, timeline columns, and clock actions. Existing records remain unchanged.",
            control: { type: "toggle", key: "enableTimeTracker" },
          },
        ],
      },
      {
        type: "group",
        heading: "Status bar widget",
        items: [
          {
            name: "Show active clock and Clock in button",
            control: {
              type: "toggle",
              key: "showActiveClockInStatusBar",
            },
          },
          {
            name: "Show active task",
            control: { type: "toggle", key: "showNow" },
          },
          {
            name: "Show upcoming task",
            control: { type: "toggle", key: "showNext" },
          },
          {
            name: "Task progress indicator",
            control: {
              type: "dropdown",
              key: "progressIndicator",
              options: {
                "mini-timeline": "Mini-timeline",
                bar: "Bar",
                pie: "Pie",
                none: "None",
              },
            },
          },
        ],
      },
      {
        type: "group",
        heading: "Task decoration",
        items: [
          {
            name: "Show a timestamp next to task text in timeline",
            control: {
              type: "toggle",
              key: "showTimestampInTaskBlock",
            },
          },
        ],
      },
      {
        type: "group",
        heading: "Duration",
        items: [
          {
            name: "Stretch task until next one if it has no end time",
            desc: "Applies to entries with a start time but no explicit end time.",
            control: {
              type: "toggle",
              key: "extendDurationUntilNext",
            },
          },
          {
            name: "Round time to minutes",
            desc: "Round edited tasks to this interval",
            control: {
              type: "slider",
              key: "snapStepMinutes",
              min: 5,
              max: 20,
              step: 5,
            },
          },
          {
            name: "Default task duration",
            desc: "Used for drag-and-drop creation and tasks without an end time",
            control: {
              type: "slider",
              key: "defaultDurationMinutes",
              min: 20,
              max: 120,
              step: 10,
            },
          },
          {
            name: "Minimal task duration",
            desc: "Used when creating a task with drag-and-drop",
            control: {
              type: "slider",
              key: "minimalDurationMinutes",
              min: 5,
              max: 15,
              step: 5,
            },
          },
        ],
      },
      {
        type: "group",
        heading: "Color overrides",
        extraButtons: [
          (button) =>
            button
              .setIcon("plus")
              .setTooltip("Add color override")
              .onClick(() => {
                this.settingsStore.update((previous) => ({
                  ...previous,
                  colorOverrides: [
                    ...previous.colorOverrides,
                    {
                      text: "#important",
                      darkModeColor: "#6e3737",
                      color: "#ffa1a1",
                    },
                  ],
                }));
                this.refreshSettings();
              }),
        ],
        items: settings.colorOverrides.map((colorOverride, index) => ({
          name: "Color " + (index + 1),
          desc:
            index === 0
              ? "Set light and dark background colors for blocks containing matching text."
              : "",
          render: (setting) => {
            setting
              .addColorPicker((picker) =>
                picker.setValue(colorOverride.color).onChange((value) => {
                  this.settingsStore.update(
                    produce((draft) => {
                      draft.colorOverrides[index].color = value;
                    }),
                  );
                }),
              )
              .addColorPicker((picker) =>
                picker
                  .setValue(colorOverride.darkModeColor)
                  .onChange((value) => {
                    this.settingsStore.update(
                      produce((draft) => {
                        draft.colorOverrides[index].darkModeColor = value;
                      }),
                    );
                  }),
              )
              .addText((text) =>
                text
                  .setPlaceholder("Text")
                  .setValue(colorOverride.text)
                  .onChange((value) => {
                    this.settingsStore.update(
                      produce((draft) => {
                        draft.colorOverrides[index].text = value;
                      }),
                    );
                  }),
              )
              .addExtraButton((button) =>
                button
                  .setIcon("trash")
                  .setTooltip("Delete color override")
                  .onClick(() => {
                    this.settingsStore.update((previous) => ({
                      ...previous,
                      colorOverrides: previous.colorOverrides.filter(
                        (_override, overrideIndex) => overrideIndex !== index,
                      ),
                    }));
                    this.refreshSettings();
                  }),
              );
          },
        })),
      },
      {
        type: "group",
        heading: "Colorful timeline",
        items: [
          {
            name: "Enable colorful timeline",
            desc: "Color tasks based on time of day instead of using a monochrome timeline",
            control: { type: "toggle", key: "timelineColored" },
          },
          {
            name: "Colorful timeline start color",
            control: { type: "color", key: "timelineStartColor" },
          },
          {
            name: "Colorful timeline end color",
            control: { type: "color", key: "timelineEndColor" },
          },
        ],
      },
    );

    return definitions;
  }

  getControlValue(key: string): unknown {
    return this.plugin.settings()[key as keyof DayPlannerSettings];
  }

  setControlValue(key: string, value: unknown): void {
    this.updateSettings({
      [key]: value,
    } as Partial<DayPlannerSettings>);

    if (key === "eventFormatOnCreation") {
      this.refreshSettings();
    }
  }

  display(): void {
    this.renderSettings();
  }

  private renderSettings(): void {
    const { containerEl, warningComponent } = this;

    if (warningComponent) {
      unmount(warningComponent);
    }

    containerEl.empty();

    // @ts-expect-error
    this.warningComponent = mount(Callout, {
      props: {
        type: "warning",
        title: "Any change to the settings requires a restart of Obsidian!",
        className: "planner-settings-warning",
      },
      target: containerEl,
    });

    const generalGroup = new SettingGroup(containerEl)
      .addSetting((setting) =>
        setting.setName("Show release notes after update").addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings().releaseNotes)
            .onChange((value: boolean) => {
              this.updateSettings({ releaseNotes: value });
            }),
        ),
      )
      .addSetting((setting) =>
        setting
          .setName("Task Notification")
          .setDesc("Display a notification when a new task is started")
          .addToggle((toggle) =>
            toggle
              .setValue(this.plugin.settings().showTaskNotification)
              .onChange((value: boolean) => {
                this.updateSettings({ showTaskNotification: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting
          .setName("Center the Pointer in the Timeline View")
          .setDesc(
            "Should the pointer continuously get scrolled to the center of the view",
          )
          .addToggle((component) => {
            component
              .setValue(this.plugin.settings().centerNeedle)
              .onChange((value) => {
                this.updateSettings({ centerNeedle: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting
          .setName("Sort tasks in planner chronologically after edits")
          .addToggle((component) => {
            component
              .setValue(this.plugin.settings().sortTasksInPlanAfterEdit)
              .onChange((value) => {
                this.updateSettings({ sortTasksInPlanAfterEdit: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting.setName("Event format on creation").addDropdown((dropdown) => {
          dropdown.addOptions({
            bullet: `Bullet (- New item)`,
            task: `Task (- [ ] New item)`,
          });
          return dropdown
            .setValue(this.plugin.settings().eventFormatOnCreation)
            .onChange((value) => {
              isOneOf(value, eventFormats);
              this.updateSettings({ eventFormatOnCreation: value });
              this.renderSettings();
            });
        }),
      )
      .addSetting((setting) =>
        setting
          .setName("Timeline Zoom Level")
          .setDesc(
            "The zoom level to display the timeline. The higher the number, the more vertical space each task will take up.",
          )
          .addSlider((slider) =>
            slider
              .setLimits(1, 5, 1)
              .setValue(Number(this.plugin.settings().zoomLevel ?? 4))
              .onChange((value: number) => {
                this.updateSettings({ zoomLevel: value });
              }),
          ),
      );

    if (this.plugin.settings().eventFormatOnCreation === "task") {
      generalGroup.addSetting((setting) =>
        setting
          .setName("Default task status on creation")
          .setDesc(
            "You can use custom statuses for more advanced workflows. E.g.: '- [>] Task'",
          )
          .addText((el) =>
            el
              .setPlaceholder("Empty")
              .setValue(this.plugin.settings().taskStatusOnCreation)
              .onChange((value: string) => {
                this.settingsStore.update((previous) => {
                  const newValue =
                    value.length > 0 ? value.substring(0, 1) : " ";

                  return {
                    ...previous,
                    taskStatusOnCreation: newValue,
                  };
                });
              }),
          ),
      );
    }

    generalGroup
      .addSetting((setting) =>
        setting
          .setName("Timeline Icon")
          .setDesc(
            "The icon of the timeline pane. Reopen timeline pane or restart obsidian to see the change.",
          )
          .addDropdown((dropdown) => {
            icons.forEach((icon) => dropdown.addOption(icon, icon));
            return dropdown
              .setValue(
                this.plugin.settings().timelineIcon ??
                  "calendar-with-checkmark",
              )
              .onChange((value: string) => {
                this.updateSettings({ timelineIcon: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting
          .setName("Start Hour")
          .setDesc("The planner is going to start at this hour each day")
          .addDropdown((component) =>
            component
              .addOptions({
                "0": "0",
                "1": "1",
                "2": "2",
                "3": "3",
                "4": "4",
                "5": "5",
                "6": "6",
                "7": "7",
                "8": "8",
                "9": "9",
                "10": "10",
                "11": "11",
                "12": "12",
              })
              .setValue(String(this.plugin.settings().startHour))
              .onChange((value: string) => {
                const asNumber = Number(value);

                this.updateSettings({ startHour: asNumber });
              }),
          ),
      )
      .addSetting((setting) =>
        setting.setName("First day of week").addDropdown((component) =>
          component
            .addOptions({
              monday: "Monday",
              sunday: "Sunday",
              saturday: "Saturday",
              friday: "Friday",
            })
            .setValue(String(this.plugin.settings().firstDayOfWeek))
            .onChange((value: string) => {
              isOneOf(value, firstDaysOfWeek);

              this.updateSettings({ firstDayOfWeek: value });
            }),
        ),
      );

    new SettingGroup(containerEl)
      .setHeading("Remote calendars")
      .addExtraButton((button) =>
        button
          .setIcon("plus")
          .setTooltip("Add remote calendar")
          .onClick(() => {
            const newIcal = {
              name: "",
              email: "",
              url: "",
              color: "#ffffff",
            };

            this.settingsStore.update((previous) => ({
              ...previous,
              icals: [...previous.icals, newIcal],
            }));

            this.renderSettings();
          }),
      );

    this.plugin.settings().icals.forEach((ical, index) => {
      new SettingGroup(containerEl)
        .setHeading(`Calendar ${index + 1}`)
        .addSetting((setting) =>
          setting.setName("Mark calendar with color").addColorPicker((el) =>
            el.setValue(ical.color).onChange((value: string) => {
              this.settingsStore.update(
                produce((draft) => {
                  draft.icals[index].color = value;
                }),
              );
            }),
          ),
        )
        .addSetting((setting) =>
          setting
            .setName("Prepend this text to events from this calendar")
            .addText((el) =>
              el
                .setPlaceholder("Displayed name")
                .setValue(ical.name)
                .onChange((value: string) => {
                  this.settingsStore.update(
                    produce((draft) => {
                      draft.icals[index].name = value;
                    }),
                  );
                }),
            ),
        )
        .addSetting((setting) =>
          setting
            .setName(
              "Your email address, used to show 'tentative'/'needs action'/'declined' marker",
            )
            .addText((el) =>
              el
                .setPlaceholder("Your email address")
                .setValue(ical.email || "")
                .onChange((value: string) => {
                  this.settingsStore.update(
                    produce((draft) => {
                      draft.icals[index].email = value.trim();
                    }),
                  );
                }),
            ),
        )
        .addSetting((setting) =>
          setting.setName("Remote calendar URL").addText((el) =>
            el
              .setPlaceholder("URL")
              .setValue(ical.url)
              .onChange((value: string) => {
                const withCorrectProtocol = value.replace(
                  "webcal://",
                  "https://",
                );

                this.settingsStore.update(
                  produce((draft) => {
                    draft.icals[index].url = withCorrectProtocol;
                  }),
                );
              }),
          ),
        )
        .addSetting((setting) =>
          setting.addButton((el) =>
            el
              .setIcon("trash")
              .setButtonText(`Delete calendar ${index + 1}`)
              .onClick(() => {
                this.settingsStore.update((previous) => ({
                  ...previous,
                  icals: previous.icals.filter(
                    (editedIcal, editedIndex) => editedIndex !== index,
                  ),
                }));

                this.renderSettings();
              }),
          ),
        );
    });

    new SettingGroup(containerEl)
      .setHeading("Date & Time Formats")
      .addSetting((setting) => {
        setting.setName("Hour format").then((component) => {
          component.setDesc(
            createFragment((fragment) => {
              fragment.appendText(
                "This is the format used in the time ruler. Use 'H' for 24 hours; use 'h' for 12 hours. Your current syntax looks like this: ",
              );
              component.addMomentFormat((momentFormat) =>
                momentFormat
                  .setValue(this.plugin.settings().hourFormat)
                  .setSampleEl(fragment.createSpan())
                  .onChange((value: string) => {
                    this.updateSettings({ hourFormat: value.trim() });
                  }),
              );
              fragment.append(
                createEl("br"),
                createEl(
                  "a",
                  {
                    text: "format reference",
                    href: "https://momentjs.com/docs/#/displaying/format/",
                  },
                  (a) => {
                    a.setAttr("target", "_blank");
                  },
                ),
              );
            }),
          );
        });
      })
      .addSetting((setting) => {
        setting.setName("Default timestamp format").then((component) => {
          component.setDesc(
            createFragment((fragment) => {
              fragment.appendText(
                "When you create or edit tasks with drag-and-drop, the plugin use this format. Use 'HH:mm' for 24 hours; use 'hh:mm' for 12 hours. Your current syntax looks like this: ",
              );
              component.addMomentFormat((momentFormat) =>
                momentFormat
                  .setValue(this.plugin.settings().timestampFormat)
                  .setSampleEl(fragment.createSpan())
                  .onChange((value: string) => {
                    this.updateSettings({ timestampFormat: value.trim() });
                  }),
              );
              fragment.append(
                createEl("br"),
                createEl(
                  "a",
                  {
                    text: "format reference",
                    href: "https://momentjs.com/docs/#/displaying/format/",
                  },
                  (a) => {
                    a.setAttr("target", "_blank");
                  },
                ),
              );
            }),
          );
        });
      })
      .addSetting((setting) => {
        setting.setName("Date Format in Timeline Header").then((component) => {
          component.setDesc(
            createFragment((fragment) => {
              fragment.appendText("Your current syntax looks like this: ");
              component.addMomentFormat((momentFormat) =>
                momentFormat
                  .setValue(this.plugin.settings().timelineDateFormat)
                  .setSampleEl(fragment.createSpan())
                  .onChange((value: string) => {
                    this.updateSettings({ timelineDateFormat: value });
                  }),
              );
              fragment.append(
                createEl("br"),
                createEl(
                  "a",
                  {
                    text: "format reference",
                    href: "https://momentjs.com/docs/#/displaying/format/",
                  },
                  (a) => {
                    a.setAttr("target", "_blank");
                  },
                ),
              );
            }),
          );
        });
      });

    new SettingGroup(containerEl)
      .setHeading("Planner Heading")
      .addSetting((setting) =>
        setting
          .setName("Planner Heading Text")
          .setDesc(
            createFragment((fragment) => {
              fragment.append(
                createEl("p", {
                  text: "Only the items under this heading (and its subheadings) are going to be pulled from daily notes.",
                }),
                createEl("p", {
                  text: "If left empty, the plugin will pull all items from daily notes.",
                }),
                createEl("p", {
                  text: `Also used when creating a plan with drag-and-drop.`,
                }),
              );
            }),
          )
          .addText((component) =>
            component
              .setValue(this.plugin.settings().plannerHeading)
              .onChange((value) => {
                this.updateSettings({ plannerHeading: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting
          .setName("Planner heading level")
          .setDesc(
            "When you create a planner in a file, this level of heading is going to be used",
          )
          .addSlider((component) =>
            component
              .setLimits(1, 6, 1)
              .setValue(this.plugin.settings().plannerHeadingLevel)
              .onChange((value) => {
                this.updateSettings({ plannerHeadingLevel: value });
              }),
          ),
      );

    new SettingGroup(containerEl)
      .setHeading("Time tracking")
      .addSetting((setting) =>
        setting
          .setName("Enable time tracker")
          .setDesc(
            "Show time-tracking views, timeline columns, and clock actions. Existing time records are kept unchanged.",
          )
          .addToggle((toggle) =>
            toggle
              .setValue(this.plugin.settings().enableTimeTracker)
              .onChange((value: boolean) => {
                this.updateSettings({ enableTimeTracker: value });
              }),
          ),
      );

    new SettingGroup(containerEl)
      .setHeading("Status bar widget")
      .addSetting((setting) =>
        setting
          .setName("Show active clock and 'Clock in' button")
          .addToggle((toggle) =>
            toggle
              .setValue(this.plugin.settings().showActiveClockInStatusBar)
              .onChange((value: boolean) => {
                this.updateSettings({ showActiveClockInStatusBar: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting.setName("Show active task").addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings().showNow)
            .onChange((value: boolean) => {
              this.updateSettings({ showNow: value });
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show upcoming task").addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings().showNext)
            .onChange((value: boolean) => {
              this.updateSettings({ showNext: value });
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Task progress indicator").addDropdown((component) =>
          component
            .addOptions({
              ["mini-timeline"]: "Mini-timeline",
              bar: "Bar",
              pie: "Pie",
              none: "None",
            })
            .setValue(String(this.plugin.settings().progressIndicator))
            .onChange((value) => {
              this.updateSettings({
                progressIndicator:
                  value as DayPlannerSettings["progressIndicator"],
              });
            }),
        ),
      );

    new SettingGroup(containerEl)
      .setHeading("Task decoration")
      .addSetting((setting) =>
        setting
          .setName("Show a timestamp next to task text in timeline")
          .addToggle((component) => {
            component
              .setValue(this.plugin.settings().showTimestampInTaskBlock)
              .onChange((value) => {
                this.updateSettings({ showTimestampInTaskBlock: value });
              });
          }),
      );

    new SettingGroup(containerEl)
      .setHeading("Duration")
      .addSetting((setting) =>
        setting
          .setName(
            "Stretch task until next one in timeline if it has no end time",
          )
          .setDesc(
            'By "no end time" we mean "- [ ] 10:00 Wake up" instead of "- [ ] 10:00 - 11:00 Wake up"',
          )
          .addToggle((component) => {
            component
              .setValue(this.plugin.settings().extendDurationUntilNext)
              .onChange((value) => {
                this.updateSettings({ extendDurationUntilNext: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting
          .setName("Round time to minutes")
          .setDesc(
            "While editing, tasks are going to get rounded to this number",
          )
          .addSlider((slider) =>
            slider
              .setLimits(5, 20, 5)
              .setValue(this.plugin.settings().snapStepMinutes)
              .onChange((value: number) => {
                this.updateSettings({ snapStepMinutes: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting
          .setName("Default task duration")
          .setDesc(
            "Used when you create a task with drag-and-drop & when you don't specify an end time",
          )
          .addSlider((slider) =>
            slider
              .setLimits(20, 120, 10)
              .setValue(Number(this.plugin.settings().defaultDurationMinutes))
              .onChange((value: number) => {
                this.updateSettings({ defaultDurationMinutes: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting
          .setName("Minimal task duration")
          .setDesc("Used when you create a task with drag-and-drop")
          .addSlider((slider) =>
            slider
              .setLimits(5, 15, 5)
              .setValue(Number(this.plugin.settings().minimalDurationMinutes))
              .onChange((value: number) => {
                this.updateSettings({ minimalDurationMinutes: value });
              }),
          ),
      );

    const colorBlockingGroup = new SettingGroup(containerEl)
      .setHeading("Color overrides")
      .addExtraButton((button) =>
        button
          .setIcon("plus")
          .setTooltip("Add color override")
          .onClick(() => {
            const newOverride = {
              text: "#important",
              darkModeColor: "#6e3737",
              color: "#ffa1a1",
            };

            this.settingsStore.update((previous) => ({
              ...previous,
              colorOverrides: [...previous.colorOverrides, newOverride],
            }));

            this.renderSettings();
          }),
      );

    this.plugin.settings().colorOverrides.forEach((colorOverride, index) => {
      colorBlockingGroup.addSetting((setting) =>
        setting
          .setName(`Color ${index + 1}`)
          .setDesc(
            index === 0
              ? "Define a background color for a block containing some text (it might be a tag, like '#important'). The first color is for light mode, the second is for dark mode."
              : "",
          )
          .addColorPicker((el) =>
            el.setValue(colorOverride.color).onChange((value: string) => {
              this.settingsStore.update(
                produce((draft) => {
                  draft.colorOverrides[index].color = value;
                }),
              );
            }),
          )
          .addColorPicker((el) =>
            el
              .setValue(colorOverride.darkModeColor)
              .onChange((value: string) => {
                this.settingsStore.update(
                  produce((draft) => {
                    draft.colorOverrides[index].darkModeColor = value;
                  }),
                );
              }),
          )
          .addText((el) =>
            el
              .setPlaceholder("Text")
              .setValue(colorOverride.text)
              .onChange((value: string) => {
                this.settingsStore.update((previous) => ({
                  ...previous,
                  colorOverrides: previous.colorOverrides.map(
                    (editedOverride, editedIndex) =>
                      editedIndex === index
                        ? { ...editedOverride, text: value }
                        : editedOverride,
                  ),
                }));
              }),
          )
          .addExtraButton((el) =>
            el
              .setIcon("trash")
              .setTooltip("Delete color override")
              .onClick(() => {
                this.settingsStore.update((previous) => ({
                  ...previous,
                  colorOverrides: previous.colorOverrides.filter(
                    (editedOverride, editedIndex) => editedIndex !== index,
                  ),
                }));

                this.renderSettings();
              }),
          ),
      );
    });

    new SettingGroup(containerEl)
      .setHeading("Colorful Timeline")
      .addSetting((setting) =>
        setting
          .setName("Enable Colorful Timeline")
          .setDesc(
            "If the planner timeline should be monochrome or color tasks based on time of day",
          )
          .addToggle((component) => {
            component
              .setValue(this.plugin.settings().timelineColored)
              .onChange((value) => {
                this.updateSettings({ timelineColored: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting
          .setName("Colorful Timeline - Start Color")
          .addColorPicker((component) => {
            component
              .setValue(this.plugin.settings().timelineStartColor)
              .onChange((value) => {
                this.updateSettings({ timelineStartColor: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting
          .setName("Colorful Timeline - End Color")
          .addColorPicker((component) => {
            component
              .setValue(this.plugin.settings().timelineEndColor)
              .onChange((value) => {
                this.updateSettings({ timelineEndColor: value });
              });
          }),
      );
  }

  private updateSettings(patch: Partial<DayPlannerSettings>) {
    this.settingsStore.update((previous) => ({ ...previous, ...patch }));
  }

  private refreshSettings(): void {
    const update = Reflect.get(PluginSettingTab.prototype, "update") as
      | ((this: DayPlannerSettingsTab) => void)
      | undefined;

    if (update) {
      update.call(this);
    } else {
      this.renderSettings();
    }
  }
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
