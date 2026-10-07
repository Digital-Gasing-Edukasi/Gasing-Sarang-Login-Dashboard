import { Navigate, Route, Routes } from "react-router-dom";
import { AdminV2Layout } from "../components/AdminV2Layout.jsx";
import { ADMIN_V2_BASE_PATH, ADMIN_V2_ROUTES } from "./routes.jsx";

export function AdminV2Routes({ user, onLogout }) {
  return (
    <Routes>
      <Route element={<AdminV2Layout user={user} onLogout={onLogout} />}>
        {ADMIN_V2_ROUTES.map((route) =>
          route.path === "" ? (
            <Route key={route.key} index element={route.element} />
          ) : (
            <Route key={route.key} path={route.path} element={route.element} />
          ),
        )}
        <Route path="*" element={<Navigate to={ADMIN_V2_BASE_PATH} replace />} />
      </Route>
    </Routes>
  );
}
