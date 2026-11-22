import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  Layers,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { DB5Part, DB5Viewport } from './components/DB5Viewport';
import {
  PRESETS,
  PresetConfig,
  SUBSYSTEM_MAP,
  SUBSYSTEMS,
  SubsystemId,
} from './data/db5Catalog';

export function App() {
  const [parts, setParts] = useState<DB5Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [explode, setExplode] = useState(0);
  const [gunDeploy, setGunDeploy] = useState(0);
  const [isFiringGuns, setIsFiringGuns] = useState(false);
  const [visibleSubsystems, setVisibleSubsystems] = useState<Set<SubsystemId>>(
    () => new Set(SUBSYSTEMS.map((s) => s.id))
  );
  const [activePresetId, setActivePresetId] = useState<string>('assembled');
  const [qBranchHighlight, setQBranchHighlight] = useState(false);

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isolatedPartId, setIsolatedPartId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cameraTargetRequest, setCameraTargetRequest] = useState<{
    position: [number, number, number];
    target: [number, number, number];
    nonce: number;
  } | null>(null);

  // Background soundtrack state (loops automatically)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userPausedRef = useRef(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.45);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = audioVolume;
    audio.muted = isMutedAudio;
  }, [audioVolume, isMutedAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tryPlay = () => {
      if (userPausedRef.current) return;
      audio
        .play()
        .then(() => {
          setIsPlayingAudio(true);
        })
        .catch(() => {
          // Browser blocked unmuted autoplay; wait for first user interaction
        });
    };

    tryPlay();

    const handleFirstInteraction = () => {
      tryPlay();
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const togglePlayAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlayingAudio) {
      userPausedRef.current = true;
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      userPausedRef.current = false;
      audio
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => {});
    }
  };

  const handlePartsLoaded = useCallback((loadedParts: DB5Part[], err?: string) => {
    setLoading(false);
    if (err) {
      setLoadError(err);
      return;
    }
    setParts(loadedParts);
  }, []);

  const handleHoverPart = useCallback(
    (partId: string | null, screenPos?: { x: number; y: number }) => {
      setHoveredPartId(partId);
      setHoverPos(screenPos ?? null);
    },
    []
  );

  const handleSelectPart = useCallback((partId: string | null) => {
    setSelectedPartId(partId);
    if (!partId) {
      setIsolatedPartId(null);
    }
  }, []);

  const toggleSubsystem = (id: SubsystemId) => {
    setActivePresetId('');
    setVisibleSubsystems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const showAllSubsystems = () => {
    setVisibleSubsystems(new Set(SUBSYSTEMS.map((s) => s.id)));
  };

  const applyPreset = (preset: PresetConfig) => {
    setActivePresetId(preset.id);
    setExplode(preset.explode);
    setVisibleSubsystems(new Set(preset.visibleSubsystems));
    setQBranchHighlight(Boolean(preset.qBranchHighlight));
    setIsolatedPartId(null);
    if (preset.id === 'wing_guns' || preset.id === 'qbranch') {
      setGunDeploy(1);
    } else if (preset.id === 'assembled') {
      setGunDeploy(0);
      setIsFiringGuns(false);
    }
    if (preset.cameraPosition) {
      setCameraTargetRequest({
        position: preset.cameraPosition,
        target: [0, 0.65, 0],
        nonce: Date.now(),
      });
    }
  };

  const resetCamera = () => {
    setCameraTargetRequest({
      position: [4.2, 2.0, 4.6],
      target: [0, 0.65, 0],
      nonce: Date.now(),
    });
  };

  const focusPart = (part: DB5Part) => {
    const c = part.worldCenter;
    setCameraTargetRequest({
      position: [c.x + 1.8, c.y + 1.0, c.z + 2.0],
      target: [c.x, c.y, c.z],
      nonce: Date.now(),
    });
  };

  const subsystemCounts = useMemo(() => {
    const counts: Record<SubsystemId, number> = {
      body: 0,
      doors: 0,
      hood_trunk: 0,
      powertrain: 0,
      wheels_brakes: 0,
      bumpers_lights: 0,
      cabin: 0,
      qbranch_weapons: 0,
    };
    for (const p of parts) {
      counts[p.subsystem]++;
    }
    return counts;
  }, [parts]);

  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return parts.filter((p) => {
      if (!q) return true;
      return (
        p.label.toLowerCase().includes(q) ||
        p.materialLabel.toLowerCase().includes(q) ||
        SUBSYSTEM_MAP[p.subsystem].name.toLowerCase().includes(q) ||
        (p.qBranchNote && p.qBranchNote.toLowerCase().includes(q))
      );
    });
  }, [parts, searchQuery]);

  const selectedPart = useMemo(
    () => parts.find((p) => p.id === selectedPartId) ?? null,
    [parts, selectedPartId]
  );

  const hoveredPart = useMemo(
    () => parts.find((p) => p.id === hoveredPartId) ?? null,
    [parts, hoveredPartId]
  );

  const totalTriangles = useMemo(
    () => parts.reduce((sum, p) => sum + p.triangleCount, 0),
    [parts]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090b0f] text-zinc-100 font-sans">
      <audio
        ref={audioRef}
        src="/audio/soundtrack.mp3"
        loop
        preload="auto"
        onPlay={() => setIsPlayingAudio(true)}
        onPause={() => setIsPlayingAudio(false)}
      />

      {/* Top-Right Soundtrack Control Pill */}
      <div
        className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-xl shadow-xl"
        title="Background Soundtrack (Pixabay Free License · Auto-Loop)"
      >
        <button
          onClick={togglePlayAudio}
          className={`flex items-center justify-center w-6 h-6 rounded-lg transition cursor-pointer ${
            isPlayingAudio
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
          title={isPlayingAudio ? 'Pause soundtrack' : 'Play soundtrack'}
        >
          {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <span className="text-[11px] font-medium text-zinc-300 tracking-wide hidden sm:inline">
          007 Audio
        </span>

        <button
          onClick={() => setIsMutedAudio((m) => !m)}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
          title={isMutedAudio ? 'Unmute' : 'Mute'}
        >
          {isMutedAudio || audioVolume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMutedAudio ? 0 : audioVolume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setAudioVolume(v);
            if (v > 0 && isMutedAudio) setIsMutedAudio(false);
          }}
          className="w-16 accent-amber-500 cursor-pointer h-1 bg-zinc-800 rounded-lg"
          aria-label="Soundtrack volume"
        />
      </div>

      {/* 3D Viewport */}
      <DB5Viewport
        explode={explode}
        gunDeploy={gunDeploy}
        isFiringGuns={isFiringGuns}
        visibleSubsystems={visibleSubsystems}
        selectedPartId={selectedPartId}
        hoveredPartId={hoveredPartId}
        isolatedPartId={isolatedPartId}
        qBranchHighlight={qBranchHighlight}
        cameraTargetRequest={cameraTargetRequest}
        onPartsLoaded={handlePartsLoaded}
        onSelectPart={handleSelectPart}
        onHoverPart={handleHoverPart}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090b0f]/90 backdrop-blur-md">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium tracking-widest uppercase text-zinc-300">
            Loading 1964 Aston Martin DB5 Vantage
          </p>
          <p className="text-xs text-zinc-500 mt-1">Parsing 84 meshes &amp; studio PBR textures…</p>
        </div>
      )}

      {/* Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="max-w-md rounded-xl border border-red-500/40 bg-zinc-900 p-6 text-center">
            <p className="text-red-400 font-semibold mb-2">Failed to load 3D model</p>
            <p className="text-xs text-zinc-400">{loadError}</p>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredPart && hoverPos && (
        <div
          className="pointer-events-none fixed z-30 px-2.5 py-1.5 rounded-lg bg-zinc-950/90 border border-zinc-700/70 backdrop-blur-md shadow-xl text-xs"
          style={{
            left: hoverPos.x + 14,
            top: hoverPos.y + 14,
          }}
        >
          <div className="flex items-center gap-1.5 font-medium text-zinc-100">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: SUBSYSTEM_MAP[hoveredPart.subsystem].color }}
            />
            {hoveredPart.label}
            {hoveredPart.isQBranch && (
              <span className="ml-1 px-1 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                007
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            {SUBSYSTEM_MAP[hoveredPart.subsystem].shortName} · {hoveredPart.materialLabel}
          </div>
        </div>
      )}

      {/* Top-Left Collapse Button when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/85 hover:bg-zinc-800/90 border border-zinc-700/60 backdrop-blur-md shadow-lg text-xs font-medium text-zinc-200 transition cursor-pointer"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>DB5 Atlas</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      )}

      {/* Left Sidebar */}
      <aside
        className={`absolute top-4 left-4 bottom-4 z-20 w-80 flex flex-col rounded-2xl bg-zinc-950/82 border border-zinc-800/80 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-400">
                007 // DB5 ATLAS
              </span>
            </div>
            <h1 className="text-sm font-semibold text-zinc-100 mt-0.5">
              1964 Aston Martin DB5 Vantage
            </h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {parts.length} meshes · {(totalTriangles / 1000).toFixed(0)}k triangles
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            title="Collapse sidebar"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800/70">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parts, materials, Q-Branch…"
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700/60 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Subsystems */}
        <div className="p-3 border-b border-zinc-800/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Subsystems
            </span>
            <button
              onClick={showAllSubsystems}
              className="text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              Show all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {SUBSYSTEMS.map((sub) => {
              const active = visibleSubsystems.has(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => toggleSubsystem(sub.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                    active
                      ? 'bg-zinc-900/90 text-zinc-100 border border-zinc-700/50'
                      : 'bg-transparent text-zinc-500 border border-transparent hover:bg-zinc-900/40'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 transition-opacity"
                      style={{
                        backgroundColor: sub.color,
                        opacity: active ? 1 : 0.25,
                      }}
                    />
                    <span className="truncate">{sub.name}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 shrink-0">
                    <span>{subsystemCounts[sub.id]}</span>
                    {active ? (
                      <Eye className="w-3 h-3 text-zinc-400" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-zinc-600" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parts Inventory */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Components ({filteredParts.length})
            </span>
            <button
              onClick={() => setQBranchHighlight((v) => !v)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                qBranchHighlight
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
              }`}
              title="Highlight 007 Q-Branch modified parts"
            >
              <Sparkles className="w-2.5 h-2.5" />
              007 Spec
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
            {filteredParts.map((part) => {
              const isSelected = part.id === selectedPartId;
              const isVisible = visibleSubsystems.has(part.subsystem);
              return (
                <button
                  key={part.id}
                  onClick={() => {
                    if (!isVisible) {
                      setVisibleSubsystems((prev) => new Set(prev).add(part.subsystem));
                    }
                    setSelectedPartId(part.id);
                  }}
                  onMouseEnter={() => setHoveredPartId(part.id)}
                  onMouseLeave={() => setHoveredPartId(null)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-100'
                      : 'bg-zinc-900/40 border-transparent hover:bg-zinc-900/80 text-zinc-300'
                  } ${!isVisible ? 'opacity-45' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate font-medium">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: SUBSYSTEM_MAP[part.subsystem].color }}
                      />
                      <span className="truncate">{part.label}</span>
                    </span>
                    {part.isQBranch && (
                      <span className="px-1 py-0.2 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        007
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 pl-3.5 truncate mt-0.5">
                    {part.materialLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Right Selected Part Inspector */}
      {selectedPart && (
        <aside className="absolute top-16 right-4 z-20 w-80 rounded-2xl bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-xl shadow-2xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border"
                style={{
                  color: SUBSYSTEM_MAP[selectedPart.subsystem].color,
                  borderColor: `${SUBSYSTEM_MAP[selectedPart.subsystem].color}44`,
                  backgroundColor: `${SUBSYSTEM_MAP[selectedPart.subsystem].color}15`,
                }}
              >
                {SUBSYSTEM_MAP[selectedPart.subsystem].shortName}
              </span>
              <h2 className="text-sm font-semibold text-zinc-100 mt-2">
                {selectedPart.label}
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedPartId(null);
                setIsolatedPartId(null);
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
              <span className="text-zinc-500">Material</span>
              <span className="text-zinc-200 font-medium">{selectedPart.materialLabel}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
              <span className="text-zinc-500">Geometry</span>
              <span className="text-zinc-200 font-mono text-[11px]">
                {selectedPart.triangleCount.toLocaleString()} tris
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
              <span className="text-zinc-500">Node ID</span>
              <span className="text-zinc-400 font-mono text-[10px] truncate max-w-[170px]" title={selectedPart.meshName}>
                {selectedPart.meshName}
              </span>
            </div>
          </div>

          {selectedPart.qBranchNote && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Q-Branch Specification
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                {selectedPart.qBranchNote}
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() =>
                setIsolatedPartId((prev) =>
                  prev === selectedPart.id ? null : selectedPart.id
                )
              }
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                isolatedPartId === selectedPart.id
                  ? 'bg-amber-500 text-zinc-950 border-amber-400'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700/70'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {isolatedPartId === selectedPart.id ? 'Exit Isolate' : 'Isolate Part'}
            </button>
            <button
              onClick={() => focusPart(selectedPart)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/70 transition cursor-pointer"
              title="Focus camera on part"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Focus
            </button>
          </div>
        </aside>
      )}

      {/* Bottom Floating Control Dock */}
      <div
        className={`absolute bottom-4 z-20 left-1/2 -translate-x-1/2 flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] ${
          sidebarOpen ? 'lg:left-[calc(50%+10rem)]' : ''
        }`}
      >
        {/* Presets Row */}
        <div className="flex items-center justify-center flex-wrap gap-1.5 px-2 py-1.5 rounded-2xl bg-zinc-950/82 border border-zinc-800/80 backdrop-blur-xl shadow-2xl">
          {PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                title={preset.description}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Sliders & Controls */}
        <div className="flex flex-col gap-2 px-4 py-2.5 rounded-2xl bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-xl shadow-2xl min-w-[340px] sm:min-w-[490px]">
          {/* Explode Slider Row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300 shrink-0 w-24">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Explode</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explode}
              onChange={(e) => {
                setActivePresetId('');
                setExplode(parseFloat(e.target.value));
              }}
              className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <span className="text-xs font-mono text-amber-400 w-10 text-right shrink-0">
              {Math.round(explode * 100)}%
            </span>
            <div className="w-px h-4 bg-zinc-800" />
            <button
              onClick={resetCamera}
              title="Reset camera view"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Q-Branch Wing Guns Deployment Slider Row */}
          <div className="flex items-center gap-4 pt-1.5 border-t border-zinc-800/70">
            <div className="flex items-center gap-2 text-xs font-medium text-orange-300 shrink-0 w-24">
              <Target className="w-3.5 h-3.5 text-orange-400" />
              <span>Wing Guns</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={gunDeploy}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setGunDeploy(v);
                if (v < 0.85) setIsFiringGuns(false);
              }}
              className="flex-1 accent-orange-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <span className="text-xs font-mono text-orange-400 w-10 text-right shrink-0">
              {Math.round(gunDeploy * 100)}%
            </span>
            <div className="w-px h-4 bg-zinc-800" />
            <button
              onClick={() => {
                if (gunDeploy < 0.85) {
                  setGunDeploy(1);
                  setIsFiringGuns(true);
                } else {
                  setIsFiringGuns((prev) => !prev);
                }
              }}
              title="Toggle simulated Browning .30-caliber firing & muzzle flash"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer shrink-0 ${
                isFiringGuns
                  ? 'bg-orange-500 text-zinc-950 border-orange-400 shadow-sm shadow-orange-500/30'
                  : 'bg-zinc-900 text-orange-300 border-orange-500/30 hover:bg-orange-500/15'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isFiringGuns ? 'Firing' : 'Fire'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
