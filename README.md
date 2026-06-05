# Day Planner Enhanced

Day Planner Enhanced is a community plugin for [Obsidian](https://obsidian.md/). It adds editable calendar views, basic time-tracking, and an enhanced timeline UI for readable nested schedules.

This plugin is an independent MIT-licensed fork of [Obsidian Day Planner](https://github.com/ivan-lednev/obsidian-day-planner).

<img src="./assets/day-planner-enhanced-ui-changes.png" alt="Day Planner Enhanced UI changes showing nested schedule timeline improvements" width="100%">

- 🪲 [Report bugs and suggest features](https://github.com/jagaldol/obsidian-day-planner-enhanced/issues)
- 🛠️ [Submit pull requests](./CONTRIBUTING.md)

Day Planner Enhanced is integrated with

- The core Daily Notes plugin.
- [the Tasks plugin](https://obsidian.md/plugins?id=obsidian-tasks-plugin)
- Online calendars

## Table of contents

- [Table of contents](#table-of-contents)
- [Installation](#installation)
  - [Install with BRAT](#install-with-brat)
  - [Manual installation](#manual-installation)
  - [Updating](#updating)
- [How to use it](#how-to-use-it)
  - [1. Showing events from your daily notes](#1-showing-events-from-your-daily-notes)
  - [2. tasks community plugin integration, showing events from other files in your vault](#2-tasks-community-plugin-integration-showing-events-from-other-files-in-your-vault)
  - [3. Showing internet calendars](#3-showing-internet-calendars)
    - [Where to get a Google Calendar link](#where-to-get-a-google-calendar-link)
    - [Where to get an iCloud link](#where-to-get-an-icloud-link)
    - [Where to get an Outlook link](#where-to-get-an-outlook-link)
      - [Alternative](#alternative)
  - [4. Time tracking](#4-time-tracking)
    - [Recording clocks](#recording-clocks)
    - [Clocks in timelines](#clocks-in-timelines)
    - [Active clocks](#active-clocks)
    - [Limitations](#limitations)
- [Upstream](#upstream)
- [Acknowledgements](#acknowledgements)

## Installation

Day Planner Enhanced is distributed from GitHub Releases. It is not currently listed in Obsidian's community plugin directory, so it will not appear in Obsidian's built-in plugin search yet.

Before installing, disable the original Day Planner plugin if it is already enabled in the same vault. This fork has its own plugin identity, but it still shares some Day Planner concepts, commands, and view behavior from the upstream codebase.

### Install with BRAT

This is the recommended way to install and update the plugin while it is distributed as a GitHub release.

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Obsidian's community plugins.
2. Open BRAT settings.
3. Add this repository as a beta plugin:

   ```text
   https://github.com/jagaldol/obsidian-day-planner-enhanced
   ```

4. Enable `Day Planner Enhanced` in Obsidian's community plugin settings.
5. Reload Obsidian if the plugin does not appear immediately.

### Manual installation

1. Open the [latest release](https://github.com/jagaldol/obsidian-day-planner-enhanced/releases/latest).
2. Download the plugin zip file, or download these release assets individually:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Create the plugin folder in your vault:

   ```text
   <vault>/.obsidian/plugins/day-planner-enhanced/
   ```

4. Put `main.js`, `manifest.json`, and `styles.css` directly inside that folder.
5. Restart or reload Obsidian.
6. Enable `Day Planner Enhanced` in Obsidian's community plugin settings.

### Updating

- If you installed with BRAT, update through BRAT.
- If you installed manually, download the latest release assets and replace the existing files in the plugin folder.
- Restart or reload Obsidian after replacing plugin files.

## How to use it

To open the timeline in the sidebar:

- Either run the command: `Show Timeline`
- Or click the timeline icon in the left ribbon
  - ![](./assets/open-timeline-ribbon-icon.png)

To open multi-day planner:

- Either run the command: `Show multi-day planner`
- Or click on the icon in the left ribbon:
  - ![](./assets/open-multi-day-view-ribbon-icon.png)

You can overview the upcoming 3 hours in the mini-timeline in the status bar:

<img src="./assets/mini-timeline-demo.png" width="100%">

If there are remote tasks, the blocks will be colored accordingly.

The plugin can display records from different sources:

1. Daily notes
2. Obsidian-tasks
3. Online calendars
4. Dataview clock properties

Let's go over each one of them.

### 1. Showing events from your daily notes

> [!Warning]
> Either the core 'Daily Notes' (core plugin) or the 'Periodic Notes' (community plugin, [see in Obsidian](obsidian://show-plugin?id=periodic-notes)) should be enabled. This is what allows day-planner to 'see' and interact with your daily notes.

Write your tasks in a daily note, and they show up on the timeline:

```md
# Day planner

- [ ] 10:00 - 10:30 Wake up
- [ ] 11:00 - 12:30 Grab a brush and put a little make-up
```

### 2. [tasks community plugin](obsidian://show-plugin?id=obsidian-tasks-plugin) integration, showing events from other files in your vault

You can see tasks anywhere in the vault with dates added by the [tasks community plugin](obsidian://show-plugin?id=obsidian-tasks-plugin). This also works out of the box for all the files in the vault. You only need to add the `scheduled` property to a task in one of the formats:

- Shorthand, added by [tasks community plugin](obsidian://show-plugin?id=obsidian-tasks-plugin): `⏳ 2021-08-29`
  - Note that this plugin has a handy modal for adding these properties
- Full Dataview-like property: `[scheduled:: 2021-08-29]`
- Another Dataview format: `(scheduled:: 2021-08-29)`.

For example, these tasks will show up in the timeline:

```md
- [ ] #task 08:00 - 10:00 This task uses the shorthand format ⏳ 2021-08-29
- [ ] #task 11:00 - 13:00 This task uses the Dataview property format [scheduled:: 2021-08-29]
```

### 3. Showing internet calendars

To show events from internet calendars like **Google Calendar, iCloud Calendar and Outlook** you only need to add an ICS link in the plugin settings.

![](./assets/ical-settings-demo.png)

#### Where to get a Google Calendar link

> [!Warning]
> Make sure you copy the right link! It should end with `.ics`, otherwise, you won't see your events!

[Google Calendar instructions](https://support.google.com/calendar/answer/37648?hl=en#zippy=%2Csync-your-google-calendar-view-edit%2Cget-your-calendar-view-only)

#### Where to get an iCloud link

[iCloud Calendar instructions](https://www.souladvisor.com/help-centre/how-to-get-icloud-calendar-address-on-mac-in-ical-format)

#### Where to get an Outlook link

[Outlook Calendar instructions](https://support.microsoft.com/en-us/office/introduction-to-publishing-internet-calendars-a25e68d6-695a-41c6-a701-103d44ba151d?ui=en-us&rs=en-us&ad=us)

Here's the relevant part:

> Under the settings in Outlook **on the web**, go to Calendar > Shared calendars. Choose the calendar you wish to publish and the level of details that you want others to see.

Here's how the settings look on the web version:
![](./assets/outlook-guide-1.png)

##### Alternative

If your organization doesn't let you share your calendar this way, you might try [a different way described in the upstream project](https://github.com/ivan-lednev/obsidian-day-planner/issues/395).

### 4. Time tracking

> [!Warning]
> This feature is experimental and can break or change at any time in the near future. You can help to shape this feature by providing your feedback.

You can record time spent on tasks in the form of Dataview properties and then view the records as time blocks, much like planner entries.

#### Recording clocks

Start a clock by right-clicking on a task in the editor:

<img src="./assets/clock-in-demo.png" width="75%">

Stop the clock to record the time spent on a task or cancel it to discard the record:

<img src="./assets/clock-out-demo.png" width="75%">

There is a command for each of the menu items, available in the command palette or as a hotkey:

<img src="./assets/clock-commands-demo.png" width="75%">

#### Clocks in timelines

You can enable an additional timeline column to see the recorded clocks next to your planner:

<img src="./assets/show-time-tracker-settings.png" width="75%">

#### Active clocks

You can see the currently active clocks in the timeline sidebar:

<img src="./assets/active-clocks-demo.png" width="75%">

A right click on an active clock will bring the control menu:

<img src="./assets/active-clocks-menu.png" width="75%">

#### Limitations

- For now clock time blocks are read-only. This is going to be addressed in the future.

## Upstream

Day Planner Enhanced is maintained as an independent fork of [Obsidian Day Planner](https://github.com/ivan-lednev/obsidian-day-planner). Upstream changes can still be merged from the original project when useful, but this plugin has its own package identity, release versioning, and issue tracker.

## Acknowledgements

- Day Planner Enhanced is based on [Obsidian Day Planner](https://github.com/ivan-lednev/obsidian-day-planner).
- Thanks to [Michael Brenan](https://github.com/blacksmithgu) for Dataview
- Thanks to [James Lynch](https://github.com/lynchjames) for the original plugin
- Thanks to [Joshua Tazman Reinier](https://github.com/joshuatazrein) for his plugin that served as an inspiration
- Thanks to @liamcain for creating daily note utilities and a helpful calendar plugin
- Thanks to [Emacs Org Mode](https://orgmode.org/) for an idea of text-based time-tracking
- Thanks to [Toggl Track](https://track.toggl.com/timer) for an idea of a great time-tracking UI
