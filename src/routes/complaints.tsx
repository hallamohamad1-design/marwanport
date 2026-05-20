import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/complaints")({
  component: () => <Layout><ComplaintsPage /></Layout>,
});

const TYPES = ["Wrong Ticket Class", "Baggage Issue", "Behavior", "Service", "Delay", "Other"];

function ComplaintsPage() {
  const session = getSession();
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<any[]>([]);
  const load = async () => {
    if (!session) return;
    const { data } = await supabase.from("complaints").select("*").eq("employee_name", session.full_name).order("created_at", { ascending: false });
    setMine(data ?? []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("my-comp").on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const badge = (s: string) => s === "Resolved" ? "sk-badge sk-badge-green" : s === "In Review" ? "sk-badge sk-badge-cyan" : "sk-badge sk-badge-amber";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 className="sk-heading" style={{ fontSize: 18, margin: 0 }}>COMPLAINTS</h1>
        <button className="sk-btn sk-btn-primary" onClick={() => setOpen(true)}>+ FILE COMPLAINT</button>
      </div>

      <div className="sk-panel" style={{ padding: 16 }}>
        <h3 className="sk-heading" style={{ margin: "0 0 12px", fontSize: 14 }}>MY COMPLAINTS</h3>
        {mine.length === 0 ? (
          <div style={{ color: "#7d8590", padding: 16 }}>You haven't filed any complaints yet.</div>
        ) : (
          <table className="sk-table">
            <thead><tr><th>PASSENGER</th><th>FLIGHT</th><th>TYPE</th><th>STATUS</th><th>RESPONSE</th><th>DATE</th></tr></thead>
            <tbody>
              {mine.map((c) => (
                <tr key={c.id}>
                  <td>{c.passenger_name}</td>
                  <td style={{ color: "#00d4ff" }}>{c.flight_no}</td>
                  <td>{c.type}</td>
                  <td><span className={badge(c.status)}>{c.status}</span></td>
                  <td style={{ color: "#7d8590" }}>{c.response || "—"}</td>
                  <td>{new Date(c.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && <FileModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function FileModal({ onClose }: { onClose: () => void }) {
  const session = getSession();
  const [pq, setPq] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [picked, setPicked] = useState<any | null>(null);
  const [flight, setFlight] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [notes, setNotes] = useState("");
  const t = useRef<any>(null);

  useEffect(() => {
    if (picked) return;
    clearTimeout(t.current);
    if (!pq.trim()) { setMatches([]); return; }
    t.current = setTimeout(async () => {
      const { data } = await supabase.from("passengers").select("id,full_name,passport,flight_no").ilike("full_name", `%${pq}%`).limit(8);
      setMatches(data ?? []);
    }, 300);
    return () => clearTimeout(t.current);
  }, [pq, picked]);

  const submit = async () => {
    if (!session) return;
    if (!picked && !pq.trim()) { toast.error("Select a passenger"); return; }
    if (!flight.trim() || !notes.trim()) { toast.error("Flight and details required"); return; }
    const { error } = await supabase.from("complaints").insert({
      employee_name: session.full_name,
      passenger_name: picked?.full_name || pq.trim(),
      flight_no: flight.trim(),
      type, notes,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Complaint filed");
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} className="sk-panel" style={{ padding: 24, width: 520, maxHeight: "90vh", overflow: "auto" }}>
        <h3 className="sk-heading" style={{ marginTop: 0 }}>FILE COMPLAINT</h3>

        <label className="sk-label">PASSENGER</label>
        <input className="sk-input" value={picked ? picked.full_name : pq} onChange={(e) => { setPicked(null); setPq(e.target.value); }} placeholder="Type passenger name..." />
        {!picked && matches.length > 0 && (
          <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, marginTop: 4, maxHeight: 180, overflow: "auto" }}>
            {matches.map((m) => (
              <div key={m.id} onClick={() => { setPicked(m); setFlight(m.flight_no || ""); setMatches([]); }} style={{ padding: 8, cursor: "pointer", borderBottom: "1px solid #30363d", color: "#c9d1d9", fontSize: 12 }}>
                {m.full_name} <span style={{ color: "#7d8590" }}>· {m.passport} · {m.flight_no}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 12 }} />
        <label className="sk-label">FLIGHT</label>
        <input className="sk-input" value={flight} onChange={(e) => setFlight(e.target.value)} />

        <div style={{ height: 12 }} />
        <label className="sk-label">TYPE</label>
        <select className="sk-input" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <div style={{ height: 12 }} />
        <label className="sk-label">DETAILS</label>
        <textarea className="sk-input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ resize: "vertical" }} />

        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="sk-btn" onClick={onClose}>CANCEL</button>
          <button className="sk-btn sk-btn-primary" onClick={submit}>SUBMIT</button>
        </div>
      </div>
    </div>
  );
}