import { clockFormat } from "../../../constants";
import { getTimeFromLine } from "../../../parser/parser";
import { createId } from "../../../redux/index/index-slice";
import { scheduledPropRegExps } from "../../../regexp";
import type { DayPlannerSettings } from "../../../settings";
import { isTaskCache } from "../../../util/metadata";
import {
  getDayKeysInRangeEndExclusive,
  strictParse,
} from "../../../util/moment";
import { getDayKey, getEndTime } from "../../../util/time-block-utils";
import type {
  ListItemIndexExtensionService,
  RawListItemEntryWithContext,
} from "../list-item-index-extension-service";

export class ObsidianTasksExtensionService
  implements ListItemIndexExtensionService
{
  constructor(private readonly settings: DayPlannerSettings) {}

  forFile() {
    return ({
      listItemCache,
      rawListItemEntry,
    }: RawListItemEntryWithContext) => {
      if (!isTaskCache(listItemCache)) {
        return {};
      }

      return {
        planEntries: this.getObsidianTasksEntries({
          firstLine: rawListItemEntry.text,
          parentId: rawListItemEntry.id,
        }),
      };
    };
  }

  private parseScheduledDateFromInlineProp(line: string) {
    for (const regexp of scheduledPropRegExps) {
      const dateMatch = line.match(regexp)?.groups?.["date"];

      if (dateMatch) {
        return strictParse(dateMatch);
      }
    }
  }

  private getObsidianTasksEntries(props: {
    firstLine: string;
    parentId: string;
  }) {
    const { firstLine, parentId } = props;

    const scheduledDate = this.parseScheduledDateFromInlineProp(firstLine);

    if (!scheduledDate) {
      return [];
    }

    const result = {
      id: createId(parentId, "tasks-scheduled"),
      // todo P3: we can add parent id later
      parentId,
      source: "tasksPluginProp" as const,
    };

    const time = getTimeFromLine({
      line: firstLine,
      day: scheduledDate,
    });

    if (!time) {
      return [
        {
          ...result,
          dayKeys: [getDayKey(scheduledDate)],
          start: scheduledDate.format(clockFormat),
          end: scheduledDate.clone().add(1, "hour").format(clockFormat),
          isAllDay: true,
        },
      ];
    }

    const endTime = getEndTime({
      startTime: time.startTime,
      durationMinutes:
        time.durationMinutes ?? this.settings.defaultDurationMinutes,
    });

    return [
      {
        ...result,
        dayKeys: getDayKeysInRangeEndExclusive(time.startTime, endTime),
        start: time.startTime.format(clockFormat),
        end: endTime.format(clockFormat),
      },
    ];
  }
}
