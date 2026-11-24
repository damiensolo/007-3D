import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Gamepad2,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  CabinSubPart,
  createQBranchCabinRig,
  QBranchCabinRig,
  QBranchGadgetStates,
  updateQBranchCabinRig,
} from './QBranchCabinAssembly';

interface QBranchMiniControllerProps {
  qBranchState: QBranchGadgetStates;
  isFiringGuns: boolean;
  onCabinAction: (action: NonNullable<CabinSubPart['action']>) => void;
  onToggleFireGuns: () => void;
  onResetAllGadgets: () => void;
}

const PLATE_NAMES = ['BMT 216A (UK)', '4711-EA-62 (FR)', 'LU 6789 (CH)'] as const;

export const QBranchMiniController: React.FC<QBranchMiniControllerProps> = ({
  qBranchState,
  isFiringGuns,
  onCabinAction,
  onToggleFireGuns,
  onResetAllGadgets,
}) => {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const qBranchStateRef = useRef(qBranchState);
  const onCabinActionRef = useRef(onCabinAction);
  qBranchStateRef.current = qBranchState;
  onCabinActionRef.current = onCabinAction;

  const [collapsed, setCollapsed] = useState(false);
  const [showCoverLid, setShowCoverLid] = useState(false);
  const showCoverLidRef = useRef(showCoverLid);
  showCoverLidRef.current = showCoverLid;

  const [hoveredControl, setHoveredControl] = useState<{
    label: string;
    status: string;
    accent: string;
  } | null>(null);

  const describeActionStatus = (
    action: NonNullable<CabinSubPart['action']>,
    state: QBranchGadgetStates
  ): { label: string; status: string; accent: string } => {
    if (action.type === 'toggleGearCap') {
      return {
        label: '5-Speed Flip-Top Safety Cap',
        status: state.gearCapOpen ? 'OPEN · CLICK TO CLOSE' : 'LOCKED · CLICK TO ARM',
        accent: '#fbbf24',
      };
    }
    if (action.type === 'pressGearButton') {
      return {
        label: 'Passenger Ejector Seat Trigger',
        status: state.roofHatch
          ? 'EJECTED · CLICK TO RESET'
          : state.gearCapOpen
            ? 'ARMED · PRESS TO EJECT'
            : 'CAP CLOSED · CLICK TO FLIP CAP',
        accent: '#ef4444',
      };
    }
    if (action.type === 'toggleArmrest') {
      return {
        label: 'Connolly Leather Armrest Lid',
        status: 'CLICK TO FOLD / UNFOLD',
        accent: '#94a3b8',
      };
    }
    if (action.type === 'cyclePlates') {
      return {
        label: 'Revolving Plates E-Gate Selector',
        status: `POS ${state.plateIndex + 1} · ${PLATE_NAMES[state.plateIndex]}`,
        accent: '#fcd34d',
      };
    }
    const key = action.key;
    const active = state[key];
    const meta: Record<string, { name: string; color: string }> = {
      oilSlick: { name: 'Left Taillight Oil Slick', color: '#fde047' },
      smokeScreen: { name: 'Twin Exhaust Smoke Screen', color: '#cbd5e1' },
      frontRam: { name: 'Front Hydraulic Battering Rams', color: '#f87171' },
      rearRam: { name: 'Rear Hydraulic Battering Rams', color: '#f87171' },
      caltrops: { name: 'Right Taillight Tire Nails', color: '#34d399' },
      wingGuns: { name: 'Twin Browning .30 Wing Guns', color: '#fb923c' },
      roofHatch: { name: 'Passenger Ejector Roof Hatch', color: '#38bdf8' },
      bulletShield: { name: 'Rear Bullet-Resistant Shield', color: '#c084fc' },
    };
    const info = meta[key] ?? { name: key, color: '#fbbf24' };
    return {
      label: info.name,
      status: active ? 'ACTIVE · CLICK TO STOW' : 'STOWED · CLICK TO DEPLOY',
      accent: info.color,
    };
  };

  useEffect(() => {
    if (collapsed) return;
    const container = canvasHostRef.current;
    if (!container) return;

    const width = container.clientWidth || 216;
    const height = container.clientHeight || 348;

    const scene = new THREE.Scene();

    // Narrow-FOV telephoto perspective camera eliminates edge distortion while keeping rich 3D depth
    const camera = new THREE.PerspectiveCamera(26, width / height, 0.05, 5);
    const baseCamPos = new THREE.Vector3(0.0, 0.72, -0.11);
    const camTarget = new THREE.Vector3(0.0, 0.055, 0.012);
    camera.position.copy(baseCamPos);
    camera.up.set(0, 0, 1); // +Z (front of car / gear knob) points to the TOP of the mini window!
    camera.lookAt(camTarget);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // High-contrast studio lighting for chrome collars, solid brass E-gate knob, and glowing LEDs
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x0f172a, 1.15);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.45);
    keyLight.position.set(0.45, 1.2, 0.35);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(512, 512);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.25);
    rimLight.position.set(-0.55, 0.85, -0.45);
    scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight(0xfde68a, 0.75);
    warmFill.position.set(0.25, 0.6, -0.55);
    scene.add(warmFill);

    // Pivot group for smooth cursor-driven 3D parallax tilt
    const tiltGroup = new THREE.Group();
    scene.add(tiltGroup);

    // Build the authentic 3D Q-Branch Cockpit Rig:
    // - Armrest console centered at (0, 0, -0.028)
    // - Flip-Top Ejector Gear-Knob docked at the top crown (0, -0.105, +0.156) with 1.35x scale so the red button is prominent and easy to click
    const cabinRig: QBranchCabinRig = createQBranchCabinRig(
      new THREE.Vector3(0, -0.105, 0.156),
      new THREE.Vector3(0, 0, -0.028),
      1.35
    );
    // Tilt the gearstick slightly toward the camera so both the 5-speed flip cap and red ejector button face the viewer
    cabinRig.gearGroup.rotation.x = -0.38;

    // Mirror X scale (-1) or rotate camera? Note: because camera looks from +Y down toward -Y with up = (0, 0, +1),
    // screen-right is Cross(forward=(0,-1,0), up=(0,0,1)) = (-1, 0, 0), meaning world +X is on the LEFT of the screen
    // and world -X is on the RIGHT of the screen! That matches the exact Goldfinger armrest layout in your screenshot
    // (E-Gate at +X on the bottom-left, Bullet Shield at -X on the bottom-right!).
    tiltGroup.add(cabinRig.root);

    // Fix the deck label texture horizontal mirror when viewed with camera.up = (0,0,1)
    cabinRig.armrestGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.map && mat.transparent) {
          mat.map.repeat.x = -1;
          mat.map.offset.x = 1;
          mat.map.needsUpdate = true;
        }
      }
    });

    // Collect interactive meshes for 3D raycast hover & click
    const interactiveMeshes: THREE.Mesh[] = [];
    for (const sub of cabinRig.subParts) {
      if (sub.action) {
        sub.mesh.userData.cabinAction = sub.action;
        sub.mesh.userData.cabinLabel = sub.label;
        const rawMats = Array.isArray(sub.mesh.material) ? sub.mesh.material : [sub.mesh.material];
        const clonedMats = rawMats.map((m) => m.clone());
        sub.mesh.material = Array.isArray(sub.mesh.material) ? clonedMats : clonedMats[0];
        interactiveMeshes.push(sub.mesh);
      }
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let targetTiltX = 0;
    let targetTiltZ = 0;
    let hoveredMesh: THREE.Mesh | null = null;
    let pointerDownPos = { x: 0, y: 0 };
    let disposed = false;

    const setMeshHoverHighlight = (mesh: THREE.Mesh | null, active: boolean) => {
      if (!mesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
          if (m.userData.origEmissive === undefined) {
            m.userData.origEmissive = m.emissive.clone();
            m.userData.origEmissiveIntensity = m.emissiveIntensity;
          }
          if (active) {
            m.emissive.set('#f59e0b');
            m.emissiveIntensity = Math.max(0.35, m.userData.origEmissiveIntensity + 0.25);
          } else {
            m.emissive.copy(m.userData.origEmissive);
            m.emissiveIntensity = m.userData.origEmissiveIntensity;
          }
        }
      }
    };

    const getHitMesh = (clientX: number, clientY: number): THREE.Mesh | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const visibleTargets = interactiveMeshes.filter((m) => m.visible && m.parent?.visible !== false);
      const hits = raycaster.intersectObjects(visibleTargets, false);
      return hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      // Subtle 3D hardware parallax tilt as cursor moves across the console
      targetTiltZ = nx * 0.11;
      targetTiltX = ny * 0.09;

      const hit = getHitMesh(e.clientX, e.clientY);
      if (hit !== hoveredMesh) {
        setMeshHoverHighlight(hoveredMesh, false);
        hoveredMesh = hit;
        setMeshHoverHighlight(hoveredMesh, true);
      }
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';

      if (hit && hit.userData.cabinAction) {
        setHoveredControl(
          describeActionStatus(
            hit.userData.cabinAction as NonNullable<CabinSubPart['action']>,
            qBranchStateRef.current
          )
        );
      } else {
        setHoveredControl(null);
      }
    };

    const handlePointerLeave = () => {
      targetTiltX = 0;
      targetTiltZ = 0;
      setMeshHoverHighlight(hoveredMesh, false);
      hoveredMesh = null;
      setHoveredControl(null);
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 6) return;
      const hit = getHitMesh(e.clientX, e.clientY);
      const action = hit?.userData.cabinAction as CabinSubPart['action'] | undefined;
      if (!action) return;

      if (action.type === 'toggleArmrest') {
        setShowCoverLid((prev) => !prev);
      }
      onCabinActionRef.current(action);
      setHoveredControl(describeActionStatus(action, qBranchStateRef.current));
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointermove', handlePointerMove);
    dom.addEventListener('pointerleave', handlePointerLeave);
    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointerup', handlePointerUp);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (disposed) return;

      // In the mini controller, keep the switchboard exposed by default unless the user toggles the leather cover lid
      const miniState: QBranchGadgetStates = {
        ...qBranchStateRef.current,
        armrestOpen: !showCoverLidRef.current,
      };
      // Hide the swung-out lid mesh when open in the mini window so it doesn't clip the right edge of the compact frame
      cabinRig.armrestLidPivot.visible = showCoverLidRef.current;

      updateQBranchCabinRig(cabinRig, miniState, 0.22);

      // Smooth cursor parallax interpolation
      tiltGroup.rotation.x += (targetTiltX - tiltGroup.rotation.x) * 0.14;
      tiltGroup.rotation.z += (targetTiltZ - tiltGroup.rotation.z) * 0.14;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      dom.removeEventListener('pointermove', handlePointerMove);
      dom.removeEventListener('pointerleave', handlePointerLeave);
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointerup', handlePointerUp);
      renderer.dispose();
    };
  }, [collapsed]);

  const activeGadgetCount = [
    qBranchState.oilSlick,
    qBranchState.smokeScreen,
    qBranchState.frontRam,
    qBranchState.rearRam,
    qBranchState.caltrops,
    qBranchState.wingGuns,
    qBranchState.roofHatch,
    qBranchState.bulletShield,
  ].filter(Boolean).length;

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-zinc-950/90 hover:bg-zinc-900 border border-amber-500/40 backdrop-blur-xl shadow-2xl text-xs font-semibold text-zinc-100 transition cursor-pointer"
          title="Expand 3D Q-Branch Armrest Controller"
        >
          <Gamepad2 className="w-4 h-4 text-amber-400" />
          <span>007 3D Console</span>
          {activeGadgetCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-zinc-950">
              {activeGadgetCount}
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="fixed bottom-4 right-4 z-30 w-[224px] flex flex-col rounded-2xl bg-zinc-950/88 border border-zinc-800/90 backdrop-blur-xl shadow-2xl overflow-hidden select-none"
      aria-label="Interactive 3D Q-Branch Armrest Controller"
    >
      {/* Top Header Bar */}
      <div className="px-3 py-2 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-amber-400">
            Q-Branch 3D Console
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowCoverLid((v) => !v);
              onCabinAction({ type: 'toggleArmrest' });
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border transition cursor-pointer ${
              showCoverLid
                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
            }`}
            title="Toggle Connolly leather armrest cover lid"
          >
            {showCoverLid ? 'Open Lid' : 'Cover'}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition cursor-pointer"
            title="Minimize 3D controller"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Hover / Status Readout Banner */}
      <div className="px-3 py-1.5 bg-zinc-950/90 border-b border-zinc-800/60 min-h-[38px] flex flex-col justify-center">
        {hoveredControl ? (
          <>
            <div className="text-[11px] font-semibold text-zinc-100 truncate">
              {hoveredControl.label}
            </div>
            <div
              className="text-[9px] font-mono font-bold tracking-wider uppercase truncate"
              style={{ color: hoveredControl.accent }}
            >
              {hoveredControl.status}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-[10px] text-zinc-300 font-medium">
              <span>Click 3D Switches &amp; Gear Cap</span>
              <span className="font-mono text-amber-400 text-[10px]">
                {PLATE_NAMES[qBranchState.plateIndex].split(' ')[0]}
              </span>
            </div>
            <div className="text-[9px] text-zinc-500 truncate">
              {activeGadgetCount > 0
                ? `${activeGadgetCount} Q-Branch system${activeGadgetCount > 1 ? 's' : ''} active`
                : 'All systems stowed · Ready'}
            </div>
          </>
        )}
      </div>

      {/* Interactive 3D WebGL Canvas (Gear-Knob Ejector Crown + Center Armrest Switchboard) */}
      <div className="relative w-full h-[340px] bg-gradient-to-b from-zinc-900/40 via-[#0b0d12] to-zinc-950">
        {/* Top Ejector Gear-Knob Callout Badge */}
        <div className="pointer-events-none absolute top-2 left-2.5 right-2.5 z-10 flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-zinc-400">
          <span className="px-1.5 py-0.5 rounded bg-zinc-950/80 border border-zinc-800/80 text-red-300 flex items-center gap-1">
            <ShieldAlert className="w-2.5 h-2.5 text-red-400" />
            {qBranchState.gearCapOpen ? 'Press Red Button' : '1. Flip Gear Cap'}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-950/80 border border-zinc-800/80 text-zinc-400">
            3D Interactive
          </span>
        </div>

        <div ref={canvasHostRef} className="w-full h-full" />
      </div>

      {/* Bottom Quick-Action Tactical Footer (Wing-Gun Fire Trigger & Master Stow) */}
      <div className="px-2.5 py-2 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-1.5">
        <button
          onClick={onToggleFireGuns}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
            isFiringGuns
              ? 'bg-orange-500 text-zinc-950 border-orange-400 shadow-sm shadow-orange-500/30'
              : 'bg-zinc-900 text-orange-300 border-orange-500/30 hover:bg-orange-500/15'
          }`}
          title="Deploy and fire twin front-wing Browning .30-caliber machine guns"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{isFiringGuns ? 'Firing Guns' : 'Fire Guns'}</span>
        </button>

        <button
          onClick={onResetAllGadgets}
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/70 transition cursor-pointer"
          title="Stow all deployed Q-Branch gadgets and reset ejector seat"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Stow All</span>
        </button>
      </div>
    </aside>
  );
};
