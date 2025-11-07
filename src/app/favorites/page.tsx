"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, MessageCircle, Building2, MapPin, TrendingUp, Search } from "lucide-react";

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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded-xl w-1/3" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-2xl" />
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

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-3xl font-bold text-foreground">Favorites</h1>
          </div>
          <p className="text-muted-foreground">
            Profiles you've saved for later ({favorites.length})
          </p>
        </motion.div>

        {/* Search */}
        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-input bg-background pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* Favorites Grid */}
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
                    transition={{ delay: index * 0.1 }}
                    className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xl">
                          {profile?.userId?.charAt(0) || "U"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {profile?.userId}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {profile?.role}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        className="rounded-full p-2 hover:bg-destructive/10 transition-colors"
                      >
                        <Heart className="h-5 w-5 text-primary fill-primary" />
                      </motion.button>
                    </div>

                    {/* Profile Details */}
                    {roleData && (
                      <div className="mb-4 space-y-2">
                        {profile.role === "entrepreneur" && (
                          <>
                            {roleData.startupName && (
                              <p className="font-semibold text-foreground">
                                {roleData.startupName}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {roleData.industry && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                  <Building2 className="h-3 w-3" />
                                  {roleData.industry}
                                </span>
                              )}
                              {roleData.fundingStage && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                  <TrendingUp className="h-3 w-3" />
                                  {roleData.fundingStage}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                        {profile.role === "investor" && (
                          <div className="flex flex-wrap gap-2">
                            {roleData.industryFocus && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                <Building2 className="h-3 w-3" />
                                {roleData.industryFocus}
                              </span>
                            )}
                            {roleData.fundingCapacity && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                {roleData.fundingCapacity}
                              </span>
                            )}
                          </div>
                        )}
                        {roleData.location && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {roleData.location}
                          </span>
                        )}
                      </div>
                    )}

                    {profile?.bio && (
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                        {profile.bio}
                      </p>
                    )}

                    <p className="mb-4 text-xs text-muted-foreground">
                      Saved on {new Date(favorite.createdAt).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleConnect(profile.id)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Connect
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-destructive bg-background px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-20 rounded-2xl border border-border bg-card"
          >
            <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {searchQuery ? (
                <Search className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Heart className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? "No results found" : "No favorites yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? "Try adjusting your search query"
                : "Start browsing to save profiles you're interested in!"}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/browse")}
                className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Browse Profiles
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}