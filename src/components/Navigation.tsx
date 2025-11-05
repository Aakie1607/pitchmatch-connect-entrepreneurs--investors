"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, MessageCircle, Heart, BarChart3, User, LogOut, Menu, X, Bell } from "lucide-react";
import { SignOutModal } from "@/components/SignOutModal";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      if (!session?.user) return;

      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch("/api/notifications?isRead=false", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.length);
        }
      } catch (error) {
        console.error("Failed to fetch notifications");
      }
    };

    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000);

    return () => clearInterval(interval);
  }, [session]);

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (error?.code) {
      toast.error("Failed to sign out");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/");
      toast.success("Signed out successfully");
    }
    setIsSignOutModalOpen(false);
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/browse", label: "Browse", icon: Search },
    { href: "/messages", label: "Messages", icon: MessageCircle, badge: unreadCount },
    { href: "/favorites", label: "Favorites", icon: Heart },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Link href={session?.user ? "/dashboard" : "/"} className="flex-shrink-0">
                <h1 className="text-xl font-light tracking-wide text-foreground">
                  PitchMatch
                </h1>
              </Link>
            </motion.div>

            {!isPending && session?.user && (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-1">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      
                      return (
                        <Link key={item.href} href={item.href}>
                          <motion.div
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.99 }}
                            className={`relative px-4 py-2 rounded-xl text-xs font-light tracking-wide transition-all duration-400 ${
                              isActive
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && item.badge > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] text-background font-light"
                              >
                                {item.badge}
                              </motion.span>
                            )}
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden md:block">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIsSignOutModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-light tracking-wide text-muted-foreground hover:text-foreground transition-all duration-400"
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Sign Out
                  </motion.button>
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="inline-flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:text-foreground transition-all"
                  >
                    <span className="sr-only">Open main menu</span>
                    {isMenuOpen ? (
                      <X className="h-5 w-5" strokeWidth={1.5} />
                    ) : (
                      <Menu className="h-5 w-5" strokeWidth={1.5} />
                    )}
                  </motion.button>
                </div>
              </>
            )}

            {!isPending && !session?.user && (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-xs font-light tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Link
                    href="/register"
                    className="rounded-full bg-foreground px-5 py-2 text-xs font-light tracking-wide text-background hover:shadow-lg transition-all duration-400"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </div>
            )}
            
            {isPending && <div className="w-32 h-10" />}
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {!isPending && session?.user && isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="space-y-1 px-4 pb-4 pt-2 border-t border-border/40">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-light tracking-wide transition-all duration-400 ${
                          isActive
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.5} />
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center rounded-full bg-background px-2 py-0.5 text-xs text-foreground font-light">
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSignOutModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-light tracking-wide text-muted-foreground hover:text-foreground transition-all duration-400"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />
    </>
  );
}