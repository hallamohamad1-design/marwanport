import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setSession } from "@/lib/session";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const fail = (msg: string) => {
    toast.error(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return fail("Username and password required");
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("id, username, full_name, role")
      .eq("username", username.trim())
      .eq("password", password)
      .maybeSingle();
    setLoading(false);
    if (error || !data) return fail("Invalid credentials");
    setSession({ id: data.id, username: data.username, full_name: data.full_name, role: (data.role as "employee" | "manager") ?? "employee" });
    toast.success(`Welcome, ${data.full_name}`);
    setTimeout(() => navigate({ to: "/" }), 200);
  };

  return (
    <div className="sk-grid-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sk-glass ${shake ? "sk-shake" : ""}`}
        style={{
          width: "100%", maxWidth: 440, borderRadius: 16, padding: 36,
          border: "1px solid rgba(0,212,255,0.3)",
          boxShadow: "0 0 80px rgba(0,212,255,0.15)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 8 }}
          >
            <Plane size={36} color="#00d4ff" className="sk-plane" />
            <h1 style={{ color: "#00d4ff", fontSize: 36, letterSpacing: "0.3em", margin: 0, fontWeight: 700, textShadow: "0 0 20px rgba(0,212,255,0.4)" }}>
              SKYPORT
            </h1>
          </motion.div>
          <div style={{ color: "#fbbf24", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Airport Check-In Management System
          </div>
        </div>

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 18 }}>
          <label className="sk-label"><User size={11} style={{ display: "inline", marginRight: 4 }} />USERNAME</label>
          <input className="sk-input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="enter username" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 28 }}>
          <label className="sk-label"><Lock size={11} style={{ display: "inline", marginRight: 4 }} />PASSWORD</label>
          <input className="sk-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" />
        </motion.div>

        <motion.button
          type="submit" disabled={loading} className="sk-btn sk-btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: 14, letterSpacing: "0.15em" }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? "AUTHENTICATING…" : "LOGIN →"}
        </motion.button>

        <div style={{ marginTop: 24, textAlign: "center", color: "#6b7280", fontSize: 11, letterSpacing: "0.05em" }}>
          Manager: <span style={{ color: "#fbbf24" }}>tamer</span> / <span style={{ color: "#fbbf24" }}>manager123</span>
        </div>
      </motion.form>
    </div>
  );
}
