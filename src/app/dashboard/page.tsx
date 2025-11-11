"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { toast } from "sonner";
import { StatCard } from "@/components/AnimatedCard";
import { DashboardStatSkeleton, VideoCardSkeleton } from "@/components/SkeletonLoaders";
import { EmptyState } from "@/components/EmptyState";
import { Users, Video, Bell, TrendingUp, Play, Eye, Check, X, UserPlus } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";

interface Profile {
  id: number;
  userId: string;
  role: string;
  profilePicture: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Video {
  id: number;
  profileId: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewsCount: number;
  createdAt: string;
}

interface Connection {
  id: number;
  requesterId: number;
  recipientId: number;
  status: string;
  createdAt: string;
  requesterProfile?: any;
  recipientProfile?: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);

  // CRITICAL FIX: Only redirect if session is definitely null after loading completes
  useEffect(() => {
    if (!isPending && !session?.user) {
      // Double-check localStorage has token before redirecting
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        router.push("/login");
      }
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Wait for session to be loaded
      if (isPending) return;
      
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("bearer_token");

        const profileResponse = await fetch("/api/profiles/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileResponse.ok) {
          router.push("/create-profile");
          return;
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);

        if (profileData.role === "entrepreneur") {
          const videosResponse = await fetch(`/api/videos/profile/${profileData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (videosResponse.ok) {
            const videosData = await videosResponse.json();
            setVideos(videosData);
          }
        }

        const connectionsResponse = await fetch("/api/connections?status=accepted", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (connectionsResponse.ok) {
          const connectionsData = await connectionsResponse.json();
          setConnections(connectionsData);
        }

        // Fetch pending connection requests where user is recipient
        const pendingResponse = await fetch("/api/connections?status=pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          // Filter only requests where current user is the recipient
          const incomingRequests = pendingData.filter(
            (conn: Connection) => conn.recipientId === profileData.id
          );
          setPendingRequests(incomingRequests);
        }

        const notificationsResponse = await fetch("/api/notifications?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          setNotifications(notificationsData);
        }
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session, isPending, router]);

  const handleConnectionRequest = async (connectionId: number, action: "accepted" | "rejected") => {
    setProcessingRequest(connectionId);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: action }),
      });

      if (response.ok) {
        toast.success(action === "accepted" ? "Connection accepted!" : "Connection rejected");
        // Remove from pending list
        setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
        
        // If accepted, add to connections count
        if (action === "accepted") {
          const updatedConnection = await response.json();
          setConnections(prev => [...prev, updatedConnection]);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update connection");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setProcessingRequest(null);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
          <div className="mb-12 animate-slide-down">
            <div className="h-8 w-64 bg-muted/30 rounded animate-pulse mb-3" />
            <div className="h-4 w-96 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <DashboardStatSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user || !profile) {
    return null;
  }

  const totalVideoViews = videos.reduce((sum, v) => sum + v.viewsCount, 0);
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <h1 className="text-3xl font-light text-foreground tracking-wide">
            Welcome back, {session.user.name}
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground tracking-wide">
            {profile.role === "entrepreneur" ? "Your startup dashboard" : "Your investment overview"}
          </p>
        </motion.div>

        {/* Connection Requests Alert */}
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 rounded-2xl border border-border/40 bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5">
                  <UserPlus className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base font-light text-foreground tracking-wide">
                    {pendingRequests.length} Pending Connection Request{pendingRequests.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-xs font-light text-muted-foreground tracking-wide">
                    Review and respond to connection requests
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              {pendingRequests.map((request, i) => {
                const requester = request.requesterProfile;
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-background p-4"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-foreground/5 to-foreground/10 text-foreground font-light text-lg">
                        {requester?.userId?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-light text-foreground tracking-wide">
                          {requester?.userId || "Unknown User"}
                        </h4>
                        <p className="text-xs font-light text-muted-foreground capitalize tracking-wide">
                          {requester?.role || "User"} • {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConnectionRequest(request.id, "accepted")}
                        disabled={processingRequest === request.id}
                        className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-light text-background hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConnectionRequest(request.id, "rejected")}
                        disabled={processingRequest === request.id}
                        className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-background px-4 py-2 text-xs font-light text-foreground hover:bg-muted/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Reject
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5" strokeWidth={1.5} />}
            label="Connections"
            value={formatNumber(connections.length)}
            delay={0}
          />
          
          {profile.role === "entrepreneur" && (
            <>
              <StatCard
                icon={<Video className="h-5 w-5" strokeWidth={1.5} />}
                label="Videos"
                value={videos.length}
                delay={100}
              />
              <StatCard
                icon={<Eye className="h-5 w-5" strokeWidth={1.5} />}
                label="Total Views"
                value={formatNumber(totalVideoViews)}
                delay={200}
              />
            </>
          )}
          
          <StatCard
            icon={<Bell className="h-5 w-5" strokeWidth={1.5} />}
            label="Notifications"
            value={unreadNotifications}
            delay={profile.role === "entrepreneur" ? 300 : 100}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/browse",
              icon: <TrendingUp className="h-6 w-6 text-foreground" strokeWidth={1.5} />,
              title: `Browse ${profile.role === "entrepreneur" ? "Investors" : "Startups"}`,
              description: "Discover opportunities",
              delay: 0,
            },
            {
              href: "/messages",
              icon: (
                <svg className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ),
              title: "Messages",
              description: "Connect with matches",
              delay: 100,
            },
            {
              href: "/analytics",
              icon: (
                <svg className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: "Analytics",
              description: "Track performance",
              delay: 200,
            },
          ].map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: action.delay / 1000, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="group rounded-2xl border border-border/40 bg-card p-8 transition-all hover:shadow-lg hover:border-border/60"
              >
                <div className="flex items-start gap-4">
                  {action.icon}
                  <div>
                    <h3 className="text-base font-light text-foreground group-hover:text-foreground/80 transition-colors tracking-wide">
                      {action.title}
                    </h3>
                    <p className="text-xs font-light text-muted-foreground mt-1 tracking-wide">{action.description}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Videos Section (Entrepreneurs only) */}
          {profile.role === "entrepreneur" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-border/40 bg-card p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-light text-foreground tracking-wide">Your Videos</h2>
                <Link
                  href="/profile"
                  className="text-xs font-light text-muted-foreground hover:text-foreground transition-colors tracking-wide"
                >
                  Upload Video →
                </Link>
              </div>
              {videos.length > 0 ? (
                <div className="space-y-3">
                  {videos.slice(0, 3).map((video, i) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-xl border border-border/40 p-4 transition-all hover:bg-muted/20 hover:border-border/60"
                    >
                      <div className="flex items-center flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5">
                          <Play className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="font-light text-sm text-foreground tracking-wide">{video.title}</h3>
                          <p className="text-xs font-light text-muted-foreground tracking-wide mt-0.5">
                            {formatNumber(video.viewsCount)} views • {formatDate(video.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Video}
                  title="No videos yet"
                  description="Upload your first pitch to start connecting"
                  action={{
                    label: "Upload Video",
                    onClick: () => router.push("/profile"),
                  }}
                />
              )}
            </motion.div>
          )}

          {/* Recent Notifications */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border/40 bg-card p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-light text-foreground tracking-wide">Recent Notifications</h2>
              <Link
                href="/messages"
                className="text-xs font-light text-muted-foreground hover:text-foreground transition-colors tracking-wide"
              >
                View All →
              </Link>
            </div>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification, i) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="flex items-start justify-between rounded-xl border border-border/40 p-4 transition-all hover:bg-muted/20"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-light text-foreground tracking-wide">{notification.content}</p>
                      <p className="text-xs font-light text-muted-foreground mt-1 tracking-wide">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="ml-3 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0 mt-1.5" />
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Bell}
                title="No notifications"
                description="You're all caught up"
                action={{
                  label: "Browse Profiles",
                  onClick: () => router.push("/browse"),
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}