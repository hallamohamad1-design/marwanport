import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const s = getSession();
    if (!s) navigate({ to: "/login" });
    else if (s.role === "manager") navigate({ to: "/analytics" });
    else navigate({ to: "/checkin" });
  }, [navigate]);
  return (
    <div className="sk-grid-bg" style={{ minHeight: "100vh", color: "#00d4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      INITIALIZING SKYPORT…
    </div>
  );
}
