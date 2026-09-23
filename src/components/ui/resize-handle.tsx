import { Separator } from "react-resizable-panels";

/** Thin draggable divider between resizable panels, with a wider invisible
 * hit-area so it's easy to grab. */
export function ResizeHandle({ direction = "horizontal" }: { direction?: "horizontal" | "vertical" }) {
  const isHorizontal = direction === "horizontal";
  return (
    <Separator
      className={`relative shrink-0 bg-zinc-800 transition-colors hover:bg-indigo-500 active:bg-indigo-500 ${
        isHorizontal ? "w-px" : "h-px"
      }`}
    >
      <div
        className={
          isHorizontal
            ? "absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize"
            : "absolute inset-x-0 -top-1.5 -bottom-1.5 cursor-row-resize"
        }
      />
    </Separator>
  );
}
