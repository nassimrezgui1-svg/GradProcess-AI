import { Sidebar } from "@/components/layout/sidebar"
import { CommandPalette } from "@/components/ui/command-palette"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-surface">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
