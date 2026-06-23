import React from "react";
import { Shield, AlertTriangle, CheckCircle, Database } from "lucide-react";

export default function Header({ incidents }) {
  const totalViolations = incidents.filter(inc => inc.violation_status.is_violation).length;
  const totalCompliant = incidents.filter(inc => !inc.violation_status.is_violation).length;
  const pendingCitations = incidents.filter(inc => inc.status === "Pending Review").length;

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-slate-100 m-0">
              SMART BUS STOP ENFORCEMENT
            </h1>
            <p className="text-xs text-slate-400 font-sans tracking-wide">
              Smart City Automated Traffic Infraction Detection Pipeline
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Violations Counter */}
          <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 hover:border-red-500/40 transition-colors duration-200">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Violations</div>
              <div className="text-base font-bold font-mono text-slate-200 leading-none mt-0.5">{totalViolations}</div>
            </div>
          </div>

          {/* Compliant Counter */}
          <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 hover:border-emerald-500/40 transition-colors duration-200">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Compliant</div>
              <div className="text-base font-bold font-mono text-slate-200 leading-none mt-0.5">{totalCompliant}</div>
            </div>
          </div>

          {/* Database Counter */}
          <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 hover:border-sky-500/40 transition-colors duration-200">
            <Database className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pending Citations</div>
              <div className="text-base font-bold font-mono text-slate-200 leading-none mt-0.5">{pendingCitations}</div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
