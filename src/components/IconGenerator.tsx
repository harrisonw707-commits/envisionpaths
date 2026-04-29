import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface IconGeneratorProps {
  apiUrl: string;
  authHeaders: Record<string, string>;
  onNotification: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function IconGenerator({ apiUrl, authHeaders, onNotification }: IconGeneratorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'generating' | 'uploading' | 'complete' | 'error'>('idle');

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-512-maskable.png', size: 512 }
  ];

  const generateAndUpload = async () => {
    if (!svgRef.current) return;
    setIsGenerating(true);
    setStatus('generating');
    setProgress(0);

    try {
      const svg = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      for (let i = 0; i < sizes.length; i++) {
        const { name, size } = sizes[i];
        setProgress(Math.round(((i) / sizes.length) * 100));

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            // Small delay to ensure SVG rendering is complete
            setTimeout(resolve, 100);
          };
          img.onerror = reject;
          img.src = url;
        });

        // Ensure fonts are loaded before drawing
        if ('fonts' in document) {
          await (document as any).fonts.ready;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const pngData = canvas.toDataURL('image/png');

        setStatus('uploading');
        const res = await fetch(`${apiUrl}/api/upload-icon`, {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, data: pngData })
        });

        if (!res.ok) {
          throw new Error(`Failed to upload ${name}`);
        }
      }

      URL.revokeObjectURL(url);
      setProgress(100);
      setStatus('complete');
      onNotification('All icons generated and uploaded successfully!', 'success');
    } catch (e: any) {
      console.error('[ICONS] Generation failed:', e);
      setStatus('error');
      onNotification(`Icon generation failed: ${e.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-8 bg-theme-input border border-theme rounded-2xl">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="shrink-0">
            <div className="relative group">
              <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-2xl group-hover:bg-red-500/30 transition-all" />
              <svg 
                ref={svgRef}
                width="200" 
                height="200" 
                viewBox="0 0 512 512" 
                className="relative z-10 rounded-3xl shadow-2xl border border-white/10"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="512" height="512" fill="black"/>
                <g transform="translate(256, 220)">
                  {/* Left Red Arrow */}
                  <path d="M-140 60 L-140 -20 L-175 -20 L-125 -100 L-75 -20 L-110 -20 L-110 60 Z" fill="#ef4444"/>
                  {/* Right Red Arrow */}
                  <path d="M140 60 L140 -20 L175 -20 L125 -100 L75 -20 L110 -20 L110 60 Z" fill="#ef4444"/>
                  {/* Middle White Arrow (Larger) */}
                  <path d="M-45 80 L-45 -50 L-85 -50 L0 -150 L85 -50 L45 -50 L45 80 Z" fill="white"/>
                </g>
                <text x="256" y="430" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="900" fill="white" text-anchor="middle">EnvisionPaths</text>
              </svg>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight text-theme-primary mb-2">PWA Icon Generator</h3>
              <p className="text-theme-secondary text-sm leading-relaxed">
                This tool generates high-resolution PNG icons from the SVG logo and uploads them directly to the server's public folder. 
                This ensures PWABuilder and other tools can correctly identify your app's branding.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {sizes.map((s, i) => (
                <div key={i} className="p-4 bg-theme-surface border border-theme rounded-xl flex items-center gap-3">
                  <ImageIcon size={16} className="text-red-500" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-theme-primary truncate">{s.name}</p>
                    <p className="text-[8px] font-bold text-theme-secondary uppercase">{s.size}x{s.size} PNG</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              {status === 'idle' || status === 'error' ? (
                <button
                  onClick={generateAndUpload}
                  disabled={isGenerating}
                  className="w-full md:w-auto px-10 py-4 bg-red-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-red-500 transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 group"
                >
                  <Upload size={18} className="group-hover:-translate-y-1 transition-transform" />
                  Generate & Upload Icons
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-theme-secondary flex items-center gap-2">
                      {status === 'generating' ? <RefreshCw size={12} className="animate-spin text-red-500" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
                      {status === 'generating' ? 'Rendering PNGs...' : 'Uploading to Server...'}
                    </span>
                    <span className="text-theme-primary">{progress}%</span>
                  </div>
                  <div className="h-2 bg-theme-surface border border-theme rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-red-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  {status === 'complete' && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      Success! Icons are now live on the server.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
        <AlertCircle className="text-red-500 shrink-0 mt-1" size={20} />
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Important Note</h4>
          <p className="text-[10px] leading-relaxed text-theme-secondary font-medium">
            After generating the icons, you should <strong>Deploy to Cloud Run</strong> from the Settings menu to ensure the icons are persisted in the production build. 
            The generator saves them to both the <code>public/icons</code> and <code>dist/icons</code> folders for immediate availability in the current session.
          </p>
        </div>
      </div>
    </div>
  );
}
