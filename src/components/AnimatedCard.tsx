"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export const AnimatedCard = ({
  children,
  className = "",
  delay = 0,
  hover = true,
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "rounded-2xl border border-border/40 bg-card p-8 transition-all duration-400",
        hover && "hover:shadow-lg hover:border-border/60",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

export const StatCard = ({ icon, label, value, trend, delay = 0 }: StatCardProps) => {
  return (
    <AnimatedCard delay={delay}>
      <div className="flex items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 text-foreground">
          {icon}
        </div>
        <div className="ml-5 flex-1">
          <p className="text-xs font-light text-muted-foreground tracking-wide">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-light text-foreground tracking-wide">{value}</p>
            {trend && (
              <span
                className={cn(
                  "text-xs font-light tracking-wide",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

interface ProfileCardProps {
  profile: {
    id: number;
    name?: string;
    role: string;
    bio?: string | null;
    profilePicture?: string | null;
  };
  roleData?: any;
  onConnect?: () => void;
  onFavorite?: () => void;
  delay?: number;
}

export const ProfileCard = ({
  profile,
  roleData,
  onConnect,
  onFavorite,
  delay = 0,
}: ProfileCardProps) => {
  return (
    <AnimatedCard delay={delay} className="group">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center">
          {profile.profilePicture ? (
            <img
              src={profile.profilePicture}
              alt={profile.name || "Profile"}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-foreground/5 to-foreground/10 text-foreground font-light text-xl">
              {profile.name?.charAt(0) || "U"}
            </div>
          )}
          <div className="ml-4">
            <h3 className="font-light text-base text-foreground transition-colors group-hover:text-foreground/80 tracking-wide">
              {profile.name}
            </h3>
            <p className="text-xs font-light text-muted-foreground capitalize mt-1 tracking-wide">{profile.role}</p>
          </div>
        </div>
      </div>

      {profile.role === "entrepreneur" && roleData && (
        <div className="mb-5 space-y-2">
          <p className="font-light text-sm text-foreground tracking-wide">{roleData.startupName}</p>
          {roleData.industry && (
            <p className="text-xs font-light text-muted-foreground tracking-wide">
              <span className="font-normal">Industry:</span> {roleData.industry}
            </p>
          )}
          {roleData.fundingStage && (
            <p className="text-xs font-light text-muted-foreground tracking-wide">
              <span className="font-normal">Stage:</span> {roleData.fundingStage}
            </p>
          )}
          {roleData.location && (
            <p className="text-xs font-light text-muted-foreground tracking-wide">
              <span className="font-normal">Location:</span> {roleData.location}
            </p>
          )}
        </div>
      )}

      {profile.role === "investor" && roleData && (
        <div className="mb-5 space-y-2">
          {roleData.industryFocus && (
            <p className="text-xs font-light text-muted-foreground tracking-wide">
              <span className="font-normal">Focus:</span> {roleData.industryFocus}
            </p>
          )}
          {roleData.fundingCapacity && (
            <p className="text-xs font-light text-muted-foreground tracking-wide">
              <span className="font-normal">Capacity:</span> {roleData.fundingCapacity}
            </p>
          )}
          {roleData.location && (
            <p className="text-xs font-light text-muted-foreground tracking-wide">
              <span className="font-normal">Location:</span> {roleData.location}
            </p>
          )}
        </div>
      )}

      {profile.bio && (
        <p className="mb-5 text-xs font-light text-muted-foreground line-clamp-3 leading-relaxed tracking-wide">{profile.bio}</p>
      )}

      <div className="flex gap-3">
        {onConnect && (
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={onConnect}
            className="flex-1 rounded-xl bg-foreground px-5 py-2.5 text-xs font-light text-background transition-all duration-400 hover:shadow-lg tracking-wide"
          >
            Connect
          </motion.button>
        )}
        {onFavorite && (
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={onFavorite}
            className="rounded-xl border border-border/40 bg-background px-5 py-2.5 text-xs font-light text-foreground transition-all duration-400 hover:bg-muted/20 hover:border-border/60 tracking-wide"
          >
            ♥
          </motion.button>
        )}
      </div>
    </AnimatedCard>
  );
};