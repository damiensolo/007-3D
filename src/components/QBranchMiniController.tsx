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
  onResetAllGadgets: () => void;
}

const PLATE_NAMES = ['BMT 216A (UK)', '4711-EA-62 (FR)', 'LU 6789 (CH)'] as const;

export const QBranchMiniController: React.FC<QBranchMiniControllerProps> = ({
  qBranchState,
  isFiringGuns,
  onCabinAction,
  onResetAllGadgets,
}) => {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const qBranchStateRef = useRef(qBranchState);
  const onCabinActionRef = useRef(onCabinAction);
  const isFiringGunsRef = useRef(isFiringGuns);
  qBranchStateRef.current = qBranchState;
  isFiringGunsRef.current = isFiringGuns;
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
      if (state.wingGuns) {
        return {
          label: 'Red Trigger · Wing Guns Fire',
          status: isFiringGunsRef.current
            ? 'FIRING · PRESS TO CEASE FIRE'
            : state.gearCapOpen
              ? 'GUNS EXTENDED · PRESS TO FIRE'
              : 'CAP CLOSED · CLICK TO FLIP CAP',
          accent: '#fb923c',
        };
      }
      return {
        label: 'Red Trigger · Passenger Ejector Seat',
        status: state.seatEjected
          ? 'EJECTED · PRESS TO RESET'
          : state.gearCapOpen
            ? 'GUNS RETRACTED · PRESS TO EJECT SEAT'
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
      tyreSlashers: { name: 'Rear Wheel Knock-Off Tyre Slashers', color: '#38bdf8' },
      caltrops: { name: 'Right Taillight Tire Nails', color: '#34d399' },
      wingGuns: { name: 'Twin Browning .30 Wing Guns', color: '#fb923c' },
      roofHatch: { name: 'Passenger Ejector Arming Switch', color: '#38bdf8' },
      bulletShield: { name: 'Rear Bullet-Resistant Shield', color: '#c084fc' },
    };
    const info = meta[key] ?? { name: key, color: '#fbbf24' };
    if (key === 'roofHatch') {
      return {
        label: info.name,
        status: active ? 'ARMED · PRESS RED BTN TO EJECT' : 'SAFE · CLICK TO ARM',
        accent: info.color,
      };
    }
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

    const width = container.clientWidth || 228;
    const height = container.clientHeight || 440;

    const scene = new THREE.Scene();

    // Narrow-FOV telephoto perspective camera framed so both the top gear-knob and the bottom armrest wall sit inside the canvas with generous margin
    const camera = new THREE.PerspectiveCamera(27.5, width / height, 0.05, 5);
    const baseCamPos = new THREE.Vector3(0.0, 0.86, -0.10);
    const camTarget = new THREE.Vector3(0.0, 0.055, 0.008);
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
    // - Armrest console shifted UP to (0, 0, -0.020) (occupies z in [-0.165, +0.125]) so the bottom E-Gate & Shield rocker sit well above the footer buttons
    // - Flip-Top Ejector Gear-Knob positioned at (0, -0.105, +0.215) so it sits cleanly above the top of the armrest with zero overlap
    const cabinRig: QBranchCabinRig = createQBranchCabinRig(
      new THREE.Vector3(0, -0.105, 0.215),
      new THREE.Vector3(0, 0, -0.020),
      1.18
    );
    // Hide the wide square carpet tunnel surround & lower boot in the mini controller so only the sculpted upper gaiter, chrome shaft, and flip-top knob crown appear cleanly above the armrest
    if (cabinRig.gearGroup.children[0]) {
      cabinRig.gearGroup.children[0].visible = false;
    }
    if (cabinRig.gearGroup.children[1]) {
      cabinRig.gearGroup.children[1].scale.set(0.58, 0.82, 0.58);
      cabinRig.gearGroup.children[1].position.y = 0.022;
    }
    // Tilt the gearstick slightly toward the camera so both the 5-speed flip cap and red ejector button face the viewer
    cabinRig.gearGroup.rotation.x = -0.32;

    tiltGroup.add(cabinRig.root);

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
    qBranchState.tyreSlashers,
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
          className="flex items-center gap-2.5 px-3.5 py-2.5 gf-panel-gold hover:bg-[#121214] font-display-bj text-xs font-bold tracking-[0.16em] text-[#F4F1EA] transition cursor-pointer"
          title="Expand 3D Q-Branch Armrest Controller"
        >
          <Gamepad2 className="w-4 h-4 text-[#D4AF37]" />
          <span>007 3D CONSOLE</span>
          {activeGadgetCount > 0 && (
              <span className="px-1.5 py-0.5 font-mono-bj text-[10px] font-bold bg-[#D4AF37] text-[#050505]">
                {activeGadgetCount}
              </span>
          )}
              <ChevronUp className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
      </div>
    );
  }

  return (
    <aside
      className="fixed bottom-4 right-4 z-30 w-[224px] flex flex-col gf-panel-gold overflow-hidden select-none"
      aria-label="Interactive 3D Q-Branch Armrest Controller"
    >
      {/* Top Header Bar */}
        <div className="px-3 py-2 border-b border-[#D4AF37]/25 flex items-center justify-between bg-[#080809]">
          <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-[1px] bg-[#D4AF37] animate-pulse" />
              <span className="font-display-bj text-[11px] font-bold tracking-[0.18em] text-[#D4AF37]">
                Q-BRANCH 3D
              </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setShowCoverLid((v) => !v);
                onCabinAction({ type: 'toggleArmrest' });
              }}
              className={`px-1.5 py-0.5 rounded-[1px] font-mono-bj text-[9px] font-bold uppercase tracking-wider border transition cursor-pointer ${
                showCoverLid
                  ? 'bg-[#141416] text-[#F4F1EA]/70 border-[#F4F1EA]/20'
                  : 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/50'
              }`}
              title="Toggle Connolly leather armrest cover lid"
            >
            {showCoverLid ? 'OPEN LID' : 'COVER'}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-[1px] text-[#F4F1EA]/60 hover:text-[#D4AF37] hover:bg-[#141416] transition cursor-pointer"
            title="Minimize 3D controller"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Hover / Status Readout Banner */}
      <div className="px-3 py-1.5 bg-[#050505] border-b border-[#F4F1EA]/12 min-h-[38px] flex flex-col justify-center">
        {hoveredControl ? (
          <>
            <div className="font-display-bj text-xs font-semibold tracking-wider text-[#F4F1EA] truncate">
              {hoveredControl.label}
            </div>
            <div
              className="font-mono-bj text-[9px] font-bold tracking-wider uppercase truncate"
              style={{ color: hoveredControl.accent }}
            >
              {hoveredControl.status}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-[10px] text-[#F4F1EA]/85 font-medium">
              <span>Click 3D Switches</span>
              <span className="font-mono-bj text-[#D4AF37] text-[10px] font-bold">
                {PLATE_NAMES[qBranchState.plateIndex].split(' ')[0]}
              </span>
            </div>
            <div className="font-mono-bj text-[9px] text-[#F4F1EA]/45 truncate">
              {activeGadgetCount > 0
                ? `${activeGadgetCount} Q-BRANCH SYSTEM${activeGadgetCount > 1 ? 'S' : ''} ACTIVE`
                : 'ALL SYSTEMS STOWED · READY'}
          </div>
        </>
        )}
      </div>

        {/* Top Ejector / Wing-Gun Gear-Knob Callout Strip */}
        <div className="px-3 py-1 bg-[#0a0a0c] border-b border-[#F4F1EA]/12 flex items-center justify-between font-mono-bj text-[9px] uppercase tracking-wider text-[#F4F1EA]/55">
          <span
          className={`flex items-center gap-1 font-bold ${qBranchState.wingGuns ? 'text-[#D96B27]' : 'text-[#C42B2B]'
              }`}
          >
          <ShieldAlert
            className={`w-2.5 h-2.5 ${
              qBranchState.wingGuns ? 'text-[#D96B27]' : 'text-[#C42B2B]'
            }`}
          />
            {!qBranchState.gearCapOpen
                ? '1. FLIP GEAR CAP'
                : qBranchState.wingGuns
                  ? isFiringGuns
            ? 'BTN: CEASE FIRE'
            : 'BTN: FIRE GUNS'
              : 'BTN: EJECT SEAT'}
          </span>
            <span className="text-[#D4AF37]/75">
              {qBranchState.wingGuns ? 'GUNS' : 'EJECTOR'}
            </span>
        </div>

        {/* Interactive 3D WebGL Canvas (Gear-Knob Ejector Crown + Center Armrest Switchboard) */}
          <div className="relative w-full h-[440px] bg-gradient-to-b from-[#0d0d10] via-[#070709] to-[#050505]">
            <div ref={canvasHostRef} className="w-full h-full" />
          </div>

            {/* Bottom Quick-Action Tactical Footer */}
            <div className="px-2.5 py-2 border-t border-[#D4AF37]/25 bg-[#080809] flex items-center justify-between gap-1.5">
              <button
                onClick={() => onCabinAction({ type: 'pressGearButton' })}
                className={`bj-eject-hover flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[1px] font-display-bj text-[11px] font-bold tracking-[0.12em] border transition cursor-pointer ${
                  qBranchState.wingGuns
                    ? isFiringGuns
                      ? 'bj-fire-active bg-[#D96B27] text-[#050505] border-[#D96B27]'
                      : 'bg-[#0e0e10] text-[#D96B27] border-[#D96B27]/50 hover:bg-[#D96B27]/15'
                    : qBranchState.seatEjected
                      ? 'bg-[#C42B2B] text-[#F4F1EA] border-[#C42B2B]'
                      : 'bg-[#0e0e10] text-[#F4F1EA] border-[#C42B2B]/55 hover:bg-[#C42B2B]/20'
                }`}
          title={
            qBranchState.wingGuns
              ? 'Press the red gear-knob button to fire/stop the extended wing guns'
              : 'Press the red gear-knob button to trigger the passenger ejector seat'
          }
        >
          <Flame className="w-3.5 h-3.5" />
          <span>
            {!qBranchState.gearCapOpen
              ? 'FLIP CAP'
              : qBranchState.wingGuns
                ? isFiringGuns
                  ? 'CEASE FIRE'
                  : 'FIRE GUNS'
                : qBranchState.seatEjected
                  ? 'RESET SEAT'
                  : 'EJECT SEAT'}
          </span>
        </button>

        <button
          onClick={onResetAllGadgets}
          className="bj-stow-hover flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-[1px] font-display-bj text-[11px] font-semibold tracking-[0.1em] bg-[#0e0e10] hover:bg-[#16161a] text-[#F4F1EA]/80 border border-[#F4F1EA]/20 transition cursor-pointer"
          title="Stow all deployed Q-Branch gadgets and reset ejector seat"
        >
          <RotateCcw className="w-3 h-3" />
          <span>STOW ALL</span>
        </button>
      </div>
    </aside>
  );
};
