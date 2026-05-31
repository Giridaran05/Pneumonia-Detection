import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  Sparkles,
  Play,
  RotateCcw,
  Cpu,
  Sliders,
  Terminal,
  Activity,
  CheckCircle,
  FileText,
  Bookmark,
  ChevronRight,
  TrendingUp,
  BarChart2
} from "lucide-react";
import { TrainingArgs, EpochLog } from "../types";

export default function FastAiSimulator() {
  // Hyperparameter configurations
  const [hyperparams, setHyperparams] = useState<TrainingArgs>({
    learningRate: 0.001,
    epochs: 5,
    batchSize: 32,
    baseArchitecture: "resnet50",
  });

  // State managers
  const [status, setStatus] = useState<"idle" | "training" | "completed">("idle");
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [epochLogs, setEpochLogs] = useState<EpochLog[]>([]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"code" | "charts" | "metrics">("code");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop simulation on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleParamChange = (key: keyof TrainingArgs, value: any) => {
    if (status === "training") return; // Lock changes during training
    setHyperparams((prev) => ({ ...prev, [key]: value }));
  };

  // Generate randomized but progressive realistic metrics for learning
  const triggerTraining = () => {
    if (status === "training") return;
    
    setStatus("training");
    setCurrentEpoch(0);
    setEpochLogs([]);
    setActiveTab("charts");
    
    const maxEpochs = hyperparams.epochs;
    let current = 0;

    // Architectural adjustments (ResNet50 performs slightly better than ResNet18)
    const archFactor = hyperparams.baseArchitecture === "resnet50" ? 1.05 : hyperparams.baseArchitecture === "resnet34" ? 1.0 : 0.93;
    const lrFactor = hyperparams.learningRate === 0.001 ? 1.0 : hyperparams.learningRate === 0.003 ? 0.95 : 0.85;
    const maxExpectedAcc = 0.952 * archFactor * lrFactor;
    const plateauAcc = Math.min(0.97, maxExpectedAcc);

    const initialTerminalLines = [
      `[sys] Initializing Kaggle Chest X-Ray (Pneumonia) Dataset...`,
      `[sys] Found 5,856 images labeled: Normal (1,583), Bacterial_Pneumonia (2,538), Viral_Pneumonia (1,735)`,
      `[sys] Image train/validation split configured: 80% / 20% | bs=${hyperparams.batchSize}`,
      `[sys] Downloaded pretrained weight registry for '${hyperparams.baseArchitecture}' from fast.ai servers`,
      `[sys] Customizing network head: replaced standard FC layer with [Linear -> BatchNorm -> Dropout -> Linear] mapping to 3 classes`,
      `[sys] Compiling PyTorch model... GPU acceleration active on NVIDIA A100 Tensor Core`,
      `----------------------------------------------------------------------`,
      `epoch     train_loss  valid_loss  accuracy  recall_bac  recall_vir  time`,
    ];
    setTerminalLines(initialTerminalLines);

    intervalRef.current = setInterval(() => {
      current++;
      setCurrentEpoch(current);

      // Math modelling of realistic loss and accuracy learning paths
      // Loss curves descend exponentially: y = final + (initial - final) * e^(-k * epoch)
      const valTrainLoss = Math.max(0.06, 0.65 * Math.pow(0.55, current) + (Math.random() * 0.02 - 0.01));
      const valValidLoss = Math.max(0.12, 0.48 * Math.pow(0.6, current) + (Math.random() * 0.03 - 0.015));
      const valAccuracy = Math.min(plateauAcc, 0.70 + (plateauAcc - 0.70) * (1 - Math.pow(0.52, current)) + (Math.random() * 0.01 - 0.005));
      
      const recallBac = Math.min(0.98, 0.72 + (0.24 * (1 - Math.pow(0.55, current))));
      const recallVir = Math.min(0.94, 0.64 + (0.28 * (1 - Math.pow(0.5, current))));
      const f1S = 2 * (valAccuracy * ((recallBac + recallVir) / 2)) / (valAccuracy + ((recallBac + recallVir) / 2));

      const newLog: EpochLog = {
        epoch: current,
        trainLoss: parseFloat(valTrainLoss.toFixed(4)),
        validLoss: parseFloat(valValidLoss.toFixed(4)),
        accuracy: parseFloat(valAccuracy.toFixed(4)),
        recallBacterial: parseFloat(recallBac.toFixed(4)),
        recallViral: parseFloat(recallVir.toFixed(4)),
        f1Score: parseFloat(f1S.toFixed(4)),
        timeTaken: `01:${Math.floor(Math.random() * 8 + 35)}`
      };

      setEpochLogs((prev) => [...prev, newLog]);
      setTerminalLines((prev) => [
        ...prev,
        `${(current - 1).toString().padEnd(10)}${newLog.trainLoss.toFixed(6).padEnd(12)}${newLog.validLoss.toFixed(6).padEnd(12)}${newLog.accuracy.toFixed(6).padEnd(10)}${newLog.recallBacterial.toFixed(6).padEnd(12)}${newLog.recallViral.toFixed(6).padEnd(12)}${newLog.timeTaken}`
      ]);

      if (current >= maxEpochs) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStatus("completed");
        setTerminalLines((prev) => [
          ...prev,
          `----------------------------------------------------------------------`,
          `[sys] Training completed in 1h ${(maxEpochs * 1.5).toFixed(0)}m total compute time.`,
          `[sys] Best validation accuracy: ${Math.max(...[...epochLogs, newLog].map(l => l.accuracy)).toFixed(4)}`,
          `[sys] Saving fine-tuned model checkpoint: 'chest-xray-${hyperparams.baseArchitecture}-tuned.pkl'`,
          `[sys] Export completed. Model is ready for standalone radiological computer-aided deployments!`
        ]);
        setActiveTab("metrics");
      }
    }, 1500);
  };

  const resetAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("idle");
    setCurrentEpoch(0);
    setEpochLogs([]);
    setTerminalLines([]);
    setActiveTab("code");
  };

  // Modern FastAI 5-line code snippet corresponding to selected hyperparameters
  const pythonCode = `from fastai.vision.all import *

# 1. Load Chest X-Ray Images from Kaggle Dataset
path = Path('chest_xray')
dls = ImageDataLoaders.from_folder(
    path, 
    valid_pct=0.2, 
    item_tfms=Resize(224),
    batch_tfms=aug_transforms(mult=1.0, do_flip=False),
    bs=${hyperparams.batchSize}
)

# 2. Compile Vision Transfer Learner with Pretrained Backbones (150+ Layers)
learn = vision_learner(
    dls, 
    ${hyperparams.baseArchitecture}, 
    metrics=[accuracy, Recall(average='macro')]
)

# 3. Fine-tune weights with Discriminative Learning rate in a single function call
learn.fine_tune(epochs=${hyperparams.epochs}, base_lr=${hyperparams.learningRate})`;

  return (
    <div id="fastai-deeplearning-lab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 shadow-xl">
      
      {/* Hyperparameter Controls & FastAI Comparison Metrics (4 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
              <Sliders className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-semibold text-slate-100">Deep Learning Hyperparameters</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Configure PyTorch ResNet training parameters directly. Toggling parameters adapts the FastAI code structure dynamically.
          </p>

          <div className="space-y-5">
            {/* Base Neural Network Model */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Vision CNN Architecture</span>
                <span className="text-sky-400 font-normal font-mono scale-95">Pretrained ResNet</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["resnet18", "resnet34", "resnet50"] as const).map((arch) => (
                  <button
                    key={arch}
                    id={`btn-arch-${arch}`}
                    disabled={status === "training"}
                    onClick={() => handleParamChange("baseArchitecture", arch)}
                    className={`py-2 px-3 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
                      hyperparams.baseArchitecture === arch
                        ? "bg-sky-500/10 border-sky-500 text-sky-400 shadow-sm"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {arch.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                {hyperparams.baseArchitecture === "resnet50" 
                  ? "ResNet50 uses 50 layers with residual shortcuts, producing superior hierarchical feature extraction." 
                  : hyperparams.baseArchitecture === "resnet34" 
                  ? "ResNet34 offers a balanced compromise between training velocity and classification precision." 
                  : "ResNet18 is extremely lightweight and fast, ideal for quick edge local runs."}
              </p>
            </div>

            {/* Epoch Multiplier */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-300">Fine-tuning Epochs</span>
                <span className="text-xs font-mono font-medium text-sky-400">{hyperparams.epochs} full passes</span>
              </div>
              <input
                id="range-epochs"
                type="range"
                min="3"
                max="15"
                step="1"
                disabled={status === "training"}
                value={hyperparams.epochs}
                onChange={(e) => handleParamChange("epochs", parseInt(e.target.value))}
                className="w-full accent-sky-500 h-1.5 rounded-lg bg-slate-950/60 cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>3 Epochs</span>
                <span>9 Epochs</span>
                <span>15 Epochs</span>
              </div>
            </div>

            {/* Learning Rate (LR) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Base Learning Rate (LR)</label>
              <div className="grid grid-cols-4 gap-2">
                {[0.0001, 0.0005, 0.001, 0.003].map((lr) => (
                  <button
                    key={lr}
                    id={`btn-lr-${lr}`}
                    disabled={status === "training"}
                    onClick={() => handleParamChange("learningRate", lr)}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                      hyperparams.learningRate === lr
                        ? "bg-slate-950/20 border-sky-500 text-sky-400 font-semibold"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {lr.toString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Training Batch Size (bs)</label>
              <div className="grid grid-cols-3 gap-2">
                {[16, 32, 64].map((bs) => (
                  <button
                    key={bs}
                    id={`btn-bs-${bs}`}
                    disabled={status === "training"}
                    onClick={() => handleParamChange("batchSize", bs)}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                      hyperparams.batchSize === bs
                        ? "bg-slate-950/20 border-sky-500 text-sky-400 font-semibold"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {bs} pics
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex gap-3">
            {status !== "training" ? (
              <button
                id="btn-start-training"
                onClick={triggerTraining}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/10 hover:shadow-sky-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Model Fine-Tuning
              </button>
            ) : (
              <div className="flex-1 py-3 px-4 rounded-xl text-center text-sm bg-slate-800 text-slate-400 flex items-center justify-center gap-2 animate-pulse border border-slate-700">
                <Cpu className="w-4 h-4 animate-spin" />
                Training Epoch {currentEpoch}/{hyperparams.epochs}...
              </div>
            )}

            <button
              id="btn-reset-training"
              onClick={resetAll}
              title="Reset training lab state"
              className="py-3 px-4 bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-300 hover:text-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[10.5px] text-slate-400 bg-slate-950/55 p-3 rounded-xl border border-slate-800/80 leading-normal">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              <strong>Keras Comparison:</strong> A full custom convolutional network containing matching parameters takes over <strong>35 lines of code</strong> in Keras. FastAI handles it seamlessly in <strong>5 streamlined lines</strong>!
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Workspace Interface (7 cols) */}
      <div className="lg:col-span-7 flex flex-col h-[490px] border border-slate-800/60 rounded-xl bg-slate-950 overflow-hidden">
        {/* Workspace Toolbar Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/55 px-4 py-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono text-slate-400 ml-2">fastai_transfer_learner.py</span>
          </div>

          {/* Workbench Tabs */}
          <div className="flex gap-1">
            <button
              id="tab-code"
              onClick={() => setActiveTab("code")}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === "code" ? "bg-slate-950 border border-slate-800 text-sky-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Python Code
            </button>
            <button
              id="tab-charts"
              disabled={epochLogs.length === 0}
              onClick={() => setActiveTab("charts")}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === "charts" ? "bg-slate-950 border border-slate-800 text-sky-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Loss Rates
            </button>
            <button
              id="tab-metrics"
              disabled={epochLogs.length === 0}
              onClick={() => setActiveTab("metrics")}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === "metrics" ? "bg-slate-950 border border-slate-800 text-sky-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Metrics
            </button>
          </div>
        </div>

        {/* Tab Workspaces */}
        <div className="flex-1 overflow-auto p-4 flex flex-col justify-between">
          
          {/* TAB 1: Real-time Updated FastAI Python Code View */}
          {activeTab === "code" && (
            <div className="flex-1 flex flex-col justify-between">
              <pre className="text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto bg-slate-950 p-2 select-all h-full max-h-[350px]">
                {pythonCode}
              </pre>
              <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  Pretrained weights: ImageNet transfer learning
                </span>
                <span className="font-mono text-slate-500 font-semibold">Vision Module</span>
              </div>
            </div>
          )}

          {/* TAB 2: Dynamic Recharts Graphs (Training vs Validation curves) */}
          {activeTab === "charts" && (
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="h-[210px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={epochLogs} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#101726" />
                    <XAxis dataKey="epoch" stroke="#475569" fontSize={10} label={{ value: "Epochs", position: "insideBottom", offset: -2, fill: "#475569" }} />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }} />
                    <Legend wrapperStyle={{ fontSize: "10.5px" }} />
                    <Line name="Train Loss" type="monotone" dataKey="trainLoss" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    <Line name="Val Loss" type="monotone" dataKey="validLoss" stroke="#eab308" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line name="Accuracy" type="monotone" dataKey="accuracy" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Console log outputs running live with training passes */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[9px] text-emerald-400 overflow-y-auto h-[120px] max-h-[120px] leading-relaxed select-all">
                {terminalLines.map((line, idx) => (
                  <div key={idx} className={line.startsWith("[sys]") ? "text-slate-400" : ""}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Core Validation Metrics and Interactive Playback Reports */}
          {activeTab === "metrics" && epochLogs.length > 0 && (
            <div className="flex-1 flex flex-col justify-between h-full">
              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-between">
                  <span>Validation Metrics Dashboard</span>
                  <span className="py-0.5 px-2 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Checkpoint Safe
                  </span>
                </h4>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-400 font-medium mb-0.5 uppercase tracking-wider">Overall Accuracy</div>
                    <div className="text-xl font-bold font-mono text-sky-400">
                      {(epochLogs[epochLogs.length - 1].accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-400 font-medium mb-0.5 uppercase tracking-wider">Bacterial Recall</div>
                    <div className="text-xl font-bold font-mono text-emerald-400">
                      {(epochLogs[epochLogs.length - 1].recallBacterial * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-400 font-medium mb-0.5 uppercase tracking-wider">F1-Score (Macro)</div>
                    <div className="text-xl font-bold font-mono text-amber-400">
                      {(epochLogs[epochLogs.length - 1].f1Score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Simulated Matrix representing highly consistent real outputs from testing */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3">
                  <h5 className="text-xs font-semibold text-slate-300 mb-2">Chest X-Ray Confusion Matrix (Out-of-sample)</h5>
                  <div className="grid grid-cols-4 gap-2 text-[10.5px] font-mono text-center">
                    <div className="text-slate-500">True \ Pred</div>
                    <div className="font-semibold text-slate-300">Norm</div>
                    <div className="font-semibold text-slate-300">Bact_P</div>
                    <div className="font-semibold text-slate-300">Viral_P</div>

                    <div className="font-semibold text-slate-300 text-left">Normal</div>
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 py-1 rounded">298</div>
                    <div className="bg-rose-500/5 text-rose-300/40 py-1 rounded">12</div>
                    <div className="bg-rose-500/5 text-rose-300/40 py-1 rounded">7</div>

                    <div className="font-semibold text-slate-300 text-left">Bact_Pne</div>
                    <div className="bg-rose-500/5 text-rose-300/40 py-1 rounded">9</div>
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 py-1 rounded">487</div>
                    <div className="bg-rose-500/5 text-rose-300/40 py-1 rounded">11</div>

                    <div className="font-semibold text-slate-300 text-left">Viral_Pne</div>
                    <div className="bg-rose-500/5 text-rose-300/40 py-1 rounded">5</div>
                    <div className="bg-rose-500/5 text-rose-300/40 py-1 rounded">34</div>
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 py-1 rounded">308</div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2.5 leading-normal">
                    *Diagonal items represent correct categorizations. Distinguishing viral and bacterial infiltrates constitutes the main diagnostic complexity.
                  </p>
                </div>
              </div>

              <div className="text-[10.5px] text-sky-400 bg-sky-500/5 p-2 rounded-lg border border-sky-500/10 flex items-center gap-1.5 leading-normal">
                <ChevronRight className="w-4 h-4 text-sky-400" />
                <span>
                  <strong>Tip:</strong> Transfer learning initializes networks with ImageNet features (shapes, edges), allowing ResNet to adapt to clinical patterns with extremely low image volumes!
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
