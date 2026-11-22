import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { classifyMesh, SubsystemId } from '../data/db5Catalog';
import { createBrowningGunRig, GunRig, updateBrowningGunRig } from './BrowningGunAssembly';
import {
  CabinSubPart,
  createQBranchCabinRig,
  QBranchCabinRig,
  QBranchGadgetStates,
  updateQBranchCabinRig,
} from './QBranchCabinAssembly';
import {
  createQBranchGadgetsRig,
  QBranchGadgetsRig,
  updateQBranchGadgetsRig,
} from './QBranchGadgetsAssembly';

export interface DB5Part {
  id: string;
  meshName: string;
  materialName: string;
  label: string;
  subsystem: SubsystemId;
  materialLabel: string;
  isQBranch: boolean;
  qBranchNote?: string;
  triangleCount: number;
  worldCenter: THREE.Vector3;
}

interface InternalPart extends DB5Part {
  mesh: THREE.Mesh;
  basePosition: THREE.Vector3;
  explodeOffset: THREE.Vector3;
  originalMaterials: THREE.Material[];
}

interface DB5ViewportProps {
  explode: number;
  gunDeploy: number;
  isFiringGuns: boolean;
  qBranchState: QBranchGadgetStates;
  visibleSubsystems: Set<SubsystemId>;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isolatedPartId: string | null;
  qBranchHighlight: boolean;
  cameraTargetRequest: { position: [number, number, number]; target: [number, number, number]; nonce: number } | null;
  onPartsLoaded: (parts: DB5Part[], loadError?: string) => void;
  onSelectPart: (partId: string | null) => void;
  onHoverPart: (partId: string | null, screenPos?: { x: number; y: number }) => void;
  onCabinAction: (action: NonNullable<CabinSubPart['action']>) => void;
}

/**
 * Builds a neutral, high-contrast automotive photography studio environment
 * with crisp overhead softbox strips and dark walls so Silver Birch paint
 * and chrome reflect cleanly without warm/orange color casts.
 */
function createAutomotiveStudioEnv(): THREE.Scene {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0b0e14);

  const softboxMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const coolFillMat = new THREE.MeshBasicMaterial({ color: 0xdbeafe });
  const darkWallMat = new THREE.MeshBasicMaterial({ color: 0x11151d });

  // Overhead main softbox strips
  const strip1 = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.2), softboxMat);
  strip1.position.set(0, 8, 2);
  strip1.rotation.x = Math.PI / 2;
  envScene.add(strip1);

  const strip2 = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.8), softboxMat);
  strip2.position.set(0, 8, -3);
  strip2.rotation.x = Math.PI / 2;
  envScene.add(strip2);

  // Side horizon bounce strips for crisp body-line reflections
  const sideLeft = new THREE.Mesh(new THREE.PlaneGeometry(16, 1.4), coolFillMat);
  sideLeft.position.set(-9, 2.2, 0);
  sideLeft.rotation.y = Math.PI / 2;
  envScene.add(sideLeft);

  const sideRight = new THREE.Mesh(new THREE.PlaneGeometry(16, 1.4), coolFillMat);
  sideRight.position.set(9, 2.2, 0);
  sideRight.rotation.y = -Math.PI / 2;
  envScene.add(sideRight);

  // Dark studio floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), darkWallMat);
  floor.position.set(0, -4, 0);
  floor.rotation.x = -Math.PI / 2;
  envScene.add(floor);

  return envScene;
}

/**
 * Removes triangles from a front-wing body/trim mesh that fall inside the
 * circular gun-port bores behind the left and right front indicator lights.
 */
function carveGunPortHoles(
  mesh: THREE.Mesh,
  leftCenter: THREE.Vector3,
  rightCenter: THREE.Vector3,
  radius: number
): void {
  const geo = mesh.geometry;
  const posAttr = geo.attributes.position;
  if (!posAttr) return;

  mesh.updateMatrixWorld(true);
  const rSq = radius * radius;
  const zMin = Math.min(leftCenter.z, rightCenter.z) - 0.14;

  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  const shouldRemoveTri = (ia: number, ib: number, ic: number): boolean => {
    va.fromBufferAttribute(posAttr, ia).applyMatrix4(mesh.matrixWorld);
    vb.fromBufferAttribute(posAttr, ib).applyMatrix4(mesh.matrixWorld);
    vc.fromBufferAttribute(posAttr, ic).applyMatrix4(mesh.matrixWorld);
    centroid.copy(va).add(vb).add(vc).multiplyScalar(1 / 3);
    if (centroid.z < zMin) return false;

    const dlSq =
      (centroid.x - leftCenter.x) ** 2 + (centroid.y - leftCenter.y) ** 2;
    const drSq =
      (centroid.x - rightCenter.x) ** 2 + (centroid.y - rightCenter.y) ** 2;
    return dlSq < rSq || drSq < rSq;
  };

  if (geo.index) {
    const oldIdx = geo.index.array;
    const kept: number[] = [];
    for (let i = 0; i < oldIdx.length; i += 3) {
      const ia = oldIdx[i];
      const ib = oldIdx[i + 1];
      const ic = oldIdx[i + 2];
      if (!shouldRemoveTri(ia, ib, ic)) {
        kept.push(ia, ib, ic);
      }
    }
    if (kept.length !== oldIdx.length) {
      geo.setIndex(kept);
      geo.computeBoundingSphere();
    }
  } else {
    // Convert non-indexed into indexed filtering or rebuild position/normal/uv
    const count = posAttr.count;
    const keptIndices: number[] = [];
    for (let i = 0; i < count; i += 3) {
      if (!shouldRemoveTri(i, i + 1, i + 2)) {
        keptIndices.push(i, i + 1, i + 2);
      }
    }
    if (keptIndices.length !== count) {
      geo.setIndex(keptIndices);
      geo.computeBoundingSphere();
    }
  }
}

/**
 * Locates the static factory gearshift (boot, shaft, knob, and shift-pattern cap)
 * inside SM_Body_101 meshes, removes its triangles cleanly without touching seats
 * or console trim, and returns its exact world-space base position and scale.
 */
function findAndCarveOriginalGearshift(
  bodyCabinMeshes: THREE.Mesh[]
): { basePos: THREE.Vector3; scale: number } {
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  // 1. Measure the factory gearshift cluster inside SM_Body_101 (dead center tunnel at x~0, z~0.31)
  let sumX = 0;
  let sumZ = 0;
  let count = 0;
  let bootMinY = Infinity;
  let knobMaxY = -Infinity;

  for (const mesh of bodyCabinMeshes) {
    const mName = (Array.isArray(mesh.material) ? mesh.material[0]?.name : mesh.material?.name || '').toLowerCase();
    if (!mName.includes('cabin1') && !mName.includes('cabin_leather_a1') && !mName.includes('cabin_a1')) {
      continue;
    }
    const posAttr = mesh.geometry.attributes.position;
    if (!posAttr) continue;
    mesh.updateMatrixWorld(true);
    for (let i = 0; i < posAttr.count; i++) {
      va.fromBufferAttribute(posAttr, i).applyMatrix4(mesh.matrixWorld);
      if (va.x > -0.065 && va.x < 0.065 && va.z > 0.25 && va.z < 0.38 && va.y > 0.455 && va.y < 0.720) {
        if (mName.includes('cabin1') || mName.includes('cabin_a1')) {
          sumX += va.x;
          sumZ += va.z;
          count++;
        }
        bootMinY = Math.min(bootMinY, va.y);
        knobMaxY = Math.max(knobMaxY, va.y);
      }
    }
  }

  const gearX = count > 0 ? sumX / count : 0.0;
  const gearZ = count > 0 ? sumZ / count : 0.311;
  const tunnelY = bootMinY < Infinity ? bootMinY : 0.460;
  const topY = knobMaxY > -Infinity ? knobMaxY : 0.708;

  // 2. Carve out ONLY triangles belonging to the factory gearshift (tight box around boot + knob)
  const carveMinX = gearX - 0.068;
  const carveMaxX = gearX + 0.068;
  const carveMinZ = gearZ - 0.068;
  const carveMaxZ = gearZ + 0.068;
  const carveMinY = tunnelY - 0.002;
  const carveMaxY = topY + 0.008;

  for (const mesh of bodyCabinMeshes) {
    const mName = (Array.isArray(mesh.material) ? mesh.material[0]?.name : mesh.material?.name || '').toLowerCase();
    if (!mName.includes('cabin1') && !mName.includes('cabin_leather_a1') && !mName.includes('cabin_a1')) {
      continue;
    }
    const geo = mesh.geometry;
    const posAttr = geo.attributes.position;
    if (!posAttr) continue;
    mesh.updateMatrixWorld(true);

    const shouldRemoveTri = (ia: number, ib: number, ic: number): boolean => {
      va.fromBufferAttribute(posAttr, ia).applyMatrix4(mesh.matrixWorld);
      vb.fromBufferAttribute(posAttr, ib).applyMatrix4(mesh.matrixWorld);
      vc.fromBufferAttribute(posAttr, ic).applyMatrix4(mesh.matrixWorld);
      centroid.copy(va).add(vb).add(vc).multiplyScalar(1 / 3);
      return (
        centroid.x >= carveMinX &&
        centroid.x <= carveMaxX &&
        centroid.z >= carveMinZ &&
        centroid.z <= carveMaxZ &&
        centroid.y >= carveMinY &&
        centroid.y <= carveMaxY
      );
    };

    if (geo.index) {
      const oldIdx = geo.index.array;
      const kept: number[] = [];
      for (let i = 0; i < oldIdx.length; i += 3) {
        if (!shouldRemoveTri(oldIdx[i], oldIdx[i + 1], oldIdx[i + 2])) {
          kept.push(oldIdx[i], oldIdx[i + 1], oldIdx[i + 2]);
        }
      }
      if (kept.length !== oldIdx.length) {
        geo.setIndex(kept);
        geo.computeBoundingSphere();
      }
    } else {
      const keptIndices: number[] = [];
      for (let i = 0; i < posAttr.count; i += 3) {
        if (!shouldRemoveTri(i, i + 1, i + 2)) {
          keptIndices.push(i, i + 1, i + 2);
        }
      }
      if (keptIndices.length !== posAttr.count) {
        geo.setIndex(keptIndices);
        geo.computeBoundingSphere();
      }
    }
  }

  const origHeight = Math.max(0.18, topY - tunnelY);
  // Nominal remodeled Q-Branch gearstick height from tunnelY to cap top is ~0.248m
  const scale = THREE.MathUtils.clamp(origHeight / 0.248, 0.88, 1.10);
  return {
    basePos: new THREE.Vector3(gearX, tunnelY, gearZ),
    scale,
  };
}

export const DB5Viewport: React.FC<DB5ViewportProps> = ({
  explode,
  gunDeploy,
  isFiringGuns,
  qBranchState,
  visibleSubsystems,
  selectedPartId,
  hoveredPartId,
  isolatedPartId,
  qBranchHighlight,
  cameraTargetRequest,
  onPartsLoaded,
  onSelectPart,
  onHoverPart,
  onCabinAction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for animation loop access without re-creating scene
  const explodeRef = useRef(explode);
  const gunDeployRef = useRef(gunDeploy);
  const isFiringGunsRef = useRef(isFiringGuns);
  const qBranchStateRef = useRef(qBranchState);
  const onCabinActionRef = useRef(onCabinAction);
  const visibleSubsystemsRef = useRef(visibleSubsystems);
  const selectedPartIdRef = useRef(selectedPartId);
  const hoveredPartIdRef = useRef(hoveredPartId);
  const isolatedPartIdRef = useRef(isolatedPartId);
  const qBranchHighlightRef = useRef(qBranchHighlight);

  explodeRef.current = explode;
  gunDeployRef.current = gunDeploy;
  isFiringGunsRef.current = isFiringGuns;
  qBranchStateRef.current = qBranchState;
  onCabinActionRef.current = onCabinAction;
  visibleSubsystemsRef.current = visibleSubsystems;
  selectedPartIdRef.current = selectedPartId;
  hoveredPartIdRef.current = hoveredPartId;
  isolatedPartIdRef.current = isolatedPartId;
  qBranchHighlightRef.current = qBranchHighlight;

  const partsRef = useRef<InternalPart[]>([]);
  const gunRigsRef = useRef<GunRig[]>([]);
  const cabinRigRef = useRef<QBranchCabinRig | null>(null);
  const gadgetsRigRef = useRef<QBranchGadgetsRig | null>(null);
  const cameraGoalRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Trigger camera transition when requested
  useEffect(() => {
    if (!cameraTargetRequest) return;
    cameraGoalRef.current = {
      pos: new THREE.Vector3(...cameraTargetRequest.position),
      target: new THREE.Vector3(...cameraTargetRequest.target),
    };
  }, [cameraTargetRequest]);

  // Apply visual states (visibility, isolation, highlight) whenever relevant props change
  useEffect(() => {
    const parts = partsRef.current;
    if (!parts.length) return;

    const vis = visibleSubsystems;
    const sel = selectedPartId;
    const hov = hoveredPartId;
    const iso = isolatedPartId;
    const qMode = qBranchHighlight;

    for (const part of parts) {
      const subsystemVisible = vis.has(part.subsystem);
      part.mesh.visible = subsystemVisible;
      if (!subsystemVisible) continue;

      const isSelected = part.id === sel;
      const isHovered = part.id === hov;
      const isIsolated = part.id === iso;
      const dimmedByIsolation = iso !== null && !isIsolated;

      part.originalMaterials.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial)) {
          return;
        }

        // Store original opacity/transparent on userData once
        if (mat.userData.origOpacity === undefined) {
          mat.userData.origOpacity = mat.opacity;
          mat.userData.origTransparent = mat.transparent;
          mat.userData.origEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000);
          mat.userData.origEmissiveIntensity = mat.emissiveIntensity ?? 1;
        }

        if (dimmedByIsolation) {
          mat.transparent = true;
          mat.opacity = 0.08;
          mat.depthWrite = false;
        } else {
          mat.transparent = mat.userData.origTransparent;
          mat.opacity = mat.userData.origOpacity;
          mat.depthWrite = !mat.userData.origTransparent;
        }

        if (isSelected) {
          mat.emissive.set('#f59e0b');
          mat.emissiveIntensity = 0.16;
        } else if (isHovered) {
          mat.emissive.set('#38bdf8');
          mat.emissiveIntensity = 0.12;
        } else if (qMode && part.isQBranch && !dimmedByIsolation) {
          mat.emissive.set('#d97706');
          mat.emissiveIntensity = 0.14;
        } else {
          mat.emissive.copy(mat.userData.origEmissive);
          mat.emissiveIntensity = mat.userData.origEmissiveIntensity;
        }
        mat.needsUpdate = true;
      });
    }
  }, [visibleSubsystems, selectedPartId, hoveredPartId, isolatedPartId, qBranchHighlight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090b0f');
    scene.fog = new THREE.FogExp2('#090b0f', 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 100);
    camera.position.set(4.2, 2.0, 4.6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Neutral Automotive Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const studioEnv = createAutomotiveStudioEnv();
    scene.environment = pmremGenerator.fromScene(studioEnv, 0.04).texture;

    // Neutral Key & Rim Studio Lights
    const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0x0f172a, 0.55);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    const d = 4;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe2e8f0, 0.85);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // Subtle Blueprint Floor Grid + Shadow Receiver
    const grid = new THREE.GridHelper(18, 36, 0x334155, 0x1e293b);
    grid.position.y = 0;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.45;
    scene.add(grid);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.ShadowMaterial({ opacity: 0.45 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.001;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.65, 0);
    controls.minDistance = 0.25;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.update();
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      cameraGoalRef.current = null;
    });

    // Load DB5 GLB
    const loader = new GLTFLoader();
    let disposed = false;

    loader.load(
      '/models/db5.glb',
      (gltf) => {
        if (disposed) return;

        const root = gltf.scene;

        // Compute raw bounding box & normalize scale
        const rawBox = new THREE.Box3().setFromObject(root);
        const rawSize = new THREE.Vector3();
        rawBox.getSize(rawSize);
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
        const normScale = 4.6 / maxDim;
        root.scale.setScalar(normScale);
        root.updateMatrixWorld(true);

        // Align longest horizontal axis to Z
        if (rawSize.x > rawSize.z) {
          root.rotation.y = Math.PI / 2;
          root.updateMatrixWorld(true);
        }

        // Verify front/rear orientation using hood vs trunk Z
        let hoodZ = 0;
        let trunkZ = 0;
        root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const name = obj.name.toLowerCase();
            const box = new THREE.Box3().setFromObject(obj);
            const c = new THREE.Vector3();
            box.getCenter(c);
            if (name.includes('hood') && hoodZ === 0) hoodZ = c.z;
            if (name.includes('trunk') && trunkZ === 0) trunkZ = c.z;
          }
        });
        if (hoodZ < trunkZ) {
          root.rotation.y += Math.PI;
          root.updateMatrixWorld(true);
        }

        // Center horizontally at (0,0) and sit bottom on y = 0.02
        const alignedBox = new THREE.Box3().setFromObject(root);
        const alignedCenter = new THREE.Vector3();
        alignedBox.getCenter(alignedCenter);
        root.position.x -= alignedCenter.x;
        root.position.z -= alignedCenter.z;
        root.position.y -= alignedBox.min.y - 0.02;
        root.updateMatrixWorld(true);

        scene.add(root);

        // Final car center for radial fallback
        const carBox = new THREE.Box3().setFromObject(root);
        const carCenter = new THREE.Vector3();
        carBox.getCenter(carCenter);

        // 1. Find exact world-space centers of the front indicator lights (SM_Roof_101_..._014 & 015)
        //    and hide the static indicator meshes so our hinged Lucas assemblies replace them cleanly.
        const leftIndBox = new THREE.Box3();
        const rightIndBox = new THREE.Box3();
        const wingBodyMeshes: THREE.Mesh[] = [];
        const vTemp = new THREE.Vector3();

        root.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          const n = obj.name.toLowerCase();
          if (n.includes('sm_roof_101') && (n.includes('014_glass') || n.includes('015_db5'))) {
            obj.visible = false;
            obj.userData.replacedByGunPort = true;
            const posAttr = obj.geometry.attributes.position;
            if (posAttr) {
              obj.updateMatrixWorld(true);
              for (let vi = 0; vi < posAttr.count; vi++) {
                vTemp.fromBufferAttribute(posAttr, vi).applyMatrix4(obj.matrixWorld);
                if (vTemp.x < 0) leftIndBox.expandByPoint(vTemp);
                else rightIndBox.expandByPoint(vTemp);
              }
            }
          } else if (n.includes('sm_roof_101') && (n.includes('013_db5') || n.includes('011_db5'))) {
            wingBodyMeshes.push(obj);
          }
        });

        const leftIndCenter = new THREE.Vector3();
        const rightIndCenter = new THREE.Vector3();
        leftIndBox.getCenter(leftIndCenter);
        rightIndBox.getCenter(rightIndCenter);

        const portRadius = Math.max(
          0.025,
          ((leftIndBox.max.x - leftIndBox.min.x) + (rightIndBox.max.x - rightIndBox.min.x)) * 0.25
        );

        // Carve circular gun-port holes through the front wing bodywork behind both indicators
        for (const bodyMesh of wingBodyMeshes) {
          carveGunPortHoles(bodyMesh, leftIndCenter, rightIndCenter, portRadius * 0.94);
        }

        // Carve recessed boot-deck slot for the bullet-resistant rear shield in SK_Trunk_101
        root.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          const n = obj.name.toLowerCase();
          const m = (Array.isArray(obj.material) ? obj.material[0]?.name : obj.material?.name || '').toLowerCase();
          if (!n.includes('sk_trunk_101') || !m.includes('133001')) return;
          const geo = obj.geometry;
          const posAttr = geo.attributes.position;
          if (!posAttr) return;
          const v = new THREE.Vector3();
          const isSlotTri = (i0: number, i1: number, i2: number) => {
            const c = new THREE.Vector3();
            for (const ii of [i0, i1, i2]) {
              v.fromBufferAttribute(posAttr, ii).applyMatrix4(obj.matrixWorld);
              c.add(v);
            }
            c.divideScalar(3);
            return Math.abs(c.x) < 0.355 && c.z > -1.725 && c.z < -1.695 && c.y > 0.90;
          };
          if (geo.index) {
            const oldIdx = geo.index.array;
            const kept: number[] = [];
            for (let i = 0; i < oldIdx.length; i += 3) {
              if (!isSlotTri(oldIdx[i], oldIdx[i + 1], oldIdx[i + 2])) {
                kept.push(oldIdx[i], oldIdx[i + 1], oldIdx[i + 2]);
              }
            }
            if (kept.length !== oldIdx.length) {
              geo.setIndex(kept);
              geo.computeBoundingSphere();
            }
          }
        });

        const internalParts: InternalPart[] = [];
        let idx = 0;

        root.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          if (obj.userData.replacedByGunPort) return;

          obj.castShadow = true;
          obj.receiveShadow = true;

          // Clone materials so each mesh has independent opacity/emissive state
          const rawMats = Array.isArray(obj.material) ? obj.material : [obj.material];
          const clonedMats = rawMats.map((m) => {
            const matName = (m?.name || '').toLowerCase();
            // Convert factory dark-teal coachwork (MI_1330010001_004) to iconic Aston Martin Silver Birch metallic clearcoat
            if (matName.includes('1330010001') && m instanceof THREE.MeshStandardMaterial) {
              const silverBirch = new THREE.MeshPhysicalMaterial({
                name: m.name,
                color: new THREE.Color('#aeb6bc'),
                metalness: 0.82,
                roughness: 0.2,
                clearcoat: 1.0,
                clearcoatRoughness: 0.05,
                envMapIntensity: 1.25,
                normalMap: m.normalMap,
                normalScale: m.normalScale ? m.normalScale.clone() : new THREE.Vector2(1, 1),
                aoMap: m.aoMap,
                aoMapIntensity: m.aoMapIntensity,
              });
              return silverBirch;
            }
            return m.clone();
          });
          obj.material = Array.isArray(obj.material) ? clonedMats : clonedMats[0];

          const primaryMatName = rawMats[0]?.name || 'Default';
          const partName = obj.name || `Mesh_${idx}`;
          const classification = classifyMesh(partName, primaryMatName);

          // Compute mesh world center
          const meshBox = new THREE.Box3().setFromObject(obj);
          const meshCenter = new THREE.Vector3();
          meshBox.getCenter(meshCenter);

          // Compute radial vector from car center
          const radial = meshCenter.clone().sub(carCenter);
          if (radial.lengthSq() < 0.0001) {
            radial.set(0, 0.2, 0);
          } else {
            radial.normalize();
          }

          // Combine semantic explosion direction + subtle radial separation
          // Convert world-space offset into the mesh parent's local space!
          const worldExplodeVec = new THREE.Vector3(...classification.semanticDir)
            .multiplyScalar(1.15)
            .addScaledVector(radial, 0.35);

          const parentWorldQuat = new THREE.Quaternion();
          const parentWorldScale = new THREE.Vector3();
          const parentWorldPos = new THREE.Vector3();
          if (obj.parent) {
            obj.parent.matrixWorld.decompose(parentWorldPos, parentWorldQuat, parentWorldScale);
          }
          const localExplodeVec = worldExplodeVec
            .clone()
            .applyQuaternion(parentWorldQuat.clone().invert())
            .divide(parentWorldScale);

          const geo = obj.geometry;
          const triCount = geo.index
            ? Math.round(geo.index.count / 3)
            : Math.round((geo.attributes.position?.count || 0) / 3);

          const id = `part-${idx++}`;
          obj.userData.partId = id;

          internalParts.push({
            id,
            meshName: partName,
            materialName: primaryMatName,
            label: classification.label,
            subsystem: classification.subsystem,
            materialLabel: classification.materialLabel,
            isQBranch: Boolean(classification.isQBranch),
            qBranchNote: classification.qBranchNote,
            triangleCount: triCount,
            worldCenter: meshCenter,
            mesh: obj,
            basePosition: obj.position.clone(),
            explodeOffset: localExplodeVec,
            originalMaterials: clonedMats,
          });
        });

        const leftRig = createBrowningGunRig('left', leftIndCenter, portRadius);
        const rightRig = createBrowningGunRig('right', rightIndCenter, portRadius);
        scene.add(leftRig.root);
        scene.add(rightRig.root);
        leftRig.root.updateMatrixWorld(true);
        rightRig.root.updateMatrixWorld(true);
        gunRigsRef.current = [leftRig, rightRig];

        for (const rig of gunRigsRef.current) {
          for (const sub of rig.subParts) {
            const rawMats = Array.isArray(sub.mesh.material) ? sub.mesh.material : [sub.mesh.material];
            const clonedMats = rawMats.map((m) => m.clone());
            sub.mesh.material = Array.isArray(sub.mesh.material) ? clonedMats : clonedMats[0];

            const meshBox = new THREE.Box3().setFromObject(sub.mesh);
            const meshCenter = new THREE.Vector3();
            meshBox.getCenter(meshCenter);

            const worldExplodeVec = new THREE.Vector3(...sub.semanticDir).multiplyScalar(0.85);
            const parentWorldQuat = new THREE.Quaternion();
            const parentWorldScale = new THREE.Vector3();
            const parentWorldPos = new THREE.Vector3();
            if (sub.mesh.parent) {
              sub.mesh.parent.matrixWorld.decompose(parentWorldPos, parentWorldQuat, parentWorldScale);
            }
            const localExplodeVec = worldExplodeVec
              .clone()
              .applyQuaternion(parentWorldQuat.clone().invert())
              .divide(parentWorldScale);

            const geo = sub.mesh.geometry;
            const triCount = geo.index
              ? Math.round(geo.index.count / 3)
              : Math.round((geo.attributes.position?.count || 0) / 3);

            const id = `part-${idx++}`;
            sub.mesh.userData.partId = id;

            internalParts.push({
              id,
              meshName: `${rig.root.name}:${sub.label}`,
              materialName: sub.materialLabel,
              label: sub.label,
              subsystem: 'qbranch_weapons',
              materialLabel: sub.materialLabel,
              isQBranch: true,
              qBranchNote: sub.qBranchNote,
              triangleCount: triCount,
              worldCenter: meshCenter,
              mesh: sub.mesh,
              basePosition: sub.mesh.position.clone(),
              explodeOffset: localExplodeVec,
              originalMaterials: clonedMats,
            });
          }
        }

        // 2. Q-Branch Cabin Controls: filter strictly to SM_Body_101 (never door meshes)
        const cabinMeshes: THREE.Mesh[] = [];
        root.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          if (!obj.name.toLowerCase().includes('sm_body_101')) return;
          const mName = (Array.isArray(obj.material) ? obj.material[0]?.name : obj.material?.name || '').toLowerCase();
          if (
            mName.includes('cabin_carpet') ||
            mName.includes('cabin_a1') ||
            mName.includes('cabin1') ||
            mName.includes('cabin_leather_a1') ||
            mName.includes('plastics')
          ) {
            cabinMeshes.push(obj);
          }
        });

        const { basePos: gearPos, scale: gearScale } = findAndCarveOriginalGearshift(cabinMeshes);

        const carpetMeshes = cabinMeshes.filter((m) => {
          const mn = (Array.isArray(m.material) ? m.material[0]?.name : m.material?.name || '').toLowerCase();
          return mn.includes('carpet');
        });
        const tunnelRay = new THREE.Raycaster();
        const downDir = new THREE.Vector3(0, -1, 0);
        const measureTunnelY = (x: number, z: number, fallbackY: number): number => {
          tunnelRay.set(new THREE.Vector3(x, 0.75, z), downDir);
          const hits = tunnelRay.intersectObjects(carpetMeshes.length ? carpetMeshes : cabinMeshes, false);
          return hits.length > 0 ? hits[0].point.y : fallbackY;
        };

        const armrestZ = -0.06;
        const armrestPos = new THREE.Vector3(0, measureTunnelY(0, armrestZ, 0.44), armrestZ);
        const cabinRig = createQBranchCabinRig(gearPos, armrestPos, gearScale);
        scene.add(cabinRig.root);
        cabinRig.root.updateMatrixWorld(true);
        cabinRigRef.current = cabinRig;

        const registerProceduralSubParts = (
          rootName: string,
          subsystem: SubsystemId,
          subs: Array<{
            mesh: THREE.Mesh;
            label: string;
            materialLabel: string;
            qBranchNote: string;
            semanticDir: [number, number, number];
            action?: CabinSubPart['action'];
          }>
        ) => {
          for (const sub of subs) {
            const rawMats = Array.isArray(sub.mesh.material) ? sub.mesh.material : [sub.mesh.material];
            const clonedMats = rawMats.map((m) => m.clone());
            sub.mesh.material = Array.isArray(sub.mesh.material) ? clonedMats : clonedMats[0];

            const meshBox = new THREE.Box3().setFromObject(sub.mesh);
            const meshCenter = new THREE.Vector3();
            meshBox.getCenter(meshCenter);

            const worldExplodeVec = new THREE.Vector3(...sub.semanticDir).multiplyScalar(0.85);
            const parentWorldQuat = new THREE.Quaternion();
            const parentWorldScale = new THREE.Vector3();
            const parentWorldPos = new THREE.Vector3();
            if (sub.mesh.parent) {
              sub.mesh.parent.matrixWorld.decompose(parentWorldPos, parentWorldQuat, parentWorldScale);
            }
            const localExplodeVec = worldExplodeVec
              .clone()
              .applyQuaternion(parentWorldQuat.clone().invert())
              .divide(parentWorldScale);

            const geo = sub.mesh.geometry;
            const triCount = geo.index
              ? Math.round(geo.index.count / 3)
              : Math.round((geo.attributes.position?.count || 0) / 3);

            const id = `part-${idx++}`;
            sub.mesh.userData.partId = id;
            if (sub.action) {
              sub.mesh.userData.cabinAction = sub.action;
            }

            internalParts.push({
              id,
              meshName: `${rootName}:${sub.label}`,
              materialName: sub.materialLabel,
              label: sub.label,
              subsystem,
              materialLabel: sub.materialLabel,
              isQBranch: true,
              qBranchNote: sub.qBranchNote,
              triangleCount: triCount,
              worldCenter: meshCenter,
              mesh: sub.mesh,
              basePosition: sub.mesh.position.clone(),
              explodeOffset: localExplodeVec,
              originalMaterials: clonedMats,
            });
          }
        };

        registerProceduralSubParts(cabinRig.root.name, 'qbranch_cockpit', cabinRig.subParts);

        // 3. Q-Branch Exterior Gadgets (Revolving Plates, Rams, Bullet Shield, Smoke, Oil, Roof Hatch)
        const gadgetsRig = createQBranchGadgetsRig();
        scene.add(gadgetsRig.root);
        gadgetsRig.root.updateMatrixWorld(true);
        gadgetsRigRef.current = gadgetsRig;
        registerProceduralSubParts(gadgetsRig.root.name, 'qbranch_gadgets', gadgetsRig.subParts);

        partsRef.current = internalParts;
        onPartsLoaded(
          internalParts.map(({ mesh: _m, basePosition: _b, explodeOffset: _e, originalMaterials: _o, ...rest }) => rest)
        );
      },
      undefined,
      (err) => {
        if (disposed) return;
        console.error('Failed to load DB5 GLB:', err);
        onPartsLoaded([], err instanceof Error ? err.message : 'Failed to load 3D model');
      }
    );

    // Raycasting for hover & click
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const getHitObject = (clientX: number, clientY: number): THREE.Object3D | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const visibleMeshes = partsRef.current
        .filter((p) => p.mesh.visible)
        .map((p) => p.mesh);

      const hits = raycaster.intersectObjects(visibleMeshes, false);
      return hits.length > 0 ? hits[0].object : null;
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const hitObj = getHitObject(e.clientX, e.clientY);
      const hitId = (hitObj?.userData.partId as string) || null;
      renderer.domElement.style.cursor = hitId ? 'pointer' : 'grab';
      onHoverPart(hitId, hitId ? { x: e.clientX, y: e.clientY } : undefined);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 5) return; // Was an orbit drag, not a click

      const hitObj = getHitObject(e.clientX, e.clientY);
      const hitId = (hitObj?.userData.partId as string) || null;
      const cabinAction = hitObj?.userData.cabinAction as CabinSubPart['action'] | undefined;
      if (cabinAction) {
        onCabinActionRef.current(cabinAction);
      }
      onSelectPart(hitId);
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation loop
    let animId = 0;
    let currentExplode = explodeRef.current;
    let currentGunDeploy = gunDeployRef.current;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.elapsedTime;

      // Smoothly lerp gun deployment & firing recoil
      currentGunDeploy += (gunDeployRef.current - currentGunDeploy) * 0.14;
      for (const rig of gunRigsRef.current) {
        updateBrowningGunRig(
          rig,
          currentGunDeploy,
          isFiringGunsRef.current,
          elapsed,
          currentExplode > 0.01
        );
      }

      if (cabinRigRef.current) {
        updateQBranchCabinRig(cabinRigRef.current, qBranchStateRef.current);
      }

      if (gadgetsRigRef.current) {
        updateQBranchGadgetsRig(gadgetsRigRef.current, qBranchStateRef.current, dt);
      }

      // Smoothly lerp explode factor
      const targetExplode = explodeRef.current;
      currentExplode += (targetExplode - currentExplode) * 0.12;

      for (const part of partsRef.current) {
        // When assembled, animated Q-Branch rigs control their own sub-part transforms
        if (
          (part.subsystem === 'qbranch_weapons' ||
            part.subsystem === 'qbranch_cockpit' ||
            part.subsystem === 'qbranch_gadgets') &&
          targetExplode < 0.01 &&
          currentExplode < 0.01
        ) {
          continue;
        }
        part.mesh.position
          .copy(part.basePosition)
          .addScaledVector(part.explodeOffset, currentExplode);
      }

      // Smoothly lerp camera if a preset/focus goal is active
      if (cameraGoalRef.current) {
        camera.position.lerp(cameraGoalRef.current.pos, 0.08);
        controls.target.lerp(cameraGoalRef.current.target, 0.08);
        if (
          camera.position.distanceTo(cameraGoalRef.current.pos) < 0.02 &&
          controls.target.distanceTo(cameraGoalRef.current.target) < 0.02
        ) {
          cameraGoalRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      controls.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full relative select-none" />;
};
