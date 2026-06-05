/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Workspace } from "obsidian";
import { fromStore, readable } from "svelte/store";

import { useIsOnline } from "../ui/hooks/use-is-online";
import { useKeyDown } from "../ui/hooks/use-key-down";
import { useModPressed } from "../ui/hooks/use-mod-pressed";

import { getDarkModeFlag } from "./dom";

export function createEnvironmentHooks(props: { workspace: Workspace }) {
  const { workspace } = props;

  const layoutReady = readable(false, (set) => {
    workspace.onLayoutReady(() => set(true));
  });

  const isDarkModeStore = readable(getDarkModeFlag(), (set) => {
    const eventRef = workspace.on("css-change", () => {
      set(getDarkModeFlag());
    });

    return () => {
      workspace.offref(eventRef);
    };
  });
  const isDarkMode = fromStore(isDarkModeStore);

  const keyDown = useKeyDown();
  const isModPressed = useModPressed();
  const isOnline = useIsOnline();

  return {
    isDarkMode,
    keyDown,
    isModPressed,
    isOnline,
    layoutReady,
  };
}
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
