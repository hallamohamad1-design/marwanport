import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/analytics")({
  component: () => <Layout><AnalyticsPage /></Layout>,
});

function AnalyticsPage() {
  const [stats, setStats] = useState({ total: 0, ow: 0, customs: 0, complaints: 0, openCounters: 0 });
  const [perFlight, setPerFlight] = useState<any[]>([]);
  const [byStatus, setByStatus] = useState<any[]>([]);
  const [topEmp, setTopEmp] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const iso = start.toISOString();
      const { data: pax } = await supabase.from("passengers").select("flight_no,overweight_fee,customs_charge,employee_name,checked_in_at").gte("checked_in_at", iso);
      const { data: comp } = await supabase.from("complaints").select("status,created_at").gte("created_at", iso);
      const { data: counters } = await supabase.from("counters").select("status");
      const total = pax?.length ?? 0;
      const ow = (pax ?? []).reduce((s: number, p: any) => s + Number(p.overweight_fee || 0), 0);
      const customs = (pax ?? []).reduce((s: number, p: any) => s + Number(p.customs_charge || 0), 0);
      const openCounters = (counters ?? []).filter((c: any) => c.status === "Open").length;
      setStats({ total, ow, customs, complaints: comp?.length ?? 0, openCounters });
      const fm: Record<string, number> = {};
      (pax ?? []).forEach((p: any) => { if (p.flight_no) fm[p.flight_no] = (fm[p.flight_no] || 0) + 1; });
      setPerFlight(Object.entries(fm).map(([flight, count]) => ({ flight, count })));
      const sm: Record<string, number> = {};
      (comp ?? []).forEach((c: any) => { sm[c.status] = (sm[c.status] || 0) + 1; });
      setByStatus(Object.entries(sm).map(([name, value]) => ({ name, value })));
      const em: Record<string, number> = {};
      (pax ?? []).forEach((p: any) => { if (p.employee_name) em[p.employee_name] = (em[p.employee_name] || 0) + 1; });
      setTopEmp(Object.entries(em).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count).slice(0, 5));
    };
    load();
    const ch = supabase.channel("analytics").on("postgres_changes", { event: "*", schema: "public", table: "passengers" }, load).on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, load).on("postgres_changes", { event: "*", schema: "public", table: "counters" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const COLORS = ["#ffa500", "#00d4ff", "#00ff88", "#ff4444"];

  return (
    <div>
      <h1 className="sk-heading" style={{ fontSize: 18, marginTop: 0 }}>ANALYTICS — TODAY</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Stat label="PASSENGERS" value={stats.total} />
        <Stat label="OVERWEIGHT REV." value={`$${stats.ow.toFixed(2)}`} />
        <Stat label="CUSTOMS REV." value={`$${stats.customs.toFixed(2)}`} />
        <Stat label="COMPLAINTS" value={stats.complaints} />
        <Stat label="OPEN COUNTERS" value={stats.openCounters} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="sk-panel" style={{ padding: 16 }}>
          <h3 className="sk-heading" style={{ margin: "0 0 12px", fontSize: 14 }}>PASSENGERS PER FLIGHT</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={perFlight}>
                <XAxis dataKey="flight" stroke="#7d8590" />
                <YAxis stroke="#7d8590" />
                <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #30363d" }} />
                <Bar dataKey="count" fill="#00d4ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="sk-panel" style={{ padding: 16 }}>
          <h3 className="sk-heading" style={{ margin: "0 0 12px", fontSize: 14 }}>COMPLAINTS BY STATUS</h3>
          <div style={{ height: 280 }}>
            {byStatus.length === 0 ? <div style={{ color: "#7d8590", textAlign: "center", paddingTop: 100 }}>No complaints today</div> :
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #30363d" }} />
                </PieChart>
              </ResponsiveContainer>}
          </div>
        </div>
      </div>
      <div className="sk-panel" style={{ padding: 16, marginTop: 16 }}>
        <h3 className="sk-heading" style={{ margin: "0 0 12px", fontSize: 14 }}>TOP 5 EMPLOYEES BY CHECK-INS</h3>
        {topEmp.length === 0 ? <div style={{ color: "#7d8590" }}>No check-ins today</div> :
          <table className="sk-table">
            <thead><tr><th>RANK</th><th>EMPLOYEE</th><th>CHECK-INS</th></tr></thead>
            <tbody>{topEmp.map((e, i) => <tr key={e.name}><td>#{i + 1}</td><td>{e.name}</td><td style={{ color: "#00d4ff", fontWeight: 700 }}>{e.count}</td></tr>)}</tbody>
          </table>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="sk-panel" style={{ padding: 16 }}>
      <div style={{ color: "#7d8590", fontSize: 11, letterSpacing: "0.1em" }}>{label}</div>
      <div style={{ color: "#00d4ff", fontSize: 26, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}