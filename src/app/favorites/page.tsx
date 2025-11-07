"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, MessageCircle, Building2, MapPin, TrendingUp, Search, User, Sparkles } from "lucide-react";

interface Favorite {
  id: number;
  favoritedProfile: any;
  createdAt: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user) return;

      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch("/api/favorites", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFavorites(data);
          setFilteredFavorites(data);
        }
      } catch (error) {
        toast.error("Failed to load favorites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [session]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = favorites.filter((fav) => {
        const profile = fav.favoritedProfile;
        const name = profile?.userId?.toLowerCase() || "";
        const role = profile?.role?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return name.includes(query) || role.includes(query);
      });
      setFilteredFavorites(filtered);
    } else {
      setFilteredFavorites(favorites);
    }
  }, [searchQuery, favorites]);

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFavorites(favorites.filter((f) => f.id !== favoriteId));
        setFilteredFavorites(filteredFavorites.filter((f) => f.id !== favoriteId));
        toast.success("Removed from favorites");
      } else {
        toast.error("Failed to remove favorite");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

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

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
          <div className="animate-pulse space-y-8">
            <div className="space-y-3">
              <div className="h-10 bg-muted/30 rounded-xl w-64" />
              <div className="h-5 bg-muted/30 rounded-lg w-96" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-muted/30 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 space-y-10">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5">
              <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-foreground tracking-wide">Favorites</h1>
              <p className="text-sm font-light text-muted-foreground mt-2 tracking-wide flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs">
                  <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                  {favorites.length} {favorites.length === 1 ? 'Profile' : 'Profiles'} Saved
                </span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Search */}
        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-input/40 bg-background pl-11 pr-4 py-3 text-sm font-light text-foreground placeholder-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all tracking-wide"
              />
            </div>
          </motion.div>
        )}

        {/* Enhanced Favorites Grid */}
        {filteredFavorites.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredFavorites.map((favorite, index) => {
                const profile = favorite.favoritedProfile;
                const roleData = profile?.entrepreneurProfile || profile?.investorProfile;

                return (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="group rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
                  >
                    <div className="p-8">
                      <div className="mb-6 flex items-start justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {profile?.profilePicture ? (
                            <motion.img
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.4 }}
                              src={profile.profilePicture}
                              alt={profile?.userId || "Profile"}
                              className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border-2 border-border/40"
                            />
                          ) : (
                            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 text-foreground font-light text-2xl border-2 border-border/40">
                              {profile?.userId?.charAt(0) || <User className="h-7 w-7" strokeWidth={1.5} />}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-light text-foreground truncate tracking-wide">
                              {profile?.userId}
                            </h3>
                            <p className="text-sm font-light text-muted-foreground capitalize tracking-wide mt-1">
                              {profile?.role}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveFavorite(favorite.id)}
                          className="rounded-xl p-2.5 hover:bg-foreground/5 transition-all duration-300"
                        >
                          <Heart className="h-5 w-5 text-foreground fill-foreground" strokeWidth={1.5} />
                        </motion.button>
                      </div>

                      {/* Profile Details */}
                      {roleData && (
                        <div className="mb-6 space-y-4">
                          {profile.role === "entrepreneur" && (
                            <>
                              {roleData.startupName && (
                                <p className="text-base font-light text-foreground tracking-wide">
                                  {roleData.startupName}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {roleData.industry && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background px-3 py-1.5 text-xs font-light text-foreground tracking-wide">
                                    <Building2 className="h-3 w-3" strokeWidth={1.5} />
                                    {roleData.industry}
                                  </span>
                                )}
                                {roleData.fundingStage && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background px-3 py-1.5 text-xs font-light text-foreground tracking-wide">
                                    <TrendingUp className="h-3 w-3" strokeWidth={1.5} />
                                    {roleData.fundingStage}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                          {profile.role === "investor" && (
                            <div className="flex flex-wrap gap-2">
                              {roleData.industryFocus && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background px-3 py-1.5 text-xs font-light text-foreground tracking-wide">
                                  <Building2 className="h-3 w-3" strokeWidth={1.5} />
                                  {roleData.industryFocus}
                                </span>
                              )}
                              {roleData.fundingCapacity && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background px-3 py-1.5 text-xs font-light text-muted-foreground tracking-wide">
                                  {roleData.fundingCapacity}
                                </span>
                              )}
                            </div>
                          )}
                          {roleData.location && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-light text-muted-foreground tracking-wide">
                              <MapPin className="h-3 w-3" strokeWidth={1.5} />
                              {roleData.location}
                            </span>
                          )}
                        </div>
                      )}

                      {profile?.bio && (
                        <p className="mb-6 text-sm font-light text-muted-foreground leading-relaxed tracking-wide line-clamp-3">
                          {profile.bio}
                        </p>
                      )}

                      <p className="mb-6 text-xs font-light text-muted-foreground tracking-wide">
                        Saved {new Date(favorite.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>

                      {/* Enhanced Actions */}
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleConnect(profile.id)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-light text-background hover:shadow-lg transition-all duration-400 tracking-wide"
                        >
                          <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                          Connect
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleRemoveFavorite(favorite.id)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-background px-5 py-3 text-sm font-light text-foreground hover:bg-muted/20 hover:border-border/60 transition-all duration-400 tracking-wide"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center py-20 sm:py-28 rounded-2xl sm:rounded-3xl border border-border/40 bg-card"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center mb-6"
            >
              {searchQuery ? (
                <Search className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" strokeWidth={1.5} />
              ) : (
                <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" strokeWidth={1.5} />
              )}
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-light text-foreground mb-3 tracking-wide">
              {searchQuery ? "No results found" : "No favorites yet"}
            </h3>
            <p className="text-sm font-light text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed tracking-wide px-4">
              {searchQuery 
                ? "Try adjusting your search query to find what you're looking for"
                : "Start browsing profiles and save the ones you're interested in for easy access later"}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/browse")}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3 text-sm font-light text-background hover:shadow-lg transition-all duration-400 tracking-wide"
              >
                Browse Profiles
                <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}