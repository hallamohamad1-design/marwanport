import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/displays")({
  component: () => (
    <Layout>
      <DisplaysPage />
    </Layout>
  ),
});

const TABS = ["FLIGHT BOARD", "GATES", "PASSENGERS", "BOARDING STATUS", "AVAILABLE"] as const;
type Tab = (typeof TABS)[number];

function DisplaysPage() {
  const [tab, setTab] = useState<Tab>("FLIGHT BOARD");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t}
            className="sk-btn"
            style={{
              background: tab === t ? "#00d4ff" : "transparent",
              color: tab === t ? "#0d1117" : "#00d4ff",
            }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "FLIGHT BOARD" && <FlightBoard />}
      {tab === "GATES" && <Gates />}
      {tab === "PASSENGERS" && <PassengersTab />}
      {tab === "BOARDING STATUS" && <BoardingStatus />}
      {tab === "AVAILABLE" && <Available />}
    </div>
  );
}

function statusBadge(status: string) {
  const m: Record<string, string> = {
    "On Time": "sk-badge sk-badge-green",
    Delayed: "sk-badge sk-badge-amber",
    Boarding: "sk-badge sk-badge-cyan",
    Cancelled: "sk-badge sk-badge-red",
  };
  return <span className={m[status] ?? "sk-badge sk-badge-cyan"}>{status}</span>;
}

function FlightBoard() {
  const [flights, setFlights] = useState<any[]>([]);
  const [updated, setUpdated] = useState(Date.now());
  const [, force] = useState(0);

  const load = async () => {
    const { data } = await supabase.from("flights").select("*").order("departure_time");
    setFlights(data ?? []);
    setUpdated(Date.now());
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("flights-board").on("postgres_changes", { event: "*", schema: "public", table: "flights" }, load).subscribe();
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(t);
    };
  }, []);

  return (
    <div className="sk-panel" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 className="sk-heading" style={{ margin: 0, fontSize: 16 }}>FLIGHT BOARD</h2>
        <span style={{ color: "#7d8590", fontSize: 11 }}>UPDATED {Math.floor((Date.now() - updated) / 1000)}s AGO</span>
      </div>
      <table className="sk-table">
        <thead>
          <tr>
            <th>FLIGHT</th><th>DESTINATION</th><th>ORIGIN</th><th>DEPARTURE</th><th>GATE</th><th>TERMINAL</th><th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {flights.map((f) => (
            <tr key={f.id}>
              <td style={{ color: "#00d4ff", fontWeight: 700 }}>{f.flight_no}</td>
              <td>{f.destination}</td>
              <td>{f.origin}</td>
              <td>{String(f.departure_time).slice(0, 5)}</td>
              <td>{f.gate}</td>
              <td>{f.terminal}</td>
              <td>{statusBadge(f.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Gates() {
  const [flights, setFlights] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("flights").select("*");
      setFlights(data ?? []);
    };
    load();
    const ch = supabase.channel("gates-disp").on("postgres_changes", { event: "*", schema: "public", table: "flights" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const gates: string[] = [];
  for (const p of ["A", "B", "C"]) for (let i = 1; i <= 10; i++) gates.push(`${p}${i}`);
  return (
    <div className="sk-panel" style={{ padding: 20 }}>
      <h2 className="sk-heading" style={{ margin: "0 0 16px", fontSize: 16 }}>GATE STATUS</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {gates.map((g) => {
          const f = flights.find((x) => x.gate === g);
          const occupied = !!f;
          const color = occupied ? (f.status === "Cancelled" ? "#ff4444" : "#ffa500") : "#00ff88";
          return (
            <div key={g} style={{ border: `1px solid ${color}`, padding: 12, borderRadius: 4, background: "rgba(0,0,0,0.3)" }}>
              <div style={{ color, fontWeight: 700, fontSize: 18 }}>{g}</div>
              {occupied ? (
                <>
                  <div style={{ fontSize: 11, color: "#00d4ff", marginTop: 4 }}>{f.flight_no}</div>
                  <div style={{ fontSize: 11, color: "#c9d1d9" }}>{f.destination}</div>
                  <div style={{ marginTop: 4 }}>{statusBadge(f.status)}</div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: "#00ff88", marginTop: 8, letterSpacing: "0.1em" }}>AVAILABLE</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PassengersTab() {
  const [flights, setFlights] = useState<any[]>([]);
  const [flightNo, setFlightNo] = useState("");
  const [pax, setPax] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("flights").select("*").order("departure_time").then(({ data }) => setFlights(data ?? []));
  }, []);
  useEffect(() => {
    if (!flightNo) { setPax([]); return; }
    const load = async () => {
      const { data } = await supabase.from("passengers").select("*").eq("flight_no", flightNo).order("checked_in_at", { ascending: false });
      setPax(data ?? []);
    };
    load();
    const ch = supabase.channel("pax-disp").on("postgres_changes", { event: "*", schema: "public", table: "passengers" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [flightNo]);
  const pBadge = (s: string) => s === "Boarded" ? "sk-badge sk-badge-green" : s === "No Show" ? "sk-badge sk-badge-red" : "sk-badge sk-badge-cyan";
  return (
    <div className="sk-panel" style={{ padding: 20 }}>
      <h2 className="sk-heading" style={{ margin: "0 0 16px", fontSize: 16 }}>PASSENGERS BY FLIGHT</h2>
      <select className="sk-input" style={{ maxWidth: 360, marginBottom: 16 }} value={flightNo} onChange={(e) => setFlightNo(e.target.value)}>
        <option value="">— SELECT FLIGHT —</option>
        {flights.map((f) => <option key={f.id} value={f.flight_no}>{f.flight_no} | {f.destination}</option>)}
      </select>
      {!flightNo ? (
        <div style={{ color: "#7d8590", padding: 24, textAlign: "center" }}>Select a flight to view passengers</div>
      ) : pax.length === 0 ? (
        <div style={{ color: "#7d8590", padding: 24, textAlign: "center" }}>No passengers checked in for this flight</div>
      ) : (
        <table className="sk-table">
          <thead><tr><th>NAME</th><th>PASSPORT</th><th>SEAT</th><th>CLASS</th><th>STATUS</th><th>CHECKED IN AT</th></tr></thead>
          <tbody>
            {pax.map((p) => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td>{p.passport}</td>
                <td style={{ color: "#00d4ff" }}>{p.seat}</td>
                <td>{p.ticket_class}</td>
                <td><span className={pBadge(p.status)}>{p.status}</span></td>
                <td>{new Date(p.checked_in_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BoardingStatus() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data: flights } = await supabase.from("flights").select("*").order("departure_time");
      const { data: pax } = await supabase.from("passengers").select("flight_no,status");
      const map: Record<string, { total: number; boarded: number }> = {};
      (pax ?? []).forEach((p: any) => {
        if (!p.flight_no) return;
        const m = (map[p.flight_no] ||= { total: 0, boarded: 0 });
        m.total += 1;
        if (p.status === "Boarded") m.boarded += 1;
      });
      setRows((flights ?? []).map((f: any) => ({ ...f, ...(map[f.flight_no] ?? { total: 0, boarded: 0 }) })));
    };
    load();
    const ch = supabase.channel("bs-disp").on("postgres_changes", { event: "*", schema: "public", table: "passengers" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
      {rows.map((r) => {
        const pct = r.total ? Math.round((r.boarded / r.total) * 100) : 0;
        return (
          <div key={r.id} className="sk-panel" style={{ padding: 16 }}>
            <div style={{ color: "#00d4ff", fontWeight: 700 }}>{r.flight_no}</div>
            <div style={{ color: "#7d8590", fontSize: 12 }}>{r.destination}</div>
            <div style={{ marginTop: 12, height: 8, background: "#0d1117", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#00ff88" }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#c9d1d9" }}>{r.boarded} / {r.total} boarded ({pct}%)</div>
          </div>
        );
      })}
    </div>
  );
}

function Available() {
  const [flights, setFlights] = useState<any[]>([]);
  useEffect(() => { supabase.from("flights").select("*").then(({ data }) => setFlights(data ?? [])); }, []);
  const allGates: string[] = [];
  for (const p of ["A", "B", "C"]) for (let i = 1; i <= 10; i++) allGates.push(`${p}${i}`);
  const occupied = allGates.map((g) => ({ g, f: flights.find((x) => x.gate === g) })).filter((x) => x.f);
  const free = allGates.filter((g) => !flights.find((x) => x.gate === g));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="sk-panel" style={{ padding: 16 }}>
        <h3 className="sk-heading" style={{ margin: "0 0 12px", fontSize: 14 }}>OCCUPIED GATES</h3>
        {occupied.length === 0 ? <div style={{ color: "#7d8590" }}>None</div> : occupied.map(({ g, f }) => (
          <div key={g} style={{ padding: 8, borderBottom: "1px solid #30363d", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#ffa500", fontWeight: 700 }}>{g}</span>
            <span style={{ color: "#00d4ff" }}>{f.flight_no}</span>
            <span style={{ color: "#c9d1d9" }}>{f.destination}</span>
          </div>
        ))}
      </div>
      <div className="sk-panel" style={{ padding: 16 }}>
        <h3 className="sk-heading" style={{ margin: "0 0 12px", fontSize: 14 }}>FREE GATES</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {free.map((g) => (
            <div key={g} style={{ padding: 8, border: "1px solid #00ff88", color: "#00ff88", textAlign: "center", borderRadius: 4 }}>{g}</div>
          ))}
        </div>
      </div>
    </div>
  );
}