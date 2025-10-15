import { ModeToggle } from './mode-toggle'
import { Separator } from './ui/separator'
import { SidebarTrigger } from './ui/sidebar'

export function AppHeader() {
  return (
    <div className="mx-auto w-full max-w-6xl flex h-16 shrink-0 items-center gap-2 border-b">
      <SidebarTrigger className="-ms-2" />

      {/* Separator */}
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />

      <div className="flex gap-3 ml-auto">
        <ModeToggle />
      </div>
    </div>
  )
};