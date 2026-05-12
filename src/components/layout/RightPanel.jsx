export function RightPanel({ children }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-12 max-w-md w-full mx-auto">
        {children}
      </div>
      <div className="pb-6">
        <p className="text-xs text-muted-foreground text-center">©2026 Gasing Circle. All rights reserved.</p>
      </div>
    </div>
  )
}

export function Divider() {
  return <div className="flex items-center my-1"><div className="flex-1 h-px bg-border" /></div>
}
