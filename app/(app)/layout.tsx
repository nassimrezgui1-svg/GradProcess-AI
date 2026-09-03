import { Sidebar } from "@/components/layout/sidebar"
import { CommandPalette } from "@/components/ui/command-palette"
import { DataSync } from "@/components/data-sync"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#070B14" }}>
      {/* Cinematic animated background — fixed, behind everything */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="cosmo-bg-blue" />
        <div className="cosmo-bg-violet" />
        <div className="cosmo-bg-cyan" />
        <div className="bg-grid absolute inset-0 opacity-100" />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <CommandPalette />
      <DataSync />
    </div>
  )
}
