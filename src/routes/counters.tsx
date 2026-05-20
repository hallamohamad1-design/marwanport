import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/counters")({
  component: () => <Layout><CountersPage /></Layout>,
});

function CountersPage() {
  const session = getSession();
  const isManager = session?.role === "manager";
  const [counters, setCounters] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("counters").select("*").order("counter_no");
      setCounters(data ?? []);
    };
    load();
    supabase.from("employees").select("id,full_name").then(({ data }) => setEmployees(data ?? []));
    supabase.from("flights").select("id,flight_no,destination").then(({ data }) => setFlights(data ?? []));
    const ch = supabase.channel("counters-rt").on("postgres_changes", { event: "*", schema: "public", table: "counters" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const close = async (c: any) => {
    const { error } = await supabase.from("counters").update({ status: "Closed", flight_no: null, employee_name: null, updated_at: new Date().toISOString() }).eq("id", c.id);
    if (error) toast.error(error.message); else toast.success(`${c.counter_no} closed`);
  };

  return (
    <div>
      <h1 className="sk-heading" style={{ fontSize: 18, marginTop: 0 }}>CHECK-IN COUNTERS</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {counters.map((c) => (
          <div key={c.id} className="sk-panel" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#00d4ff", fontWeight: 700, fontSize: 18 }}>{c.counter_no}</span>
              <span className={`sk-badge ${c.status === "Open" ? "sk-badge-green" : "sk-badge-red"}`}>{c.status}</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#7d8590" }}>EMPLOYEE</div>
            <div style={{ color: "#c9d1d9" }}>{c.employee_name || "—"}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#7d8590" }}>FLIGHT</div>
            <div style={{ color: "#c9d1d9" }}>{c.flight_no || "—"}</div>
            {isManager && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="sk-btn" onClick={() => setEditing(c)}>ASSIGN</button>
                {c.status === "Open" && <button className="sk-btn sk-btn-danger" onClick={() => close(c)}>CLOSE</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <AssignModal
          counter={editing}
          employees={employees}
          flights={flights}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function AssignModal({ counter, employees, flights, onClose }: any) {
  const [emp, setEmp] = useState(counter.employee_name || "");
  const [fl, setFl] = useState(counter.flight_no || "");
  const save = async () => {
    if (!emp || !fl) { toast.error("Select employee and flight"); return; }
    const { error } = await supabase.from("counters").update({
      employee_name: emp, flight_no: fl, status: "Open", updated_at: new Date().toISOString(),
    }).eq("id", counter.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${counter.counter_no} opened`);
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} className="sk-panel" style={{ padding: 24, width: 420 }}>
        <h3 className="sk-heading" style={{ marginTop: 0 }}>ASSIGN {counter.counter_no}</h3>
        <label className="sk-label">EMPLOYEE</label>
        <select className="sk-input" value={emp} onChange={(e) => setEmp(e.target.value)}>
          <option value="">— SELECT —</option>
          {employees.map((e: any) => <option key={e.id} value={e.full_name}>{e.full_name}</option>)}
        </select>
        <div style={{ height: 12 }} />
        <label className="sk-label">FLIGHT</label>
        <select className="sk-input" value={fl} onChange={(e) => setFl(e.target.value)}>
          <option value="">— SELECT —</option>
          {flights.map((f: any) => <option key={f.id} value={f.flight_no}>{f.flight_no} | {f.destination}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="sk-btn" onClick={onClose}>CANCEL</button>
          <button className="sk-btn sk-btn-primary" onClick={save}>OPEN COUNTER</button>
        </div>
      </div>
    </div>
  );
}