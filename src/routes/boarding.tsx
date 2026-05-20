import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { PriorityQueue } from "@/lib/priority-queue";

export const Route = createFileRoute("/boarding")({
  component: () => (
    <Layout>
      <BoardingPage />
    </Layout>
  ),
});

type Passenger = {
  id: string;
  full_name: string | null;
  seat: string | null;
  passport: string | null;
  ticket_class: string | null;
  flight_no: string | null;
  status: string | null;
  checked_in_at: string | null;
};

type BoardedEntry = {
  passengerId: string;
  name: string;
  flight: string;
  seat: string | null;
  ticket_class: string | null;
  at: string;
};

const priorityFor = (cls: string | null | undefined): number =>
  cls === "First" ? 1 : cls === "Business" ? 2 : 3;

const classMeta = (cls: string | null | undefined) => {
  if (cls === "First") return { label: "FIRST CLASS", icon: "🥇", border: "#fbbf24", badge: "sk-badge sk-badge-gold", p: "P1" };
  if (cls === "Business") return { label: "BUSINESS CLASS", icon: "💼", border: "#00d4ff", badge: "sk-badge sk-badge-cyan", p: "P2" };
  return { label: "ECONOMY CLASS", icon: "🎫", border: "#6b7280", badge: "sk-badge", p: "P3" };
};

function buildQueue(passengers: Passenger[]): PriorityQueue<Passenger> {
  const sorted = [...passengers].sort(
    (a, b) =>
      new Date(a.checked_in_at ?? 0).getTime() - new Date(b.checked_in_at ?? 0).getTime(),
  );
  const pq = new PriorityQueue<Passenger>();
  sorted.forEach((p) => pq.enqueue(p, priorityFor(p.ticket_class)));
  return pq;
}

function BoardingPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [flightNo, setFlightNo] = useState("");
  const [queueItems, setQueueItems] = useState<Passenger[]>([]);
  const [history, setHistory] = useState<BoardedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const pqRef = useRef<PriorityQueue<Passenger>>(new PriorityQueue<Passenger>());

  useEffect(() => {
    supabase
      .from("flights")
      .select("*")
      .order("departure_time")
      .then(({ data }) => setFlights(data ?? []));
  }, []);

  const refreshFromState = () => {
    setQueueItems(pqRef.current.toSortedArray());
  };

  const persistState = async (boardedHistory: BoardedEntry[]) => {
    const remaining = pqRef.current.toSortedArray().map((p) => ({
      id: p.id,
      flight_no: p.flight_no,
      ticket_class: p.ticket_class,
      checked_in_at: p.checked_in_at,
    }));
    const { data: existing } = await supabase
      .from("boarding_state")
      .select("payload")
      .eq("id", 1)
      .maybeSingle();
    const payload: any = existing?.payload ?? { stacks: {}, queues: {}, boardedHistory: [] };
    payload.queues = { ...(payload.queues ?? {}), [flightNo]: remaining };
    payload.boardedHistory = boardedHistory;
    if (existing) {
      await supabase
        .from("boarding_state")
        .update({ payload, updated_at: new Date().toISOString() })
        .eq("id", 1);
    } else {
      await supabase.from("boarding_state").insert({ id: 1, payload });
    }
  };

  useEffect(() => {
    if (!flightNo) {
      pqRef.current = new PriorityQueue<Passenger>();
      setQueueItems([]);
      setHistory([]);
      return;
    }
    const load = async () => {
      setLoading(true);
      const { data: pax } = await supabase
        .from("passengers")
        .select("*")
        .eq("flight_no", flightNo);
      const checkedIn = (pax ?? []).filter((p: any) => p.status === "Checked In") as Passenger[];
      pqRef.current = buildQueue(checkedIn);
      refreshFromState();

      const { data: bs } = await supabase
        .from("boarding_state")
        .select("payload")
        .eq("id", 1)
        .maybeSingle();
      const allHist: BoardedEntry[] = (bs?.payload as any)?.boardedHistory ?? [];
      setHistory(allHist.filter((h) => h.flight === flightNo));
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel(`boarding-pax-${flightNo}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "passengers", filter: `flight_no=eq.${flightNo}` },
        (payload) => {
          const p = payload.new as Passenger;
          if (p.status === "Checked In") {
            pqRef.current.enqueue(p, priorityFor(p.ticket_class));
            refreshFromState();
            toast.info(`Late check-in queued: ${p.full_name}`);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightNo]);

  const boardNext = async () => {
    const next = pqRef.current.peek();
    if (!next) {
      toast.error("Queue is empty");
      return;
    }
    pqRef.current.dequeue();
    refreshFromState();

    const { error } = await supabase
      .from("passengers")
      .update({ status: "Boarded" })
      .eq("id", next.id);
    if (error) {
      toast.error(error.message);
      // re-enqueue on failure
      pqRef.current.enqueue(next, priorityFor(next.ticket_class));
      refreshFromState();
      return;
    }
    const entry: BoardedEntry = {
      passengerId: next.id,
      name: next.full_name ?? "—",
      flight: next.flight_no ?? flightNo,
      seat: next.seat,
      ticket_class: next.ticket_class,
      at: new Date().toISOString(),
    };
    const newHist = [...history, entry];
    setHistory(newHist);

    const { data: bs } = await supabase
      .from("boarding_state")
      .select("payload")
      .eq("id", 1)
      .maybeSingle();
    const allHist: BoardedEntry[] = (bs?.payload as any)?.boardedHistory ?? [];
    await persistState([...allHist, entry]);
    toast.success(`Boarded ${entry.name} (${classMeta(entry.ticket_class).p})`);
  };

  const peek = queueItems[0] ?? null;
  const grouped = useMemo(() => {
    const g: Record<1 | 2 | 3, Passenger[]> = { 1: [], 2: [], 3: [] };
    queueItems.forEach((p) => g[priorityFor(p.ticket_class) as 1 | 2 | 3].push(p));
    return g;
  }, [queueItems]);

  const total = queueItems.length + history.length;
  const boarded = history.length;
  const pct = total ? Math.round((boarded / total) * 100) : 0;

  return (
    <div>
      <h1 className="sk-heading" style={{ fontSize: 18, marginTop: 0 }}>BOARDING CONTROL — PRIORITY QUEUE</h1>

      <div className="sk-panel" style={{ padding: 16, marginBottom: 16 }}>
        <label className="sk-label">FLIGHT</label>
        <select
          className="sk-input"
          value={flightNo}
          onChange={(e) => setFlightNo(e.target.value)}
          style={{ maxWidth: 380 }}
        >
          <option value="">— SELECT FLIGHT —</option>
          {flights.map((f) => (
            <option key={f.id} value={f.flight_no}>
              {f.flight_no} | {f.destination}
            </option>
          ))}
        </select>
      </div>

      {!flightNo && (
        <div className="sk-panel" style={{ padding: 24, color: "#7d8590", textAlign: "center" }}>
          Select a flight to build the priority queue
        </div>
      )}

      {flightNo && loading && (
        <div className="sk-panel" style={{ padding: 24, color: "#7d8590", textAlign: "center" }}>
          Loading queue…
        </div>
      )}

      {flightNo && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          {/* LEFT: QUEUE */}
          <div className="sk-panel" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 className="sk-heading" style={{ fontSize: 14, margin: 0 }}>PRIORITY QUEUE</h2>
              <span className="sk-badge sk-badge-cyan">SIZE {queueItems.length}</span>
            </div>

            {([1, 2, 3] as const).map((prio) => {
              const meta = classMeta(prio === 1 ? "First" : prio === 2 ? "Business" : "Economy");
              const list = grouped[prio];
              return (
                <div key={prio} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px dashed ${meta.border}55`, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{meta.icon}</span>
                    <span className="sk-heading" style={{ fontSize: 12, color: meta.border }}>{meta.label}</span>
                    <span className="sk-badge" style={{ borderColor: meta.border, color: meta.border, border: `1px solid ${meta.border}` }}>{meta.p}</span>
                    <span style={{ marginLeft: "auto", color: "#7d8590", fontSize: 11 }}>{list.length} waiting</span>
                  </div>
                  {list.length === 0 ? (
                    <div style={{ color: "#4b5563", fontSize: 12, fontStyle: "italic", padding: "4px 2px" }}>— empty —</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                      <AnimatePresence initial={true}>
                        {list.map((p, idx) => {
                          const isPeek = peek?.id === p.id;
                          return (
                            <motion.div
                              key={p.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 80 }}
                              transition={{ duration: 0.25, delay: idx * 0.03 }}
                              className={isPeek ? "sk-glow-cyan" : ""}
                              style={{
                                padding: 10,
                                borderRadius: 8,
                                background: "#0d1117",
                                border: `1px solid ${meta.border}66`,
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ color: "#c9d1d9", fontWeight: 700, fontSize: 13 }}>{p.full_name}</span>
                                <span className="sk-badge" style={{ border: `1px solid ${meta.border}`, color: meta.border }}>{meta.p}</span>
                              </div>
                              <div style={{ color: "#7d8590", fontSize: 11, marginTop: 4 }}>
                                Seat <span style={{ color: "#00d4ff" }}>{p.seat}</span> · {p.passport}
                              </div>
                              <div style={{ color: "#6b7280", fontSize: 10, marginTop: 2 }}>{meta.label}</div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT: CONTROL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="sk-panel" style={{ padding: 16 }}>
              <h2 className="sk-heading" style={{ fontSize: 14, margin: "0 0 10px" }}>NEXT TO BOARD</h2>
              {peek ? (
                <motion.div
                  key={peek.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="sk-glow-cyan"
                  style={{ padding: 14, borderRadius: 10, background: "#0d1117", border: "1px solid #00d4ff" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#c9d1d9", fontWeight: 700, fontSize: 16 }}>{peek.full_name}</span>
                    <span className={classMeta(peek.ticket_class).badge}>{classMeta(peek.ticket_class).p}</span>
                  </div>
                  <div style={{ color: "#7d8590", fontSize: 12, marginTop: 6 }}>
                    {classMeta(peek.ticket_class).label} · Seat <span style={{ color: "#00d4ff" }}>{peek.seat}</span>
                  </div>
                </motion.div>
              ) : (
                <div style={{ color: "#7d8590", padding: 14, textAlign: "center" }}>Queue empty — all boarded</div>
              )}
              <button
                className="sk-btn sk-btn-primary"
                onClick={boardNext}
                disabled={!peek}
                style={{ width: "100%", marginTop: 12 }}
              >
                BOARD NEXT PASSENGER
              </button>

              <div style={{ marginTop: 14 }}>
                <div style={{ height: 10, background: "#0d1117", borderRadius: 4, overflow: "hidden" }}>
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                    style={{ height: "100%", background: "linear-gradient(90deg,#00d4ff,#00ff88)" }}
                  />
                </div>
                <div style={{ marginTop: 6, color: "#7d8590", fontSize: 12 }}>
                  {boarded} / {total} boarded ({pct}%)
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
                {([1, 2, 3] as const).map((prio) => {
                  const meta = classMeta(prio === 1 ? "First" : prio === 2 ? "Business" : "Economy");
                  return (
                    <div key={prio} style={{ padding: 10, borderRadius: 8, background: "#0d1117", border: `1px solid ${meta.border}55`, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: meta.border, fontWeight: 700 }}>{meta.icon} {meta.p}</div>
                      <div style={{ fontSize: 18, color: "#c9d1d9", fontWeight: 800 }}>{grouped[prio].length}</div>
                      <div style={{ fontSize: 10, color: "#7d8590" }}>remaining</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sk-panel" style={{ padding: 16 }}>
              <h2 className="sk-heading" style={{ fontSize: 14, margin: "0 0 10px" }}>BOARDED HISTORY</h2>
              {history.length === 0 ? (
                <div style={{ color: "#7d8590", fontSize: 12, textAlign: "center", padding: 8 }}>No passengers boarded yet</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
                  <AnimatePresence initial={false}>
                    {history.map((h, i) => {
                      const meta = classMeta(h.ticket_class);
                      return (
                        <motion.div
                          key={h.passengerId + h.at}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: 8,
                            borderRadius: 6,
                            background: "#0d1117",
                            border: "1px solid #1f2937",
                          }}
                        >
                          <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 12, minWidth: 32 }}>#{i + 1}</span>
                          <span style={{ color: "#c9d1d9", fontSize: 13, fontWeight: 600, flex: 1 }}>{h.name}</span>
                          <span className={meta.badge}>{meta.p}</span>
                          <span style={{ color: "#7d8590", fontSize: 11 }}>{h.seat}</span>
                          <span style={{ color: "#6b7280", fontSize: 10 }}>{new Date(h.at).toLocaleTimeString()}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}