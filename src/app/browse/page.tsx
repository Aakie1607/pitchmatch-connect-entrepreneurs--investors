"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Building2, TrendingUp, Heart, MessageCircle, Eye, ChevronDown } from "lucide-react";

interface Profile {
  id: number;
  userId: string;
  role: string;
  profilePicture: string | null;
  bio: string | null;
  entrepreneurProfile?: any;
  investorProfile?: any;
  name?: string;
  email?: string;
  videos?: Video[];
}

interface Video {
  id: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  viewsCount: number;
  createdAt: string;
}

export default function BrowsePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    industry: "",
    fundingStage: "",
    location: "",
  });
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchCurrentProfile = async () => {
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
          setCurrentProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile");
      }
    };

    fetchCurrentProfile();
  }, [session]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!currentProfile) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("bearer_token");
        const targetRole = currentProfile.role === "entrepreneur" ? "investor" : "entrepreneur";
        
        const params = new URLSearchParams({
          role: targetRole,
          limit: "20",
          ...filters,
        });

        const response = await fetch(`/api/browse?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Fetch videos for entrepreneur profiles
          if (targetRole === "entrepreneur") {
            const profilesWithVideos = await Promise.all(
              data.map(async (profile: Profile) => {
                const videosResponse = await fetch(`/api/videos/profile/${profile.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                
                if (videosResponse.ok) {
                  const videos = await videosResponse.json();
                  return { ...profile, videos };
                }
                return profile;
              })
            );
            setProfiles(profilesWithVideos);
          } else {
            setProfiles(data);
          }
        }
      } catch (error) {
        toast.error("Failed to load profiles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [currentProfile, filters]);

  // Video autoplay on scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.7 }
    );

    Object.values(videoRefs.current).forEach((video) => {
      if (video) observerRef.current?.observe(video);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [profiles]);

  const handleConnect = async (profileId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: profileId,
        }),
      });

      if (response.ok) {
        toast.success("Connection request sent!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send connection request");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleFavorite = async (profileId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          favoritedProfileId: profileId,
        }),
      });

      if (response.ok) {
        toast.success("Added to favorites!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add to favorites");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleVideoView = async (videoId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      await fetch(`/api/videos/${videoId}/view`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Failed to track video view");
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border/40 bg-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-muted/30" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted/30 rounded w-1/4" />
                    <div className="h-3 bg-muted/30 rounded w-1/6" />
                  </div>
                </div>
                <div className="h-64 bg-muted/30 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <h1 className="text-3xl font-light text-foreground tracking-wide">
            Discover {currentProfile?.role === "entrepreneur" ? "Investors" : "Startups"}
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground tracking-wide">
            {currentProfile?.role === "entrepreneur" ? "Connect with investors" : "Explore innovative startups"}
          </p>
        </motion.div>

        {/* Filters Toggle */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowFilters(!showFilters)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          className="mb-6 flex items-center gap-2 rounded-xl border border-border/40 bg-card px-5 py-3 text-xs font-light text-foreground hover:bg-muted/20 transition-all tracking-wide"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
          Filters
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-400 ${showFilters ? "rotate-180" : ""}`} strokeWidth={1.5} />
        </motion.button>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 overflow-hidden rounded-2xl border border-border/40 bg-card"
            >
              <div className="p-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-light text-foreground mb-3 flex items-center gap-2 tracking-wide">
                    <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or company..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground placeholder-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all tracking-wide"
                  />
                </div>

                <div>
                  <label className="block text-xs font-light text-foreground mb-3 flex items-center gap-2 tracking-wide">
                    <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Industry
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Technology, Healthcare"
                    value={filters.industry}
                    onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                    className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground placeholder-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all tracking-wide"
                  />
                </div>

                {currentProfile?.role === "investor" && (
                  <div>
                    <label className="block text-xs font-light text-foreground mb-3 flex items-center gap-2 tracking-wide">
                      <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Funding Stage
                    </label>
                    <select
                      value={filters.fundingStage}
                      onChange={(e) => setFilters({ ...filters, fundingStage: e.target.value })}
                      className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all tracking-wide"
                    >
                      <option value="">All Stages</option>
                      <option value="Pre-seed">Pre-seed</option>
                      <option value="Seed">Seed</option>
                      <option value="Series A">Series A</option>
                      <option value="Series B">Series B</option>
                      <option value="Series C+">Series C+</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-light text-foreground mb-3 flex items-center gap-2 tracking-wide">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, Country"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground placeholder-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all tracking-wide"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profiles Feed */}
        <div className="space-y-8">
          {profiles.length > 0 ? (
            profiles.map((profile, index) => {
              const roleData = profile.entrepreneurProfile || profile.investorProfile;
              
              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-400"
                >
                  {/* Profile Header */}
                  <div className="p-8 pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-foreground/5 to-foreground/10 text-foreground font-light text-2xl">
                          {profile.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <h3 className="text-xl font-light text-foreground tracking-wide">
                            {profile.name}
                          </h3>
                          <p className="text-xs font-light text-muted-foreground capitalize tracking-wide mt-1">
                            {profile.role}
                          </p>
                          {profile.role === "entrepreneur" && roleData?.startupName && (
                            <p className="text-sm font-light text-foreground mt-1 tracking-wide">
                              {roleData.startupName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {roleData?.industry && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background px-3 py-1.5 text-xs font-light text-foreground tracking-wide">
                          <Building2 className="h-3 w-3" strokeWidth={1.5} />
                          {roleData.industry}
                        </span>
                      )}
                      {roleData?.fundingStage && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background px-3 py-1.5 text-xs font-light text-foreground tracking-wide">
                          <TrendingUp className="h-3 w-3" strokeWidth={1.5} />
                          {roleData.fundingStage}
                        </span>
                      )}
                      {roleData?.location && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background px-3 py-1.5 text-xs font-light text-muted-foreground tracking-wide">
                          <MapPin className="h-3 w-3" strokeWidth={1.5} />
                          {roleData.location}
                        </span>
                      )}
                    </div>

                    {profile.bio && (
                      <p className="mt-5 text-sm font-light text-muted-foreground line-clamp-2 leading-relaxed tracking-wide">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {/* Video Section */}
                  {profile.videos && profile.videos.length > 0 && (
                    <div className="relative">
                      <video
                        ref={(el) => { videoRefs.current[profile.videos![0].id] = el; }}
                        src={profile.videos[0].videoUrl}
                        loop
                        muted
                        playsInline
                        onPlay={() => handleVideoView(profile.videos![0].id)}
                        className="w-full aspect-video object-cover bg-black"
                      />
                      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-light text-lg drop-shadow-lg tracking-wide">
                            {profile.videos[0].title}
                          </h4>
                          {profile.videos[0].description && (
                            <p className="text-white/90 text-xs font-light drop-shadow-lg line-clamp-1 mt-1 tracking-wide">
                              {profile.videos[0].description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-white drop-shadow-lg">
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                          <span className="text-xs font-light tracking-wide">
                            {profile.videos[0].viewsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-8 pt-6 flex gap-3">
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleConnect(profile.id)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 font-light text-sm text-background hover:shadow-lg transition-all duration-400 tracking-wide"
                    >
                      <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                      Connect
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleFavorite(profile.id)}
                      className="flex items-center justify-center rounded-xl border border-border/40 bg-background px-5 py-3 hover:bg-muted/20 hover:border-border/60 transition-all duration-400"
                    >
                      <Heart className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-20 rounded-2xl border border-border/40 bg-card"
            >
              <div className="mx-auto h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-5">
                <Search className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-light text-muted-foreground tracking-wide">
                No profiles found. Try adjusting your filters.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}