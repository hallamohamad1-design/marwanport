import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/search")({
  component: () => <Layout><SearchPage /></Layout>,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true);
    const { data } = await supabase.from("passengers").select("*").or(`full_name.ilike.%${q}%,passport.ilike.%${q}%`).order("checked_in_at", { ascending: false }).limit(100);
    setRows(data ?? []);
    setSearched(true);
    setLoading(false);
  };

  return (
    <div>
      <h1 className="sk-heading" style={{ fontSize: 18, marginTop: 0 }}>PASSENGER SEARCH</h1>
      <div className="sk-panel" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="sk-input" placeholder="Name or passport..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} />
          <button className="sk-btn sk-btn-primary" onClick={run} disabled={loading}>{loading ? "..." : "SEARCH"}</button>
        </div>
      </div>
      <div className="sk-panel" style={{ padding: 16 }}>
        {!searched ? (
          <div style={{ color: "#7d8590", padding: 24, textAlign: "center" }}>Enter a name or passport number to search</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "#7d8590", padding: 24, textAlign: "center" }}>No matching passengers</div>
        ) : (
          <table className="sk-table">
            <thead><tr><th>NAME</th><th>PASSPORT</th><th>FLIGHT</th><th>SEAT</th><th>CLASS</th><th>GATE</th><th>STATUS</th><th>CHECKED IN</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <Fragment key={p.id}>
                  <tr onClick={() => setExpanded(expanded === p.id ? null : p.id)} style={{ cursor: "pointer" }}>
                    <td>{p.full_name}</td><td>{p.passport}</td><td style={{ color: "#00d4ff" }}>{p.flight_no}</td>
                    <td>{p.seat}</td><td>{p.ticket_class}</td><td>{p.gate}</td>
                    <td><span className="sk-badge sk-badge-cyan">{p.status}</span></td>
                    <td>{new Date(p.checked_in_at).toLocaleString()}</td>
                  </tr>
                  {expanded === p.id && (
                    <tr>
                      <td colSpan={8} style={{ background: "rgba(0,212,255,0.05)" }}>
                        <div style={{ padding: 12, fontSize: 12, lineHeight: 1.8 }}>
                          <div><b style={{ color: "#ffc107" }}>Boarding Pass:</b> {p.boarding_pass_no} | <b style={{ color: "#ffc107" }}>Group:</b> {p.boarding_group}</div>
                          <div><b style={{ color: "#ffc107" }}>Bags:</b> {p.bag_count} | <b style={{ color: "#ffc107" }}>Checked:</b> {p.checked_kg} kg | <b style={{ color: "#ffc107" }}>Carry-on:</b> {p.carry_on_kg} kg</div>
                          <div><b style={{ color: "#ffc107" }}>Overweight:</b> {p.overweight_kg} kg | <b style={{ color: "#ffc107" }}>Fee:</b> ${Number(p.overweight_fee).toFixed(2)} | <b style={{ color: "#ffc107" }}>Total:</b> ${Number(p.total_charge).toFixed(2)}</div>
                          <div><b style={{ color: "#ffc107" }}>Nationality:</b> {p.nationality || "—"} | <b style={{ color: "#ffc107" }}>Terminal:</b> {p.terminal} | <b style={{ color: "#ffc107" }}>By:</b> {p.employee_name}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}