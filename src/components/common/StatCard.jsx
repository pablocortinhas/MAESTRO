import { C } from "../../constants/colors";

export default function StatCard({ label, val, color }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${val > 0 ? color + "55" : C.bdr}`,
      borderRadius: 7,
      padding: "8px 10px",
      boxShadow: "0 1px 3px rgba(0,0,0,.05)",
    }}>
      <div style={{
        fontSize: 10, color: C.txtM,
        fontFamily: "'Rajdhani',sans-serif",
        fontWeight: 600, marginBottom: 2,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 28, fontFamily: "'Bebas Neue'",
        color: val > 0 ? color : C.bdr,
        lineHeight: 1,
      }}>
        {val}
      </div>
    </div>
  );
}
