import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.9 29 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19 19-8.5 19-19c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.9 29 5 24 5 16.3 5 9.6 9.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43c5 0 9.5-1.9 13-5l-6-5.1c-2 1.4-4.4 2.1-7 2.1-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 38.6 16.2 43 24 43z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6 5.1c-.4.4 6.7-4.9 6.7-14.6 0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.21-1.12 3.05-.78.92-2.07 1.62-3.13 1.54-.13-1.1.42-2.27 1.13-3.04C14 2.06 15.27 1.43 16.365 1.43zm4.05 16.86c-.55 1.27-.82 1.84-1.53 2.97-.99 1.55-2.39 3.48-4.13 3.5-1.55.01-1.95-1.01-4.05-1-2.1.01-2.54 1.02-4.09 1.01-1.74-.02-3.07-1.77-4.06-3.32-2.77-4.32-3.06-9.4-1.35-12.1 1.22-1.92 3.14-3.05 4.95-3.05 1.83 0 2.99 1.01 4.5 1.01 1.47 0 2.36-1.01 4.49-1.01 1.6 0 3.3.87 4.52 2.38-3.97 2.17-3.32 7.85.75 9.62z" />
    </svg>
  );
}

export function OAuthButtons() {
  const { signInWithOAuth } = useAuth();
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const handle = async (provider: "google" | "apple") => {
    setLoading(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast.error(`No se pudo iniciar sesión con ${provider}`, { description: error.message });
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => handle("google")}
        disabled={loading !== null}
        className="gap-2 h-11"
      >
        {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => handle("apple")}
        disabled={loading !== null}
        className="gap-2 h-11"
      >
        {loading === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon />}
        Apple
      </Button>
    </div>
  );
}
