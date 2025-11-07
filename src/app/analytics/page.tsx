"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, Users, Heart, Video, Play, Clock, TrendingUp, BarChart3, Activity } from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

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

  // Chart data preparations
  const viewsOverTimeData = useMemo(() => {
    if (!analytics?.recentProfileViews) return [];
    
    // Group views by date
    const viewsByDate: { [key: string]: number } = {};
    analytics.recentProfileViews.forEach(view => {
      const date = new Date(view.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      viewsByDate[date] = (viewsByDate[date] || 0) + 1;
    });

    return Object.entries(viewsByDate).map(([date, count]) => ({
      date,
      views: count
    })).reverse();
  }, [analytics]);

  const engagementData = useMemo(() => {
    if (!analytics) return [];
    
    return [
      { name: 'Connections', value: analytics.totalConnections, color: 'hsl(var(--foreground))' },
      { name: 'Favorites', value: analytics.favoritedByCount, color: 'hsl(var(--chart-1))' },
      { name: 'Pending', value: analytics.pendingConnectionRequests, color: 'hsl(var(--chart-2))' }
    ];
  }, [analytics]);

  const videoPerformanceData = useMemo(() => {
    if (!analytics || !profile || profile.role !== 'entrepreneur') return [];
    
    return [
      { metric: 'Videos', count: analytics.totalVideoUploads },
      { metric: 'Total Views', count: analytics.totalVideoViews },
      { metric: 'Avg Views', count: analytics.totalVideoUploads > 0 ? Math.round(analytics.totalVideoViews / analytics.totalVideoUploads) : 0 }
    ];
  }, [analytics, profile]);

  const overallMetricsData = useMemo(() => {
    if (!analytics) return [];
    
    const baseData = [
      { name: 'Profile Views', value: analytics.totalProfileViews },
      { name: 'Connections', value: analytics.totalConnections },
      { name: 'Favorites', value: analytics.favoritedByCount }
    ];

    if (profile?.role === 'entrepreneur') {
      baseData.push({ name: 'Video Views', value: analytics.totalVideoViews });
    }

    return baseData;
  }, [analytics, profile]);

  const stats = useMemo(() => {
    if (!analytics || !profile) return [];
    
    const baseStats = [
      {
        label: "Profile Views",
        value: analytics.totalProfileViews,
        icon: Eye,
        gradient: "from-blue-500/10 to-blue-500/5",
        color: "text-blue-500"
      },
      {
        label: "Connections",
        value: analytics.totalConnections,
        icon: Users,
        gradient: "from-green-500/10 to-green-500/5",
        color: "text-green-500"
      },
      {
        label: "Favorited By",
        value: analytics.favoritedByCount,
        icon: Heart,
        gradient: "from-red-500/10 to-red-500/5",
        color: "text-red-500"
      },
    ];

    if (profile?.role === "entrepreneur") {
      baseStats.push(
        {
          label: "Total Videos",
          value: analytics.totalVideoUploads,
          icon: Video,
          gradient: "from-purple-500/10 to-purple-500/5",
          color: "text-purple-500"
        },
        {
          label: "Video Views",
          value: analytics.totalVideoViews,
          icon: Play,
          gradient: "from-orange-500/10 to-orange-500/5",
          color: "text-orange-500"
        }
      );
    }

    baseStats.push({
      label: "Pending Requests",
      value: analytics.pendingConnectionRequests,
      icon: Clock,
      gradient: "from-yellow-500/10 to-yellow-500/5",
      color: "text-yellow-500"
    });

    return baseStats;
  }, [analytics, profile]);

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="space-y-8 animate-pulse">
            <div className="h-8 w-64 bg-muted/30 rounded" />
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-foreground tracking-wide">Analytics Dashboard</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm font-light text-muted-foreground tracking-wide">
              Track your profile performance and engagement metrics
            </p>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-xl border border-input/40 bg-background px-4 py-2.5 text-xs font-light text-foreground focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all tracking-wide"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group rounded-2xl border border-border/40 bg-card p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-light text-muted-foreground mb-3 tracking-wide uppercase">
                    {stat.label}
                  </p>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.05 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-3xl sm:text-4xl font-light text-foreground tracking-wide"
                  >
                    {stat.value.toLocaleString()}
                  </motion.p>
                </div>
                <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Animated progress bar */}
              <div className="mt-4 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stat.value / 100) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: index * 0.05 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full bg-gradient-to-r ${stat.gradient.replace('/10', '').replace('/5', '')}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Views Over Time - Line Chart */}
          {viewsOverTimeData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                <h2 className="text-lg sm:text-xl font-light text-foreground tracking-wide">Profile Views Trend</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={viewsOverTimeData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px', fontWeight: 300 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px', fontWeight: 300 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 300
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={2}
                    fill="url(#colorViews)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Engagement Breakdown - Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              <h2 className="text-lg sm:text-xl font-light text-foreground tracking-wide">Engagement Breakdown</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="hsl(var(--foreground))"
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 300
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Video Performance (Entrepreneur only) */}
        {profile?.role === "entrepreneur" && analytics.totalVideoUploads > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <Video className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              <h2 className="text-lg sm:text-xl font-light text-foreground tracking-wide">Video Performance</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={videoPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="metric" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px', fontWeight: 300 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px', fontWeight: 300 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 300
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--foreground))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Overall Metrics - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <h2 className="text-lg sm:text-xl font-light text-foreground tracking-wide">Overall Metrics</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overallMetricsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px', fontWeight: 300 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px', fontWeight: 300 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 300
                }}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--foreground))" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Engagement Insights */}
        {profile?.role === "entrepreneur" && analytics.totalVideoUploads > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              <h2 className="text-lg sm:text-xl font-light text-foreground tracking-wide">Engagement Insights</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="text-center p-6 rounded-xl border border-border/40 bg-background hover:bg-muted/10 transition-all">
                <p className="text-xs font-light text-muted-foreground mb-3 tracking-wide uppercase">Avg. Views per Video</p>
                <p className="text-3xl font-light text-foreground tracking-wide">
                  {Math.round(analytics.totalVideoViews / analytics.totalVideoUploads)}
                </p>
              </div>
              <div className="text-center p-6 rounded-xl border border-border/40 bg-background hover:bg-muted/10 transition-all">
                <p className="text-xs font-light text-muted-foreground mb-3 tracking-wide uppercase">Profile to Video Ratio</p>
                <p className="text-3xl font-light text-foreground tracking-wide">
                  {analytics.totalProfileViews > 0 
                    ? `${Math.round((analytics.totalVideoViews / analytics.totalProfileViews) * 100)}%`
                    : "0%"}
                </p>
              </div>
              <div className="text-center p-6 rounded-xl border border-border/40 bg-background hover:bg-muted/10 transition-all">
                <p className="text-xs font-light text-muted-foreground mb-3 tracking-wide uppercase">Conversion Rate</p>
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
          transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <Eye className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <h2 className="text-lg sm:text-xl font-light text-foreground tracking-wide">Recent Profile Views</h2>
          </div>
          {analytics.recentProfileViews.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentProfileViews.map((view, index) => (
                <motion.div
                  key={view.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
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