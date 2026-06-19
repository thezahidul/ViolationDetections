import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ControlPanel from "./components/ControlPanel";
import DetectionView from "./components/DetectionView";
import TrafficContextPanel from "./components/TrafficContextPanel";
import VerdictMonitor from "./components/VerdictMonitor";
import IncidentManager from "./components/IncidentManager";
import { AlertCircle, Terminal } from "lucide-react";

export default function App() {
  const [speed, setSpeed] = useState(0);
  const [frontFile, setFrontFile] = useState(null);
  const [rearFile, setRearFile] = useState(null);
  
  // Historical inspections state
  const [frontImageUrl, setFrontImageUrl] = useState(null);
  const [rearImageUrl, setRearImageUrl] = useState(null);
  const [frontDetections, setFrontDetections] = useState([]);
  const [rearDetections, setRearDetections] = useState([]);

  // Active execution results
  const [incident, setIncident] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [incidentsList, setIncidentsList] = useState([]);

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Fetch incidents list from SQLite backend
  const fetchIncidents = async () => {
    try {
      const res = await fetch("/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidentsList(data);
      } else {
        showToast("Error retrieving database logs.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Cannot connect to server. Ensure uvicorn is running.", "error");
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleExecute = async () => {
    if (!frontFile && !rearFile) {
      showToast("Optical stream missing: Upload front or rear frame.", "error");
      return;
    }

    setLoading(true);
    setHasRun(false);
    
    // Clear inspection states
    setFrontImageUrl(null);
    setRearImageUrl(null);
    setFrontDetections([]);
    setRearDetections([]);

    const formData = new FormData();
    formData.append("speed", speed);
    
    if (frontFile) {
      formData.append("front_file", frontFile);
    }
    if (rearFile) {
      formData.append("rear_file", rearFile);
    }

    try {
      const response = await fetch("/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Pipeline parsing failed.");
      }

      const result = await response.json();
      
      // Update state with result
      setIncident(result);
      setFrontDetections(result.infrastructure_detections_front);
      setRearDetections(result.infrastructure_detections_rear);
      setHasRun(true);
      showToast("AI inference completed successfully!", "success");
      
      // Refresh DB list
      fetchIncidents();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to execute pipeline.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSpeed(0);
    setFrontFile(null);
    setRearFile(null);
    setFrontImageUrl(null);
    setRearImageUrl(null);
    setFrontDetections([]);
    setRearDetections([]);
    setIncident(null);
    setHasRun(false);
    showToast("Controls and preview reset.", "success");
  };

  const handleInspectIncident = (inc) => {
    setSpeed(inc.bus_speed_kmh);
    
    // Set URLs (from backend) and clear upload file states
    setFrontImageUrl(inc.front_image_url);
    setRearImageUrl(inc.rear_image_url);
    setFrontFile(null);
    setRearFile(null);

    setFrontDetections(inc.infrastructure_detections_front);
    setRearDetections(inc.infrastructure_detections_rear);
    
    // Reconstruct incident schema for verdict & stats components
    setIncident({
      id: inc.id,
      timestamp: inc.timestamp,
      bus_speed_kmh: inc.bus_speed_kmh,
      congestion_status: inc.congestion_status,
      multi_view_context: {
        front_infrastructure_verified: inc.multi_view_context.front_infrastructure_verified,
        rear_infrastructure_verified: inc.multi_view_context.rear_infrastructure_verified,
      },
      infrastructure_detections_front: inc.infrastructure_detections_front,
      infrastructure_detections_rear: inc.infrastructure_detections_rear,
      violation_status: inc.violation_status,
      front_image_url: inc.front_image_url,
      rear_image_url: inc.rear_image_url,
      status: inc.status,
    });
    setHasRun(true);
    showToast(`Loading visual records for BUS-${inc.id}`, "success");
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const formData = new FormData();
    formData.append("action", newStatus);

    try {
      const res = await fetch(`/incidents/${id}/action`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        showToast("Enforcement status updated.", "success");
        fetchIncidents();
        
        // Update currently displayed incident status if it's the one being modified
        if (incident && incident.id === id) {
          setIncident(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        showToast("Failed to write to DB.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error updating status.", "error");
    }
  };

  const handleDeleteIncident = async (id) => {
    if (!window.confirm(`Are you sure you want to permanently purge incident BUS-${id}?`)) return;

    try {
      const res = await fetch(`/incidents/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Incident purged successfully.", "success");
        fetchIncidents();
        
        // If current inspected is deleted, reset view
        if (incident && incident.id === id) {
          handleReset();
        }
      } else {
        showToast("Failed to delete record.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error executing delete command.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-2.5 px-4.5 py-3 rounded-xl border text-sm font-semibold shadow-2xl transition-all duration-300 animate-slide-in ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-400 border-emerald-500/30 shadow-emerald-500/5"
              : "bg-red-950/90 text-red-400 border-red-500/30 shadow-red-500/5"
          }`}
        >
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          {toast.message}
        </div>
      )}

      {/* Main App Header */}
      <Header incidents={incidentsList} />

      {/* Primary Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        
        {/* Upper Dashboard: Controls */}
        <ControlPanel
          speed={speed}
          setSpeed={setSpeed}
          frontFile={frontFile}
          setFrontFile={setFrontFile}
          rearFile={rearFile}
          setRearFile={setRearFile}
          loading={loading}
          onExecute={handleExecute}
          onReset={handleReset}
        />

        {/* Mid Dashboard: Image Canvases */}
        <DetectionView
          frontFile={frontFile}
          rearFile={rearFile}
          frontImageUrl={frontImageUrl}
          rearImageUrl={rearImageUrl}
          frontDetections={frontDetections}
          rearDetections={rearDetections}
          hasRun={hasRun}
        />

        {/* Lower Dashboard: Traffic Analytics context & Enforcement Decision Banner */}
        <TrafficContextPanel
          congestionDetected={incident?.congestion_status?.traffic_congestion_detected || false}
          frontVerified={incident?.multi_view_context?.front_infrastructure_verified || false}
          rearVerified={incident?.multi_view_context?.rear_infrastructure_verified || false}
          hasRun={hasRun}
        />

        <VerdictMonitor incident={incident} hasRun={hasRun} />

        {/* Incident Database Log Manager */}
        <IncidentManager
          incidents={incidentsList}
          onInspect={handleInspectIncident}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteIncident}
          loading={loading}
        />

      </main>

      {/* Systems Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 tracking-wider font-mono">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-slate-400">
          <Terminal className="w-3.5 h-3.5" />
          <span>smart-enforcement-node-v5.0.0</span>
        </div>
        Developed by Zahidul Islam and team members | Dhaka International University Thesis
      </footer>

    </div>
  );
}
