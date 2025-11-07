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
import { Users, Video, Bell, TrendingUp, Play, Eye, Check, X, UserPlus, User, ArrowRight, Sparkles } from "lucide-react";
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

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user) return;

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

        const pendingResponse = await fetch("/api/connections?status=pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
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
  }, [session, router]);

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
        setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
        
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
          <div className="mb-12 animate-slide-down space-y-3">
            <div className="h-10 w-80 bg-muted/30 rounded-xl animate-pulse" />
            <div className="h-5 w-96 bg-muted/30 rounded-lg animate-pulse" />
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

      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 space-y-10 sm:space-y-12">
        {/* Enhanced Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-light text-foreground tracking-wide mb-2">
              Welcome back, {session.user.name}
            </h1>
            <p className="text-sm sm:text-base font-light text-muted-foreground tracking-wide flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs">
                <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                {profile.role === "entrepreneur" ? "Entrepreneur Dashboard" : "Investor Overview"}
              </span>
            </p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/analytics">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-light text-background shadow-lg hover:shadow-xl transition-all tracking-wide"
              >
                View Analytics
                <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Enhanced Connection Requests Alert */}
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl sm:rounded-3xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-8 shadow-lg"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5">
                  <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 text-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-light text-foreground tracking-wide">
                    {pendingRequests.length} Pending Connection{pendingRequests.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm font-light text-muted-foreground tracking-wide mt-1">
                    Review and respond to connection requests
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {pendingRequests.map((request, i) => {
                const requester = request.requesterProfile;
                const requesterName = requester?.userName || "Unknown User";
                const requesterRole = requester?.role || "user";
                const requesterPhoto = requester?.profilePicture;
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/40 bg-background p-6 hover:shadow-lg transition-all duration-400"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {requesterPhoto ? (
                        <motion.img
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.4 }}
                          src={requesterPhoto}
                          alt={requesterName}
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border-2 border-border/40"
                        />
                      ) : (
                        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 text-foreground font-light text-xl border-2 border-border/40">
                          {requesterName.charAt(0) || <User className="h-7 w-7" strokeWidth={1.5} />}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-light text-foreground tracking-wide">
                          {requesterName}
                        </h4>
                        <p className="text-sm font-light text-muted-foreground capitalize tracking-wide flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5 text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                            {requesterRole}
                          </span>
                          <span className="text-muted-foreground/50">•</span>
                          <span>{formatDate(request.createdAt)}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConnectionRequest(request.id, "accepted")}
                        disabled={processingRequest === request.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-light text-background hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        <Check className="h-4 w-4" strokeWidth={1.5} />
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConnectionRequest(request.id, "rejected")}
                        disabled={processingRequest === request.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-background px-6 py-3 text-sm font-light text-foreground hover:bg-muted/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                        Reject
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Enhanced Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />}
            label="Connections"
            value={formatNumber(connections.length)}
            delay={0}
          />
          
          {profile.role === "entrepreneur" && (
            <>
              <StatCard
                icon={<Video className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />}
                label="Videos"
                value={videos.length}
                delay={100}
              />
              <StatCard
                icon={<Eye className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />}
                label="Total Views"
                value={formatNumber(totalVideoViews)}
                delay={200}
              />
            </>
          )}
          
          <StatCard
            icon={<Bell className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />}
            label="Notifications"
            value={unreadNotifications}
            delay={profile.role === "entrepreneur" ? 300 : 100}
          />
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/browse",
              icon: <TrendingUp className="h-7 w-7 text-foreground" strokeWidth={1.5} />,
              title: `Browse ${profile.role === "entrepreneur" ? "Investors" : "Startups"}`,
              description: "Discover opportunities",
              delay: 0,
            },
            {
              href: "/messages",
              icon: (
                <svg className="h-7 w-7 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                <svg className="h-7 w-7 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: action.delay / 1000, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.3 } }}
                className="group rounded-2xl sm:rounded-3xl border border-border/40 bg-card p-8 sm:p-10 transition-all hover:shadow-xl hover:border-border/60 h-full"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 group-hover:from-foreground group-hover:to-foreground/90 group-hover:text-background transition-all duration-500">
                      {action.icon}
                    </div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                    </motion.div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-light text-foreground group-hover:text-foreground/90 transition-colors tracking-wide mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm font-light text-muted-foreground tracking-wide">{action.description}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Enhanced Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Videos Section (Entrepreneurs only) */}
          {profile.role === "entrepreneur" && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl sm:rounded-3xl border border-border/40 bg-card p-8 sm:p-10 shadow-sm"
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-light text-foreground tracking-wide">Your Videos</h2>
                <Link
                  href="/profile"
                  className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors tracking-wide flex items-center gap-1.5"
                >
                  Upload Video
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </div>
              {videos.length > 0 ? (
                <div className="space-y-4">
                  {videos.slice(0, 3).map((video, i) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      whileHover={{ y: -2 }}
                      className="flex items-center justify-between rounded-2xl border border-border/40 p-5 transition-all hover:bg-muted/20 hover:border-border/60 hover:shadow-md"
                    >
                      <div className="flex items-center flex-1 gap-4">
                        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5">
                          <Play className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-light text-sm sm:text-base text-foreground tracking-wide truncate">{video.title}</h3>
                          <p className="text-xs sm:text-sm font-light text-muted-foreground tracking-wide mt-1">
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl sm:rounded-3xl border border-border/40 bg-card p-8 sm:p-10 shadow-sm"
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-light text-foreground tracking-wide">Recent Notifications</h2>
              <Link
                href="/messages"
                className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors tracking-wide flex items-center gap-1.5"
              >
                View All
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification, i) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-border/40 p-5 transition-all hover:bg-muted/20 hover:border-border/60"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-light text-foreground tracking-wide leading-relaxed">{notification.content}</p>
                      <p className="text-xs sm:text-sm font-light text-muted-foreground mt-2 tracking-wide">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="ml-3 h-2 w-2 rounded-full bg-foreground flex-shrink-0 mt-2" />
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