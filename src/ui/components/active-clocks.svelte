<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import {
    Play,
    Hourglass,
    File,
    Square,
    EllipsisVertical,
  } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { currentTimeSignal } from "../../global-store/current-time";
  import { settingsStore } from "../../global-store/settings";
  import { selectActiveLogTimeBlocks } from "../../redux/index/index-selectors";
  import type { LogTimeBlock } from "../../time-block-types";
  import { runWithNoticeOnError } from "../../util/effect";
  import { removeMarkdownExtension } from "../../util/markdown";
  import * as m from "../../util/moment";
  import { createActiveClockMenu } from "../active-clock-menu";

  import BlockControls from "./block-controls.svelte";
  import BlockList from "./block-list.svelte";
  import ControlButton from "./control-button.svelte";
  import LocalTimeBlockComponent from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Properties from "./properties.svelte";
  import Selectable from "./selectable.svelte";

  const {
    workspaceFacade,
    logEntryEditor,
    openLogEntryEditModal,
    useSelector,
  } = getObsidianContext();

  const activeLogRecords = useSelector((state) =>
    selectActiveLogTimeBlocks(state, currentTimeSignal.current),
  );
</script>

<BlockList list={activeLogRecords.current}>
  {#snippet match(timeBlock: LogTimeBlock)}
    <Selectable
      onSecondarySelect={(event) =>
        createActiveClockMenu({
          event,
          timeBlock,
          logEntryEditor,
          workspaceFacade,
          openLogEntryEditModal,
        })}
    >
      {#snippet children({ use, onpointerup, state })}
        <LocalTimeBlockComponent
          --time-block-border-color-override="var(--color-accent)"
          isActive={state === "secondary"}
          {onpointerup}
          {timeBlock}
          {use}
        >
          {#snippet blockEndDecoration()}
            <BlockControls>
              <ControlButton
                onclick={async () => {
                  await runWithNoticeOnError(
                    logEntryEditor.clockOut(timeBlock),
                  );
                }}
              >
                {#snippet icon()}
                  <Square class="svg-icon" />
                {/snippet}
              </ControlButton>

              <ControlButton
                onclick={(event: MouseEvent) => {
                  createActiveClockMenu({
                    timeBlock,
                    event,
                    logEntryEditor,
                    workspaceFacade,
                    openLogEntryEditModal,
                  });
                }}
              >
                {#snippet icon()}
                  <EllipsisVertical class="svg-icon" />
                {/snippet}
              </ControlButton>
            </BlockControls>
          {/snippet}
          {#snippet bottomDecoration()}
            <Properties>
              <Pill
                key={File}
                onclick={async () => {
                  await workspaceFacade.revealLocation(timeBlock);
                }}
                value={removeMarkdownExtension(timeBlock.path)}
              />
              <Pill
                key={Play}
                value={timeBlock.startTime.format(
                  $settingsStore.timestampFormat,
                )}
              />
              <Pill
                key={Hourglass}
                value={m
                  .fromDiff(timeBlock.startTime, currentTimeSignal.current)
                  .format($settingsStore.timestampFormat)}
              />
            </Properties>
          {/snippet}
        </LocalTimeBlockComponent>
      {/snippet}
    </Selectable>
  {/snippet}
</BlockList>
<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->
