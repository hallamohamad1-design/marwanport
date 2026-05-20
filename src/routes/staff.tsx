import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/staff")({
  component: () => <Layout><StaffPage /></Layout>,
});

function StaffPage() {
  const session = getSession();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase.from("employees").select("id,full_name,username,role,created_at").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const del = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from("employees").delete().eq("id", confirmDelete.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
    setConfirmDelete(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 className="sk-heading" style={{ fontSize: 18, margin: 0 }}>STAFF ACCOUNTS</h1>
        <button className="sk-btn sk-btn-primary" onClick={() => setOpen(true)}>+ ADD STAFF</button>
      </div>
      <div className="sk-panel" style={{ padding: 16 }}>
        <table className="sk-table">
          <thead><tr><th>FULL NAME</th><th>USERNAME</th><th>ROLE</th><th>CREATED</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td style={{ color: "#00d4ff" }}>{r.username}</td>
                <td><span className={`sk-badge ${r.role === "manager" ? "sk-badge-gold" : "sk-badge-cyan"}`}>{r.role}</span></td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  {r.id !== session?.id && (
                    <button className="sk-btn sk-btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setConfirmDelete(r)}>DELETE</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && <AddModal onClose={() => { setOpen(false); load(); }} />}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} className="sk-panel" style={{ padding: 24, width: 380 }}>
            <h3 className="sk-heading" style={{ marginTop: 0 }}>CONFIRM DELETE</h3>
            <div style={{ color: "#c9d1d9" }}>Delete <b style={{ color: "#ff4444" }}>{confirmDelete.full_name}</b>?</div>
            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="sk-btn" onClick={() => setConfirmDelete(null)}>CANCEL</button>
              <button className="sk-btn sk-btn-danger" onClick={del}>DELETE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddModal({ onClose }: { onClose: () => void }) {
  const [fn, setFn] = useState("");
  const [un, setUn] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState("employee");
  const save = async () => {
    if (!fn.trim() || !un.trim() || !pw) { toast.error("All fields required"); return; }
    const { error } = await supabase.from("employees").insert({ full_name: fn.trim(), username: un.trim(), password: pw, role });
    if (error) { toast.error(error.message); return; }
    toast.success("Staff added");
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} className="sk-panel" style={{ padding: 24, width: 420 }}>
        <h3 className="sk-heading" style={{ marginTop: 0 }}>ADD STAFF</h3>
        <label className="sk-label">FULL NAME</label>
        <input className="sk-input" value={fn} onChange={(e) => setFn(e.target.value)} />
        <div style={{ height: 10 }} />
        <label className="sk-label">USERNAME</label>
        <input className="sk-input" value={un} onChange={(e) => setUn(e.target.value)} />
        <div style={{ height: 10 }} />
        <label className="sk-label">PASSWORD</label>
        <input className="sk-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <div style={{ height: 10 }} />
        <label className="sk-label">ROLE</label>
        <select className="sk-input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="employee">employee</option>
          <option value="manager">manager</option>
        </select>
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="sk-btn" onClick={onClose}>CANCEL</button>
          <button className="sk-btn sk-btn-primary" onClick={save}>CREATE</button>
        </div>
      </div>
    </div>
  );
}