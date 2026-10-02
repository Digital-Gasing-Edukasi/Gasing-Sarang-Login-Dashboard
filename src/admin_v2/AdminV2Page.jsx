import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { authApi, tokenStorage } from "@/lib/api";
import { LogOut } from "lucide-react";

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <h1 className="text-2xl font-bold text-foreground">Admin V2</h1>
      {user?.email && (
        <p className="text-sm text-muted-foreground">{user.email}</p>
      )}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="flex items-center gap-2"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </Button>
    </div>
  );
}

export default function AdminV2Page(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminV2Content {...props} />
    </QueryClientProvider>
  );
}
