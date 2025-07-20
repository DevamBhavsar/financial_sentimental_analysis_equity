import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { Globe, User } from "lucide-react";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import Head from "next/head";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <Head>
        <title>SSA - Smart Sentiment Analysis | AI-Powered Investment Intelligence</title>
        <meta name="description" content="Transform your investment strategy with AI-powered sentiment analysis. Get real-time market insights and data-driven recommendations for smarter trading decisions." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><path d='m4.93 4.93 4.24 4.24'/><path d='m14.83 9.17 4.24-4.24'/><path d='m14.83 14.83 4.24 4.24'/><path d='m9.17 14.83-4.24 4.24'/></svg>" />
      </Head>
      <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div
            className="flex items-center gap-2 text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push(isAuthenticated ? "/dashboard" : "/")}
          >
            <Globe className="h-6 w-6" />
            <h1>SSA</h1>
          </div>
          <nav className="flex items-center space-x-1 md:space-x-2">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => router.push("/upload")}>
                  Upload
                </Button>
                <Button variant="ghost" onClick={() => router.push("/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Login
                </Button>
                <Button onClick={() => router.push("/register")}>
                  Register
                </Button>
              </>
            )}
            <ModeToggle />
          </nav>
        </div>
      </header>
      <main className="container mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </>
  );
}
