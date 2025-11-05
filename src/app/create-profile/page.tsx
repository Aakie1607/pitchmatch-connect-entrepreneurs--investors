"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Video, 
  Check, 
  Rocket, 
  TrendingUp,
  X,
  Loader2,
  Image as ImageIcon
} from "lucide-react";

type ProfileStep = 1 | 2 | 3 | 4;

export default function CreateProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProfileStep>(1);
  const [role, setRole] = useState<"entrepreneur" | "investor" | null>(null);
  
  // Step 1: Basic Information
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    email: "",
    bio: ""
  });

  // Step 2: Role-specific details
  const [entrepreneurData, setEntrepreneurData] = useState({
    startupName: "",
    businessDescription: "",
    industry: "",
    fundingStage: "",
    location: "",
    website: ""
  });

  const [investorData, setInvestorData] = useState({
    investmentPreferences: "",
    industryFocus: "",
    fundingCapacity: "",
    location: ""
  });

  // Step 3: Video Upload (for entrepreneurs)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Step 4: Profile Photo & Preferences
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const availableInterests = [
    "Technology", "Healthcare", "Finance", "Education", "E-commerce",
    "AI/ML", "SaaS", "Climate Tech", "Fintech", "Biotech"
  ];

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      setBasicInfo({
        name: session.user.name || "",
        email: session.user.email || "",
        bio: ""
      });
    }
  }, [session]);

  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!session?.user) return;

      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch("/api/profiles/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.log("No existing profile found");
      }
    };

    checkExistingProfile();
  }, [session, router]);

  const handleRoleSelection = (selectedRole: "entrepreneur" | "investor") => {
    setRole(selectedRole);
  };

  const validateStep = (step: ProfileStep): boolean => {
    switch (step) {
      case 1:
        if (!role) {
          toast.error("Please select your role");
          return false;
        }
        if (!basicInfo.name.trim()) {
          toast.error("Name is required");
          return false;
        }
        if (!basicInfo.bio.trim()) {
          toast.error("Bio is required");
          return false;
        }
        return true;

      case 2:
        if (role === "entrepreneur") {
          if (!entrepreneurData.startupName.trim()) {
            toast.error("Startup name is required");
            return false;
          }
          if (!entrepreneurData.businessDescription.trim()) {
            toast.error("Business description is required");
            return false;
          }
          if (!entrepreneurData.industry.trim()) {
            toast.error("Industry is required");
            return false;
          }
          if (!entrepreneurData.location.trim()) {
            toast.error("Location is required");
            return false;
          }
        } else {
          if (!investorData.investmentPreferences.trim()) {
            toast.error("Investment preferences are required");
            return false;
          }
          if (!investorData.industryFocus.trim()) {
            toast.error("Industry focus is required");
            return false;
          }
          if (!investorData.location.trim()) {
            toast.error("Location is required");
            return false;
          }
        }
        return true;

      case 3:
        if (role === "entrepreneur") {
          if (!videoFile) {
            toast.error("Video pitch is required for entrepreneurs");
            return false;
          }
          if (!videoTitle.trim()) {
            toast.error("Video title is required");
            return false;
          }
          if (!videoDescription.trim()) {
            toast.error("Video description is required");
            return false;
          }
          // Validate video content
          if (videoTitle.toLowerCase().includes("test") || 
              videoTitle.toLowerCase().includes("lorem") ||
              videoDescription.toLowerCase().includes("test") ||
              videoDescription.toLowerCase().includes("lorem")) {
            toast.error("Please provide meaningful title and description (no test/placeholder content)");
            return false;
          }
        }
        return true;

      case 4:
        if (!profilePhoto) {
          toast.error("Profile photo is required");
          return false;
        }
        if (interests.length === 0) {
          toast.error("Please select at least one interest");
          return false;
        }
        return true;

      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4) as ProfileStep);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as ProfileStep);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return;
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Video file must be under 500MB");
      return;
    }

    // Create video element to check duration
    const video = document.createElement("video");
    video.preload = "metadata";
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      
      if (video.duration < 3) {
        toast.error("Video must be at least 3 seconds long");
        setVideoFile(null);
        setVideoPreview(null);
        return;
      }
      
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      toast.success("Video loaded successfully");
    };

    video.src = URL.createObjectURL(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image file must be under 5MB");
      return;
    }

    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !interests.includes(customInterest.trim())) {
      setInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest("");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem("bearer_token");

      // Step 1: Upload profile photo to Supabase
      let profilePictureUrl = null;
      if (profilePhoto) {
        const photoFormData = new FormData();
        photoFormData.append("file", profilePhoto);
        
        // You would implement this endpoint to upload to Supabase Storage
        // For now, we'll use a placeholder
        profilePictureUrl = URL.createObjectURL(profilePhoto);
      }

      // Step 2: Create profile
      const profileResponse = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role,
          bio: basicInfo.bio,
          profilePicture: profilePictureUrl,
        }),
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        toast.error(error.error || "Failed to create profile");
        return;
      }

      const profile = await profileResponse.json();

      // Step 3: Create role-specific profile
      if (role === "entrepreneur") {
        const entrepreneurResponse = await fetch("/api/entrepreneur-profiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profileId: profile.id,
            startupName: entrepreneurData.startupName,
            businessDescription: entrepreneurData.businessDescription,
            industry: entrepreneurData.industry,
            fundingStage: entrepreneurData.fundingStage,
            location: entrepreneurData.location,
            website: entrepreneurData.website || null,
          }),
        });

        if (!entrepreneurResponse.ok) {
          toast.error("Failed to create entrepreneur profile");
          return;
        }

        // Step 4: Upload video if entrepreneur
        if (videoFile) {
          setIsUploading(true);
          const videoFormData = new FormData();
          videoFormData.append("file", videoFile);
          videoFormData.append("title", videoTitle);
          videoFormData.append("description", videoDescription);
          videoFormData.append("profileId", profile.id.toString());

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + 10;
            });
          }, 300);

          const videoResponse = await fetch("/api/videos", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: videoFormData,
          });

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (!videoResponse.ok) {
            toast.error("Failed to upload video");
            return;
          }
        }
      } else {
        const investorResponse = await fetch("/api/investor-profiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profileId: profile.id,
            investmentPreferences: investorData.investmentPreferences,
            industryFocus: investorData.industryFocus,
            fundingCapacity: investorData.fundingCapacity,
            location: investorData.location,
          }),
        });

        if (!investorResponse.ok) {
          toast.error("Failed to create investor profile");
          return;
        }
      }

      toast.success("Profile created successfully! Welcome to PitchMatch!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const steps = [
    { number: 1, title: "Basic Info", completed: currentStep > 1 },
    { number: 2, title: role === "entrepreneur" ? "Startup Details" : "Investment Details", completed: currentStep > 2 },
    { number: 3, title: role === "entrepreneur" ? "Video Pitch" : "Preferences", completed: currentStep > 3 },
    { number: 4, title: "Profile Photo", completed: currentStep > 4 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
              Pitch<span className="text-primary">Match</span>
            </h1>
            <h2 className="text-2xl font-bold text-foreground">
              Complete Your Profile
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Step {currentStep} of 4 - {steps[currentStep - 1].title}
            </p>
          </motion.div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex flex-1 items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex flex-col items-center"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        step.completed
                          ? "border-primary bg-primary text-primary-foreground"
                          : currentStep === step.number
                          ? "border-primary bg-background text-primary"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {step.completed ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">{step.number}</span>
                      )}
                    </div>
                    <span className="mt-2 hidden sm:block text-xs text-center font-medium text-muted-foreground max-w-[80px]">
                      {step.title}
                    </span>
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border mx-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: step.completed ? "100%" : "0%" }}
                        className="h-full bg-primary"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-border bg-card p-8 shadow-xl"
          >
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Information & Role Selection */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4">
                      Select Your Role
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleSelection("entrepreneur")}
                        className={`relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all ${
                          role === "entrepreneur"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                          <Rocket className="h-7 w-7 text-primary" />
                        </div>
                        <h4 className="text-lg font-bold text-foreground mb-2">
                          Entrepreneur
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Pitch your startup and connect with investors
                        </p>
                        {role === "entrepreneur" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleSelection("investor")}
                        className={`relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all ${
                          role === "investor"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                          <TrendingUp className="h-7 w-7 text-primary" />
                        </div>
                        <h4 className="text-lg font-bold text-foreground mb-2">
                          Investor
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Discover startups and find investment opportunities
                        </p>
                        {role === "investor" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={basicInfo.name}
                        onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={basicInfo.email}
                        disabled
                        className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-muted-foreground cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Bio *
                      </label>
                      <textarea
                        value={basicInfo.bio}
                        onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                        rows={4}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Tell us about yourself and your goals..."
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {basicInfo.bio.length} / 500 characters
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Role-Specific Details */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {role === "entrepreneur" ? "Startup Details" : "Investment Preferences"}
                  </h3>

                  {role === "entrepreneur" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Startup Name *
                        </label>
                        <input
                          type="text"
                          value={entrepreneurData.startupName}
                          onChange={(e) => setEntrepreneurData({ ...entrepreneurData, startupName: e.target.value })}
                          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Your company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Business Description *
                        </label>
                        <textarea
                          value={entrepreneurData.businessDescription}
                          onChange={(e) => setEntrepreneurData({ ...entrepreneurData, businessDescription: e.target.value })}
                          rows={4}
                          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Describe your business and what makes it unique..."
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Industry *
                          </label>
                          <input
                            type="text"
                            value={entrepreneurData.industry}
                            onChange={(e) => setEntrepreneurData({ ...entrepreneurData, industry: e.target.value })}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="e.g., Technology"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Funding Stage
                          </label>
                          <select
                            value={entrepreneurData.fundingStage}
                            onChange={(e) => setEntrepreneurData({ ...entrepreneurData, fundingStage: e.target.value })}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">Select stage</option>
                            <option value="Pre-seed">Pre-seed</option>
                            <option value="Seed">Seed</option>
                            <option value="Series A">Series A</option>
                            <option value="Series B">Series B</option>
                            <option value="Series C+">Series C+</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Location *
                          </label>
                          <input
                            type="text"
                            value={entrepreneurData.location}
                            onChange={(e) => setEntrepreneurData({ ...entrepreneurData, location: e.target.value })}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="City, Country"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            value={entrepreneurData.website}
                            onChange={(e) => setEntrepreneurData({ ...entrepreneurData, website: e.target.value })}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Investment Preferences *
                        </label>
                        <textarea
                          value={investorData.investmentPreferences}
                          onChange={(e) => setInvestorData({ ...investorData, investmentPreferences: e.target.value })}
                          rows={4}
                          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="What types of startups and investments interest you?"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Industry Focus *
                          </label>
                          <input
                            type="text"
                            value={investorData.industryFocus}
                            onChange={(e) => setInvestorData({ ...investorData, industryFocus: e.target.value })}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="e.g., Technology, Healthcare"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Funding Capacity
                          </label>
                          <select
                            value={investorData.fundingCapacity}
                            onChange={(e) => setInvestorData({ ...investorData, fundingCapacity: e.target.value })}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">Select range</option>
                            <option value="$10K-$50K">$10K-$50K</option>
                            <option value="$50K-$100K">$50K-$100K</option>
                            <option value="$100K-$500K">$100K-$500K</option>
                            <option value="$500K-$1M">$500K-$1M</option>
                            <option value="$1M+">$1M+</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Location *
                        </label>
                        <input
                          type="text"
                          value={investorData.location}
                          onChange={(e) => setInvestorData({ ...investorData, location: e.target.value })}
                          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="City, Country"
                        />
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step 3: Video Upload (Entrepreneurs) or Skip for Investors */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {role === "entrepreneur" ? (
                    <>
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          Upload Your Pitch Video *
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          This is required for entrepreneurs. Show investors your vision! (Max 500MB, min 3 seconds)
                        </p>
                      </div>

                      {!videoPreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-2xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="mb-2 text-sm font-semibold text-foreground">
                              Click to upload video
                            </p>
                            <p className="text-xs text-muted-foreground">
                              MP4, MOV, AVI (MAX. 500MB, MIN. 3s)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={handleVideoChange}
                          />
                        </label>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden border border-border">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full h-64 object-cover bg-black"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setVideoFile(null);
                              setVideoPreview(null);
                            }}
                            className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                        </div>
                      )}

                      {videoFile && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Video Title *
                            </label>
                            <input
                              type="text"
                              value={videoTitle}
                              onChange={(e) => setVideoTitle(e.target.value)}
                              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="e.g., Revolutionary AI Platform for Healthcare"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Video Description *
                            </label>
                            <textarea
                              value={videoDescription}
                              onChange={(e) => setVideoDescription(e.target.value)}
                              rows={3}
                              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="Describe what investors will see in this pitch..."
                            />
                          </div>
                        </div>
                      )}

                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Uploading...</span>
                            <span className="font-semibold text-foreground">{uploadProgress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="h-full bg-primary"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <Check className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Great Progress!
                      </h3>
                      <p className="text-muted-foreground">
                        As an investor, you can skip the video upload step.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Profile Photo & Preferences */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Profile Photo & Preferences
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add a professional photo and select your interests
                    </p>
                  </div>

                  {!photoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-2xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-all">
                      <div className="flex flex-col items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="mb-2 text-sm font-semibold text-foreground">
                          Click to upload photo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG (MAX. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="h-48 w-48 rounded-2xl object-cover border border-border"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setProfilePhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute -top-2 -right-2 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Select Interests (at least 1) *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableInterests.map((interest) => (
                        <motion.button
                          key={interest}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            interests.includes(interest)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {interest}
                        </motion.button>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={customInterest}
                        onChange={(e) => setCustomInterest(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
                        className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Add custom interest..."
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={addCustomInterest}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Add
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Profile Visibility
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setVisibility("public")}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${
                          visibility === "public"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground">Public</h4>
                          {visibility === "public" && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Visible to all users
                        </p>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setVisibility("private")}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${
                          visibility === "private"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground">Private</h4>
                          {visibility === "private" && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Only visible to connections
                        </p>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex gap-4">
            {currentStep > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-2xl border-2 border-border bg-background px-6 py-3 font-semibold text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={currentStep === 4 ? handleSubmit : handleNext}
              disabled={isLoading || isUploading}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading || isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isUploading ? "Uploading..." : "Creating Profile..."}
                </>
              ) : currentStep === 4 ? (
                <>
                  Complete Profile
                  <Check className="h-5 w-5" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}