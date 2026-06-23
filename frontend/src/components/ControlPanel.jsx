import React, { useRef } from "react";
import { UploadCloud, RotateCcw, Play } from "lucide-react";

export default function ControlPanel({
  speed,
  setSpeed,
  frontFile,
  setFrontFile,
  rearFile,
  setRearFile,
  loading,
  onExecute,
  onReset,
}) {
  const frontInputRef = useRef(null);
  const rearInputRef = useRef(null);

  const handleSpeedChange = (val) => {
    const num = Math.min(80, Math.max(0, parseFloat(val) || 0));
    setSpeed(num);
  };

  const handleFrontDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFrontFile(e.dataTransfer.files[0]);
    }
  };

  const handleRearDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setRearFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-lg font-bold font-mono tracking-wide text-slate-200 mb-6 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        LIVE INGESTION CONTROL PANEL
      </h2>

      {/* Speed input telemetry slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-400 tracking-wide">
            🚌 Instantaneous Bus Speed
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={speed}
              onChange={(e) => handleSpeedChange(e.target.value)}
              className="w-16 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2 py-1 text-center text-sm font-mono font-bold text-emerald-400 focus:outline-none"
              min="0"
              max="80"
              disabled={loading}
            />
            <span className="text-xs font-mono text-slate-500">km/h</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="80"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="flex-1 accent-emerald-500 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer"
            disabled={loading}
          />
          <span className="text-xs font-mono text-slate-400 w-12 text-right">{speed.toFixed(1)} km/h</span>
        </div>
      </div>

      {/* Camera upload zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Front Camera Node */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFrontDrop}
          onClick={() => frontInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            frontFile
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
          }`}
        >
          <input
            type="file"
            ref={frontInputRef}
            onChange={(e) => e.target.files?.[0] && setFrontFile(e.target.files[0])}
            accept="image/*"
            className="hidden"
            disabled={loading}
          />
          
          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-xs font-bold font-mono text-slate-400">CAMERA LENS: FRONT</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono tracking-wider ${
                frontFile
                  ? "bg-emerald-500/20 text-emerald-400 animate-pulse"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {frontFile ? "ACTIVE" : "STANDBY"}
            </span>
          </div>

          {frontFile ? (
            <div className="relative group w-full h-32 rounded-lg overflow-hidden border border-emerald-500/30">
              <img
                src={URL.createObjectURL(frontFile)}
                alt="Front camera view"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <p className="text-xs text-slate-300 font-semibold">Change Frame</p>
              </div>
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-slate-500 mb-2.5" />
              <p className="text-sm font-semibold text-slate-300">Front Camera Frame</p>
              <p className="text-xs text-slate-500 mt-1">Drag & drop or click to upload</p>
            </div>
          )}
        </div>

        {/* Rear Camera Node */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleRearDrop}
          onClick={() => rearInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            rearFile
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
          }`}
        >
          <input
            type="file"
            ref={rearInputRef}
            onChange={(e) => e.target.files?.[0] && setRearFile(e.target.files[0])}
            accept="image/*"
            className="hidden"
            disabled={loading}
          />

          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-xs font-bold font-mono text-slate-400">CAMERA LENS: REAR</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono tracking-wider ${
                rearFile
                  ? "bg-emerald-500/20 text-emerald-400 animate-pulse"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {rearFile ? "ACTIVE" : "STANDBY"}
            </span>
          </div>

          {rearFile ? (
            <div className="relative group w-full h-32 rounded-lg overflow-hidden border border-emerald-500/30">
              <img
                src={URL.createObjectURL(rearFile)}
                alt="Rear camera view"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <p className="text-xs text-slate-300 font-semibold">Change Frame</p>
              </div>
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-slate-500 mb-2.5" />
              <p className="text-sm font-semibold text-slate-300">Rear Camera Frame</p>
              <p className="text-xs text-slate-500 mt-1">Drag & drop or click to upload</p>
            </div>
          )}
        </div>

      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onReset}
          disabled={loading}
          className="flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950 text-slate-300 px-5 py-3 rounded-xl cursor-pointer font-semibold transition-all duration-200 disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <button
          onClick={onExecute}
          disabled={loading || (!frontFile && !rearFile)}
          className={`flex-1 flex items-center justify-center gap-2 text-white font-bold px-6 py-3 rounded-xl cursor-pointer transition-all duration-200 shadow-md ${
            loading
              ? "bg-slate-800"
              : !frontFile && !rearFile
              ? "bg-slate-800/50 text-slate-500 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 active:translate-y-0 shadow-emerald-500/10"
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Play className="w-4.5 h-4.5 fill-current" />
          )}
          ⚡ Execute Pipeline
        </button>
      </div>
    </div>
  );
}
