"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Video as VideoIcon, Eye, Trash2, Edit, X, Check, PlayCircle, Loader2, User, MapPin, Building2, TrendingUp, DollarSign, Globe } from "lucide-react";

interface Profile {
  id: number;
  userId: string;
  role: string;
  profilePicture: string | null;
  bio: string | null;
  entrepreneurProfile?: {
    startupName: string;
    businessDescription: string;
    industry: string;
    fundingStage: string;
    location: string;
    website: string | null;
  };
  investorProfile?: {
    investmentPreferences: string;
    industryFocus: string;
    fundingCapacity: string;
    location: string;
  };
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

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const fetchProfile = useCallback(async () => {
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
        
        // Fetch entrepreneur or investor details
        if (data.role === "entrepreneur") {
          const entrepreneurResponse = await fetch(`/api/entrepreneur-profiles/${data.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (entrepreneurResponse.ok) {
            const entrepreneurData = await entrepreneurResponse.json();
            data.entrepreneurProfile = entrepreneurData;
          }
          
          // Fetch videos
          const videosResponse = await fetch(`/api/videos/profile/${data.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (videosResponse.ok) {
            const videosData = await videosResponse.json();
            setVideos(videosData);
          }
        } else if (data.role === "investor") {
          const investorResponse = await fetch(`/api/investor-profiles/${data.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (investorResponse.ok) {
            const investorData = await investorResponse.json();
            data.investorProfile = investorData;
          }
        }
        
        setProfile(data);
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileSelect = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video must be less than 500MB");
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      
      if (video.duration < 3) {
        toast.error("Video must be at least 3 seconds long");
        setSelectedFile(null);
        setVideoPreview(null);
        return;
      }
      
      setSelectedFile(file);
      setVideoPreview(URL.createObjectURL(file));
      toast.success("Video loaded successfully - ready to upload!");
    };

    video.onerror = () => {
      toast.error("Invalid video file");
      setSelectedFile(null);
      setVideoPreview(null);
    };

    video.src = URL.createObjectURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileSelect,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    },
    maxFiles: 1,
    disabled: isUploading || !profile,
    multiple: false,
  });

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !profile) return;

    if (!videoTitle.trim()) {
      toast.error("Please enter a video title");
      return;
    }

    const lowerTitle = videoTitle.toLowerCase();
    if (lowerTitle.includes("test") || lowerTitle.includes("lorem") || lowerTitle === "untitled") {
      toast.error("Please provide a meaningful title for your video");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("profileId", profile.id.toString());
      formData.append("title", videoTitle.trim());
      formData.append("description", videoDescription.trim() || "");

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/upload/video", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload video");
      }

      const result = await response.json();
      
      setVideos([result.video, ...videos]);
      setVideoTitle("");
      setVideoDescription("");
      setSelectedFile(null);
      setVideoPreview(null);
      
      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, profile, videoTitle, videoDescription, videos]);

  const handleCancelUpload = useCallback(() => {
    setSelectedFile(null);
    setVideoPreview(null);
    setVideoTitle("");
    setVideoDescription("");
    setUploadProgress(0);
  }, []);

  const handleDeleteVideo = useCallback(async (videoId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setVideos(videos.filter((v) => v.id !== videoId));
        toast.success("Video deleted");
      } else {
        toast.error("Failed to delete video");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }, [videos]);

  const handleEditVideo = useCallback(async () => {
    if (!editingVideo) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/videos/${editingVideo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingVideo.title,
          description: editingVideo.description,
        }),
      });

      if (response.ok) {
        const updatedVideo = await response.json();
        setVideos(videos.map((v) => (v.id === updatedVideo.id ? updatedVideo : v)));
        setEditingVideo(null);
        toast.success("Video updated");
      } else {
        toast.error("Failed to update video");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }, [editingVideo, videos]);

  const profileDetails = useMemo(() => {
    if (!profile) return null;
    
    if (profile.role === "entrepreneur" && profile.entrepreneurProfile) {
      return [
        { icon: Building2, label: "Startup", value: profile.entrepreneurProfile.startupName },
        { icon: MapPin, label: "Location", value: profile.entrepreneurProfile.location },
        { icon: TrendingUp, label: "Industry", value: profile.entrepreneurProfile.industry },
        { icon: DollarSign, label: "Stage", value: profile.entrepreneurProfile.fundingStage || "Not specified" },
        ...(profile.entrepreneurProfile.website ? [{ icon: Globe, label: "Website", value: profile.entrepreneurProfile.website }] : []),
      ];
    }
    
    if (profile.role === "investor" && profile.investorProfile) {
      return [
        { icon: MapPin, label: "Location", value: profile.investorProfile.location },
        { icon: Building2, label: "Focus", value: profile.investorProfile.industryFocus },
        { icon: DollarSign, label: "Capacity", value: profile.investorProfile.fundingCapacity || "Not specified" },
      ];
    }
    
    return null;
  }, [profile]);

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted/30 rounded-2xl" />
            <div className="h-64 bg-muted/30 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <h1 className="text-3xl font-light text-foreground tracking-wide">Profile</h1>
          <p className="mt-2 text-sm font-light text-muted-foreground tracking-wide">
            Manage your profile and pitch videos
          </p>
        </motion.div>

        {/* Enhanced Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 rounded-2xl border border-border/40 bg-card p-10 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* FIXED: Instant profile picture display */}
            <div className="flex-shrink-0">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={session.user.name || "Profile"}
                  className="h-24 w-24 rounded-full object-cover border-2 border-border/40"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-foreground/5 to-foreground/10 text-foreground font-light text-4xl border-2 border-border/40">
                  {session.user.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-light text-foreground tracking-wide">
                {session.user.name}
              </h2>
              <p className="text-muted-foreground capitalize mt-2 text-sm font-light tracking-wide">
                {profile.role}
              </p>
              <p className="text-xs font-light text-muted-foreground mt-2 tracking-wide">
                {session.user.email}
              </p>
              
              {/* FIXED: Complete user details */}
              {profileDetails && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {profileDetails.map((detail, index) => (
                    <motion.div
                      key={detail.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                      className="flex items-center gap-2 text-xs font-light tracking-wide"
                    >
                      <detail.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                      <span className="text-muted-foreground">{detail.label}:</span>
                      <span className="text-foreground">{detail.value}</span>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {profile.bio && (
                <p className="text-sm font-light text-muted-foreground mt-6 leading-relaxed tracking-wide">
                  {profile.bio}
                </p>
              )}
              
              {/* Additional entrepreneur details */}
              {profile.role === "entrepreneur" && profile.entrepreneurProfile?.businessDescription && (
                <div className="mt-6 p-4 rounded-xl border border-border/40 bg-background">
                  <p className="text-xs font-light text-muted-foreground mb-2 tracking-wide">Business Description</p>
                  <p className="text-sm font-light text-foreground leading-relaxed tracking-wide">
                    {profile.entrepreneurProfile.businessDescription}
                  </p>
                </div>
              )}
              
              {/* Additional investor details */}
              {profile.role === "investor" && profile.investorProfile?.investmentPreferences && (
                <div className="mt-6 p-4 rounded-xl border border-border/40 bg-background">
                  <p className="text-xs font-light text-muted-foreground mb-2 tracking-wide">Investment Preferences</p>
                  <p className="text-sm font-light text-foreground leading-relaxed tracking-wide">
                    {profile.investorProfile.investmentPreferences}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Video Upload Section (Entrepreneurs only) */}
        {profile.role === "entrepreneur" && (
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-3 mb-8">
                <VideoIcon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                <div>
                  <h2 className="text-2xl font-light text-foreground tracking-wide">Pitch Videos</h2>
                  <p className="text-xs font-light text-muted-foreground mt-1 tracking-wide">
                    Showcase your startup with compelling presentations
                  </p>
                </div>
              </div>

              {/* Upload Form */}
              <div className="rounded-2xl border border-border/40 bg-card p-8 shadow-sm">
                <AnimatePresence mode="wait">
                  {!videoPreview ? (
                    <motion.div
                      key="upload-area"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="mb-8 space-y-6">
                        <div>
                          <label className="block text-xs font-light text-foreground mb-3 tracking-wide">
                            Video Title *
                          </label>
                          <input
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            placeholder="Give your pitch a compelling title"
                            className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground placeholder-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all tracking-wide"
                            disabled={isUploading}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-light text-foreground mb-3 tracking-wide">
                            Description (Optional)
                          </label>
                          <textarea
                            value={videoDescription}
                            onChange={(e) => setVideoDescription(e.target.value)}
                            placeholder="Describe what makes your startup unique..."
                            rows={3}
                            className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground placeholder-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all resize-none tracking-wide"
                            disabled={isUploading}
                          />
                        </div>
                      </div>

                      <div
                        {...getRootProps()}
                        className={`cursor-pointer rounded-2xl border border-dashed p-16 text-center transition-all duration-400 ${
                          isDragActive
                            ? "border-foreground/40 bg-foreground/5 scale-[1.01]"
                            : "border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-foreground/20"
                        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <input {...getInputProps()} />
                        {isDragActive ? (
                          <div>
                            <Upload className="mx-auto h-12 w-12 text-foreground mb-5" strokeWidth={1.5} />
                            <p className="text-base font-light text-foreground tracking-wide">Drop video here</p>
                            <p className="text-xs font-light text-muted-foreground mt-2 tracking-wide">
                              Release to upload
                            </p>
                          </div>
                        ) : (
                          <div>
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-5" strokeWidth={1.5} />
                            <p className="text-base font-light text-foreground mb-2 tracking-wide">
                              Drag and drop your video
                            </p>
                            <p className="text-xs font-light text-muted-foreground mb-5 tracking-wide">
                              or click to browse
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs font-light text-muted-foreground tracking-wide">
                              <span>MP4, MOV, AVI, MKV, WebM</span>
                              <span>•</span>
                              <span>Max 500MB</span>
                              <span>•</span>
                              <span>Min 3s</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview-area"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-6"
                    >
                      <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-black">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full aspect-video object-contain"
                          preload="metadata"
                        />
                        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-foreground/90 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4 text-background" strokeWidth={1.5} />
                            <span className="text-xs font-light text-background tracking-wide">Preview</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-light text-foreground mb-3 tracking-wide">
                            Video Title *
                          </label>
                          <input
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            placeholder="Give your pitch a compelling title"
                            className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground placeholder-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all tracking-wide"
                            disabled={isUploading}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-light text-foreground mb-3 tracking-wide">
                            Description (Optional)
                          </label>
                          <textarea
                            value={videoDescription}
                            onChange={(e) => setVideoDescription(e.target.value)}
                            placeholder="Describe what makes your startup unique..."
                            rows={3}
                            className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground placeholder-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all resize-none tracking-wide"
                            disabled={isUploading}
                          />
                        </div>
                      </div>

                      {isUploading && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-xs font-light text-muted-foreground tracking-wide">
                              Uploading your pitch...
                            </span>
                            <span className="text-xs font-light text-foreground tracking-wide">
                              {uploadProgress}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.3 }}
                              className="h-full bg-foreground"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleUpload}
                          disabled={isUploading || !videoTitle.trim()}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-light text-background hover:shadow-lg transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" strokeWidth={1.5} />
                              Upload Video
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleCancelUpload}
                          disabled={isUploading}
                          className="flex items-center gap-2 rounded-xl border border-border/40 bg-background px-6 py-3 text-sm font-light text-foreground hover:bg-muted/20 transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                        >
                          <X className="h-4 w-4" strokeWidth={1.5} />
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Videos List */}
            {videos.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-light text-foreground tracking-wide">
                  Your Videos ({videos.length})
                </h3>
                {videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-400"
                  >
                    {editingVideo?.id === video.id ? (
                      <div className="p-8">
                        <div className="space-y-5 mb-6">
                          <div>
                            <label className="block text-xs font-light text-foreground mb-2 tracking-wide">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editingVideo.title}
                              onChange={(e) =>
                                setEditingVideo({ ...editingVideo, title: e.target.value })
                              }
                              className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all tracking-wide"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-light text-foreground mb-2 tracking-wide">
                              Description
                            </label>
                            <textarea
                              value={editingVideo.description || ""}
                              onChange={(e) =>
                                setEditingVideo({ ...editingVideo, description: e.target.value })
                              }
                              rows={3}
                              className="w-full rounded-xl border border-input/40 bg-background px-4 py-3 text-sm font-light text-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all resize-none tracking-wide"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleEditVideo}
                            className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-light text-background hover:shadow-lg transition-all duration-400 tracking-wide"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Save
                          </motion.button>
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setEditingVideo(null)}
                            className="flex items-center gap-2 rounded-xl border border-border/40 bg-background px-5 py-2.5 text-xs font-light text-foreground hover:bg-muted/20 transition-all duration-400 tracking-wide"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          src={video.videoUrl}
                          controls
                          className="w-full aspect-video object-cover bg-black"
                          preload="metadata"
                        />
                        <div className="p-8">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-base font-light text-foreground tracking-wide">
                                {video.title}
                              </h3>
                              {video.description && (
                                <p className="mt-2 text-xs font-light text-muted-foreground leading-relaxed tracking-wide">
                                  {video.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs font-light text-muted-foreground tracking-wide">
                              <span className="flex items-center gap-1.5">
                                <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                                {video.viewsCount} views
                              </span>
                              <span>
                                {new Date(video.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setEditingVideo(video)}
                                className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-background px-4 py-2 text-xs font-light text-foreground hover:bg-muted/20 transition-all duration-400 tracking-wide"
                              >
                                <Edit className="h-3.5 w-3.5" strokeWidth={1.5} />
                                Edit
                              </motion.button>
                              <motion.button
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleDeleteVideo(video.id)}
                                className="flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-background px-4 py-2 text-xs font-light text-destructive hover:bg-destructive/10 transition-all duration-400 tracking-wide"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                                Delete
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center py-16 rounded-2xl border border-border/40 bg-card"
              >
                <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground mb-5" strokeWidth={1.5} />
                <p className="text-sm font-light text-muted-foreground tracking-wide">
                  No videos yet. Upload your first pitch above
                </p>
              </motion.div>
            )}
          </div>
        )}

        {profile.role === "investor" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border/40 bg-card p-16 text-center"
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-foreground/5 flex items-center justify-center mb-6">
              <VideoIcon className="h-7 w-7 text-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-light text-foreground mb-3 tracking-wide">
              Discover Startup Pitches
            </h3>
            <p className="text-sm font-light text-muted-foreground mb-8 tracking-wide leading-relaxed">
              Browse entrepreneur profiles and watch pitch videos
            </p>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/browse")}
              className="rounded-xl bg-foreground px-8 py-3 font-light text-sm text-background hover:shadow-lg transition-all duration-400 tracking-wide"
            >
              Browse Startups
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}