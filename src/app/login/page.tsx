"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  useEffect(() => {
    if (!isPending && session?.user) {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    }
  }, [session, isPending, router, searchParams]);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.success("Account created! Please log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (error?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        return;
      }

      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
      toast.success("Welcome back!");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" strokeWidth={1.5} />
      </div>
    );
  }

  if (session?.user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-block">
              <motion.h1
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-light tracking-wide text-foreground"
              >
                Pitch<span className="font-normal">Match</span>
              </motion.h1>
            </Link>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-8 text-2xl font-light tracking-wide text-foreground"
            >
              Welcome Back
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-3 text-sm font-light text-muted-foreground tracking-wide"
            >
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-normal text-foreground hover:opacity-70 transition-opacity duration-300"
              >
                Sign up
              </Link>
            </motion.p>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmit}
            className="mt-10 space-y-5"
          >
            <div className="space-y-5 rounded-2xl border border-border/40 bg-card p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-light text-foreground mb-2 tracking-wide"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="block w-full rounded-xl border border-border/40 bg-background pl-10 pr-4 py-2.5 text-sm font-light text-foreground placeholder-muted-foreground/60 focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all duration-300 tracking-wide"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-light text-foreground mb-2 tracking-wide"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="block w-full rounded-xl border border-border/40 bg-background pl-10 pr-12 py-2.5 text-sm font-light text-foreground placeholder-muted-foreground/60 focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all duration-300 tracking-wide"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                  className="h-3.5 w-3.5 rounded border-border/40 text-foreground focus:ring-foreground/20 focus:ring-offset-0"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs font-light text-muted-foreground tracking-wide"
                >
                  Remember me
                </label>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.3 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-light text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.08)] tracking-wide"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Privacy Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center pt-4"
          >
            <p className="text-xs font-light text-muted-foreground tracking-wide">
              Protected by industry-standard encryption
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" strokeWidth={1.5} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}