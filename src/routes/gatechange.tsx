import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/gatechange")({
  component: () => <Layout><GateChangePage /></Layout>,
});

function GateChangePage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [flightId, setFlightId] = useState("");
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");

  const load = async () => {
    const { data } = await supabase.from("flights").select("*").order("departure_time");
    setFlights(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const flight = flights.find((f) => f.id === flightId);
  const allGates: string[] = [];
  for (const p of ["A", "B", "C"]) for (let i = 1; i <= 10; i++) allGates.push(`${p}${i}`);

  const submit = async () => {
    const session = getSession();
    if (!flight || !selected) { toast.error("Pick flight and a new gate"); return; }
    if (selected === flight.gate) { toast.error("Pick a different gate"); return; }
    const oldGate = flight.gate;
    const { error } = await supabase.from("flights").update({ gate: selected }).eq("id", flight.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("gate_changes").insert({
      flight_no: flight.flight_no, old_gate: oldGate, new_gate: selected, reason: reason || null, changed_by: session?.full_name,
    });
    toast.success(`Gate changed: ${flight.flight_no} ${oldGate} → ${selected}`);
    setReason(""); setSelected(""); load();
  };

  return (
    <div>
      <h1 className="sk-heading" style={{ fontSize: 18, marginTop: 0 }}>GATE CHANGE</h1>
      <div className="sk-panel" style={{ padding: 20, marginBottom: 16 }}>
        <label className="sk-label">FLIGHT</label>
        <select className="sk-input" value={flightId} onChange={(e) => { setFlightId(e.target.value); setSelected(""); }} style={{ maxWidth: 380 }}>
          <option value="">— SELECT FLIGHT —</option>
          {flights.map((f) => <option key={f.id} value={f.id}>{f.flight_no} | {f.destination} | gate {f.gate}</option>)}
        </select>
        {flight && <div style={{ marginTop: 12, color: "#7d8590" }}>Current gate: <span style={{ color: "#ffa500", fontWeight: 700 }}>{flight.gate}</span></div>}
      </div>
      {flight && (
        <>
          <div className="sk-panel" style={{ padding: 20, marginBottom: 16 }}>
            <h3 className="sk-heading" style={{ margin: "0 0 12px", fontSize: 14 }}>SELECT NEW GATE</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
              {allGates.map((g) => {
                const occ = flights.find((x) => x.gate === g);
                const isCurrent = g === flight.gate;
                const isSelected = g === selected;
                let color = "#00ff88", bg = "transparent";
                if (occ && !isCurrent) color = "#ffa500";
                if (isSelected) { color = "#00d4ff"; bg = "rgba(0,212,255,0.2)"; }
                if (isCurrent) color = "#7d8590";
                return (
                  <button key={g} disabled={!!occ && !isCurrent} onClick={() => setSelected(g)}
                    style={{ padding: 10, border: `1px solid ${color}`, color, background: bg, cursor: occ && !isCurrent ? "not-allowed" : "pointer", fontFamily: "inherit", borderRadius: 4, opacity: isCurrent ? 0.5 : 1 }}>
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="sk-panel" style={{ padding: 20 }}>
            <label className="sk-label">REASON</label>
            <input className="sk-input" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button className="sk-btn sk-btn-primary" style={{ marginTop: 12 }} onClick={submit}>CONFIRM GATE CHANGE</button>
          </div>
        </>
      )}
    </div>
  );
}