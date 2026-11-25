import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Eye,
  EyeOff,
  Film,
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
  CabinSubPart,
  QBranchGadgetKey,
  QBranchGadgetStates,
} from './components/QBranchCabinAssembly';
import { QBranchMiniController } from './components/QBranchMiniController';
import { BondTitleSequence } from './components/BondTitleSequence';
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
  const [showTitles, setShowTitles] = useState(true);
  const handleTitlesComplete = useCallback(() => setShowTitles(false), []);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [explode, setExplode] = useState(0);
  const [gunDeploy, setGunDeploy] = useState(0);
  const [isFiringGuns, setIsFiringGuns] = useState(false);
  const [qBranchState, setQBranchState] = useState<QBranchGadgetStates>({
    armrestOpen: false,
    gearCapOpen: false,
    gearButtonPressed: false,
    plateIndex: 0,
    oilSlick: false,
    caltrops: false,
    smokeScreen: false,
    frontRam: false,
    rearRam: false,
    tyreSlashers: false,
    wingGuns: false,
    roofHatch: false,
    seatEjected: false,
    bulletShield: false,
  });
  const buttonTimerRef = useRef<number | null>(null);
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
  const [controlsOpen, setControlsOpen] = useState(true);
  const [cameraTargetRequest, setCameraTargetRequest] = useState<{
    position: [number, number, number];
    target: [number, number, number];
    nonce: number;
  } | null>(null);

  // Background soundtrack state (off by default; user-controlled)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.45);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = audioVolume;
    audio.muted = isMutedAudio;
  }, [audioVolume, isMutedAudio]);

  const togglePlayAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => { });
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

  const handleLoadProgress = useCallback((pct: number) => {
    setLoadProgress(pct);
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

  const qBranchStateRef = useRef(qBranchState);
  const gunDeployRef = useRef(gunDeploy);
  const isFiringGunsRef = useRef(isFiringGuns);
  qBranchStateRef.current = qBranchState;
  gunDeployRef.current = gunDeploy;
  isFiringGunsRef.current = isFiringGuns;

  const triggerGearRedButton = useCallback(() => {
    const curr = qBranchStateRef.current;

    // If the flip-top safety cap is still closed, flip it open first so the red button is exposed
    if (!curr.gearCapOpen) {
      setQBranchState((prev) => ({ ...prev, gearCapOpen: true }));
      return;
    }

    if (buttonTimerRef.current !== null) {
      window.clearTimeout(buttonTimerRef.current);
    }
    buttonTimerRef.current = window.setTimeout(() => {
      setQBranchState((prev) => ({ ...prev, gearButtonPressed: false }));
    }, 260);

    // Authentic Goldfinger / Skyfall / Goldfinger Continuation behavior:
    // 1) When the front-wing Browning machine guns are extended (deployed), pressing the red gear-knob button fires (or ceases firing) the guns!
    // 2) When the front-wing machine guns are retracted, pressing that same red gear-knob button acts as the passenger ejector seat trigger!
    const gunsExtended = curr.wingGuns || gunDeployRef.current >= 0.5;
    if (gunsExtended) {
      if (gunDeployRef.current < 0.85) {
        setGunDeploy(1);
      }
      setIsFiringGuns((firing) => !firing);
      setQBranchState((prev) => ({
        ...prev,
        gearCapOpen: true,
        gearButtonPressed: true,
        wingGuns: true,
      }));
      return;
    }

    // Guns are retracted -> Red button triggers (or resets) the passenger ejector seat
    setQBranchState((prev) => {
      const nextEject = !prev.seatEjected;
      return {
        ...prev,
        gearCapOpen: true,
        gearButtonPressed: true,
        roofHatch: nextEject,
        seatEjected: nextEject,
      };
    });
  }, []);

  const toggleGadget = useCallback((key: QBranchGadgetKey) => {
    if (key === 'wingGuns') {
      const nextVal = !qBranchStateRef.current.wingGuns;
      // Extending the Wing Guns deploys them out of the front indicator bays WITHOUT auto-firing;
      // firing only happens when the user presses the red gearshift button!
      setGunDeploy(nextVal ? 1 : 0);
      setIsFiringGuns(false);
      setQBranchState((prev) => ({ ...prev, wingGuns: nextVal }));
      return;
    }

    if (key === 'roofHatch') {
      const nextVal = !qBranchStateRef.current.roofHatch;
      setQBranchState((prev) => ({
        ...prev,
        roofHatch: nextVal,
        seatEjected: nextVal ? prev.seatEjected : false,
      }));
      return;
    }

    setQBranchState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const cyclePlates = useCallback(() => {
    setQBranchState((prev) => ({
      ...prev,
      plateIndex: ((prev.plateIndex + 1) % 3) as 0 | 1 | 2,
    }));
  }, []);

  const handleToggleFireGuns = useCallback(() => {
    if (gunDeploy < 0.85) {
      // First deploy the wing guns (they do not fire automatically on deployment)
      setGunDeploy(1);
      setIsFiringGuns(false);
      setQBranchState((prev) => ({ ...prev, wingGuns: true, gearCapOpen: true }));
    } else {
      // Once extended, fire/stop via the red gear-knob trigger
      if (buttonTimerRef.current !== null) {
        window.clearTimeout(buttonTimerRef.current);
      }
      buttonTimerRef.current = window.setTimeout(() => {
        setQBranchState((curr) => ({ ...curr, gearButtonPressed: false }));
      }, 260);
      setQBranchState((prev) => ({ ...prev, gearCapOpen: true, gearButtonPressed: true }));
      setIsFiringGuns((prev) => !prev);
    }
  }, [gunDeploy]);

  const handleResetAllGadgets = useCallback(() => {
    setGunDeploy(0);
    setIsFiringGuns(false);
    setQBranchState((prev) => ({
      ...prev,
      gearCapOpen: false,
      gearButtonPressed: false,
      oilSlick: false,
      caltrops: false,
      smokeScreen: false,
      frontRam: false,
      rearRam: false,
      tyreSlashers: false,
      wingGuns: false,
      roofHatch: false,
      seatEjected: false,
      bulletShield: false,
    }));
  }, []);

  const handleCabinAction = useCallback(
    (action: NonNullable<CabinSubPart['action']>) => {
      if (action.type === 'toggleGearCap') {
        setQBranchState((prev) => ({ ...prev, gearCapOpen: !prev.gearCapOpen }));
      } else if (action.type === 'pressGearButton') {
        triggerGearRedButton();
      } else if (action.type === 'toggleArmrest') {
        setQBranchState((prev) => ({ ...prev, armrestOpen: !prev.armrestOpen }));
      } else if (action.type === 'cyclePlates') {
        cyclePlates();
      } else if (action.type === 'toggleGadget') {
        toggleGadget(action.key);
      }
    },
    [triggerGearRedButton, toggleGadget, cyclePlates]
  );

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
      setQBranchState((prev) => ({ ...prev, wingGuns: true }));
    } else if (preset.id === 'cockpit') {
      setQBranchState((prev) => ({ ...prev, armrestOpen: true, gearCapOpen: true }));
    } else if (preset.id === 'assembled') {
      setGunDeploy(0);
      setIsFiringGuns(false);
      setQBranchState((prev) => ({
        ...prev,
        armrestOpen: false,
        gearCapOpen: false,
        wingGuns: false,
        roofHatch: false,
        seatEjected: false,
      }));
    }
    if (preset.cameraPosition) {
      setCameraTargetRequest({
        position: preset.cameraPosition,
        target: preset.cameraTarget ?? [0, 0.65, 0],
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
      qbranch_cockpit: 0,
      qbranch_gadgets: 0,
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
    <div className="relative w-screen h-screen overflow-hidden bg-[#050505] text-[#F4F1EA]">
      <audio
        ref={audioRef}
        src="/audio/soundtrack.mp3"
        loop
        preload="none"
        onPlay={() => setIsPlayingAudio(true)}
        onPause={() => setIsPlayingAudio(false)}
      />

      {/* 35mm Film-Gate, Silver-Gelatin Grain & Optical Projector Vignette (Never obscures 3D car) */}
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="absolute inset-0 gf-projector-vignette" />
        <div className="absolute inset-0 gf-film-grain opacity-75" />
        {/* 4 Optical Gate Corner Registration Marks */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#D4AF37]/45" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#D4AF37]/45" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#D4AF37]/45" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#D4AF37]/45" />
      </div>

      {/* Top-Right Soundtrack & Replay Titles Pill */}
      <div
        className="absolute top-4 right-4 z-30 flex items-center gap-2.5 px-3 py-1.5 gf-panel"
        title="Background Soundtrack (Pixabay Free License · Auto-Loop)"
      >
        <div className="hidden md:flex items-center gap-1 pr-1 border-r border-[#F4F1EA]/15" aria-hidden="true">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#C42B2B]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#F4F1EA]" />
        </div>

        <button
          onClick={togglePlayAudio}
          className={`flex items-center justify-center w-6 h-6 rounded-[1px] transition cursor-pointer ${isPlayingAudio
            ? 'bg-[#D4AF37] text-[#050505]'
            : 'bg-[#121214] text-[#F4F1EA]/80 hover:text-[#F4F1EA] hover:bg-[#1c1c20] border border-[#F4F1EA]/15'
            }`}
          title={isPlayingAudio ? 'Pause soundtrack' : 'Play soundtrack'}
        >
          {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <span className="font-display-bj text-[11px] font-semibold text-[#F4F1EA] tracking-[0.16em] hidden sm:inline">
          007 AUDIO
        </span>

        <button
          onClick={() => setIsMutedAudio((m) => !m)}
          className="p-1 text-[#F4F1EA]/60 hover:text-[#D4AF37] transition cursor-pointer"
          title={isMutedAudio ? 'Unmute' : 'Mute'}
        >
          {isMutedAudio || audioVolume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-[#F4F1EA]/40" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
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
          className="w-16 gf-slider cursor-pointer"
          aria-label="Soundtrack volume"
        />

        <div className="w-px h-4 bg-[#F4F1EA]/15" />

        <button
          onClick={() => setShowTitles(true)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-[1px] font-mono-bj text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-[#050505] transition cursor-pointer"
          title="Replay 007 Opening Title Sequence"
        >
          <Film className="w-3 h-3" />
          <span className="hidden sm:inline">TITLES</span>
        </button>
      </div>

      {/* 3D Viewport */}
      <DB5Viewport
        explode={explode}
        gunDeploy={gunDeploy}
        isFiringGuns={isFiringGuns}
        qBranchState={qBranchState}
        visibleSubsystems={visibleSubsystems}
        selectedPartId={selectedPartId}
        hoveredPartId={hoveredPartId}
        isolatedPartId={isolatedPartId}
        qBranchHighlight={qBranchHighlight}
        cameraTargetRequest={cameraTargetRequest}
        onPartsLoaded={handlePartsLoaded}
        onLoadProgress={handleLoadProgress}
        onSelectPart={handleSelectPart}
        onHoverPart={handleHoverPart}
        onCabinAction={handleCabinAction}
      />

      {/* 007 Opening Title Sequence & Loader (Binder × Brownjohn × Kleinman) */}
      {showTitles && (
        <BondTitleSequence
          loading={loading}
          loadProgress={loadProgress}
          isPlayingAudio={isPlayingAudio}
          onToggleAudio={togglePlayAudio}
          onComplete={handleTitlesComplete}
        />
      )}

      {/* Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]/95 p-6">
          <div className="max-w-md gf-panel border-[#C42B2B]/60 p-6 text-center">
            <p className="font-display-bj text-lg tracking-wider text-[#C42B2B] mb-2">
              TRANSMISSION FAILURE // MODEL LOAD ERROR
            </p>
            <p className="font-mono-bj text-xs text-[#F4F1EA]/70">{loadError}</p>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredPart && hoverPos && (
        <div
          className="pointer-events-none fixed z-30 px-2.5 py-1.5 gf-panel-gold text-xs"
          style={{
            left: hoverPos.x + 14,
            top: hoverPos.y + 14,
          }}
        >
          <div className="flex items-center gap-1.5 font-display-bj text-xs tracking-wider text-[#F4F1EA]">
            <span
              className="w-2 h-2 rounded-[1px] shrink-0"
              style={{ backgroundColor: SUBSYSTEM_MAP[hoveredPart.subsystem].color }}
            />
            {hoveredPart.label}
            {hoveredPart.isQBranch && (
              <span className="ml-1 px-1 py-0.5 font-mono-bj text-[9px] font-bold bg-[#D4AF37] text-[#050505]">
                007
              </span>
            )}
          </div>
          <div className="font-mono-bj text-[10px] text-[#F4F1EA]/65 mt-0.5">
            {SUBSYSTEM_MAP[hoveredPart.subsystem].shortName} · {hoveredPart.materialLabel}
          </div>
        </div>
      )}

      {/* Top-Left Collapse Button when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 gf-panel-gold hover:bg-[#121214] text-xs font-display-bj tracking-[0.16em] text-[#F4F1EA] transition cursor-pointer"
        >
          <Layers className="w-4 h-4 text-[#D4AF37]" />
          <span>DB5 ATLAS</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
        </button>
      )}

      {/* Left Sidebar */}
      <aside
        className={`absolute top-4 left-4 bottom-4 z-20 w-80 flex flex-col gf-panel transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'
          }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#D4AF37]/25 flex items-start justify-between gap-2 bg-[#080809]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-[#D4AF37] text-[#050505] font-mono-bj text-[10px] font-bold tracking-[0.18em]">
                007
              </span>
              <span className="font-display-bj text-xs font-bold tracking-[0.22em] text-[#D4AF37]">
                DB5 // GOLDFINGER ATLAS
              </span>
              <span className="flex items-center gap-1 ml-1" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C42B2B]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              </span>
            </div>
            <h1 className="font-display-bj text-base font-bold tracking-[0.06em] text-[#F4F1EA] mt-1.5">
              1964 ASTON MARTIN DB5
            </h1>
            <p className="font-mono-bj text-[10px] text-[#F4F1EA]/55 mt-0.5">
              {parts.length} MESHES · {(totalTriangles / 1000).toFixed(0)}K TRIS
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            title="Collapse sidebar"
            className="p-1.5 rounded-[1px] text-[#F4F1EA]/60 hover:text-[#D4AF37] hover:bg-[#141416] transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#F4F1EA]/12">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#D4AF37]/75 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH PARTS, Q-BRANCH…"
              className="w-full pl-8 pr-7 py-1.5 rounded-[1px] bg-[#0c0c0e] border border-[#F4F1EA]/18 font-mono-bj text-[11px] text-[#F4F1EA] placeholder:text-[#F4F1EA]/35 focus:outline-none focus:border-[#D4AF37]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#F4F1EA]/50 hover:text-[#D4AF37] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Subsystems */}
        <div className="p-3 border-b border-[#F4F1EA]/12">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-bj text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4F1EA]/55">
              SUBSYSTEMS
            </span>
            <button
              onClick={showAllSubsystems}
              className="font-mono-bj text-[10px] uppercase tracking-wider text-[#D4AF37] hover:text-[#E6C75A] cursor-pointer"
            >
              SHOW ALL
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {SUBSYSTEMS.map((sub) => {
              const active = visibleSubsystems.has(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => toggleSubsystem(sub.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-[1px] text-xs transition cursor-pointer ${active
                    ? 'bg-[#101012] text-[#F4F1EA] border border-[#F4F1EA]/15'
                    : 'bg-transparent text-[#F4F1EA]/35 border border-transparent hover:bg-[#101012]/50'
                    }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-[1px] shrink-0 transition-opacity"
                      style={{
                        backgroundColor: sub.color,
                        opacity: active ? 1 : 0.25,
                      }}
                    />
                    <span className="truncate font-medium">{sub.name}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono-bj text-[10px] text-[#F4F1EA]/50 shrink-0">
                    <span>{subsystemCounts[sub.id]}</span>
                    {active ? (
                      <Eye className="w-3 h-3 text-[#D4AF37]/80" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-[#F4F1EA]/25" />
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
            <span className="font-mono-bj text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4F1EA]/55">
              COMPONENTS ({filteredParts.length})
            </span>
            <button
              onClick={() => setQBranchHighlight((v) => !v)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[1px] font-mono-bj text-[10px] font-bold border transition cursor-pointer ${qBranchHighlight
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37]'
                : 'bg-[#0e0e10] text-[#D4AF37] border-[#D4AF37]/35 hover:border-[#D4AF37]'
                }`}
              title="Highlight 007 Q-Branch modified parts"
            >
              <Sparkles className="w-2.5 h-2.5" />
              007 SPEC
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
                  className={`w-full text-left px-2.5 py-2 rounded-[1px] text-xs transition cursor-pointer border ${isSelected
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F4F1EA]'
                    : 'bg-[#0b0b0d] border-transparent hover:border-[#F4F1EA]/15 text-[#F4F1EA]/85'
                    } ${!isVisible ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate font-medium">
                      <span
                        className="w-1.5 h-1.5 rounded-[1px] shrink-0"
                        style={{ backgroundColor: SUBSYSTEM_MAP[part.subsystem].color }}
                      />
                      <span className="truncate">{part.label}</span>
                    </span>
                    {part.isQBranch && (
                      <span className="px-1 py-0.2 font-mono-bj text-[9px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/45 shrink-0">
                        007
                      </span>
                    )}
                  </div>
                  <div className="font-mono-bj text-[10px] text-[#F4F1EA]/45 pl-3.5 truncate mt-0.5">
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
        <aside className="absolute top-16 right-4 z-20 w-80 gf-panel-gold p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[1px] font-mono-bj text-[9px] font-bold uppercase tracking-[0.18em] border"
                style={{
                  color: SUBSYSTEM_MAP[selectedPart.subsystem].color,
                  borderColor: `${SUBSYSTEM_MAP[selectedPart.subsystem].color}55`,
                  backgroundColor: `${SUBSYSTEM_MAP[selectedPart.subsystem].color}14`,
                }}
              >
                {SUBSYSTEM_MAP[selectedPart.subsystem].shortName}
              </span>
              <h2 className="font-display-bj text-base font-bold tracking-[0.05em] text-[#F4F1EA] mt-2">
                {selectedPart.label}
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedPartId(null);
                setIsolatedPartId(null);
              }}
              className="p-1 rounded-[1px] text-[#F4F1EA]/55 hover:text-[#D4AF37] hover:bg-[#141416] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#F4F1EA]/12">
              <span className="font-mono-bj text-[10px] uppercase tracking-wider text-[#F4F1EA]/50">Material</span>
              <span className="text-[#F4F1EA] font-medium">{selectedPart.materialLabel}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F4F1EA]/12">
              <span className="font-mono-bj text-[10px] uppercase tracking-wider text-[#F4F1EA]/50">Geometry</span>
              <span className="text-[#D4AF37] font-mono-bj text-[11px]">
                {selectedPart.triangleCount.toLocaleString()} TRIS
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F4F1EA]/12">
              <span className="font-mono-bj text-[10px] uppercase tracking-wider text-[#F4F1EA]/50">Node ID</span>
              <span className="text-[#F4F1EA]/65 font-mono-bj text-[10px] truncate max-w-[170px]" title={selectedPart.meshName}>
                {selectedPart.meshName}
              </span>
            </div>
          </div>

          {selectedPart.qBranchNote && (
            <div className="mt-3 p-3 bg-[#D4AF37]/8 border-l-2 border-[#D4AF37]">
              <div className="flex items-center gap-1.5 font-mono-bj text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37] mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Q-Branch Specification
              </div>
              <p className="text-xs text-[#F4F1EA]/85 leading-relaxed">
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
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[1px] font-display-bj text-xs font-semibold tracking-[0.12em] border transition cursor-pointer ${isolatedPartId === selectedPart.id
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37]'
                : 'bg-[#0e0e10] hover:bg-[#17171a] text-[#F4F1EA] border-[#F4F1EA]/20'
                }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {isolatedPartId === selectedPart.id ? 'EXIT ISOLATE' : 'ISOLATE PART'}
            </button>
            <button
              onClick={() => focusPart(selectedPart)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[1px] font-display-bj text-xs font-semibold tracking-[0.12em] bg-[#0e0e10] hover:bg-[#17171a] text-[#D4AF37] border border-[#D4AF37]/40 transition cursor-pointer"
              title="Focus camera on part"
            >
              <Crosshair className="w-3.5 h-3.5" />
              FOCUS
            </button>
          </div>
        </aside>
      )}

      {/* Bottom Floating Control Dock (Collapsible Views & Controls) */}
      <div
        className={`absolute bottom-4 z-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-max max-w-[calc(100vw-2rem)] ${sidebarOpen ? 'lg:left-[calc(50%+3.5rem)] lg:max-w-[calc(100vw-37rem)]' : 'lg:max-w-[calc(100vw-18rem)]'
          }`}
      >
        {!controlsOpen ? (
          <button
            onClick={() => setControlsOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 gf-panel-gold hover:bg-[#121214] font-display-bj text-xs font-bold tracking-[0.16em] text-[#F4F1EA] transition cursor-pointer"
            title="Expand Views & Q-Branch Controls"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>VIEWS &amp; CONTROLS</span>
            {explode > 0 && (
              <span className="px-1.5 py-0.5 font-mono-bj text-[10px] font-bold bg-[#D4AF37] text-[#050505]">
                {Math.round(explode * 100)}%
              </span>
            )}
            <ChevronUp className="w-3.5 h-3.5 text-[#D4AF37]" />
          </button>
        ) : (
          <>
            {/* Presets Row + Collapse Button */}
            <div className="flex items-center justify-center flex-wrap xl:flex-nowrap gap-1 px-2.5 py-1.5 gf-panel w-full">
              {PRESETS.map((preset) => {
                const active = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    title={preset.description}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-[1px] font-display-bj text-xs font-semibold tracking-[0.12em] transition cursor-pointer ${active
                        ? 'bg-[#D4AF37] text-[#050505]'
                        : 'text-[#F4F1EA]/75 hover:text-[#F4F1EA] hover:bg-[#141416]'
                      }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <div className="w-px h-4 bg-[#F4F1EA]/15 mx-0.5 shrink-0" />
              <button
                onClick={() => setControlsOpen(false)}
                className="p-1 rounded-[1px] text-[#F4F1EA]/60 hover:text-[#D4AF37] hover:bg-[#141416] transition cursor-pointer shrink-0"
                title="Collapse Views & Controls"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sliders & Controls */}
            <div className="flex flex-col gap-2 px-4 py-2.5 gf-panel w-full min-w-[320px] sm:min-w-[540px] lg:min-w-[680px]">
              {/* Kinetic Brownjohn Explode Slider Row ("EXPLODE" spreads apart as slider increases) */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-[#F4F1EA] shrink-0 w-28">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span
                    className="font-display-bj font-bold transition-all duration-150"
                    style={{ letterSpacing: `${0.06 + explode * 0.34}em` }}
                  >
                    EXPLODE
                  </span>
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
                  className="flex-1 gf-slider cursor-pointer"
                />
                <span className="font-mono-bj text-xs text-[#D4AF37] w-10 text-right shrink-0">
                  {Math.round(explode * 100)}%
                </span>
                <div className="w-px h-4 bg-[#F4F1EA]/15" />
                <button
                  onClick={resetCamera}
                  title="Reset camera view"
                  className="bj-stow-hover flex items-center gap-1.5 px-2.5 py-1 rounded-[1px] font-display-bj text-xs tracking-[0.1em] text-[#F4F1EA]/75 hover:text-[#F4F1EA] hover:bg-[#141416] transition cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">RESET</span>
                </button>
              </div>

              {/* Q-Branch Wing Guns Deployment Slider Row */}
              <div className="flex items-center gap-4 pt-1.5 border-t border-[#F4F1EA]/12">
                <div className="flex items-center gap-2 text-xs text-[#D96B27] shrink-0 w-28">
                  <Target className="w-3.5 h-3.5 text-[#D96B27] shrink-0" />
                  <span className="font-display-bj font-bold tracking-[0.12em]">WING GUNS</span>
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
                    setQBranchState((prev) => ({ ...prev, wingGuns: v >= 0.5 }));
                    if (v < 0.85) setIsFiringGuns(false);
                  }}
                  className="flex-1 gf-slider gf-slider-orange cursor-pointer"
                />
                <span className="font-mono-bj text-xs text-[#D96B27] w-10 text-right shrink-0">
                  {Math.round(gunDeploy * 100)}%
                </span>
                <div className="w-px h-4 bg-[#F4F1EA]/15" />
                <button
                  onClick={handleToggleFireGuns}
                  title={
                    gunDeploy < 0.85
                      ? 'Extend twin front-wing Browning .30-caliber machine guns'
                      : 'Press the red gear-knob button to fire/stop the deployed wing guns'
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[1px] font-display-bj text-xs font-bold tracking-[0.14em] border transition cursor-pointer shrink-0 ${isFiringGuns
                    ? 'bj-fire-active bg-[#D96B27] text-[#050505] border-[#D96B27]'
                    : 'bg-[#0e0e10] text-[#D96B27] border-[#D96B27]/45 hover:bg-[#D96B27]/15'
                    }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{gunDeploy < 0.85 ? 'DEPLOY' : isFiringGuns ? 'FIRING' : 'FIRE'}</span>
                </button>
              </div>

              {/* Q-Branch Cockpit & Armrest Controls Row */}
              <div className="flex items-center flex-wrap xl:flex-nowrap justify-center gap-1.5 pt-1.5 border-t border-[#F4F1EA]/12 whitespace-nowrap">
                <button
                  onClick={() => setQBranchState((prev) => ({ ...prev, gearCapOpen: !prev.gearCapOpen }))}
                  className={`px-2 py-1 rounded-[1px] font-mono-bj text-[10px] font-semibold uppercase tracking-wider border transition cursor-pointer ${qBranchState.gearCapOpen
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]'
                    : 'bg-[#0e0e10] text-[#F4F1EA]/75 border-[#F4F1EA]/18 hover:border-[#F4F1EA]/40'
                    }`}
                  title="Flip open/close the gear-knob safety cap"
                >
                  {qBranchState.gearCapOpen ? 'CAP OPEN' : 'FLIP CAP'}
                </button>

                <button
                  onClick={triggerGearRedButton}
                  className={`bj-eject-hover px-2.5 py-1 rounded-[1px] font-display-bj text-[11px] font-bold tracking-[0.12em] border transition cursor-pointer ${(qBranchState.wingGuns || gunDeploy >= 0.5)
                      ? isFiringGuns
                        ? 'bj-fire-active bg-[#D96B27] text-[#050505] border-[#D96B27]'
                        : 'bg-[#D96B27]/15 text-[#D96B27] border-[#D96B27]/60 hover:bg-[#D96B27]/25'
                      : qBranchState.seatEjected
                        ? 'bg-[#C42B2B] text-[#F4F1EA] border-[#C42B2B]'
                        : 'bg-[#C42B2B]/15 text-[#F4F1EA] border-[#C42B2B]/60 hover:bg-[#C42B2B]/30'
                    }`}
                  title="Red Gear-Knob Button: Fires/stops the Wing Guns when guns are extended, or triggers the Passenger Ejector Seat when guns are retracted"
                >
                  {!qBranchState.gearCapOpen
                    ? (qBranchState.wingGuns || gunDeploy >= 0.5)
                      ? 'FLIP CAP (GUNS)'
                      : 'FLIP CAP (EJECT)'
                    : (qBranchState.wingGuns || gunDeploy >= 0.5)
                      ? isFiringGuns
                        ? 'CEASE FIRE (RED BTN)'
                        : 'FIRE GUNS (RED BTN)'
                      : qBranchState.seatEjected
                        ? 'RESET EJECTOR'
                        : 'EJECT SEAT (RED BTN)'}
                </button>

                <button
                  onClick={() => setQBranchState((prev) => ({ ...prev, armrestOpen: !prev.armrestOpen }))}
                  className={`px-2 py-1 rounded-[1px] font-mono-bj text-[10px] font-semibold uppercase tracking-wider border transition cursor-pointer ${qBranchState.armrestOpen
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]'
                    : 'bg-[#0e0e10] text-[#F4F1EA]/75 border-[#F4F1EA]/18 hover:border-[#F4F1EA]/40'
                    }`}
                  title="Lift center armrest lid to reveal Q-Branch switchgear"
                >
                  {qBranchState.armrestOpen ? 'ARMREST OPEN' : 'ARMREST'}
                </button>

                <div className="w-px h-4 bg-[#F4F1EA]/15 mx-0.5" />

                <button
                  onClick={cyclePlates}
                  className="px-2 py-0.5 rounded-[1px] font-mono-bj text-[10px] font-bold uppercase tracking-wider border bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/50 hover:bg-[#D4AF37]/25 transition cursor-pointer"
                  title="Cycle 3-way revolving number plates (1: BMT 216A, 2: 4711-EA-62, 3: LU 6789)"
                >
                  PLATE {qBranchState.plateIndex + 1}
                </button>

                {(
                  [
                    ['wingGuns', 'GUNS'],
                    ['roofHatch', 'EJECT'],
                    ['bulletShield', 'SHIELD'],
                    ['tyreSlashers', 'SLASHERS'],
                    ['smokeScreen', 'SMOKE'],
                    ['oilSlick', 'OIL'],
                    ['caltrops', 'NAILS'],
                    ['frontRam', 'F-RAM'],
                    ['rearRam', 'R-RAM'],
                  ] as Array<[QBranchGadgetKey, string]>
                ).map(([key, label]) => {
                  const active = qBranchState[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggleGadget(key)}
                      className={`px-2 py-0.5 rounded-[1px] font-mono-bj text-[10px] font-semibold tracking-wider border transition cursor-pointer ${active
                        ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37]'
                        : 'bg-[#0b0b0d] text-[#F4F1EA]/60 border-[#F4F1EA]/15 hover:text-[#F4F1EA] hover:border-[#F4F1EA]/35'
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom-Right Interactive Mini 3D Q-Branch Armrest & Gear-Knob Controller */}
      <QBranchMiniController
        qBranchState={qBranchState}
        isFiringGuns={isFiringGuns}
        onCabinAction={handleCabinAction}
        onResetAllGadgets={handleResetAllGadgets}
      />
    </div>
  );
}

export default App;
