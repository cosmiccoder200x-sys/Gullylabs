import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, Smartphone, Mail } from "lucide-react";

const authSearch = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});
const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().regex(/^[0-9]{10,15}$/, "Enter 10-15 digit phone number").optional(),
});
const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
const phoneSchema = z.object({
  phone: z.string().regex(/^[0-9]{10,15}$/, "Enter valid 10-15 digit phone number"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearch,
  head: () => ({
    meta: [{ title: "Sign in — GullyGadget" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup" | "phone">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        const parsed = signupSchema.safeParse({ name, email, password, phone });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name, phone: phone || null },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm, then sign in.");
          setTab("signin");
          return;
        }
        toast.success("Account created!");
      } else {
        const parsed = signinSchema.safeParse({ email, password });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: search.redirect ?? "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const sendPhoneOTP = async () => {
    const parsed = phoneSchema.safeParse({ phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setOtpBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${parsed.data.phone}`,
      });
      if (error) throw error;
      setOtpSent(true);
      setOtpTimer(300);
      toast.success("OTP sent! Check your phone.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOTP = async () => {
    const otpStr = otp.join("");
    if (otpStr.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }
    setOtpBusy(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otpStr,
        type: "sms",
      });
      if (error) throw error;
      toast.success("Phone verified!");
      navigate({ to: search.redirect ?? "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setOtpBusy(false);
    }
  };

  const google = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-3xl bg-white p-8 ring-1 ring-brand/5">
        <h1 className="mb-2 font-display text-3xl uppercase">Welcome</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in to shop, track orders & save favourites
        </p>

        <Button onClick={google} variant="outline" className="mb-4 w-full rounded-full">
          <Mail className="mr-2 size-4" /> Continue with Google
        </Button>
        <div className="mb-4 text-center text-xs uppercase tracking-widest text-muted-foreground">
          or
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <TabsContent value="signup" className="m-0">
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={tab === "signup"}
                placeholder="Riya Sharma"
              />
            </TabsContent>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
              />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-brand font-bold uppercase tracking-tighter hover:bg-accent-cyan"
            >
              {busy ? "Please wait…" : tab === "signup" ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <TabsContent value="phone" className="m-0">
            {!otpSent ? (
              <div className="mt-6 space-y-4">
                <Label>Phone Number (India)</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                    +91
                  </span>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="rounded-l-none flex-1"
                  />
                </div>
                <Button
                  type="button"
                  onClick={sendPhoneOTP}
                  disabled={otpBusy || phone.length !== 10}
                  className="w-full rounded-full bg-brand font-bold uppercase tracking-tighter hover:bg-accent-cyan"
                >
                  {otpBusy ? "Sending…" : "Send OTP"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You'll receive a 6-digit OTP via SMS
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <Label>Enter 6-Digit OTP</Label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <Input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/, "");
                        const next = [...otp];
                        next[i] = val;
                        setOtp(next);
                        if (val && i < 5) {
                          const input = document.querySelectorAll<HTMLInputElement>(
                            `[data-otp-index="${i + 1}"]`
                          )[0];
                          input?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !digit && i > 0) {
                          const prev = document.querySelectorAll<HTMLInputElement>(
                            `[data-otp-index="${i - 1}"]`
                          )[0];
                          prev?.focus();
                        }
                      }}
                      data-otp-index={i}
                      className="w-12 h-12 text-center text-xl font-bold"
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={verifyOTP}
                  disabled={otpBusy || otp.join("").length !== 6}
                  className="w-full rounded-full bg-brand font-bold uppercase tracking-tighter hover:bg-accent-cyan"
                >
                  {otpBusy ? "Verifying…" : "Verify & Sign In"}
                </Button>
                {otpTimer > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Resend OTP in {otpTimer}s
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
