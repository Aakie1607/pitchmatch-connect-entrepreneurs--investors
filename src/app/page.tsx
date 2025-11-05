"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Video, Users, MessageSquare, Upload, Sparkles, TrendingUp, CheckCircle2, Twitter, Linkedin, Github, Shield, Lock } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.98]);

  useEffect(() => {
    if (!isPending && session?.user) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-light text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sticky Navigation Bar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 py-3"
            : "bg-transparent py-4"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-xl font-light tracking-wide text-foreground">
                  PitchMatch
                </h1>
              </Link>
            </motion.div>

            <div className="hidden md:flex items-center gap-8">
              <motion.a
                href="#features"
                whileHover={{ y: -1 }}
                className="text-xs font-light tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ y: -1 }}
                className="text-xs font-light tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                Process
              </motion.a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-light tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-light tracking-wide text-background shadow-sm hover:shadow-md transition-all"
                >
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-6 lg:px-8"
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-foreground/[0.015] blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-foreground/[0.015] blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/20 px-3 py-1 backdrop-blur-sm"
            >
              <Sparkles className="h-3 w-3 text-foreground" />
              <span className="text-xs font-light tracking-wide text-foreground">
                Precision Matching
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extralight tracking-tight text-foreground leading-[1.15]">
              Where Founders Meet
              <br />
              <span className="relative inline-block mt-1 font-light">
                Investors
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -bottom-1 left-0 right-0 h-px bg-foreground origin-left"
                />
              </span>
            </h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mx-auto max-w-xl text-sm font-light text-muted-foreground leading-relaxed tracking-wide"
            >
              Video pitches. Intelligent matching. Direct connections.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            >
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-light tracking-wide text-background shadow-lg hover:shadow-xl transition-all"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-7 py-3 text-sm font-light tracking-wide text-foreground hover:bg-muted/30 transition-all"
                >
                  Sign In
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="grid grid-cols-3 gap-8 pt-12 border-t border-border/40 mt-12"
            >
              {[
                { value: "100+", label: "Matched" },
                { value: "50+", label: "Investors" },
                { value: "$10M+", label: "Funded" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-2xl sm:text-3xl font-light text-foreground tracking-wide">{stat.value}</p>
                  <p className="text-xs font-light text-muted-foreground mt-1 tracking-wide">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 lg:px-8 bg-muted/20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-3 tracking-wide">
              Process
            </h2>
            <p className="text-sm font-light text-muted-foreground max-w-lg mx-auto tracking-wide">
              Four steps to meaningful connections
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="relative h-full rounded-2xl border border-border/50 bg-background p-6 shadow-sm hover:shadow-md transition-all">
                  {/* Step Number */}
                  <div className="mb-4">
                    <span className="text-5xl font-extralight text-foreground/5">
                      {item.step}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                    <item.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-light text-foreground mb-2 tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-xs font-light text-muted-foreground leading-relaxed tracking-wide">
                    {item.description}
                  </p>
                </div>

                {/* Connector Line */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border/30" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-3 tracking-wide">
              Features
            </h2>
            <p className="text-sm font-light text-muted-foreground max-w-lg mx-auto tracking-wide">
              Everything you need to connect and grow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="relative h-full rounded-2xl border border-border/50 bg-background p-6 shadow-sm hover:shadow-md transition-all">
                  {/* Icon */}
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted group-hover:bg-foreground group-hover:text-background transition-all">
                    <feature.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-light text-foreground mb-2 tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-xs font-light text-muted-foreground leading-relaxed tracking-wide">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-6 lg:px-8 bg-muted/20">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm font-light text-muted-foreground mb-4 tracking-wide">
              Trusted by founders and investors
            </p>
            <div className="flex items-center justify-center gap-2 text-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-foreground/20 to-foreground/10"
                  />
                ))}
              </div>
              <span className="ml-3 text-xs font-light tracking-wide">
                100+ successful matches
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-border/50 bg-gradient-to-br from-muted/30 to-transparent p-12 lg:p-16 text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-4 tracking-wide">
              Ready to Connect?
            </h2>
            <p className="text-sm font-light text-muted-foreground max-w-lg mx-auto mb-8 tracking-wide">
              Join the platform connecting founders with investors
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-8 py-3.5 text-sm font-light tracking-wide text-background shadow-lg hover:shadow-xl transition-all"
                >
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-8 py-3.5 text-sm font-light tracking-wide text-foreground hover:bg-muted/30 transition-all"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>

            <p className="text-xs font-light text-muted-foreground mt-6 tracking-wide">
              Free to join
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-8">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-lg font-light text-foreground mb-1 tracking-wide">
                PitchMatch
              </h2>
              <p className="text-xs font-light text-muted-foreground tracking-wide">
                Connecting Founders with Investors
              </p>
            </motion.div>

            {/* Data & Privacy Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="grid md:grid-cols-2 gap-8 max-w-3xl w-full pt-4 border-t border-border/30"
            >
              {/* Data Storage */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Shield className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                  <h3 className="text-xs font-light text-foreground tracking-wide">Data Storage</h3>
                </div>
                <p className="text-xs font-light text-muted-foreground leading-relaxed tracking-wide">
                  All data is encrypted and securely stored using industry-standard protocols. 
                  Videos and files are hosted on enterprise-grade cloud infrastructure with 
                  automatic backups and 99.9% uptime guarantee.
                </p>
              </div>

              {/* Privacy Policy */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Lock className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                  <h3 className="text-xs font-light text-foreground tracking-wide">Privacy Policy</h3>
                </div>
                <p className="text-xs font-light text-muted-foreground leading-relaxed tracking-wide">
                  Your privacy matters. We never share your data without consent. All communications 
                  are private and encrypted. You control your visibility and can delete your account 
                  at any time.
                </p>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-3"
            >
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Github, href: "#", label: "GitHub" },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" strokeWidth={1.5} />
                </motion.a>
              ))}
            </motion.div>

            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center pt-6 border-t border-border/30 w-full"
            >
              <p className="text-xs font-light text-muted-foreground tracking-wide">
                © {new Date().getFullYear()} PitchMatch. All rights reserved.
              </p>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
}