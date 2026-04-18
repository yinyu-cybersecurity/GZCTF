import { useEffect, useState } from "react";
import { Shield, Wifi, Activity, Users, Flag, Clock } from "lucide-react";

interface HeaderProps {
  totalTeams: number;
  totalSolves: number;
  totalChallenges: number;
  eventName: string;
  endTime: Date;
}

export function CTFHeader({ totalTeams, totalSolves, totalChallenges, eventName, endTime }: HeaderProps) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const diff = endTime.getTime() - now.getTime();
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft({ h, m, s });
      } else {
        setTimeLeft({ h: 0, m: 0, s: 0 });
      }
      setTick(t => !t);
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const pad = (n: number) => String(n).padStart(2, "0");

  const timeStr = currentTime.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = currentTime.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <header className="relative flex items-center justify-between px-6 py-3 flicker"
      style={{
        background: "linear-gradient(180deg, rgba(0,20,40,0.95) 0%, rgba(4,8,16,0.95) 100%)",
        borderBottom: "1px solid rgba(0,212,255,0.3)",
        boxShadow: "0 4px 30px rgba(0,212,255,0.1)"
      }}>
      {/* Left: Logo + Event Name */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-12 h-12">
          <Shield size={40} style={{ color: "#00d4ff", filter: "drop-shadow(0 0 8px #00d4ff)" }} />
          <div className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)",
              animation: "pulse-glow 2s ease-in-out infinite"
            }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.3em] uppercase"
              style={{ color: "rgba(0,212,255,0.6)", fontFamily: "'Courier New', monospace" }}>
              CTF PLATFORM
            </span>
            <span className="pulse-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#00ff88" }} />
            <span className="text-xs" style={{ color: "#00ff88", fontFamily: "'Courier New', monospace" }}>LIVE</span>
          </div>
          <h1 className="text-xl tracking-wider uppercase"
            style={{
              color: "#fff",
              fontFamily: "'Orbitron', 'Courier New', monospace",
              fontWeight: 700,
              textShadow: "0 0 20px rgba(0,212,255,0.5), 0 0 40px rgba(0,212,255,0.2)"
            }}>
            {eventName}
          </h1>
        </div>
      </div>

      {/* Center: Stats */}
      <div className="flex items-center gap-8">
        {[
          { icon: Users, label: "队伍", value: totalTeams, color: "#00d4ff" },
          { icon: Flag, label: "解题", value: totalSolves, color: "#00ff88" },
          { icon: Activity, label: "题数", value: totalChallenges, color: "#b347ff" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center justify-center gap-0.5 px-5 py-1.5 relative text-center"
            style={{
              width: "108px",
              border: `1px solid ${color}40`,
              background: `linear-gradient(135deg, ${color}08, transparent)`,
              boxShadow: `0 0 8px ${color}30, 0 0 16px ${color}15`,
              animation: "neon-shadow-pulse 3s ease-in-out infinite",
              ['--neon-color' as string]: `${color}55`,
            }}>
            <div className="flex items-center justify-center gap-1.5 w-full">
              <Icon size={14} style={{ color }} />
              <span className="text-xs tracking-wider" style={{ color: `${color}99`, fontFamily: "'Courier New', monospace" }}>{label}</span>
            </div>
            <span className="text-2xl font-bold tabular-nums"
              style={{ color, fontFamily: "'Courier New', monospace", textShadow: `0 0 10px ${color}` }}>
              {value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Right: Countdown + Time */}
      <div className="flex items-center gap-6">
        {/* Current Time */}
        <div className="text-right">
          <div className="text-xs tracking-widest mb-0.5" style={{ color: "rgba(0,212,255,0.5)", fontFamily: "'Courier New', monospace" }}>
            {dateStr}
          </div>
          <div className="text-xl tabular-nums font-bold"
            style={{ color: "#00d4ff", fontFamily: "'Courier New', monospace", textShadow: "0 0 10px #00d4ff" }}>
            {timeStr}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12" style={{ background: "linear-gradient(to bottom, transparent, #00d4ff44, transparent)" }} />

        {/* Countdown */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <Clock size={12} style={{ color: "rgba(255,107,53,0.8)" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(255,107,53,0.8)", fontFamily: "'Courier New', monospace" }}>
              剩余时间
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[timeLeft.h, timeLeft.m, timeLeft.s].map((val, i) => (
              <span key={i} className="flex items-center">
                <span className="tabular-nums px-1.5 py-0.5"
                  style={{
                    color: "#ff6b35",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    background: "rgba(255,107,53,0.1)",
                    border: "1px solid rgba(255,107,53,0.3)",
                    textShadow: "0 0 10px #ff6b35",
                    boxShadow: "0 0 8px rgba(255,107,53,0.2)"
                  }}>
                  {pad(val)}
                </span>
                {i < 2 && (
                  <span className="mx-0.5 font-bold"
                    style={{ color: tick ? "#ff6b35" : "rgba(255,107,53,0.2)", fontFamily: "'Courier New', monospace", fontSize: "1.2rem" }}>
                    :
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Signal bars */}
        <div className="flex items-end gap-0.5 h-8">
          <Wifi size={20} style={{ color: "#00ff88", filter: "drop-shadow(0 0 6px #00ff88)", alignSelf: "center" }} />
        </div>
      </div>
    </header>
  );
}
