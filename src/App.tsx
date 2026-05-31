import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Sliders,
  Cpu,
  FileText,
  Activity,
  Sparkles,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Search,
  Gauge,
  Layers,
  Compass,
  BookOpen,
  Heart,
  Info,
  ChevronRight,
  X,
  HelpCircle,
  RefreshCw,
  Eye,
  ZoomIn
} from "lucide-react";
import XRaySvg from "./components/XRaySvg";
import FastAiSimulator from "./components/FastAiSimulator";
import { XRayDiagnosis, ConditionType, BoundingBox, MarkerPoint } from "./types";

// High-fidelity standard preloaded clinical cases
const PRELOADED_CASES: Record<"NORMAL" | "BACTERIAL_PNEUMONIA" | "VIRAL_PNEUMONIA", XRayDiagnosis> = {
  NORMAL: {
    condition: "NORMAL",
    confidence: 0.98,
    severity: "None",
    findings: "The lungs are clear and normally inflated. There are no focal consolidations, mass-like structures, or suspicious pleural effusions. Pulmonary vascular markings distribution is entirely normal, tapering normally to the periphery. The heart configuration is of physiological shape and size with a cardiothoracic ratio strictly less than 0.50. Both diaphragmatic leaflets exhibit normal dome configuration. Costophrenic recesses are sharp and free of blunting. High-pass filter testing confirms absence of airspace infiltrates.",
    detectedRegions: [],
    markers: [
      { label: "Normal Left Lung Field", x: 65, y: 45 },
      { label: "Normal Right Lung Field", x: 35, y: 45 },
      { label: "Physiological Aortic Stripe", "x": 48, "y": 38 }
    ],
    anatomicalReport: {
      pleuralEffusion: "Absent bilaterally",
      diaphragmShape: "Normal dome-shaped, fully intact bilateral costophrenic recesses",
      cardiacSize: "Within normal physiological limits (CTR ~0.46)",
      mediastinum: "Centralised, trachea midline, hila stable"
    }
  },
  BACTERIAL_PNEUMONIA: {
    condition: "BACTERIAL_PNEUMONIA",
    confidence: 0.94,
    severity: "Moderate",
    findings: "Preloaded clinical plate displays highly defined, localized lobar opacification and consolidation in the middle and lower right lung zones (anatomical right, corresponding to the left side of the visual field). High-pass radiographic filters emphasize distinct lucent air bronchogram shadows (air-filled bronchial tubes visible against the dense water-density fluid filling the adjacent alveoli). Left lung volume and transparency are well within physiological specifications. Cardiomediastinal silhouette and costophrenic recesses are clear of visible anomalies.",
    detectedRegions: [
      { name: "Slight Lobar Consolidation Zone", x: 18, y: 55, width: 26, height: 28 }
    ],
    markers: [
      { label: "Lobar consolidation density", x: 30, y: 66 },
      { label: "Visible Air Bronchograms", x: 25, y: 60 }
    ],
    anatomicalReport: {
      pleuralEffusion: "Absent",
      diaphragmShape: "Right costophrenic margin obscured by localized consolidation",
      cardiacSize: "Normal cardiothoracic index",
      mediastinum: "Centered tracheal position, no deviation"
    }
  },
  VIRAL_PNEUMONIA: {
    condition: "VIRAL_PNEUMONIA",
    confidence: 0.89,
    severity: "Moderate",
    findings: "Chest radiograph exhibits bilateral, diffuse, patchy interstitial infiltrates and symmetrical opacity distribution. Bronchovascular wall thickening is highly prominent with peribronchial cuffing around the hila bilaterally. General lung fields show mild hyperinflation with slight flattening of the diaphragmatic sheets, typical of viral broncho-pulmonary viral infections. No massive localized focal airspace consolidations are present, which distinguishes this condition from bacterial etiologies. Costophrenic recesses remain clear of major effusions.",
    detectedRegions: [
      { name: "Bilateral Interstitial Opacity (L)", x: 16, y: 35, width: 24, height: 40 },
      { name: "Bilateral Interstitial Opacity (R)", x: 58, y: 32, width: 24, height: 45 }
    ],
    markers: [
      { label: "Diffuse interstitial infiltration", x: 68, y: 48 },
      { label: "Peribronchial thickening", x: 32, y: 40 },
      { label: "Flattened diaphragm outline", x: 50, y: 88 }
    ],
    anatomicalReport: {
      pleuralEffusion: "Absent / Normal costophrenic recesses",
      diaphragmShape: "Bilateral flattening mirroring secondary hyperinflation state",
      cardiacSize: "Normal vertical heart configuration",
      mediastinum: "Symmetrical central structures, trachea midline"
    }
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"workspace" | "fastai">("workspace");
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [checkingApi, setCheckingApi] = useState<boolean>(true);

  // Active configuration case loaded in workspace
  const [activeCaseType, setActiveCaseType] = useState<"NORMAL" | "BACTERIAL_PNEUMONIA" | "VIRAL_PNEUMONIA" | "CUSTOM">("NORMAL");
  const [activeDiagnosis, setActiveDiagnosis] = useState<XRayDiagnosis>(PRELOADED_CASES.NORMAL);

  // DICOM workstation image tuning sliders
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invertColors, setInvertColors] = useState<boolean>(false);
  const [boneEnhancement, setBoneEnhancement] = useState<boolean>(false);

  // Custom upload records
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customDataUrl, setCustomDataUrl] = useState<string>("");
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [serverFallbackActive, setServerFallbackActive] = useState<boolean>(false);

  // Interactive mouse click tracking over X-ray plate
  const [clickedCoords, setClickedCoords] = useState<{ x: number, y: number } | null>(null);
  const [hoverRegionLabel, setHoverRegionLabel] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API keys status on mount
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(data.hasApiKey);
        setCheckingApi(false);
      })
      .catch((err) => {
        console.error("Error reading API config:", err);
        setCheckingApi(false);
      });
  }, []);

  // Handle preset selector click
  const handleCaseSelect = (type: "NORMAL" | "BACTERIAL_PNEUMONIA" | "VIRAL_PNEUMONIA") => {
    setActiveCaseType(type);
    setActiveDiagnosis(PRELOADED_CASES[type]);
    setClickedCoords(null);
    setHoverRegionLabel(null);
    setUploadError(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Process the dropped file
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  // Convert client file, load preview, and trigger server-side Gemini analysis
  const processAndUploadFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Diagnostics invalid. Please select standard radiographic image files (JPEG, PNG).");
      return;
    }

    setCustomFile(file);
    setUploadLoading(true);
    setUploadError(null);
    setServerFallbackActive(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      setCustomDataUrl(base64Url);
      setActiveCaseType("CUSTOM");
      setClickedCoords(null);

      try {
        const response = await fetch("/api/analyze-xray", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Url,
            mimeType: file.type
          })
        });

        const data = await response.json();

        if (response.ok) {
          setActiveDiagnosis(data);
          // If server reports fallback details (meaning it returned fallback data due to missing keys)
          if (data.isFallback || !hasApiKey) {
            setServerFallbackActive(true);
          }
        } else {
          // If server failed, check for fallback data inside returned payload
          if (data.fallbackData) {
            setActiveDiagnosis(data.fallbackData);
            setServerFallbackActive(true);
          } else {
            throw new Error(data.error || "Analysis failed.");
          }
        }
      } catch (err: any) {
        console.error("Error analyzing chest image:", err);
        setUploadError(`Failed to establish autonomous model link: ${err.message || String(err)}. Simulating mock results...`);
        // Fallback to beautiful normal Case to keep app fully playable 
        setActiveDiagnosis(PRELOADED_CASES.BACTERIAL_PNEUMONIA);
        setServerFallbackActive(true);
      } finally {
        setUploadLoading(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Unable to decode file stream locally.");
      setUploadLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // Reset parameters in the CAD workstation
  const resetWorkspaceSliders = () => {
    setBrightness(100);
    setContrast(100);
    setInvertColors(false);
    setBoneEnhancement(false);
  };

  // Calculate mouse coordinate click placements inside SVG
  const handleSvgPlateClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgEl = e.currentTarget;
    const rect = svgEl.getBoundingClientRect();
    
    // Calculate click coordinates within the 0 to 100 relative space
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    setClickedCoords({ x, y });
  };

  // Display conditions with professional clinical naming schemes
  const getConditionLabel = (condition: ConditionType) => {
    if (condition === "NORMAL") return "NORMAL STATUS Healthy Lung Volumetrics";
    if (condition === "BACTERIAL_PNEUMONIA") return "RESPIRATORY BACTERIAL PNEUMONIA (Lobar Consolidation)";
    if (condition === "VIRAL_PNEUMONIA") return "RESPIRATORY VIRAL PNEUMONIA (Interstitial Diffusion)";
    return "EVALUATING CUSTOM SPECIMEN";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-white flex flex-col justify-between">
      
      {/* Clinician Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shadow-inner">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Pneumonia Detection Lab
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-full">
                  v2.5
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Deep Learning Transfer Labs & Radiographic Computer-Aided Diagnosis (CAD) Workspace
              </p>
            </div>
          </div>

          {/* Model Status Indicators */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Gemini Vision Server Link badge */}
            {checkingApi ? (
              <span className="py-1 px-3 bg-slate-900 text-slate-400 rounded-full border border-slate-800 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                Querying Server Config...
              </span>
            ) : hasApiKey ? (
              <span className="py-1.5 px-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/25 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Gemini Vision Active
              </span>
            ) : (
              <span className="py-1.5 px-3 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/25 flex items-center gap-1.5 font-medium" title="Configure GEMINI_API_KEY inside secrets panel to enable live analysis of uploaded plates. Default samples are always live.">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Simulation Sandbox Mode
              </span>
            )}

            {/* Layout Tab selectors */}
            <div className="flex p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                id="tab-cad-workspace"
                onClick={() => setActiveTab("workspace")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "workspace"
                    ? "bg-sky-500 text-slate-950 font-bold shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Diagnostic Workspace
              </button>
              <button
                id="tab-fastai-center"
                onClick={() => setActiveTab("fastai")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "fastai"
                    ? "bg-sky-500 text-slate-950 font-bold shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                FastAI Training Lab
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        
        {/* TAB A: Diagnostic Workspace Panel */}
        {activeTab === "workspace" && (
          <div className="space-y-6">
            
            {/* Quick Education Callout Banner */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-lg">
              <div className="flex gap-3 items-start">
                <span className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl self-start md:self-center">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white">How Radiologists Detect Pneumonia with AI</h4>
                  <p className="text-xs text-slate-400 max-w-2xl mt-0.5 leading-relaxed">
                    Pneumonia appears as a cloudy region or &quot;opacity&quot; in the normally dark, air-filled lobes of the lungs on a chest plate. Lobar Bacterial pneumonia often presents as a concentrated cloud blunting specific zones, while viral pneumonia generates diffuse patchy interstitial networks across both lungs. Use the selectors below to test preloaded plates or drop your own custom scan.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 md:justify-end">
                <button
                  id="btn-case-normal"
                  onClick={() => handleCaseSelect("NORMAL")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                    activeCaseType === "NORMAL"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  Healthy Normal Plate
                </button>
                <button
                  id="btn-case-bacterial"
                  onClick={() => handleCaseSelect("BACTERIAL_PNEUMONIA")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                    activeCaseType === "BACTERIAL_PNEUMONIA"
                      ? "bg-rose-500/15 border-rose-500 text-rose-400 shadow-sm"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  Bacterial Case
                </button>
                <button
                  id="btn-case-viral"
                  onClick={() => handleCaseSelect("VIRAL_PNEUMONIA")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                    activeCaseType === "VIRAL_PNEUMONIA"
                      ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  Viral Case
                </button>
              </div>
            </div>

            {/* Primary Interactive Workstation Board Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Radiologist Workspace (7 col-span) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                
                {/* Plate Card */}
                <div className="border border-slate-800 rounded-3xl bg-slate-950 overflow-hidden shadow-2xl relative flex flex-col aspect-square max-h-[520px]">
                  
                  {/* Overlay labels */}
                  <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
                    <span className="py-1 px-2 text-[10px] font-mono tracking-widest bg-slate-950/80 backdrop-blur border border-slate-800 text-slate-300 rounded font-semibold uppercase">
                      CASE SPECIMEN: {activeCaseType}
                    </span>
                    {serverFallbackActive && (
                      <span className="py-1 px-2 text-[9px] font-mono bg-amber-500/15 backdrop-blur border border-amber-500/25 text-amber-400 rounded flex items-center gap-1 font-semibold">
                        <Info className="w-3 h-3" />
                        Simulation Match (API Key Missing)
                      </span>
                    )}
                  </div>

                  <div className="absolute top-4 right-4 z-20 flex gap-1">
                    <span className="py-1 px-2 text-[10px] font-mono bg-slate-950/85 backdrop-blur border border-slate-850 text-sky-400 rounded flex items-center gap-1 font-medium">
                      <Search className="w-3 h-3" />
                      CAD Layer Active
                    </span>
                  </div>

                  {/* Radiograph Stage Container */}
                  <div className="relative flex-1 w-full h-full bg-slate-900 border-b border-slate-900 overflow-hidden">
                    
                    {/* SVG/Plate */}
                    <div className="w-full h-full">
                      <XRaySvg
                        type={activeCaseType}
                        customDataUrl={customDataUrl}
                        brightness={brightness}
                        contrast={contrast}
                        invert={invertColors}
                        enhance={boneEnhancement}
                        onCoordinatesClick={handleSvgPlateClick}
                        className="w-full h-full"
                      />
                    </div>

                    {/* OVERLAY 1: Bounding boxes generated by CAD / Gemini prediction */}
                    {!uploadLoading && activeDiagnosis && activeCaseType !== "CUSTOM" && activeDiagnosis.detectedRegions.map((region, i) => (
                      <div
                        id={`bounding-box-${i}`}
                        key={i}
                        className="absolute border-2 border-dashed border-rose-500 bg-rose-500/10 pointer-events-auto rounded-md group hover:border-solid hover:bg-rose-500/15 transition-all"
                        style={{
                          left: `${region.x}%`,
                          top: `${region.y}%`,
                          width: `${region.width}%`,
                          height: `${region.height}%`,
                        }}
                        onMouseEnter={() => setHoverRegionLabel(region.name)}
                        onMouseLeave={() => setHoverRegionLabel(null)}
                      >
                        <div className="absolute -top-6 left-0 bg-rose-500 text-slate-950 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded shadow flex items-center gap-1 whitespace-nowrap opacity-85 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3 h-3" />
                          {region.name}
                        </div>
                      </div>
                    ))}

                    {/* OVERLAY 2: Point Markers */}
                    {!uploadLoading && activeDiagnosis && activeCaseType !== "CUSTOM" && activeDiagnosis.markers.map((marker, i) => (
                      <div
                        id={`point-point-${i}`}
                        key={i}
                        className="absolute w-4 h-4 -translate-x-2 -translate-y-2 flex items-center justify-center cursor-pointer group z-20"
                        style={{
                          left: `${marker.x}%`,
                          top: `${marker.y}%`,
                        }}
                        onMouseEnter={() => setHoverRegionLabel(marker.label)}
                        onMouseLeave={() => setHoverRegionLabel(null)}
                      >
                        <span className="absolute w-full h-full rounded-full bg-sky-500/30 animate-ping" />
                        <span className="w-2 h-2 rounded-full bg-sky-400 border border-white" />
                        <div className="absolute left-6 bg-slate-950/90 backdrop-blur border border-slate-800 text-[10px] font-mono text-slate-300 px-2 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-30 font-medium">
                          {marker.label}
                        </div>
                      </div>
                    ))}

                    {/* OVERLAY 3: Manual coordinates click overlay */}
                    {clickedCoords && (
                      <div
                        className="absolute w-8 h-8 -translate-x-4 -translate-y-4 flex items-center justify-center pointer-events-none"
                        style={{ left: `${clickedCoords.x}%`, top: `${clickedCoords.y}%` }}
                      >
                        <div className="absolute border border-amber-400 rounded-full w-full h-full animate-ping opacity-75" />
                        <div className="w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-950" />
                        <div className="absolute bottom-6 left-6 min-w-[70px] bg-slate-950/90 text-[10px] font-mono border border-amber-400 bg-slate-950 text-amber-400 px-2 py-0.5 rounded shadow whitespace-nowrap">
                          x: {clickedCoords.x}, y: {clickedCoords.y}
                        </div>
                      </div>
                    )}

                    {/* OVERLAY 4: Uploading Screen */}
                    {uploadLoading && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-30">
                        <div className="p-4 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-400/20 shadow-xl relative flex items-center justify-center w-20 h-20 animate-spin">
                          <RefreshCw className="w-10 h-10" />
                        </div>
                        <div className="text-center">
                          <h4 className="text-sm font-semibold text-slate-100 animate-pulse">Running Neural CAD Diagnostician...</h4>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-[280px]">
                            Extracting lung vectors & analyzing density shadows recursively via Gemini 3.5 Vision.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Tooltip Readout */}
                  <div className="bg-slate-950 px-4 py-2 flex justify-between items-center text-[11px] font-mono text-slate-400 border-t border-slate-900">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      {!hoverRegionLabel ? "Hover markers, or click anywhere to probe anatomical coordinates." : `Focused: ${hoverRegionLabel}`}
                    </span>
                    {clickedCoords && (
                      <button
                        id="btn-clear-probe"
                        onClick={() => setClickedCoords(null)}
                        className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:text-slate-200 cursor-pointer text-slate-400 rounded"
                      >
                        Clear Probe
                      </button>
                    )}
                  </div>
                </div>

                {/* DICOM Workstation Sliders */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Workstation Contrast & Contrast Filters</h4>
                    </div>
                    <button
                      id="btn-reset-filters"
                      onClick={resetWorkspaceSliders}
                      className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset Filters
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Brightness slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
                        <span>Plate Exposure</span>
                        <span className="font-mono text-[11px] text-sky-400">{brightness}%</span>
                      </div>
                      <input
                        id="slider-brightness"
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full accent-sky-500 h-1.5 rounded bg-slate-950 cursor-pointer"
                      />
                    </div>

                    {/* Contrast slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
                        <span>Radiographic Contrast</span>
                        <span className="font-mono text-[11px] text-sky-400">{contrast}%</span>
                      </div>
                      <input
                        id="slider-contrast"
                        type="range"
                        min="50"
                        max="200"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="w-full accent-sky-500 h-1.5 rounded bg-slate-950 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Toggle buttons for filters */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800">
                    <button
                      id="toggle-invert"
                      onClick={() => setInvertColors(!invertColors)}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        invertColors
                          ? "bg-sky-500/10 border-sky-500 text-sky-400 font-semibold"
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Color solarization (Invert)
                    </button>

                    <button
                      id="toggle-enhance"
                      onClick={() => setBoneEnhancement(!boneEnhancement)}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        boneEnhancement
                          ? "bg-sky-500/10 border-sky-500 text-sky-400 font-semibold"
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                      }`}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      High-Pass Edge Booster
                    </button>
                  </div>
                </div>
              </div>

              {/* Patient Record Report & Diagnostic Outcome (5 col-span) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Drag-and-drop / selector panel */}
                <div 
                  id="dropzone-container"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-md ${
                    dragOver
                      ? "border-sky-500 bg-sky-500/10"
                      : "border-slate-800 bg-slate-900/15 hover:border-slate-700 hover:bg-slate-900/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <UploadCloud className={`w-10 h-10 mb-3 transition-colors ${dragOver ? "text-sky-400" : "text-slate-500"}`} />
                  <span className="text-xs font-bold text-slate-200">Autonomous Radiographic Specimen Input</span>
                  <p className="text-[11px] text-slate-400 shrink-0 mt-1 max-w-[280px] leading-relaxed">
                    Drag and drop a custom Chest X-Ray file, or click to browse local storage. Supports JPG, PNG.
                  </p>
                  
                  {uploadError && (
                    <div className="mt-3 flex items-center gap-1.5 p-2 bg-rose-500/10 text-rose-400 text-[10px] rounded border border-rose-500/20 text-left">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                {/* Patient Record CAD Report Card */}
                <div id="diagnostic-record-card" className="border border-slate-800 rounded-3xl bg-slate-900/40 p-6 flex-1 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="border-b border-slate-800 pb-4 mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-slate-400 select-none uppercase tracking-wider">
                          Autonomous Neural Diagnosis Card #3859
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-slate-300">
                          <Gauge className="w-3.5 h-3.5 text-sky-400" />
                          CTR ASSESSMENT
                        </div>
                      </div>

                      <h4 className="text-md font-bold text-white leading-tight">
                        {getConditionLabel(activeDiagnosis.condition)}
                      </h4>
                    </div>

                    {/* Confidence percentage and Severity labels */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850">
                        <span className="block text-[9px] text-slate-450 uppercase tracking-wider font-semibold font-mono mb-1">Confidence probability</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold font-mono text-sky-400">
                            {(activeDiagnosis.confidence * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-500">macro val</span>
                        </div>
                        {/* Progressive visual bar chart representation */}
                        <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="bg-sky-400 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${activeDiagnosis.confidence * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850">
                        <span className="block text-[9px] text-slate-450 uppercase tracking-wider font-semibold font-mono mb-1">Infiltration opacity severity</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-xl font-bold font-mono ${
                            activeDiagnosis.severity === "None" 
                              ? "text-emerald-400" 
                              : activeDiagnosis.severity === "Mild" 
                              ? "text-sky-400" 
                              : activeDiagnosis.severity === "Moderate" 
                              ? "text-amber-400" 
                              : "text-rose-400"
                          }`}>
                            {activeDiagnosis.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2.5">
                          Consolidation Density
                        </p>
                      </div>
                    </div>

                    {/* Thoracic System Checks */}
                    <div className="space-y-2 mb-4 bg-slate-950/20 p-4 border border-slate-850 rounded-2xl">
                      <h5 className="text-[10px] uppercase font-bold text-slate-350 tracking-wider font-semibold flex items-center justify-between mb-3">
                        <span>Structured Thoracic System Checklist</span>
                        <span className="text-[9px] text-sky-400 font-mono">CAD Normalcy Check</span>
                      </h5>

                      <div className="grid grid-cols-1 gap-2.5 text-xs">
                        <div className="flex items-start justify-between border-b border-slate-850 pb-1.5">
                          <span className="text-slate-400 font-medium">Pleural Cavities</span>
                          <span className="text-right font-semibold text-slate-200 text-[11px]">{activeDiagnosis.anatomicalReport.pleuralEffusion}</span>
                        </div>
                        <div className="flex items-start justify-between border-b border-slate-850 pb-1.5">
                          <span className="text-slate-400 font-medium">Diaphragmatic Contours</span>
                          <span className="text-right font-semibold text-slate-200 text-[11px]">{activeDiagnosis.anatomicalReport.diaphragmShape}</span>
                        </div>
                        <div className="flex items-start justify-between border-b border-slate-850 pb-1.5">
                          <span className="text-slate-400 font-medium">Heart Silhouette Limits (CTR)</span>
                          <span className="text-right font-semibold text-slate-200 text-[11px]">{activeDiagnosis.anatomicalReport.cardiacSize}</span>
                        </div>
                        <div className="flex items-start justify-between pb-0.5">
                          <span className="text-slate-400 font-medium">Mediastinal Structures</span>
                          <span className="text-right font-semibold text-slate-200 text-[11px]">{activeDiagnosis.anatomicalReport.mediastinum}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dictation Findings detail */}
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        Clinical Findings Radiologist Dictation
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/45 p-3 rounded-xl border border-slate-850 select-all max-h-[140px] overflow-y-auto">
                        {activeDiagnosis.findings}
                      </p>
                    </div>
                  </div>

                  {/* Safety clinical disclaimer required by general design rules */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-start gap-2 text-[10px] text-slate-500 leading-normal">
                    <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>
                      <strong>Educational CAD Disclaimer:</strong> This framework is an educational model playground demonstrating FastAI training structures and vision capabilities. It is not an FDA-cleared diagnostic device and should never replace professional radiological evaluations.
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB B: Deep Training Simulator Dashboard */}
        {activeTab === "fastai" && (
          <div className="space-y-6">
            {/* Context callout regarding FastAI */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md flex items-start gap-4">
              <span className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Fine-Tuning ResNet CNNs via FastAI</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-4xl leading-relaxed">
                  FastAI is built on top of PyTorch and provides high-level transfer learning wrappers. Transfer learning works by taking a model (e.g. ResNet50) pretrained on general tasks (ImageNet) which contains 150+ neural layers already recognizing edges, shapes, and gradients, and fine-tuning only the classification head on our 5,856 chest radiographs. Change hyperparameters on the left to see the Python scripts update in real-time.
                </p>
              </div>
            </div>

            {/* Core Simulator Module */}
            <FastAiSimulator />
          </div>
        )}

      </main>

      {/* Hospital Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-4 shrink-0 text-center text-xs text-slate-600 leading-relaxed font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current ml-1" />
            <span>Chest Pneumonia Lab Workspace</span>
          </div>
          <span>Clinical Informatics Transfer Sandbox Area - Non-diagnostic demo build</span>
        </div>
      </footer>

    </div>
  );
}
