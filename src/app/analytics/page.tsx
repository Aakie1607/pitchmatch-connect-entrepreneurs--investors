"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, Users, Heart, Video, Play, Clock, TrendingUp, BarChart3 } from "lucide-react";

interface Analytics {
  profileId: number;
  totalProfileViews: number;
  totalConnections: number;
  pendingConnectionRequests: number;
  totalVideoUploads: number;
  totalVideoViews: number;
  favoritedByCount: number;
  recentProfileViews: any[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return;

      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch("/api/profiles/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile");
      }
    };

    fetchProfile();
  }, [session]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!profile) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch(
          `/api/analytics/profile/${profile.id}?timeRange=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        toast.error("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [profile, timeRange]);

  const stats = useMemo(() => {
    if (!analytics || !profile) return [];
    
    const baseStats = [
      {
        label: "Profile Views",
        value: analytics.totalProfileViews,
        icon: Eye,
        gradient: "from-foreground/10 to-foreground/5",
      },
      {
        label: "Connections",
        value: analytics.totalConnections,
        icon: Users,
        gradient: "from-foreground/10 to-foreground/5",
      },
      {
        label: "Favorited By",
        value: analytics.favoritedByCount,
        icon: Heart,
        gradient: "from-foreground/10 to-foreground/5",
      },
    ];

    if (profile?.role === "entrepreneur") {
      baseStats.push(
        {
          label: "Total Videos",
          value: analytics.totalVideoUploads,
          icon: Video,
          gradient: "from-foreground/10 to-foreground/5",
        },
        {
          label: "Video Views",
          value: analytics.totalVideoViews,
          icon: Play,
          gradient: "from-foreground/10 to-foreground/5",
        }
      );
    }

    baseStats.push({
      label: "Pending Requests",
      value: analytics.pendingConnectionRequests,
      icon: Clock,
      gradient: "from-foreground/10 to-foreground/5",
    });

    return baseStats;
  }, [analytics, profile]);

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
          <div className="space-y-6 animate-pulse">
            <div className="h-8 w-64 bg-muted/30 rounded" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-muted/30 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="h-6 w-6 text-foreground" strokeWidth={1.5} />
            <h1 className="text-3xl font-light text-foreground tracking-wide">Analytics</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm font-light text-muted-foreground tracking-wide">
              Track your profile performance and engagement
            </p>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-xl border border-input/40 bg-background px-4 py-2.5 text-xs font-light text-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all tracking-wide"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="group rounded-2xl border border-border/40 bg-card p-8 shadow-sm hover:shadow-lg transition-all duration-400"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-light text-muted-foreground mb-3 tracking-wide">
                    {stat.label}
                  </p>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.05 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-4xl font-light text-foreground tracking-wide"
                  >
                    {stat.value.toLocaleString()}
                  </motion.p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} group-hover:scale-110 transition-transform duration-400`}>
                  <stat.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-4 h-1 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stat.value / 100) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: index * 0.05 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-foreground"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Engagement Overview */}
        {profile?.role === "entrepreneur" && analytics.totalVideoUploads > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12 rounded-2xl border border-border/40 bg-card p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              <h2 className="text-xl font-light text-foreground tracking-wide">Engagement Overview</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="text-center p-6 rounded-xl border border-border/40 bg-background">
                <p className="text-xs font-light text-muted-foreground mb-3 tracking-wide">Avg. Views per Video</p>
                <p className="text-3xl font-light text-foreground tracking-wide">
                  {Math.round(analytics.totalVideoViews / analytics.totalVideoUploads)}
                </p>
              </div>
              <div className="text-center p-6 rounded-xl border border-border/40 bg-background">
                <p className="text-xs font-light text-muted-foreground mb-3 tracking-wide">Profile to Video Ratio</p>
                <p className="text-3xl font-light text-foreground tracking-wide">
                  {analytics.totalProfileViews > 0 
                    ? `${Math.round((analytics.totalVideoViews / analytics.totalProfileViews) * 100)}%`
                    : "0%"}
                </p>
              </div>
              <div className="text-center p-6 rounded-xl border border-border/40 bg-background">
                <p className="text-xs font-light text-muted-foreground mb-3 tracking-wide">Conversion Rate</p>
                <p className="text-3xl font-light text-foreground tracking-wide">
                  {analytics.totalProfileViews > 0
                    ? `${Math.round((analytics.totalConnections / analytics.totalProfileViews) * 100)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Profile Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-border/40 bg-card p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <Eye className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <h2 className="text-xl font-light text-foreground tracking-wide">Recent Profile Views</h2>
          </div>
          {analytics.recentProfileViews.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentProfileViews.map((view, index) => (
                <motion.div
                  key={view.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between rounded-xl border border-border/40 p-6 hover:bg-muted/10 transition-all duration-400"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 text-foreground font-light text-lg">
                      {view.viewerName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-light text-sm text-foreground tracking-wide">
                        {view.viewerName}
                      </p>
                      <p className="text-xs font-light text-muted-foreground capitalize tracking-wide mt-1">
                        {view.viewerRole}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-light text-muted-foreground tracking-wide">
                      {new Date(view.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs font-light text-muted-foreground tracking-wide mt-1">
                      {new Date(view.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-border/40 bg-muted/10">
              <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" strokeWidth={1.5} />
              <p className="text-sm font-light text-muted-foreground tracking-wide">
                No profile views yet. Keep engaging to get noticed!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}