import { Link, useLocation } from "wouter";
import { useGame } from "./GameContext";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Trophy, 
  BarChart3, 
  LogOut, 
  LayoutDashboard,
  Shield
} from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useGame();

  if (location === "/") return <>{children}</>;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-serif font-bold text-xl tracking-tight text-primary">ComPASS</span>
          </div>

          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard">
                <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/dashboard" ? "text-primary" : "text-muted-foreground"}`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/stats">
                <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/stats" ? "text-primary" : "text-muted-foreground"}`}>
                  Statistics
                </a>
              </Link>
              <Link href="/leaderboard">
                <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/leaderboard" ? "text-primary" : "text-muted-foreground"}`}>
                  Leaderboard
                </a>
              </Link>
              {user.role === "admin" && (
                <Link href="/admin">
                  <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin" ? "text-primary" : "text-muted-foreground"}`}>
                    Admin
                  </a>
                </Link>
              )}
            </nav>
          )}

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-sm text-right">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
