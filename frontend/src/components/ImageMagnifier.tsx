import { useState, useRef, type MouseEvent } from "react";
import { ZoomIn } from "lucide-react";

interface Props {
  src: string;
  zoomLevel?: number;
  magnifierSize?: number;
  label?: string;
}

export default function ImageMagnifier({
  src,
  zoomLevel = 2.5,
  magnifierSize = 140,
  label = "Pixel-Level Magnifier Inspection",
}: Props) {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseEnter = () => setShowMagnifier(true);
  const handleMouseLeave = () => setShowMagnifier(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const { top, left, width, height } = imgRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Bounds checking
    if (x < 0 || y < 0 || x > width || y > height) {
      setShowMagnifier(false);
      return;
    }

    setShowMagnifier(true);
    setCoords({ x, y });
  };

  const imgWidth = imgRef.current?.width || 0;
  const imgHeight = imgRef.current?.height || 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <ZoomIn className="text-indigo-400" size={20} />
            {label}
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Hover cursor over the image to activate 2.5x optical loupe for fine splice edge examination
          </p>
        </div>
        <span className="text-xs bg-gray-950 border border-gray-800 text-indigo-300 font-mono px-2.5 py-1 rounded-lg">
          Zoom: {zoomLevel}x
        </span>
      </div>

      <div
        className="relative w-full h-[400px] bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center cursor-crosshair select-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <img
          ref={imgRef}
          src={src}
          alt="Magnifiable inspection"
          className="w-full h-full object-contain"
        />

        {showMagnifier && (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-indigo-400 shadow-2xl bg-no-repeat z-30"
            style={{
              width: `${magnifierSize}px`,
              height: `${magnifierSize}px`,
              top: `${coords.y - magnifierSize / 2}px`,
              left: `${coords.x - magnifierSize / 2}px`,
              backgroundImage: `url('${src}')`,
              backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
              backgroundPosition: `${-coords.x * zoomLevel + magnifierSize / 2}px ${
                -coords.y * zoomLevel + magnifierSize / 2
              }px`,
              boxShadow: "0 0 25px rgba(99, 102, 241, 0.6), inset 0 0 15px rgba(0,0,0,0.5)",
            }}
          >
            {/* Center target reticle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full border border-indigo-300"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
