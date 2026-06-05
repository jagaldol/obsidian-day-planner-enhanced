# Changelog

All notable changes to **Day Planner Enhanced** are documented here.

This plugin is an independent fork of [Obsidian Day Planner](https://github.com/ivan-lednev/obsidian-day-planner), based on upstream **0.30.0**, and follows its own versioning.

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
