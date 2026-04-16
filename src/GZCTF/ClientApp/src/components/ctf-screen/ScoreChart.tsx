import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp } from "lucide-react";

interface ScoreData {
  time: string;
  [teamName: string]: number | string;
}

interface ScoreChartProps {
  data: ScoreData[];
  teams: { name: string; color: string }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(4,8,16,0.95)",
        border: "1px solid rgba(0,212,255,0.4)",
        padding: "10px 14px",
        boxShadow: "0 0 20px rgba(0,212,255,0.2)",
        fontFamily: "'Courier New', monospace"
      }}>
        <p style={{ color: "rgba(0,212,255,0.7)", fontSize: "11px", marginBottom: "6px" }}>
          TIME: {label}
        </p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color, fontSize: "12px", margin: "2px 0" }}>
            {entry.name}: <span style={{ fontWeight: "bold" }}>{entry.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ScoreChart({ data, teams }: ScoreChartProps) {
  return (
    <div className="flex flex-col h-full panel-border"
      style={{
        background: "linear-gradient(135deg, rgba(0,15,30,0.95) 0%, rgba(4,8,16,0.98) 100%)",
        boxShadow: "inset 0 0 20px rgba(0,212,255,0.05)"
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(0,212,255,0.15)" }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: "#00ff88", filter: "drop-shadow(0 0 6px #00ff88)" }} />
          <span className="text-sm tracking-[0.2em] uppercase font-bold"
            style={{ color: "#00d4ff", fontFamily: "'Courier New', monospace" }}>
            积分走势
          </span>
        </div>
        <span className="text-xs" style={{ color: "rgba(0,212,255,0.4)", fontFamily: "'Courier New', monospace" }}>
          TOP 5 队伍
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,212,255,0.06)"
              horizontal={true}
              vertical={true}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 10, fontFamily: "'Courier New', monospace" }}
              axisLine={{ stroke: "rgba(0,212,255,0.2)" }}
              tickLine={{ stroke: "rgba(0,212,255,0.2)" }}
            />
            <YAxis
              tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 10, fontFamily: "'Courier New', monospace" }}
              axisLine={{ stroke: "rgba(0,212,255,0.2)" }}
              tickLine={{ stroke: "rgba(0,212,255,0.2)" }}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "11px",
                fontFamily: "'Courier New', monospace",
                paddingTop: "4px"
              }}
              formatter={(value) => <span style={{ color: "rgba(255,255,255,0.7)" }}>{value}</span>}
            />
            {teams.map((team, i) => (
              <Line
                key={team.name}
                type="monotone"
                dataKey={team.name}
                stroke={team.color}
                strokeWidth={i === 0 ? 2.5 : 1.5}
                dot={false}
                activeDot={{ r: 4, fill: team.color, stroke: "#000", strokeWidth: 1 }}
                style={{ filter: `drop-shadow(0 0 6px ${team.color}90) drop-shadow(0 0 3px ${team.color}60)` }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}