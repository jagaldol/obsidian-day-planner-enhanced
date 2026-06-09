# Changelog

All notable changes to **Day Planner Enhanced** are documented here.

This plugin is an independent fork of [Obsidian Day Planner](https://github.com/ivan-lednev/obsidian-day-planner), based on upstream **0.30.0**, and follows its own versioning.

## 0.2.1

### 🐞 Fixed issues

- Fixed end-of-day timeline moves so tasks moved to the bottom of the day are saved as `23:59` in the source note instead of displaying as `23:59` while writing `00:00`.
- Fixed click-created timeline tasks so the clicked position becomes the task start time and the configured default duration is applied from there.
- Reduced timeline auto-scroll interruptions while interacting with the planner, editing a task, or keeping a timeline block selected.
- Fixed the empty nested-item editor state so the add action no longer overlaps with an empty-state message.

### ✨ Other improvements

- Timeline block removal now happens immediately from the context menu while still using the undoable edit path.
- Newly created timeline blocks stay selected while the title prompt is open, preventing auto-scroll from pulling the view away while typing.

## 0.2.0

### ✨ New features

- Added **Edit nested items...** for timeline blocks, with inline text editing, root item and child item creation, sibling move controls, delete, checkbox task conversion, and checkbox completion toggles.
- Added a nested-subtree save path that keeps the parent planner line intact while replacing only its nested child list in the source file.
- Added a **Remove** context menu action for deleting a timeline item and its nested subtree from the source file.

### ✨ Other improvements

- Improved the nested item editor layout across desktop and mobile, including icon-only controls, clearer row separators, centered add action, and better marker alignment for timed nested items.
- Updated task sorting so timed anchor groups are ordered by time while untimed siblings can stay attached to the timed item they follow.
- Timeline checkbox colors now use Obsidian theme variables instead of a hardcoded checked color.

## 0.1.11

### ✨ Other improvements

- Adjusted the bundled Redux random action type separator during production builds to avoid a false positive network endpoint warning in automated review.

## 0.1.10

### ✨ Other improvements

- Removed direct dependencies flagged by the automated Obsidian community review by replacing `lodash`, `js-yaml`, and `eslint-plugin-import`.
- Replaced lodash/fp usage with small internal utilities.
- Switched coverage from Istanbul instrumentation to V8 coverage so Svelte rune source files can be covered without compile errors.

## 0.1.5

### 🐞 Fixed issues

- Fixed the GitHub release workflow attestation step so release assets can be published with build provenance.

## 0.1.4

### 🐞 Fixed issues

- Addressed automated Obsidian community review errors from unsupported ESLint directive comments and explicit `any` suppressions.

### ✨ Other improvements

- Added GitHub artifact attestations for release assets.
- Removed the unsupported release zip asset from the release workflow.
- Replaced direct `moment` imports in plugin source with Obsidian's bundled `moment` export.
- Removed unused or replaceable development dependencies flagged by automated review.

## 0.1.3

### ✨ Other improvements

- Removed the inherited support banner (donation link and upstream issue links) from the in-app release notes, which now show only the changelog.
- GitHub release notes are now generated from this changelog.

## 0.1.2

### 🐞 Fixed issues

- Nested timeline dots and their connector line now share a single horizontal axis, fixing the misalignment that appeared under fractional display scaling.

### ✨ Other improvements

- Mixed timed and untimed nested task groups now get a divider at every boundary for clearer grouping.
- The plugin description notes the Day Planner 0.30.0 base so it is visible in plugin listings.

## 0.1.1

### ✨ Other improvements

- Modernized the GitHub release workflow to publish via the GitHub CLI.
- Minor internal cleanups.

## 0.1.0

Initial release of **Day Planner Enhanced**, an independent fork of Obsidian Day Planner based on upstream 0.30.0.

### ✨ New features

- Enhanced timeline UI focused on readable nested schedules: timed child items nested under a timed parent render inside the parent block instead of as separate overlapping blocks, while untimed children stay visible.
- Green visual language for current and future timeline accents (selected blocks remain blue).

### ✨ Other improvements

- Time ranges (`HH:mm - HH:mm`) always remain visible in rendered nested schedules.
- Separate plugin identity (`day-planner-enhanced`) so it can be installed alongside the original Day Planner.
