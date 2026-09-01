import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Card, Button, Logo } from "../components/ui/primitives.jsx";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await auth.signIn(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 transition-colors overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block">
            <Logo withText={true} className="scale-125" />
          </div>
          <p className="text-sm text-muted-foreground">
            Sign in to access your virtual trading account
          </p>
        </div>

        <Card className="p-8 shadow-card border-border">
          {error && (
            <div className="mb-5 rounded-xl bg-negative-muted border border-negative/20 p-3.5 text-xs font-semibold text-negative">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full mt-2"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground border-t border-border pt-4">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-primary hover:underline"
            >
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
