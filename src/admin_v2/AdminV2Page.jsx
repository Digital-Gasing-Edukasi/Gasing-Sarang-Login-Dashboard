import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authApi, tokenStorage } from "@/lib/api";
import { Toaster } from "./components/ui/toaster.jsx";
import { AdminV2Routes } from "./routes/AdminV2Routes.jsx";

// QueryClient owned by admin_v2 so the rest of the app stays untouched.
// (No provider changes in main.jsx / App.jsx needed.)
const queryClient = new QueryClient();

function AdminV2Content({ user, onSignOut }) {
  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Gagal logout:", error);
    }
    if (onSignOut) {
      onSignOut();
    } else {
      tokenStorage.clear();
      window.location.href = "/login";
    }
  };

  return <AdminV2Routes user={user} onLogout={handleLogout} />;
}

export default function AdminV2Page(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminV2Content {...props} />
      <Toaster />
    </QueryClientProvider>
  );
}
