"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { ArrowRight, Video, Users, MessageSquare, Upload, Sparkles, TrendingUp, CheckCircle2, Twitter, Linkedin, Github, Shield, Lock, Zap } from "lucide-react";
import { useRef } from "react";

// Enhanced animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  // Enhanced parallax effects
  const heroOpacity = useSpring(useTransform(scrollY, [0, 400], [1, 0]), { stiffness: 100, damping: 30 });
  const heroScale = useSpring(useTransform(scrollY, [0, 400], [1, 0.95]), { stiffness: 100, damping: 30 });
  const heroY = useSpring(useTransform(scrollY, [0, 400], [0, -80]), { stiffness: 100, damping: 30 });

  useEffect(() => {
    if (!isPending && session?.user) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-light text-muted-foreground tracking-wide">Loading your experience...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Enhanced Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/90 backdrop-blur-2xl border-b border-border/50 py-3 md:py-4 shadow-lg"
            : "bg-transparent py-4 md:py-6"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-light tracking-wide text-foreground">
                  PitchMatch
                </h1>
              </Link>
            </motion.div>

            <div className="hidden md:flex items-center gap-8 lg:gap-10">
              <motion.a
                href="#features"
                whileHover={{ y: -2 }}
                className="text-sm font-light tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ y: -2 }}
                className="text-sm font-light tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                Process
              </motion.a>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/login"
                className="text-sm font-light tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-light tracking-wide text-background shadow-lg hover:shadow-xl transition-all"
                >
                  <span className="hidden xs:inline">Get Started</span>
                  <span className="xs:hidden">Start</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Enhanced Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center px-6 sm:px-8 lg:px-12 pt-20 sm:pt-0"
      >
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.02, 0.035, 0.02]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 left-1/4 h-96 w-96 sm:h-[500px] sm:w-[500px] rounded-full bg-foreground/[0.02] blur-3xl" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.25, 1],
              opacity: [0.02, 0.035, 0.02]
            }}
            transition={{ 
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
            className="absolute bottom-1/4 right-1/4 h-96 w-96 sm:h-[500px] sm:w-[500px] rounded-full bg-foreground/[0.02] blur-3xl" 
          />
        </div>

        <div className="mx-auto max-w-5xl text-center w-full">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6 sm:space-y-8"
          >
            {/* Enhanced Badge */}
            <motion.div
              variants={scaleIn}
              className="inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-muted/30 px-4 sm:px-5 py-2 backdrop-blur-sm shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-foreground" />
              <span className="text-xs sm:text-sm font-light tracking-wide text-foreground">
                Precision Matching Platform
              </span>
            </motion.div>

            {/* Enhanced Headline */}
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl xs:text-5xl sm:text-6xl lg:text-7xl font-extralight tracking-tight text-foreground leading-[1.1] px-4 sm:px-0"
            >
              Where Founders Meet
              <br />
              <span className="relative inline-block mt-2 font-light">
                Investors
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, delay: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -bottom-2 left-0 right-0 h-[2px] bg-foreground origin-left"
                />
              </span>
            </motion.h1>

            {/* Enhanced Subtext */}
            <motion.p
              variants={fadeInUp}
              className="mx-auto max-w-2xl text-sm sm:text-base font-light text-muted-foreground leading-relaxed tracking-wide px-4 sm:px-0"
            >
              Video pitches. Intelligent matching. Direct connections.
              <br className="hidden sm:block" />
              <span className="text-foreground/70">Join the future of startup investment.</span>
            </motion.p>

            {/* Enhanced CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col xs:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4 sm:px-0"
            >
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/register"
                  className="w-full xs:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-foreground px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base font-light tracking-wide text-background shadow-xl hover:shadow-2xl transition-all"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/login"
                  className="w-full xs:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-border/50 bg-transparent px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base font-light tracking-wide text-foreground hover:bg-muted/30 hover:border-border transition-all"
                >
                  Sign In
                </Link>
              </motion.div>
            </motion.div>

            {/* Enhanced Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-3 gap-6 sm:gap-10 pt-12 sm:pt-16 border-t border-border/40 mt-12 sm:mt-16 px-4 sm:px-0"
            >
              {[
                { value: "100+", label: "Matched", icon: Users },
                { value: "50+", label: "Investors", icon: TrendingUp },
                { value: "$10M+", label: "Funded", icon: Zap },
              ].map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center"
                  whileHover={{ scale: 1.08, y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="h-5 w-5 text-foreground/60" strokeWidth={1.5} />
                    <p className="text-2xl xs:text-3xl sm:text-4xl font-light text-foreground tracking-wide">{stat.value}</p>
                  </div>
                  <p className="text-xs sm:text-sm font-light text-muted-foreground tracking-wide">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Process Section */}
      <ProcessSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Social Proof Section */}
      <SocialProofSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}

// ... keep existing ProcessSection, FeaturesSection, SocialProofSection, CTASection, FooterSection components ...

function ProcessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="py-20 sm:py-28 lg:py-32 px-6 sm:px-8 lg:px-12 bg-muted/20" ref={ref}>
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-4 tracking-wide">
            Process
          </h2>
          <p className="text-sm sm:text-base font-light text-muted-foreground max-w-2xl mx-auto tracking-wide px-4 sm:px-0">
            Four simple steps to meaningful connections
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            {
              step: "01",
              icon: Users,
              title: "Sign Up",
              description: "Create your profile",
            },
            {
              step: "02",
              icon: Upload,
              title: "Share",
              description: "Upload your pitch",
            },
            {
              step: "03",
              icon: Video,
              title: "Match",
              description: "Connect with opportunities",
            },
            {
              step: "04",
              icon: MessageSquare,
              title: "Engage",
              description: "Start conversations",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
              className="relative"
            >
              <div className="relative h-full rounded-3xl border border-border/50 bg-background p-8 sm:p-10 shadow-sm hover:shadow-2xl transition-all duration-500">
                {/* Enhanced step number */}
                <div className="mb-6">
                  <span className="text-6xl sm:text-7xl font-extralight text-foreground/5">
                    {item.step}
                  </span>
                </div>

                {/* Enhanced icon */}
                <motion.div 
                  className="mb-6 inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-foreground text-background"
                  whileHover={{ rotate: 10, scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <item.icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.5} />
                </motion.div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl font-light text-foreground mb-3 tracking-wide">
                  {item.title}
                </h3>
                <p className="text-sm font-light text-muted-foreground leading-relaxed tracking-wide">
                  {item.description}
                </p>
              </div>

              {/* Enhanced connector line */}
              {index < 3 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-[2px] bg-gradient-to-r from-border/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-20 sm:py-28 lg:py-32 px-6 sm:px-8 lg:px-12" ref={ref}>
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-4 tracking-wide">
            Features
          </h2>
          <p className="text-sm sm:text-base font-light text-muted-foreground max-w-2xl mx-auto tracking-wide px-4 sm:px-0">
            Everything you need to connect and grow
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: Video,
              title: "Video Pitches",
              description: "Share your vision through compelling presentations",
            },
            {
              icon: Users,
              title: "Smart Matching",
              description: "Algorithm-driven connections based on preferences",
            },
            {
              icon: MessageSquare,
              title: "Direct Chat",
              description: "Real-time messaging with mutual connections",
            },
            {
              icon: TrendingUp,
              title: "Analytics",
              description: "Track engagement and investor interest",
            },
            {
              icon: CheckCircle2,
              title: "Mutual Approval",
              description: "Quality connections through two-way consent",
            },
            {
              icon: Sparkles,
              title: "Curated Feed",
              description: "Personalized recommendations for investors",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="relative h-full rounded-3xl border border-border/50 bg-background p-8 sm:p-10 shadow-sm hover:shadow-2xl transition-all duration-500">
                {/* Icon */}
                <motion.div 
                  className="mb-6 inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-muted group-hover:bg-foreground group-hover:text-background transition-all duration-500"
                  whileHover={{ rotate: 10, scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <feature.icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.5} />
                </motion.div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl font-light text-foreground mb-3 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-sm font-light text-muted-foreground leading-relaxed tracking-wide">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-16 sm:py-20 px-6 sm:px-8 lg:px-12 bg-muted/20" ref={ref}>
      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm sm:text-base font-light text-muted-foreground mb-6 tracking-wide">
            Trusted by founders and investors worldwide
          </p>
          <div className="flex items-center justify-center gap-3 text-foreground">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.25, zIndex: 10 }}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-3 border-background bg-gradient-to-br from-foreground/20 to-foreground/10"
                />
              ))}
            </div>
            <span className="ml-4 text-sm sm:text-base font-light tracking-wide">
              100+ successful matches
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 sm:py-28 lg:py-32 px-6 sm:px-8 lg:px-12" ref={ref}>
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl sm:rounded-[2.5rem] border border-border/50 bg-gradient-to-br from-muted/40 to-transparent p-12 sm:p-16 lg:p-20 text-center shadow-2xl"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-5 tracking-wide">
            Ready to Connect?
          </h2>
          <p className="text-sm sm:text-base font-light text-muted-foreground max-w-2xl mx-auto mb-10 tracking-wide px-4 sm:px-0">
            Join the platform connecting founders with investors.
            <br className="hidden sm:block" />
            Start building meaningful partnerships today.
          </p>

          <div className="flex flex-col xs:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/register"
                className="w-full xs:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-foreground px-10 sm:px-12 py-4 sm:py-5 text-sm sm:text-base font-light tracking-wide text-background shadow-xl hover:shadow-2xl transition-all"
              >
                Create Account
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="w-full xs:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-border/50 bg-transparent px-10 sm:px-12 py-4 sm:py-5 text-sm sm:text-base font-light tracking-wide text-foreground hover:bg-muted/30 hover:border-border transition-all"
              >
                Sign In
              </Link>
            </motion.div>
          </div>

          <p className="text-xs sm:text-sm font-light text-muted-foreground mt-8 tracking-wide">
            Free to join • No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FooterSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <footer className="border-t border-border/40 py-12 sm:py-16 px-6 sm:px-8 lg:px-12" ref={ref}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-10 sm:gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-lg sm:text-xl font-light text-foreground mb-2 tracking-wide">
              PitchMatch
            </h2>
            <p className="text-xs sm:text-sm font-light text-muted-foreground tracking-wide">
              Connecting Founders with Investors
            </p>
          </motion.div>

          {/* Data & Privacy Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 max-w-4xl w-full pt-6 border-t border-border/30"
          >
            {/* Data Storage */}
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-3">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" strokeWidth={1.5} />
                <h3 className="text-sm font-light text-foreground tracking-wide">Data Storage</h3>
              </div>
              <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed tracking-wide">
                All data is encrypted and securely stored using industry-standard protocols. 
                Videos and files are hosted on enterprise-grade cloud infrastructure with 
                automatic backups and 99.9% uptime guarantee.
              </p>
            </div>

            {/* Privacy Policy */}
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-3">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" strokeWidth={1.5} />
                <h3 className="text-sm font-light text-foreground tracking-wide">Privacy Policy</h3>
              </div>
              <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed tracking-wide">
                Your privacy matters. We never share your data without consent. All communications 
                are private and encrypted. You control your visibility and can delete your account 
                at any time.
              </p>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center gap-3 sm:gap-4"
          >
            {[
              { icon: Twitter, href: "#", label: "Twitter" },
              { icon: Linkedin, href: "#", label: "LinkedIn" },
              { icon: Github, href: "#", label: "GitHub" },
            ].map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-all"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
              </motion.a>
            ))}
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center pt-6 sm:pt-8 border-t border-border/30 w-full"
          >
            <p className="text-xs sm:text-sm font-light text-muted-foreground tracking-wide">
              © {new Date().getFullYear()} PitchMatch. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}