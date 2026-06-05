import { moment as obsidianMoment } from "obsidian";

const moment = obsidianMoment as unknown as typeof window.moment;

export { moment };
export type Moment = ReturnType<typeof moment>;
