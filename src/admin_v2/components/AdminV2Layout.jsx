import { useState } from "react";
import { ADMIN_V2_MENUS, AppSidebar } from "./AppSidebar.jsx";

export function AdminV2Layout({ user, onLogout, active, onActiveChange, children }) {
  const [internalActive, setInternalActive] = useState(ADMIN_V2_MENUS[0].key);
  const currentKey = active ?? internalActive;
  const currentMenu = ADMIN_V2_MENUS.find((menu) => menu.key === currentKey) ?? ADMIN_V2_MENUS[0];

  const handleSelect = (key) => {
    setInternalActive(key);
    onActiveChange?.(key);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar
        active={currentKey}
        onSelect={handleSelect}
        user={user}
        onLogout={onLogout}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b px-6">
          <h1 className="text-lg font-semibold">{currentMenu.title}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {children ?? (
            <p className="text-sm text-muted-foreground">
              Konten {currentMenu.title} — coming soon.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
