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
                side: m.side,
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

        // 3. Q-Branch Exterior Gadgets (sample exact SK_Trunk_101 contour, split articulated rear taillights,
        //    and extract the jettisonable passenger roof panel + passenger ejector seat)
        const trunkMeshes: THREE.Mesh[] = [];
        const rearLightMeshes: THREE.Mesh[] = [];
        const roofHatchSourceMeshes: THREE.Mesh[] = [];
        const passengerSeatSourceMeshes: THREE.Mesh[] = [];
        root.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          const n = obj.name.toLowerCase();
          if (n.includes('sk_trunk_101')) trunkMeshes.push(obj);
          if (n.includes('sm_light_b_101')) rearLightMeshes.push(obj);
          if (
            (n.includes('sm_roof_101') && n.includes('013_db5')) ||
            (n.includes('sm_body_101') && n.includes('leather_c1'))
          ) {
            roofHatchSourceMeshes.push(obj);
          }
          if (n.includes('sm_body_101') && n.includes('leather_a1')) {
            passengerSeatSourceMeshes.push(obj);
          }
        });
        const trunkShieldProfile: Array<{ x: number; y: number }> = [];
        const trunkRay = new THREE.Raycaster();
        const trunkDown = new THREE.Vector3(0, -1, 0);
        for (let i = 0; i <= 48; i++) {
          const x = -0.48 + (i / 48) * 0.96;
          trunkRay.set(new THREE.Vector3(x, 1.4, -1.71), trunkDown);
          const hits = trunkRay.intersectObjects(trunkMeshes, false);
          if (hits.length > 0) {
            trunkShieldProfile.push({ x, y: hits[0].point.y });
          }
        }

        /**
         * Exact triangle-level rounded-rectangle clipper: splits straddling triangles
         * along the smooth SDF boundary so both the roof cutout and extracted panel
         * have razor-clean edges and rounded corners with zero sawtooth jaggies.
         */
        const clipMeshByRoundedRect = (
          srcMesh: THREE.Mesh,
          pivot: THREE.Vector3,
          minX: number,
          maxX: number,
          minZ: number,
          maxZ: number,
          cornerR: number,
          minY: number
        ): THREE.Mesh | null => {
          const geo = srcMesh.geometry;
          const posAttr = geo.attributes.position;
          const normAttr = geo.attributes.normal;
          const uvAttr = geo.attributes.uv;
          if (!posAttr) return null;

          srcMesh.updateMatrixWorld(true);
          const invWorld = srcMesh.matrixWorld.clone().invert();
          const normalMat = new THREE.Matrix3().getNormalMatrix(srcMesh.matrixWorld);
          const invNormalMat = normalMat.clone().invert();

          const cx = (minX + maxX) * 0.5;
          const cz = (minZ + maxZ) * 0.5;
          const hw = (maxX - minX) * 0.5;
          const hz = (maxZ - minZ) * 0.5;
          const r = Math.min(cornerR, hw * 0.8, hz * 0.8);

          const sdRect = (x: number, z: number): number => {
            const dx = Math.abs(x - cx) - (hw - r);
            const dz = Math.abs(z - cz) - (hz - r);
            return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0) - r;
          };

          interface ClipVert {
            pos: THREE.Vector3;
            norm: THREE.Vector3;
            uv: THREE.Vector2;
          }

          const readVert = (vi: number): ClipVert => ({
            pos: new THREE.Vector3().fromBufferAttribute(posAttr, vi).applyMatrix4(srcMesh.matrixWorld),
            norm: normAttr
              ? new THREE.Vector3().fromBufferAttribute(normAttr, vi).applyMatrix3(normalMat).normalize()
              : new THREE.Vector3(0, 1, 0),
            uv: uvAttr
              ? new THREE.Vector2(uvAttr.getX(vi), uvAttr.getY(vi))
              : new THREE.Vector2(),
          });

          const intersectEdge = (a: ClipVert, da: number, b: ClipVert, db: number): ClipVert => {
            let lo = 0;
            let hi = 1;
            let t = THREE.MathUtils.clamp(da / (da - db), 0, 1);
            // 4 bisection steps refine exact intersection on curved corners
            for (let k = 0; k < 4; k++) {
              const px = THREE.MathUtils.lerp(a.pos.x, b.pos.x, t);
              const pz = THREE.MathUtils.lerp(a.pos.z, b.pos.z, t);
              const d = sdRect(px, pz);
              if (Math.abs(d) < 1e-5) break;
              if ((d < 0) === (da < 0)) {
                lo = t;
              } else {
                hi = t;
              }
              t = 0.5 * (lo + hi);
            }
            return {
              pos: a.pos.clone().lerp(b.pos, t),
              norm: a.norm.clone().lerp(b.norm, t).normalize(),
              uv: a.uv.clone().lerp(b.uv, t),
            };
          };

          const outerTris: Array<[ClipVert, ClipVert, ClipVert]> = [];
          const innerTris: Array<[ClipVert, ClipVert, ClipVert]> = [];
          const triCount = geo.index ? geo.index.count / 3 : posAttr.count / 3;

          const midVert = (a: ClipVert, b: ClipVert): ClipVert => ({
            pos: a.pos.clone().lerp(b.pos, 0.5),
            norm: a.norm.clone().lerp(b.norm, 0.5).normalize(),
            uv: a.uv.clone().lerp(b.uv, 0.5),
          });

          // Adaptive 1-to-4 subdivision near the SDF boundary so curved corners clip CNC-smooth
          const processTri = (v0: ClipVert, v1: ClipVert, v2: ClipVert, depth: number) => {
            const avgY = (v0.pos.y + v1.pos.y + v2.pos.y) / 3;
            if (avgY < minY) {
              outerTris.push([v0, v1, v2]);
              return;
            }

            const d0 = sdRect(v0.pos.x, v0.pos.z);
            const d1 = sdRect(v1.pos.x, v1.pos.z);
            const d2 = sdRect(v2.pos.x, v2.pos.z);

            const in0 = d0 < 0;
            const in1 = d1 < 0;
            const in2 = d2 < 0;
            const straddles = !(in0 && in1 && in2) && (in0 || in1 || in2);
            const nearBoundary = Math.min(Math.abs(d0), Math.abs(d1), Math.abs(d2)) < 0.09;

            if (depth > 0 && (straddles || nearBoundary)) {
              const m01 = midVert(v0, v1);
              const m12 = midVert(v1, v2);
              const m20 = midVert(v2, v0);
              processTri(v0, m01, m20, depth - 1);
              processTri(m01, v1, m12, depth - 1);
              processTri(m20, m12, v2, depth - 1);
              processTri(m01, m12, m20, depth - 1);
              return;
            }

            if (in0 && in1 && in2) {
              innerTris.push([v0, v1, v2]);
            } else if (!in0 && !in1 && !in2) {
              outerTris.push([v0, v1, v2]);
            } else {
              // Rotate vertices so vA is the lone vertex on its side of the boundary
              const verts: [ClipVert, ClipVert, ClipVert] = [v0, v1, v2];
              const dists: [number, number, number] = [d0, d1, d2];
              const ins: [boolean, boolean, boolean] = [in0, in1, in2];
              const inCount = (in0 ? 1 : 0) + (in1 ? 1 : 0) + (in2 ? 1 : 0);
              const loneIsIn = inCount === 1;
              let loneIdx = 0;
              for (let k = 0; k < 3; k++) {
                if (ins[k] === loneIsIn) {
                  loneIdx = k;
                  break;
                }
              }
              const vA = verts[loneIdx];
              const vB = verts[(loneIdx + 1) % 3];
              const vC = verts[(loneIdx + 2) % 3];
              const dA = dists[loneIdx];
              const dB = dists[(loneIdx + 1) % 3];
              const dC = dists[(loneIdx + 2) % 3];

              const pAB = intersectEdge(vA, dA, vB, dB);
              const pAC = intersectEdge(vA, dA, vC, dC);

              if (loneIsIn) {
                innerTris.push([vA, pAB, pAC]);
                outerTris.push([pAB, vB, vC]);
                outerTris.push([pAB, vC, pAC]);
              } else {
                outerTris.push([vA, pAB, pAC]);
                innerTris.push([pAB, vB, vC]);
                innerTris.push([pAB, vC, pAC]);
              }
            }
          };

          for (let t = 0; t < triCount; t++) {
            const i0 = geo.index ? geo.index.getX(t * 3) : t * 3;
            const i1 = geo.index ? geo.index.getX(t * 3 + 1) : t * 3 + 1;
            const i2 = geo.index ? geo.index.getX(t * 3 + 2) : t * 3 + 2;
            processTri(readVert(i0), readVert(i1), readVert(i2), 3);
          }

          if (innerTris.length === 0) return null;

          // Rebuild outer mesh in srcMesh local space
          const outP = new Float32Array(outerTris.length * 9);
          const outN = normAttr ? new Float32Array(outerTris.length * 9) : null;
          const outU = uvAttr ? new Float32Array(outerTris.length * 6) : null;
          const localP = new THREE.Vector3();
          const localN = new THREE.Vector3();
          let oi = 0;
          let ou = 0;
          for (const tri of outerTris) {
            for (const cv of tri) {
              localP.copy(cv.pos).applyMatrix4(invWorld);
              outP[oi] = localP.x;
              outP[oi + 1] = localP.y;
              outP[oi + 2] = localP.z;
              if (outN) {
                localN.copy(cv.norm).applyMatrix3(invNormalMat).normalize();
                outN[oi] = localN.x;
                outN[oi + 1] = localN.y;
                outN[oi + 2] = localN.z;
              }
              if (outU) {
                outU[ou] = cv.uv.x;
                outU[ou + 1] = cv.uv.y;
                ou += 2;
              }
              oi += 3;
            }
          }
          const newOuterGeo = new THREE.BufferGeometry();
          newOuterGeo.setAttribute('position', new THREE.BufferAttribute(outP, 3));
          if (outN) newOuterGeo.setAttribute('normal', new THREE.BufferAttribute(outN, 3));
          if (outU) {
            newOuterGeo.setAttribute('uv', new THREE.BufferAttribute(outU, 2));
            newOuterGeo.setAttribute('uv2', new THREE.BufferAttribute(outU, 2));
          }
          newOuterGeo.computeBoundingSphere();
          srcMesh.geometry.dispose();
          srcMesh.geometry = newOuterGeo;

          // Build inner panel mesh centered at pivot
          // If srcMesh has a negative matrixWorld determinant (mirrored scale), flip triangle winding (1 <-> 2)
          // so world-space triangles keep their true outward front-face winding!
          const flipWinding = srcMesh.matrixWorld.determinant() < 0;
          const inP = new Float32Array(innerTris.length * 9);
          const inN = normAttr ? new Float32Array(innerTris.length * 9) : null;
          const inU = uvAttr ? new Float32Array(innerTris.length * 6) : null;
          let ii = 0;
          let iu = 0;
          for (const tri of innerTris) {
            const ordered: [ClipVert, ClipVert, ClipVert] = flipWinding
              ? [tri[0], tri[2], tri[1]]
              : tri;
            for (const cv of ordered) {
              inP[ii] = cv.pos.x - pivot.x;
              inP[ii + 1] = cv.pos.y - pivot.y;
              inP[ii + 2] = cv.pos.z - pivot.z;
              if (inN) {
                inN[ii] = cv.norm.x;
                inN[ii + 1] = cv.norm.y;
                inN[ii + 2] = cv.norm.z;
              }
              if (inU) {
                inU[iu] = cv.uv.x;
                inU[iu + 1] = cv.uv.y;
                iu += 2;
              }
              ii += 3;
            }
          }
          const innerGeo = new THREE.BufferGeometry();
          innerGeo.setAttribute('position', new THREE.BufferAttribute(inP, 3));
          if (inN) innerGeo.setAttribute('normal', new THREE.BufferAttribute(inN, 3));
          if (inU) {
            innerGeo.setAttribute('uv', new THREE.BufferAttribute(inU, 2));
            innerGeo.setAttribute('uv2', new THREE.BufferAttribute(inU, 2));
          }
          innerGeo.computeBoundingSphere();
          const mat = Array.isArray(srcMesh.material)
            ? srcMesh.material.map((m) => m.clone())
            : srcMesh.material.clone();
          return new THREE.Mesh(innerGeo, mat);
        };

        /**
         * Extracts whole connected mesh components belonging to the front passenger bucket seat
         * so no backrest or cushion triangles are ever jaggedly sliced.
         */
        const extractSeatByComponents = (
          srcMesh: THREE.Mesh,
          pivot: THREE.Vector3
        ): THREE.Mesh | null => {
          const geo = srcMesh.geometry;
          const posAttr = geo.attributes.position;
          const normAttr = geo.attributes.normal;
          const uvAttr = geo.attributes.uv;
          if (!posAttr) return null;

          srcMesh.updateMatrixWorld(true);
          const normalMat = new THREE.Matrix3().getNormalMatrix(srcMesh.matrixWorld);
          const triCount = geo.index ? geo.index.count / 3 : posAttr.count / 3;

          // Build vertex-to-vertex adjacency across triangles
          const vCount = posAttr.count;
          const adj: number[][] = Array.from({ length: vCount }, () => []);
          for (let t = 0; t < triCount; t++) {
            const a = geo.index ? geo.index.getX(t * 3) : t * 3;
            const b = geo.index ? geo.index.getX(t * 3 + 1) : t * 3 + 1;
            const c = geo.index ? geo.index.getX(t * 3 + 2) : t * 3 + 2;
            adj[a].push(b, c);
            adj[b].push(a, c);
            adj[c].push(a, b);
          }

          const compId = new Int32Array(vCount).fill(-1);
          const compIsPassengerSeat: boolean[] = [];
          const vTmp = new THREE.Vector3();
          let cIdx = 0;

          for (let i = 0; i < vCount; i++) {
            if (compId[i] !== -1) continue;
            const queue = [i];
            compId[i] = cIdx;
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;
            let head = 0;
            while (head < queue.length) {
              const u = queue[head++];
              vTmp.fromBufferAttribute(posAttr, u).applyMatrix4(srcMesh.matrixWorld);
              if (vTmp.x < minX) minX = vTmp.x;
              if (vTmp.x > maxX) maxX = vTmp.x;
              if (vTmp.y < minY) minY = vTmp.y;
              if (vTmp.y > maxY) maxY = vTmp.y;
              if (vTmp.z < minZ) minZ = vTmp.z;
              if (vTmp.z > maxZ) maxZ = vTmp.z;
              for (const w of adj[u]) {
                if (compId[w] === -1) {
                  compId[w] = cIdx;
                  queue.push(w);
                }
              }
            }
            const isSeat =
              minX > 0.04 &&
              maxX < 0.63 &&
              minY > 0.30 &&
              maxY < 0.96 &&
              minZ > -0.505 &&
              maxZ < 0.30;
            compIsPassengerSeat.push(isSeat);
            cIdx++;
          }

          const extractedTris: Array<[number, number, number]> = [];
          const keptIdx: number[] = [];
          for (let t = 0; t < triCount; t++) {
            const a = geo.index ? geo.index.getX(t * 3) : t * 3;
            const b = geo.index ? geo.index.getX(t * 3 + 1) : t * 3 + 1;
            const c = geo.index ? geo.index.getX(t * 3 + 2) : t * 3 + 2;
            if (compIsPassengerSeat[compId[a]]) {
              extractedTris.push([a, b, c]);
            } else {
              keptIdx.push(a, b, c);
            }
          }

          if (extractedTris.length === 0) return null;

          const flipSeatWinding = srcMesh.matrixWorld.determinant() < 0;
          const outPos = new Float32Array(extractedTris.length * 9);
          const outNorm = normAttr ? new Float32Array(extractedTris.length * 9) : null;
          const outUv = uvAttr ? new Float32Array(extractedTris.length * 6) : null;
          const nTmp2 = new THREE.Vector3();
          let pIdx = 0;
          let uIdx = 0;
          for (const tri of extractedTris) {
            const ordered: [number, number, number] = flipSeatWinding
              ? [tri[0], tri[2], tri[1]]
              : tri;
            for (const vi of ordered) {
              vTmp.fromBufferAttribute(posAttr, vi).applyMatrix4(srcMesh.matrixWorld).sub(pivot);
              outPos[pIdx] = vTmp.x;
              outPos[pIdx + 1] = vTmp.y;
              outPos[pIdx + 2] = vTmp.z;
              if (outNorm && normAttr) {
                nTmp2.fromBufferAttribute(normAttr, vi).applyMatrix3(normalMat).normalize();
                outNorm[pIdx] = nTmp2.x;
                outNorm[pIdx + 1] = nTmp2.y;
                outNorm[pIdx + 2] = nTmp2.z;
              }
              if (outUv && uvAttr) {
                outUv[uIdx] = uvAttr.getX(vi);
                outUv[uIdx + 1] = uvAttr.getY(vi);
                uIdx += 2;
              }
              pIdx += 3;
            }
          }

          geo.setIndex(keptIdx);
          geo.computeBoundingSphere();

          const newGeo = new THREE.BufferGeometry();
          newGeo.setAttribute('position', new THREE.BufferAttribute(outPos, 3));
          if (outNorm) newGeo.setAttribute('normal', new THREE.BufferAttribute(outNorm, 3));
          if (outUv) newGeo.setAttribute('uv', new THREE.BufferAttribute(outUv, 2));
          newGeo.computeBoundingSphere();
          const mat = Array.isArray(srcMesh.material)
            ? srcMesh.material.map((m) => m.clone())
            : srcMesh.material.clone();
          return new THREE.Mesh(newGeo, mat);
        };

        // Exact per-point raycast against roofOuterMeshes BEFORE carving the opening (0.0mm height error)
        const roofOuterMeshes = roofHatchSourceMeshes.filter((m) =>
          m.name.toLowerCase().includes('sm_roof_101')
        );
        const roofSurfaceY = (x: number, z: number): number => {
          trunkRay.set(new THREE.Vector3(x, 1.65, z), trunkDown);
          const hits = trunkRay.intersectObjects(roofOuterMeshes, false);
          if (hits.length > 0) return hits[0].point.y;
          return 1.380 - 0.14 * x * x - 0.08 * (z + 0.18) * (z + 0.18);
        };

        // Extract passenger-side roof panel & inner headliner using exact SDF triangle clipping
        // Bounds stay strictly inside the top roof deck (x ∈ [0.020, 0.440], z ∈ [-0.435, +0.055], r = 0.055)
        const roofPanelCenter = new THREE.Vector3(0.230, roofSurfaceY(0.230, -0.190), -0.190);
        const roofPanelMeshes: THREE.Mesh[] = [];
        for (const rMesh of roofHatchSourceMeshes) {
          const isOuterRoof = rMesh.name.toLowerCase().includes('sm_roof_101');
          const extracted = clipMeshByRoundedRect(
            rMesh,
            roofPanelCenter,
            0.020,
            0.440,
            -0.435,
            0.055,
            0.055,
            1.25
          );
          // Only attach the outer Silver Birch roof panel to roofHatchGroup so the tan headliner never shows or z-fights from outside
          if (extracted && isOuterRoof) roofPanelMeshes.push(extracted);
        }

        // Extract ONLY whole connected components of the front passenger bucket seat (zero jagged backrest cuts)
        const passengerSeatCenter = new THREE.Vector3(0.33, 0.56, -0.14);
        const passengerSeatMeshes: THREE.Mesh[] = [];
        for (const sMesh of passengerSeatSourceMeshes) {
          const extracted = extractSeatByComponents(sMesh, passengerSeatCenter);
          if (extracted) passengerSeatMeshes.push(extracted);
        }

        const leftTopPivotPos = new THREE.Vector3(0.6325, 0.828, -2.168);
        const rightClusterPivotPos = new THREE.Vector3(-0.6325, 0.578, -2.172);
        const leftTopMeshes: THREE.Mesh[] = [];
        const rightClusterMeshes: THREE.Mesh[] = [];

        for (const lightMesh of rearLightMeshes) {
          const geo = lightMesh.geometry;
          const posAttr = geo.attributes.position;
          const normAttr = geo.attributes.normal;
          const uvAttr = geo.attributes.uv;
          if (!posAttr) continue;

          const normalMat = new THREE.Matrix3().getNormalMatrix(lightMesh.matrixWorld);
          const v0 = new THREE.Vector3();
          const v1 = new THREE.Vector3();
          const v2 = new THREE.Vector3();
          const nTmp = new THREE.Vector3();

          const flipLightWinding = lightMesh.matrixWorld.determinant() < 0;
          const buildExtractedMesh = (tris: Array<[number, number, number]>, pivot: THREE.Vector3): THREE.Mesh | null => {
            if (tris.length === 0) return null;
            const outPos = new Float32Array(tris.length * 9);
            const outNorm = normAttr ? new Float32Array(tris.length * 9) : null;
            const outUv = uvAttr ? new Float32Array(tris.length * 6) : null;
            let pIdx = 0;
            let uIdx = 0;
            for (const tri of tris) {
              const ordered: [number, number, number] = flipLightWinding
                ? [tri[0], tri[2], tri[1]]
                : tri;
              for (const vi of ordered) {
                v0.fromBufferAttribute(posAttr, vi).applyMatrix4(lightMesh.matrixWorld).sub(pivot);
                outPos[pIdx] = v0.x;
                outPos[pIdx + 1] = v0.y;
                outPos[pIdx + 2] = v0.z;
                if (outNorm && normAttr) {
                  nTmp.fromBufferAttribute(normAttr, vi).applyMatrix3(normalMat).normalize();
                  outNorm[pIdx] = nTmp.x;
                  outNorm[pIdx + 1] = nTmp.y;
                  outNorm[pIdx + 2] = nTmp.z;
                }
                if (outUv && uvAttr) {
                  outUv[uIdx] = uvAttr.getX(vi);
                  outUv[uIdx + 1] = uvAttr.getY(vi);
                  uIdx += 2;
                }
                pIdx += 3;
              }
            }
            const newGeo = new THREE.BufferGeometry();
            newGeo.setAttribute('position', new THREE.BufferAttribute(outPos, 3));
            if (outNorm) newGeo.setAttribute('normal', new THREE.BufferAttribute(outNorm, 3));
            if (outUv) newGeo.setAttribute('uv', new THREE.BufferAttribute(outUv, 2));
            newGeo.computeBoundingSphere();
            const mat = Array.isArray(lightMesh.material)
              ? lightMesh.material.map((m) => m.clone())
              : lightMesh.material.clone();
            return new THREE.Mesh(newGeo, mat);
          };

          const leftTopTris: Array<[number, number, number]> = [];
          const rightTris: Array<[number, number, number]> = [];
          const keptStaticIdx: number[] = [];

          const triCount = geo.index ? geo.index.count / 3 : posAttr.count / 3;
          for (let t = 0; t < triCount; t++) {
            const i0 = geo.index ? geo.index.getX(t * 3) : t * 3;
            const i1 = geo.index ? geo.index.getX(t * 3 + 1) : t * 3 + 1;
            const i2 = geo.index ? geo.index.getX(t * 3 + 2) : t * 3 + 2;
            v0.fromBufferAttribute(posAttr, i0).applyMatrix4(lightMesh.matrixWorld);
            v1.fromBufferAttribute(posAttr, i1).applyMatrix4(lightMesh.matrixWorld);
            v2.fromBufferAttribute(posAttr, i2).applyMatrix4(lightMesh.matrixWorld);
            const cx = (v0.x + v1.x + v2.x) / 3;
            const cy = (v0.y + v1.y + v2.y) / 3;
            if (cx < 0) {
              rightTris.push([i0, i1, i2]);
            } else if (cy > 0.740) {
              leftTopTris.push([i0, i1, i2]);
            } else {
              keptStaticIdx.push(i0, i1, i2);
            }
          }

          const ltMesh = buildExtractedMesh(leftTopTris, leftTopPivotPos);
          if (ltMesh) leftTopMeshes.push(ltMesh);
          const rcMesh = buildExtractedMesh(rightTris, rightClusterPivotPos);
          if (rcMesh) rightClusterMeshes.push(rcMesh);

          geo.setIndex(keptStaticIdx);
          geo.computeBoundingSphere();
        }

        const gadgetsRig = createQBranchGadgetsRig(
          trunkShieldProfile,
          {
            leftTopMeshes,
            leftTopPivotPos,
            rightClusterMeshes,
            rightClusterPivotPos,
          },
          {
            roofPanelMeshes,
            roofPanelCenter,
            passengerSeatMeshes,
            passengerSeatCenter,
            roofSurfaceY,
          }
        );
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
