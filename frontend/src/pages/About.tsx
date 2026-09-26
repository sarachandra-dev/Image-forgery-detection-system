import { Zap, Activity, Sparkles, Cpu, Target, Hash, Terminal } from "lucide-react";

export default function About() {
  const forensicModules = [
    {
      icon: <Zap className="text-indigo-400" size={24} />,
      title: "1. Error Level Analysis (ELA)",
      desc: "Recompresses images at a calibrated baseline quality and computes pixel disparity maps. Tampered or spliced regions show higher compression error rates due to differing compression histories.",
    },
    {
      icon: <Activity className="text-cyan-400" size={24} />,
      title: "2. Spatial Rich Model (SRM) Noise Residuals",
      desc: "High-pass spatial filtering strips semantic content to isolate high-frequency sensor pattern noise (PRNU). Local block variance analysis reveals splice boundaries and smoothed retouching.",
    },
    {
      icon: <Sparkles className="text-fuchsia-400" size={24} />,
      title: "3. 2D FFT Frequency Harmonics",
      desc: "Fast Fourier Transform magnitude spectrum analysis exposes periodic sinc/comb grid artifacts caused by image interpolation, geometric warping, and AI generative inpainting.",
    },
    {
      icon: <Cpu className="text-purple-400" size={24} />,
      title: "4. ResNet50 + ResNet34 Dual-Stream Deep CNN",
      desc: "A dual-branch convolutional architecture extracts deep semantic representations from the RGB domain (ResNet50) and compression artifact features from the ELA domain (ResNet34).",
    },
    {
      icon: <Target className="text-amber-400" size={24} />,
      title: "5. Grad-CAM & Morphological Tamper Localization",
      desc: "Gradient-weighted Class Activation Mapping backpropagates decision gradients to highlight anomalous spatial regions. Morphological clustering extracts precise tampered bounding boxes.",
    },
    {
      icon: <Hash className="text-emerald-400" size={24} />,
      title: "6. Cryptographic Provenance & DevOps Telemetry",
      desc: "Every analyzed image is hashed with SHA-256 and logged into an immutable forensic audit trail. Real-time telemetry streams memory, latency, and hardware health metrics.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Forensic Engine Architecture & Science
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
          How our real-time multi-modal forensic pipeline synthesizes deep learning, signal processing, and statistical quantization to achieve high-accuracy image authentication.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {forensicModules.map((item, idx) => (
          <div
            key={idx}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-3"
          >
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 w-fit">
              {item.icon}
            </div>
            <h3 className="text-white font-bold text-base">{item.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* DevOps Stack Section */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border border-gray-800 rounded-3xl p-8 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Terminal size={18} /> DevOps & Production Deployment Stack
        </div>
        <h2 className="text-xl font-bold text-white">Built for High Availability & Real-Time Performance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
            <span className="text-gray-500 font-mono">Backend Engine</span>
            <p className="font-semibold text-white mt-1">FastAPI + Async Python 3.13</p>
          </div>
          <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
            <span className="text-gray-500 font-mono">Neural Inference</span>
            <p className="font-semibold text-white mt-1">PyTorch 2.14 + Torchvision</p>
          </div>
          <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
            <span className="text-gray-500 font-mono">Frontend Client</span>
            <p className="font-semibold text-white mt-1">React 19 + Vite + Tailwind</p>
          </div>
          <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
            <span className="text-gray-500 font-mono">Containerization</span>
            <p className="font-semibold text-white mt-1">Docker Compose Multi-Stage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
