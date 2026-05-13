import { Group, Panel, Separator } from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full group/resizable",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className
      )}
      orientation={orientation}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof Panel>) {
  return <Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean
}) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "relative flex items-center justify-center bg-transparent transition-colors hover:bg-sky-500/30 focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:outline-none z-10",
        // Horizontal group (panels are side by side) -> vertical divider
        "group-data-[orientation=horizontal]/resizable:w-px group-data-[orientation=horizontal]/resizable:h-full",
        "after:group-data-[orientation=horizontal]/resizable:absolute after:group-data-[orientation=horizontal]/resizable:inset-y-0 after:group-data-[orientation=horizontal]/resizable:left-1/2 after:group-data-[orientation=horizontal]/resizable:w-4 after:group-data-[orientation=horizontal]/resizable:-translate-x-1/2",
        // Vertical group (panels are stacked) -> horizontal divider
        "group-data-[orientation=vertical]/resizable:h-px group-data-[orientation=vertical]/resizable:w-full",
        "after:group-data-[orientation=vertical]/resizable:absolute after:group-data-[orientation=vertical]/resizable:inset-x-0 after:group-data-[orientation=vertical]/resizable:top-1/2 after:group-data-[orientation=vertical]/resizable:h-4 after:group-data-[orientation=vertical]/resizable:-translate-y-1/2",
        // Visible line (thin)
        "before:absolute before:bg-slate-700/50 before:transition-colors group-hover/resizable:before:bg-slate-600",
        "group-data-[orientation=horizontal]/resizable:before:inset-y-0 group-data-[orientation=horizontal]/resizable:before:left-1/2 group-data-[orientation=horizontal]/resizable:before:w-px group-data-[orientation=horizontal]/resizable:before:-translate-x-1/2",
        "group-data-[orientation=vertical]/resizable:before:inset-x-0 group-data-[orientation=vertical]/resizable:before:top-1/2 group-data-[orientation=vertical]/resizable:before:h-px group-data-[orientation=vertical]/resizable:before:-translate-y-1/2",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-1 shrink-0 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
      )}
    </Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
