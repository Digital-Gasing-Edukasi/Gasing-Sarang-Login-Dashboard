import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar.jsx";
import { findRouteByPath } from "../routes/routes.jsx";

export function AdminV2Layout({ user, onLogout }) {
  const { pathname } = useLocation();
  const currentMenu = findRouteByPath(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar user={user} onLogout={onLogout} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b px-6">
          <h1 className="text-lg font-semibold">{currentMenu.title}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">Memuat...</p>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
