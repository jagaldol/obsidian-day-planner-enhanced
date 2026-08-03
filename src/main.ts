/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { get, type Readable, type Writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import {
  obsidianContextKey,
  viewTypeReleaseNotes,
  viewTypeTimeline,
  viewTypeMultiDay,
  viewTypeTimeTracker,
  icalRefreshIntervalMillis,
  icalParseLowerLimit,
} from "./constants";
import {
  createDeleteTimeBlockHandler,
  createEditLineHandler,
  createUpdateHandler,
  getTextFromUser,
} from "./create-update-handler";
import { createDumpMetadataCommand } from "./dump-metadata";
import { VaultIndexAdapter } from "./feature/vault-index-adapter";
import { currentTime } from "./global-store/current-time";
import { settingsSignal, settingsStore } from "./global-store/settings";
import {
  clearTimelineTaskSelection,
  createTimelineTaskSelectionTarget,
  requestTimelineTaskSelection,
} from "./global-store/timeline-task-selection";
import {
  fromMarkdown,
  positionContainsPoint,
  sortListsRecursivelyByTimestamp,
  toEditorPos,
  toMarkdown,
  toMdastPoint,
} from "./mdast/mdast";
import type { DateRanges } from "./redux/date-ranges";
import { icalRefreshRequested } from "./redux/ical/ical-slice";
import { type IcalParseTaskResult } from "./redux/ical/init-ical-listeners";
import { selectActiveLogTimeBlocks } from "./redux/index/index-selectors";
import { settingsUpdated } from "./redux/settings-slice";
import {
  type AppDispatch,
  type AppStore,
  createReactor,
  type RootState,
} from "./redux/store";
import { type UseSelector } from "./redux/use-selector";
import { configureTimestampRegExps } from "./regexp";
import { TransactionWriter } from "./service/diff-writer";
import { createYamlEditTargets } from "./service/edit-yaml";
import { createIndexServices } from "./service/index/create-index-services";
import { ListItemEntryEditor } from "./service/list-item-entry-editor";
import { ListPropsParser } from "./service/list-props-parser";
import { LogEntryEditor } from "./service/log-entry-editor";
import { MetadataCacheFacade } from "./service/metadata-cache-facade";
import { PeriodicNotes } from "./service/periodic-notes";
import {
  DefaultSearchOrderingService,
  type SearchOrderingService,
} from "./service/search-ordering-service";
import {
  type SearchService,
  VaultSearchService,
} from "./service/search-service";
import { VaultFacade } from "./service/vault-facade";
import { WorkspaceFacade } from "./service/workspace-facade";
import { type DayPlannerSettings, mergeStoredSettings } from "./settings";
import { createGetTasksApi } from "./tasks-plugin";
import type { EditableTimeBlock, RemoteTimeBlock } from "./time-block-types";
import type { ObsidianContext, OnUpdateFn, PointerDateTime } from "./types";
import { ClockInOnAnythingModal } from "./ui/clock-in-on-anything-modal";
import { askForConfirmation } from "./ui/confirmation-modal";
import { createNestedItemsEditModalCreator } from "./ui/create-nested-items-edit-modal";
import { createEditorMenuCallback } from "./ui/editor-menu";
import { EditMode } from "./ui/hooks/use-edit/types";
import { useTimeBlocks } from "./ui/hooks/use-time-blocks";
import { createLogEntryEditModalOpener } from "./ui/log-entry-edit-modal";
import MultiDayView from "./ui/multi-day-view";
import { DayPlannerReleaseNotesView } from "./ui/release-notes";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { mountStatusBarWidget } from "./ui/status-bar-widget";
import {
  createTimeTrackerCommandCheck,
  createTimeTrackerViewSynchronizer,
  getTimeTrackerDisableConfirmation,
} from "./ui/time-tracker-availability";
import TimeTrackerView from "./ui/time-tracker-view";
import { createTimelineSettingsModalOpener } from "./ui/timeline-settings-modal";
import TimelineView from "./ui/timeline-view";
import { UndoNotice } from "./ui/undo-notice";
import { createEnvironmentHooks } from "./util/create-environment-hooks";
import { createRenderMarkdown } from "./util/create-render-markdown";
import {
  createShowPreview,
  dayPlannerHoverLinkSource,
} from "./util/create-show-preview";
import { runWithNoticeOnError } from "./util/effect";
import { notifyAboutStartedTimeBlocks } from "./util/notify-about-started-time-blocks";
import { createBackgroundBatchScheduler } from "./util/scheduler";

export default class DayPlanner extends Plugin {
  getSettings!: () => DayPlannerSettings;
  private settingsStore!: Writable<DayPlannerSettings>;
  private workspaceFacade!: WorkspaceFacade;
  private periodicNotes!: PeriodicNotes;
  private taskEntryEditor!: ListItemEntryEditor;
  private logEntryEditor!: LogEntryEditor;
  private vaultFacade!: VaultFacade;
  private searchService!: SearchService;
  private searchOrderingService!: SearchOrderingService;
  private transactionWriter!: TransactionWriter;
  private metadataCacheFacade!: MetadataCacheFacade;
  private undoNotice!: UndoNotice;
  private getActiveClockCount = () => 0;
  private enqueueTimeTrackerViewOperation!: (
    operation: () => Promise<void>,
  ) => Promise<void>;
  private syncTimeTrackerView!: (enabled: boolean) => Promise<void>;

  private openClockInOnAnythingModal = () => {
    if (!this.getSettings().enableTimeTracker) {
      return;
    }

    new ClockInOnAnythingModal(
      this.app,
      this.searchService,
      this.searchOrderingService,
      this.vaultFacade,
      this.logEntryEditor,
    ).open();
  };

  setTimeTrackerEnabled = async (enabled: boolean): Promise<boolean> => {
    if (enabled === this.getSettings().enableTimeTracker) {
      return true;
    }

    if (!enabled) {
      const confirmation = getTimeTrackerDisableConfirmation(
        this.getActiveClockCount(),
      );

      if (
        confirmation &&
        !(await askForConfirmation({ ...confirmation, app: this.app }))
      ) {
        return false;
      }
    }

    this.settingsStore.update((previous) => ({
      ...previous,
      enableTimeTracker: enabled,
    }));

    return true;
  };

  async onload() {
    const { vault, metadataCache } = this.app;

    const initialSettings = mergeStoredSettings(await this.loadData());

    const getTasksApi = createGetTasksApi(this.app);
    const listPropsParser = new ListPropsParser(vault, metadataCache);

    this.periodicNotes = new PeriodicNotes();

    const indexServices = createIndexServices({
      listPropsParser,
      periodicNotes: this.periodicNotes,
      settings: initialSettings,
    });
    this.vaultFacade = new VaultFacade(vault, getTasksApi);
    this.transactionWriter = new TransactionWriter(this.vaultFacade);
    this.undoNotice = new UndoNotice(this.transactionWriter.undo);
    this.workspaceFacade = new WorkspaceFacade(
      this.app.workspace,
      this.vaultFacade,
      this.periodicNotes,
    );
    this.metadataCacheFacade = new MetadataCacheFacade(metadataCache);
    this.searchService = new VaultSearchService(vault, metadataCache);

    const icalParseScheduler =
      createBackgroundBatchScheduler<IcalParseTaskResult>({
        timeRemainingLowerLimit: icalParseLowerLimit,
      });

    const {
      store,
      useSelector,
      listenerMiddleware,
      remoteTimeBlocks,
      localTimeBlocks,
      pointerDateTime,
      dateRanges,
    } = createReactor({
      listPropsParser,
      indexServices,
      vault,
      metadataCache,
      periodicNotes: this.periodicNotes,
      settings: initialSettings,
      icalParseScheduler,
    });

    const { dispatch } = store;

    this.getActiveClockCount = () =>
      selectActiveLogTimeBlocks(store.getState(), window.moment()).length;

    this.searchOrderingService = new DefaultSearchOrderingService(vault, () =>
      store.getState(),
    );

    this.taskEntryEditor = new ListItemEntryEditor(
      this.workspaceFacade,
      this.vaultFacade,
      this.metadataCacheFacade,
      listPropsParser,
    );

    const yamlEditTargets = createYamlEditTargets({
      vaultFacade: this.vaultFacade,
      metadataCacheFacade: this.metadataCacheFacade,
      listPropsParser,
      workspaceFacade: this.workspaceFacade,
    });
    this.logEntryEditor = new LogEntryEditor(yamlEditTargets);

    this.register(() => {
      listenerMiddleware.clearListeners();
      icalParseScheduler.cancelTasks();
    });

    this.initSettingsStore({ initialSettings, dispatch });
    this.registerHoverLinkSource(dayPlannerHoverLinkSource, {
      display: this.manifest.name,
      defaultMod: false,
    });
    this.registerViews({
      store,
      dispatch,
      remoteTimeBlocks,
      pointerDateTime,
      useSelector,
      localTimeBlocks,
      dateRanges,
    });

    const timeTrackerViewSynchronizer = createTimeTrackerViewSynchronizer({
      openSilently: async () => {
        await this.initLeafSilently(viewTypeTimeTracker);
      },
      detach: async () => {
        await this.detachLeavesOfType(viewTypeTimeTracker);
      },
    });
    this.enqueueTimeTrackerViewOperation = timeTrackerViewSynchronizer.enqueue;
    this.syncTimeTrackerView = timeTrackerViewSynchronizer.sync;

    const handleEditorMenu = createEditorMenuCallback({
      logEntryEditor: this.logEntryEditor,
      metadataCacheFacade: this.metadataCacheFacade,
      metadataCache,
      listPropsParser,
      isTimeTrackerEnabled: () => this.getSettings().enableTimeTracker,
    });

    this.registerEvent(this.app.workspace.on("editor-menu", handleEditorMenu));

    this.registerCommands();
    this.addRibbonIcons();
    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    await this.handleNewPluginVersion();

    this.app.workspace.onLayoutReady(async () => {
      this.registerTimeTrackerSettingListener();
      await this.initLeafSilently(viewTypeTimeline);
      await this.syncTimeTrackerView(this.getSettings().enableTimeTracker);
    });

    const timeTrackingFeature = new VaultIndexAdapter(
      this,
      this.app.workspace,
      vault,
      metadataCache,
      dispatch,
    );

    timeTrackingFeature.load();
  }

  async onunload() {
    return Promise.all([
      this.detachLeavesOfType(viewTypeTimeline),
      this.detachLeavesOfType(viewTypeMultiDay),
      this.syncTimeTrackerView(false),
    ]);
  }

  addRibbonIcons() {
    this.addRibbonIcon(
      "calendar-range",
      "Open Timeline",
      this.initTimelineLeaf,
    );
    this.addRibbonIcon("table-2", "Open Multi-Day View", this.initWeeklyLeaf);
  }

  initWeeklyLeaf = async () => {
    await this.app.workspace.getLeaf("tab").setViewState({
      type: viewTypeMultiDay,
      active: true,
    });
  };

  initTimeTrackerTab = async () => {
    if (!this.getSettings().enableTimeTracker) {
      return;
    }

    await this.enqueueTimeTrackerViewOperation(async () => {
      if (!this.getSettings().enableTimeTracker) {
        return;
      }

      await this.app.workspace.getLeaf("tab").setViewState({
        type: viewTypeTimeTracker,
        active: true,
      });
    });
  };

  initTimelineTab = async () => {
    await this.app.workspace.getLeaf("tab").setViewState({
      type: viewTypeTimeline,
      active: true,
    });
  };

  initLeafSilently = async (viewType: string) => {
    const [firstExisting] = this.app.workspace.getLeavesOfType(viewType);
    if (firstExisting) {
      return;
    }

    await this.detachLeavesOfType(viewType);

    await this.app.workspace.getRightLeaf(false)?.setViewState({
      type: viewType,
    });
  };

  initRightPanelLeaf = async (viewType: string) => {
    const [firstExisting] = this.app.workspace.getLeavesOfType(viewType);

    if (firstExisting) {
      this.app.workspace.revealLeaf(firstExisting);
      return;
    }

    await this.detachLeavesOfType(viewType);
    await this.app.workspace.getRightLeaf(false)?.setViewState({
      type: viewType,
      active: true,
    });
    this.app.workspace.rightSplit.expand();
  };

  initTimelineLeaf = async () => this.initRightPanelLeaf(viewTypeTimeline);

  initTimeTrackerLeaf = async () => {
    if (!this.getSettings().enableTimeTracker) {
      return;
    }

    await this.enqueueTimeTrackerViewOperation(async () => {
      if (!this.getSettings().enableTimeTracker) {
        return;
      }

      await this.initRightPanelLeaf(viewTypeTimeTracker);
    });
  };

  private async handleNewPluginVersion() {
    if (this.getSettings().pluginVersion === currentPluginVersion) {
      return;
    }

    this.settingsStore.update((previous) => ({
      ...previous,
      pluginVersion: currentPluginVersion,
    }));

    if (this.getSettings().releaseNotes) {
      this.app.workspace.onLayoutReady(async () => {
        await this.showReleaseNotes();
      });
    }
  }

  private registerCommands() {
    const timeTrackerCommand = (execute: () => void) =>
      createTimeTrackerCommandCheck({
        execute,
        isEnabled: () => this.getSettings().enableTimeTracker,
      });

    this.addCommand({
      id: "show-day-planner-timeline",
      name: "Show timeline",
      callback: async () => await this.initTimelineLeaf(),
    });

    this.addCommand({
      id: "show-timeline-tab",
      name: "Show timeline in regular tab",
      callback: this.initTimelineTab,
    });

    this.addCommand({
      id: "show-weekly-view",
      name: "Show week planner",
      callback: this.initWeeklyLeaf,
    });

    this.addCommand({
      id: "show-multi-day-view",
      name: "Show multi-day planner",
      callback: this.initWeeklyLeaf,
    });

    this.addCommand({
      id: "show-time-tracker",
      name: "Show time tracker",
      checkCallback: timeTrackerCommand(this.initTimeTrackerLeaf),
    });

    this.addCommand({
      id: "show-time-tracker-tab",
      name: "Show time tracker in regular tab",
      checkCallback: timeTrackerCommand(this.initTimeTrackerTab),
    });

    this.addCommand({
      id: "show-day-planner-today-note",
      name: "Open today's planner",
      callback: async () => {
        const dailyNote = await this.periodicNotes.createDailyNoteIfNeeded(
          window.moment(),
        );

        await this.app.workspace.getLeaf(false).openFile(dailyNote);
      },
    });

    this.addCommand({
      id: "reorder-tasks-by-time",
      name: "Sort tasks under cursor by time",
      editorCallback: (editor) => {
        const mdastRoot = fromMarkdown(editor.getValue());
        const cursorPoint = toMdastPoint(editor.getCursor());

        // todo: move out
        const list = mdastRoot.children.find(
          (rootContent) =>
            rootContent.position &&
            positionContainsPoint(rootContent.position, cursorPoint),
        );

        if (!list) {
          new Notice("There is no list under cursor");

          return;
        }

        const sorted = sortListsRecursivelyByTimestamp(list);
        const updatedText = toMarkdown(sorted).trim();

        isNotVoid(sorted.position);

        editor.replaceRange(
          updatedText,
          toEditorPos(sorted.position.start),
          toEditorPos(sorted.position.end),
        );
      },
    });

    this.addCommand({
      id: "clock-in",
      icon: "play",
      name: "Clock in",
      editorCheckCallback: timeTrackerCommand(() =>
        runWithNoticeOnError(this.logEntryEditor.clockInUnderCursor()),
      ),
    });

    this.addCommand({
      icon: "square",
      id: "clock-out",
      name: "Clock out",
      editorCheckCallback: timeTrackerCommand(() =>
        runWithNoticeOnError(this.logEntryEditor.clockOutUnderCursor()),
      ),
    });

    this.addCommand({
      icon: "trash-2",
      id: "cancel-clock",
      name: "Cancel clock",
      editorCheckCallback: timeTrackerCommand(() =>
        runWithNoticeOnError(this.logEntryEditor.cancelClockUnderCursor()),
      ),
    });

    this.addCommand({
      id: "clock-in-on-anything",
      name: "Clock in on anything...",
      checkCallback: timeTrackerCommand(this.openClockInOnAnythingModal),
    });
  }

  private registerTimeTrackerSettingListener() {
    let previous = this.getSettings().enableTimeTracker;

    this.register(
      this.settingsStore.subscribe(({ enableTimeTracker }) => {
        if (enableTimeTracker === previous) {
          return;
        }

        previous = enableTimeTracker;
        void this.syncTimeTrackerView(enableTimeTracker);
      }),
    );
  }

  private initSettingsStore(props: {
    initialSettings: DayPlannerSettings;
    dispatch: AppDispatch;
  }) {
    const { initialSettings, dispatch } = props;

    settingsStore.set(initialSettings);

    this.register(
      settingsStore.subscribe(async (newValue) => {
        configureTimestampRegExps(newValue.timestampFormat);
        dispatch(settingsUpdated(newValue));

        await this.saveData(newValue);
      }),
    );

    this.settingsStore = settingsStore;
    this.getSettings = () => get(settingsStore);
  }

  private async detachLeavesOfType(type: string) {
    // Although this is synchronous, without wrapping into a promise, weird things happen:
    // - when re-initializing the weekly view, it gets deleted every other time instead of getting re-created
    // - or the tabs get hidden
    this.app.workspace.detachLeavesOfType(type);
    await Promise.resolve();
  }

  private showReleaseNotes = async () => {
    await this.app.workspace.getLeaf("tab").setViewState({
      type: viewTypeReleaseNotes,
      active: true,
    });
  };

  private registerViews(props: {
    store: AppStore;
    dispatch: AppDispatch;
    useSelector: UseSelector<RootState>;
    remoteTimeBlocks: Readable<RemoteTimeBlock[]>;
    localTimeBlocks: Readable<EditableTimeBlock[]>;
    pointerDateTime: Writable<PointerDateTime>;
    dateRanges: DateRanges;
  }) {
    const {
      store,
      dispatch,
      useSelector,
      remoteTimeBlocks,
      localTimeBlocks,
      pointerDateTime,
      dateRanges,
    } = props;

    const confirmAction: ObsidianContext["confirmAction"] = (input) =>
      askForConfirmation({
        ...input,
        app: this.app,
      });

    const selectTimelineTask = (task: EditableTimeBlock) => {
      const path =
        task.source === "unwritten"
          ? task.destination.type === "line"
            ? task.destination.path
            : this.periodicNotes.createDailyNotePath(task.startTime)
          : task.path;

      requestTimelineTaskSelection(
        createTimelineTaskSelectionTarget(task, path),
      );
    };

    const onUpdate: OnUpdateFn = createUpdateHandler({
      getSettings: this.getSettings,
      transactionWriter: this.transactionWriter,
      vaultFacade: this.vaultFacade,
      periodicNotes: this.periodicNotes,
      onEditConfirmed: this.undoNotice.show,
      onTaskCreationStarted: selectTimelineTask,
      onTaskCreated: selectTimelineTask,
      onEditCanceled: () => {
        clearTimelineTaskSelection();
        new Notice("Edit canceled");
      },
      getTextInput: () =>
        getTextFromUser({
          app: this.app,
          getDescriptionText: (value) =>
            value.trim().length === 0
              ? "Start typing to create a task"
              : `Create item "${value}"`,
        }),
      getConfirmationInput: confirmAction,
    });

    const onEditAborted = () => {
      new Notice("Tasks changed externally; edit canceled");
    };

    const { isDarkMode, isModPressed, isOnline } = createEnvironmentHooks({
      workspace: this.app.workspace,
    });

    const { timeBlocksWithTimeForToday, editContext, newlyStartedTimeBlocks } =
      useTimeBlocks({
        onUpdate,
        onEditAborted,
        periodicNotes: this.periodicNotes,
        workspaceFacade: this.workspaceFacade,
        isOnline,
        settingsStore: this.settingsStore,
        currentTime,
        pointerDateTime,
        remoteTimeBlocks,
        localTimeBlocks,
      });

    this.registerInterval(
      window.setInterval(() => {
        dispatch(icalRefreshRequested());
      }, icalRefreshIntervalMillis),
    );

    dispatch(icalRefreshRequested());

    this.registerDomEvent(window, "blur", editContext.cancelEdit);
    this.registerDomEvent(activeDocument, "pointerup", editContext.cancelEdit);

    this.register(
      editContext.cursor.subscribe(({ bodyCursor }) => {
        activeDocument.body.style.cursor = bodyCursor;
      }),
    );
    const openLogEntryEditModal = createLogEntryEditModalOpener(
      this.app,
      this.logEntryEditor,
    );

    const openTimelineSettingsModal = createTimelineSettingsModalOpener(
      this.app,
      settingsStore,
    );

    const destroyStatusBarWidget = mountStatusBarWidget({
      plugin: this,
      dateRanges,
      timeBlocksWithTimeForToday,
      useSelector,
      logEntryEditor: this.logEntryEditor,
      workspaceFacade: this.workspaceFacade,
      openLogEntryEditModal,
      openClockInOnAnythingModal: this.openClockInOnAnythingModal,
    });

    this.register(destroyStatusBarWidget);

    this.register(
      newlyStartedTimeBlocks.subscribe((value) =>
        notifyAboutStartedTimeBlocks(value, this.getSettings()),
      ),
    );
    this.addCommand({
      id: "re-sync",
      name: "Re-sync tasks",
      callback: async () => {
        dispatch(icalRefreshRequested());
      },
    });

    this.addCommand({
      id: "jump-to-active-clock",
      name: "Jump to active clock",
      checkCallback: createTimeTrackerCommandCheck({
        isEnabled: () => this.getSettings().enableTimeTracker,
        execute: async () => {
          const activeLogTimeBlocks = selectActiveLogTimeBlocks(
            store.getState(),
            window.moment(),
          );

          if (activeLogTimeBlocks.length === 0) {
            new Notice("No active clocks found");
            return;
          }

          const firstActiveLogTimeBlock = activeLogTimeBlocks[0];

          isNotVoid(firstActiveLogTimeBlock);

          await this.workspaceFacade.revealLocation(firstActiveLogTimeBlock);
        },
      }),
    });

    if (envMode === "development") {
      this.addCommand({
        id: "dump-metadata",
        name: "Dump metadata to files",
        callback: createDumpMetadataCommand(this.app),
      });
    }

    const editLine = createEditLineHandler({
      getSettings: this.getSettings,
      transactionWriter: this.transactionWriter,
      onConfirmed: this.undoNotice.show,
    });

    const deleteTimeBlock = createDeleteTimeBlockHandler({
      getSettings: this.getSettings,
      periodicNotes: this.periodicNotes,
      transactionWriter: this.transactionWriter,
      onConfirmed: this.undoNotice.show,
    });

    // todo: clean up
    const editText: ObsidianContext["editText"] = ({
      initialText,
      getDescriptionText,
      sourcePath,
    }) =>
      getTextFromUser({
        app: this.app,
        initialText,
        getDescriptionText,
        sourcePath,
      });

    const reSync = () => dispatch(icalRefreshRequested());
    const openNestedItemsEditModal = createNestedItemsEditModalCreator(
      this.app,
      this.taskEntryEditor,
    );
    const removeTask: ObsidianContext["removeTask"] = (task) => {
      const base = get(localTimeBlocks);

      return onUpdate(
        base,
        base.filter((candidate) => candidate.id !== task.id),
        EditMode.DELETE,
      );
    };

    const defaultObsidianContext: ObsidianContext = {
      periodicNotes: this.periodicNotes,
      openLogEntryEditModal,
      openTimelineSettingsModal,
      openClockInOnAnythingModal: this.openClockInOnAnythingModal,
      setTimeTrackerEnabled: this.setTimeTrackerEnabled,
      openNestedItemsEditModal,
      removeTask,
      taskEntryEditor: this.taskEntryEditor,
      logEntryEditor: this.logEntryEditor,
      confirmAction,
      editText,
      editLine,
      deleteTimeBlock,
      workspaceFacade: this.workspaceFacade,
      initWeeklyView: this.initWeeklyLeaf,
      renderMarkdown: createRenderMarkdown(this.app),
      toggleCheckboxInFile: this.vaultFacade.toggleCheckboxInFile,
      editContext,
      showPreview: createShowPreview(this.app, {
        source: dayPlannerHoverLinkSource,
      }),
      reSync,
      isOnline,
      isDarkMode,
      isModPressed,
      settings: settingsStore,
      settingsStore,
      settingsSignal,
      pointerDateTime,
      dispatch,
      useSelector,
    };

    const componentContext = new Map<string, ObsidianContext>([
      [obsidianContextKey, defaultObsidianContext],
    ]);

    this.registerView(
      viewTypeTimeline,
      (leaf: WorkspaceLeaf) =>
        new TimelineView(
          leaf,
          this.settingsStore,
          componentContext,
          dateRanges,
          this.periodicNotes,
          this.workspaceFacade,
          this.initWeeklyLeaf,
          reSync,
          openTimelineSettingsModal,
        ),
    );

    this.registerView(
      viewTypeMultiDay,
      (leaf: WorkspaceLeaf) =>
        new MultiDayView(
          leaf,
          this.settingsStore,
          componentContext,
          dateRanges,
        ),
    );

    this.registerView(
      viewTypeReleaseNotes,
      (leaf: WorkspaceLeaf) => new DayPlannerReleaseNotesView(leaf),
    );

    this.registerView(
      viewTypeTimeTracker,
      (leaf: WorkspaceLeaf) => new TimeTrackerView(leaf, componentContext),
    );
  }
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
