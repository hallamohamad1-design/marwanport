import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/inbox")({
  component: () => <Layout><InboxPage /></Layout>,
});

const STATUSES = ["Pending", "In Review", "Resolved"];

function InboxPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const load = async () => {
    const { data } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("inbox-rt").on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Status updated");
  };
  const saveResponse = async (id: string) => {
    const r = drafts[id] ?? "";
    const { error } = await supabase.from("complaints").update({ response: r }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Response saved");
  };
  const badge = (s: string) => s === "Resolved" ? "sk-badge sk-badge-green" : s === "In Review" ? "sk-badge sk-badge-cyan" : "sk-badge sk-badge-amber";

  return (
    <div>
      <h1 className="sk-heading" style={{ fontSize: 18, marginTop: 0 }}>INBOX — ALL COMPLAINTS</h1>
      {rows.length === 0 ? (
        <div className="sk-panel" style={{ padding: 24, color: "#7d8590", textAlign: "center" }}>No complaints filed</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((c) => (
            <div key={c.id} className="sk-panel" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ color: "#00d4ff", fontWeight: 700 }}>{c.passenger_name} <span style={{ color: "#7d8590", fontWeight: 400 }}>· {c.flight_no}</span></div>
                  <div style={{ color: "#ffc107", fontSize: 12, marginTop: 4 }}>{c.type}</div>
                </div>
                <span className={badge(c.status)}>{c.status}</span>
              </div>
              <div style={{ marginTop: 10, color: "#c9d1d9", fontSize: 13 }}>{c.notes}</div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#7d8590" }}>By {c.employee_name} · {new Date(c.created_at).toLocaleString()}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {STATUSES.map((s) => (
                  <button key={s} className="sk-btn" onClick={() => setStatus(c.id, s)} style={{ padding: "4px 10px", fontSize: 11, opacity: c.status === s ? 1 : 0.7 }}>{s}</button>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <label className="sk-label">RESPONSE</label>
                <textarea className="sk-input" rows={2} defaultValue={c.response || ""} onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))} style={{ resize: "vertical" }} />
                <button className="sk-btn" style={{ marginTop: 8 }} onClick={() => saveResponse(c.id)}>SAVE RESPONSE</button>
                {c.response && <div style={{ marginTop: 8, padding: 10, background: "#0d1117", borderLeft: "3px solid #00ff88", color: "#c9d1d9", fontSize: 13 }}>{c.response}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}