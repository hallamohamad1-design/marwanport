import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Tv, Monitor, Search, Users as UsersIcon,
  Shuffle, FileText, BarChart3, Inbox, UserCog, LogOut,
} from "lucide-react";
import { clearSession, getSession, type Session } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";

const employeeNav = [
  { to: "/checkin", label: "Check-In", Icon: Plane },
  { to: "/displays", label: "Displays", Icon: Tv },
  { to: "/counters", label: "Counters", Icon: Monitor },
  { to: "/search", label: "Search", Icon: Search },
  { to: "/boarding", label: "Boarding", Icon: UsersIcon },
  { to: "/gatechange", label: "Gate Change", Icon: Shuffle },
  { to: "/complaints", label: "Complaints", Icon: FileText },
] as const;

const managerNav = [
  { to: "/displays", label: "Displays", Icon: Tv },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/staff", label: "Staff Accounts", Icon: UserCog },
  { to: "/inbox", label: "Inbox", Icon: Inbox },
  { to: "/counters", label: "Counters", Icon: Monitor },
  { to: "/search", label: "Search", Icon: Search },
] as const;

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const now = useClock();

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate({ to: "/login" }); return; }
    setSessionState(s);
  }, [navigate]);

  useEffect(() => { setMobileOpen(false); }, [path]);

  useEffect(() => {
    if (session?.role !== "manager") return;
    const load = async () => {
      const { count } = await supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "Pending");
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase.channel("inbox-count").on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session]);

  if (!session) {
    return (
      <div className="sk-grid-bg" style={{ minHeight: "100vh", color: "#00d4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>LOADING…</motion.div>
      </div>
    );
  }

  const nav = session.role === "manager" ? managerNav : employeeNav;
  const time = now.toTimeString().slice(0, 8);
  const date = now.toDateString();
  const logout = () => { clearSession(); navigate({ to: "/login" }); };

  const Sidebar = (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sk-glass"
      style={{
        position: "fixed", top: 56, left: 0, bottom: 0, width: 280,
        display: "flex", flexDirection: "column", padding: "20px 0", zIndex: 40,
        borderRight: "1px solid rgba(0,212,255,0.15)",
      }}
    >
      <div style={{ padding: "0 24px 20px", borderBottom: "1px solid rgba(55,65,81,0.5)", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plane size={18} color="#00d4ff" className="sk-plane" />
          <div style={{ color: "#00d4ff", fontWeight: 700, letterSpacing: "0.2em", fontSize: 14 }}>SKYPORT</div>
        </div>
        <div style={{ color: "#6b7280", fontSize: 10, marginTop: 4, letterSpacing: "0.1em" }}>CHECK-IN MGMT</div>
      </div>
      <nav style={{ flex: 1, overflowY: "auto" }}>
        {nav.map((item, i) => {
          const active = path === item.to;
          const isInbox = item.to === "/inbox";
          const Icon = item.Icon;
          return (
            <motion.div key={item.to} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
              <Link
                to={item.to}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 24px",
                  color: active ? "#00d4ff" : "#9ca3af",
                  background: active ? "rgba(0,212,255,0.08)" : "transparent",
                  borderLeft: active ? "3px solid #00d4ff" : "3px solid transparent",
                  textDecoration: "none", fontSize: 13, fontWeight: 600,
                  transition: "all 200ms ease", position: "relative",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(0,212,255,0.04)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isInbox && unread > 0 && (
                  <span className="sk-badge sk-badge-red sk-pulse">{unread}</span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
      <button onClick={logout} className="sk-btn sk-btn-danger" style={{ margin: "0 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <LogOut size={14} /> LOGOUT
      </button>
    </motion.aside>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--skyport-bg)", color: "#e5e7eb" }}>
      <header className="sk-glass" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 56,
        display: "flex", alignItems: "center", padding: "0 24px", zIndex: 50,
        borderBottom: "1px solid rgba(0,212,255,0.15)",
      }}>
        <button onClick={() => setMobileOpen(v => !v)} className="sk-btn" style={{ marginRight: 12, padding: "6px 10px", display: "none" }} id="sk-burger">☰</button>
        <div style={{ width: 268, display: "flex", alignItems: "center", gap: 8 }}>
          <Plane size={18} color="#00d4ff" className="sk-plane" />
          <div style={{ color: "#00d4ff", fontWeight: 700, letterSpacing: "0.2em", fontSize: 14 }}>SKYPORT</div>
          <span style={{ color: "#6b7280", fontSize: 10, letterSpacing: "0.1em" }}>v2.1</span>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <motion.span key={time} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} style={{ color: "#fbbf24", fontSize: 18, letterSpacing: "0.1em", fontWeight: 600 }}>{time}</motion.span>
          <span style={{ color: "#6b7280", fontSize: 11, marginLeft: 12 }}>{date}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#00d4ff", fontWeight: 600, fontSize: 13 }}>{session.full_name}</div>
          <span className={`sk-badge ${session.role === "manager" ? "sk-badge-gold" : "sk-badge-cyan"}`} style={{ marginTop: 2 }}>{session.role}</span>
        </div>
      </header>

      <AnimatePresence>{mobileOpen && Sidebar}</AnimatePresence>
      <div className="sk-desktop-side">{Sidebar}</div>

      <main style={{ marginLeft: 280, marginTop: 56, padding: 24, minHeight: "calc(100vh - 56px)" }} className="sk-main">
        <AnimatePresence mode="wait">
          <motion.div key={path} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sk-desktop-side { display: none; }
          .sk-main { margin-left: 0 !important; padding: 16px !important; }
          #sk-burger { display: inline-block !important; }
        }
      `}</style>
    </div>
  );
}
