"use client";

import { useState, useEffect } from "react";
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

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-muted rounded-xl w-1/3" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-2xl" />
              ))}
            </div>
            <div className="h-96 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      label: "Profile Views",
      value: analytics.totalProfileViews,
      icon: Eye,
      color: "from-blue-500/20 to-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      label: "Connections",
      value: analytics.totalConnections,
      icon: Users,
      color: "from-green-500/20 to-green-500/10",
      iconColor: "text-green-500",
    },
    {
      label: "Favorited By",
      value: analytics.favoritedByCount,
      icon: Heart,
      color: "from-pink-500/20 to-pink-500/10",
      iconColor: "text-pink-500",
    },
    ...(profile?.role === "entrepreneur" ? [
      {
        label: "Total Videos",
        value: analytics.totalVideoUploads,
        icon: Video,
        color: "from-purple-500/20 to-purple-500/10",
        iconColor: "text-purple-500",
      },
      {
        label: "Video Views",
        value: analytics.totalVideoViews,
        icon: Play,
        color: "from-orange-500/20 to-orange-500/10",
        iconColor: "text-orange-500",
      },
    ] : []),
    {
      label: "Pending Requests",
      value: analytics.pendingConnectionRequests,
      icon: Clock,
      color: "from-yellow-500/20 to-yellow-500/10",
      iconColor: "text-yellow-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            </div>
            <p className="text-muted-foreground">
              Track your profile performance and engagement
            </p>
          </div>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-xl border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </motion.div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {stat.label}
                  </p>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="text-3xl font-bold text-foreground"
                  >
                    {stat.value.toLocaleString()}
                  </motion.p>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-4 h-1 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stat.value / 100) * 100, 100)}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                  className={`h-full bg-gradient-to-r ${stat.color.replace('/20', '').replace('/10', '')}`}
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
            transition={{ delay: 0.6 }}
            className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Engagement Overview</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Avg. Views per Video</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(analytics.totalVideoViews / analytics.totalVideoUploads)}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Profile to Video Ratio</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.totalProfileViews > 0 
                    ? `${Math.round((analytics.totalVideoViews / analytics.totalProfileViews) * 100)}%`
                    : "0%"}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Conversion Rate</p>
                <p className="text-2xl font-bold text-foreground">
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
          transition={{ delay: 0.7 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="mb-6 text-xl font-bold text-foreground flex items-center gap-3">
            <Eye className="h-6 w-6 text-primary" />
            Recent Profile Views
          </h2>
          {analytics.recentProfileViews.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentProfileViews.map((view, index) => (
                <motion.div
                  key={view.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-accent transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                      {view.viewerName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {view.viewerName}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {view.viewerRole}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(view.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(view.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl bg-muted/20">
              <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No profile views yet. Keep engaging to get noticed!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}