import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/checkin")({
  component: CheckInPage,
});

type Flight = {
  id: string;
  flight_no: string;
  destination: string;
  origin: string;
  departure_time: string;
  gate: string;
  terminal: string;
};

const ALLOWANCE: Record<string, number> = { Economy: 23, Business: 32, First: 40 };

function randomBP() {
  return "BP-" + Math.floor(100000 + Math.random() * 900000);
}

function CheckInPage() {
  return (
    <Layout>
      <CheckInInner />
    </Layout>
  );
}

function CheckInInner() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [passport, setPassport] = useState("");
  const [nationality, setNationality] = useState("");
  const [klass, setKlass] = useState("Economy");
  const [flightId, setFlightId] = useState("");
  const [bagCount, setBagCount] = useState(1);
  const [checked, setChecked] = useState(0);
  const [carry, setCarry] = useState(0);
  const [confirm, setConfirm] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("flights")
      .select("*")
      .order("departure_time")
      .then(({ data }) => setFlights((data as Flight[]) ?? []));
  }, []);

  const allowance = ALLOWANCE[klass] ?? 23;
  const overweightKg = Math.max(0, Number(checked) - allowance);
  const overweightFee = overweightKg * 15;
  const totalCharge = overweightFee;

  const flight = useMemo(() => flights.find((f) => f.id === flightId), [flights, flightId]);

  const submit = async () => {
    const session = getSession();
    if (!session) return;
    if (!name.trim() || !passport.trim() || !flight) {
      toast.error("Name, passport and flight required");
      return;
    }
    setLoading(true);

    // assign sequential seat by class
    const prefix = klass === "First" ? "F" : klass === "Business" ? "B" : "E";
    const max = klass === "First" ? 20 : klass === "Business" ? 40 : 140;
    const { data: existing } = await supabase
      .from("passengers")
      .select("seat")
      .eq("flight_no", flight.flight_no)
      .eq("ticket_class", klass);
    const used = new Set((existing ?? []).map((r: any) => r.seat).filter(Boolean));
    let seat = "";
    for (let i = 1; i <= max; i++) {
      const candidate = `${prefix}${i}`;
      if (!used.has(candidate)) {
        seat = candidate;
        break;
      }
    }
    if (!seat) {
      toast.error(`No ${klass} seats available on this flight`);
      setLoading(false);
      return;
    }
    const bp = randomBP();

    const row = {
      full_name: name.trim(),
      name: name.trim(),
      passport: passport.trim(),
      passport_no: passport.trim(),
      nationality: nationality.trim() || null,
      flight_no: flight.flight_no,
      flight_number: flight.flight_no,
      flight_id: flight.id,
      seat,
      seat_number: seat,
      ticket_class: klass,
      class: klass,
      bag_count: Number(bagCount),
      checked_kg: Number(checked),
      bag_weight: Number(checked),
      carry_on_kg: Number(carry),
      carry_on_weight: Number(carry),
      overweight_kg: overweightKg,
      overweight_fee: overweightFee,
      customs_charge: 0,
      total_charge: totalCharge,
      gate: flight.gate,
      terminal: flight.terminal,
      boarding_pass_no: bp,
      boarding_group: klass === "First" ? "1" : klass === "Business" ? "2" : "3",
      status: "Checked In",
      employee_name: session.full_name,
      employee_id: session.id,
    };

    const { data, error } = await supabase.from("passengers").insert(row).select().single();
    setLoading(false);
    if (error) {
      toast.error("Check-in failed: " + error.message);
      return;
    }
    setConfirm({ ...row, ...data, departure_time: flight.departure_time, destination: flight.destination });
    toast.success(`Checked in ${name} → seat ${seat}`);
    // reset
    setName("");
    setPassport("");
    setNationality("");
    setBagCount(1);
    setChecked(0);
    setCarry(0);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div className="sk-panel" style={{ padding: 20 }}>
        <h2 className="sk-heading" style={{ margin: "0 0 20px", fontSize: 16 }}>PASSENGER CHECK-IN</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label className="sk-label">NAME</label>
            <input className="sk-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="sk-label">PASSPORT NO</label>
            <input className="sk-input" value={passport} onChange={(e) => setPassport(e.target.value)} />
          </div>
          <div>
            <label className="sk-label">NATIONALITY</label>
            <input className="sk-input" value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <div>
              <label className="sk-label">CLASS</label>
              <select className="sk-input" value={klass} onChange={(e) => setKlass(e.target.value)}>
                <option>Economy</option>
                <option>Business</option>
                <option>First</option>
              </select>
            </div>
            <div>
              <label className="sk-label">FLIGHT</label>
              <select className="sk-input" value={flightId} onChange={(e) => setFlightId(e.target.value)}>
                <option value="">— SELECT FLIGHT —</option>
                {flights.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flight_no} | {f.destination} | {f.departure_time.slice(0, 5)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label className="sk-label">BAG COUNT</label>
              <input className="sk-input" type="number" min={0} value={bagCount} onChange={(e) => setBagCount(Number(e.target.value))} />
            </div>
            <div>
              <label className="sk-label">CHECKED (KG)</label>
              <input className="sk-input" type="number" min={0} step="0.1" value={checked} onChange={(e) => setChecked(Number(e.target.value))} />
            </div>
            <div>
              <label className="sk-label">CARRY-ON (KG)</label>
              <input className="sk-input" type="number" min={0} step="0.1" value={carry} onChange={(e) => setCarry(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ marginTop: 8, padding: 12, border: "1px dashed #30363d", borderRadius: 4 }}>
            <div style={{ fontSize: 11, color: "#7d8590" }}>
              Allowance: <span style={{ color: "#00d4ff" }}>{allowance} kg</span>
            </div>
            <div style={{ fontSize: 11, color: "#7d8590", marginTop: 4 }}>
              Overweight: <span style={{ color: overweightKg > 0 ? "#ffa500" : "#00ff88" }}>{overweightKg} kg</span>
            </div>
            <div style={{ fontSize: 11, color: "#7d8590", marginTop: 4 }}>
              Overweight fee: <span style={{ color: "#ffc107" }}>${overweightFee.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: 13, color: "#00ff88", marginTop: 8, fontWeight: 700 }}>
              TOTAL CHARGE: ${totalCharge.toFixed(2)}
            </div>
          </div>

          <button className="sk-btn sk-btn-primary" disabled={loading} onClick={submit} style={{ marginTop: 8, padding: 12 }}>
            {loading ? "PROCESSING..." : "CHECK IN PASSENGER"}
          </button>
        </div>
      </div>

      <div className="sk-panel" style={{ padding: 20 }}>
        <h2 className="sk-heading" style={{ margin: "0 0 20px", fontSize: 16 }}>CONFIRMATION</h2>
        {!confirm ? (
          <div style={{ color: "#7d8590", textAlign: "center", padding: 40, fontSize: 13 }}>
            Awaiting check-in submission...
          </div>
        ) : (
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            <div style={{ color: "#00ff88", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              ✓ CHECK-IN CONFIRMED
            </div>
            <Row k="PASSENGER" v={confirm.full_name} />
            <Row k="PASSPORT" v={confirm.passport} />
            <Row k="FLIGHT" v={`${confirm.flight_no} → ${confirm.destination}`} />
            <Row k="DEPARTURE" v={String(confirm.departure_time).slice(0, 5)} />
            <Row k="GATE / TERMINAL" v={`${confirm.gate} / ${confirm.terminal}`} />
            <Row k="SEAT" v={confirm.seat} highlight />
            <Row k="BOARDING PASS" v={confirm.boarding_pass_no} highlight />
            <Row k="CLASS" v={confirm.ticket_class} />
            <Row k="BAGS / CHECKED KG" v={`${confirm.bag_count} bags / ${confirm.checked_kg} kg`} />
            <Row k="CARRY-ON KG" v={`${confirm.carry_on_kg} kg`} />
            <Row k="OVERWEIGHT FEE" v={`$${Number(confirm.overweight_fee).toFixed(2)}`} />
            <Row k="TOTAL CHARGE" v={`$${Number(confirm.total_charge).toFixed(2)}`} highlight />
            <Row k="CHECKED IN BY" v={confirm.employee_name} />
            <Row k="TIMESTAMP" v={new Date().toLocaleString()} />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: any; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #30363d", padding: "4px 0" }}>
      <span style={{ color: "#7d8590", fontSize: 11, letterSpacing: "0.1em" }}>{k}</span>
      <span style={{ color: highlight ? "#00d4ff" : "#c9d1d9", fontWeight: highlight ? 700 : 400 }}>{v}</span>
    </div>
  );
}