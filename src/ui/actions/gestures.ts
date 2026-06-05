/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import TinyGesture, { type Options } from "tinygesture";

export function createGestures(props: {
  ontap?: (event: MouseEvent | TouchEvent) => void;
  onlongpress?: (event: MouseEvent | TouchEvent) => void;
  onpanstart?: (event: MouseEvent | TouchEvent) => void;
  onpanend?: (event: MouseEvent | TouchEvent) => void;
  onpanmove?: (event: MouseEvent | TouchEvent) => void;
  options?: Partial<Options>;
}) {
  const { ontap, onlongpress, onpanstart, onpanend, onpanmove, options } =
    props;

  let pressed = false;

  return (el: HTMLElement) => {
    const gesture = new TinyGesture(el, options);

    gesture.on("tap", (event) => {
      if (pressed) {
        return;
      }

      ontap?.(event);
    });

    gesture.on("longpress", (event) => {
      pressed = true;

      onlongpress?.(event);
    });

    gesture.on("panend", (event) => {
      if (pressed) {
        window.setTimeout(() => {
          pressed = false;
        });
      }

      onpanend?.(event);
    });

    gesture.on("panstart", (event) => {
      onpanstart?.(event);
    });

    gesture.on("panmove", (event) => {
      onpanmove?.(event);
    });

    return {
      destroy() {
        gesture.destroy();
      },
    };
  };
}
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
