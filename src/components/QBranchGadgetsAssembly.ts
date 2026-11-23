import * as THREE from 'three';
import { QBranchGadgetStates } from './QBranchCabinAssembly';

export interface GadgetSubPart {
  mesh: THREE.Mesh;
  label: string;
  materialLabel: string;
  qBranchNote: string;
  semanticDir: [number, number, number];
}

interface SmokeParticle {
  active: boolean;
  age: number;
  life: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  baseSize: number;
  seed: number;
  rot: number;
}

interface OilDroplet {
  active: boolean;
  age: number;
  life: number;
  radius: number;
  elongation: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
}

interface OilMetaball {
  active: boolean;
  x: number;
  z: number;
  vx: number;
  vz: number;
  r: number;
}

export interface TailLightSplitData {
  leftTopMeshes: THREE.Mesh[];
  leftTopPivotPos: THREE.Vector3;
  rightClusterMeshes: THREE.Mesh[];
  rightClusterPivotPos: THREE.Vector3;
}

export interface EjectorExtractData {
  roofPanelMeshes: THREE.Mesh[];
  roofPanelCenter: THREE.Vector3;
  passengerSeatMeshes: THREE.Mesh[];
  passengerSeatCenter: THREE.Vector3;
  roofSurfaceY: (x: number, z: number) => number;
}

interface CaltropItem {
  active: boolean;
  settled: boolean;
  age: number;
  life: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  angVel: THREE.Vector3;
}

export interface QBranchGadgetsRig {
  root: THREE.Group;
  frontPlateDrum: THREE.Group;
  rearPlateDrum: THREE.Group;
  frontRams: THREE.Group[];
  rearRams: THREE.Group[];
  bulletShieldGroup: THREE.Group;
  roofHatchGroup: THREE.Group;
  roofHatchBasePos: THREE.Vector3;
  passengerSeatGroup: THREE.Group;
  passengerSeatBasePos: THREE.Vector3;
  ejectAirPoints: THREE.Points;
  ejectAirParticles: SmokeParticle[];
  leftOilLampPivot: THREE.Group;
  leftOilNozzle: THREE.Mesh;
  leftOilArms: THREE.Mesh[];
  rightCaltropPivot: THREE.Group;
  subParts: GadgetSubPart[];
  plateAngle: number;
  ramFrontExtend: number;
  ramRearExtend: number;
  shieldExtend: number;
  hatchActivePrev: boolean;
  hatchTimer: number;
  hatchOpen: number;
  seatEjectProgress: number;
  oilLidOpen: number;
  caltropLidOpen: number;
  smokePoints: THREE.Points;
  smokeParticles: SmokeParticle[];
  oilBlobInstanced: THREE.InstancedMesh;
  oilBlobMat: THREE.ShaderMaterial;
  oilFilamentMesh: THREE.Mesh;
  oilFilamentMat: THREE.ShaderMaterial;
  oilDroplets: OilDroplet[];
  oilMetaballs: OilMetaball[];
  oilPuddleMat: THREE.ShaderMaterial;
  oilImpact: THREE.Vector3;
  oilSpawnAccum: number;
  caltropInstanced: THREE.InstancedMesh;
  caltrops: CaltropItem[];
  time: number;
}

/** Generates crisp period-authentic 1964 license plate textures for all 3 revolving faces. */
function createPlateTexture(variant: 0 | 1 | 2): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (variant === 0) {
    // 1. UK 1964 Goldfinger / GoldenEye: BMT 216A (Pressed silver on black)
    ctx.fillStyle = '#0c0d10';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, 996, 228);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 148px "Arial Narrow", "Helvetica Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 4;
    ctx.fillText('BMT 216A', 512, 134);
  } else if (variant === 1) {
    // 2. France 1964: 4711-EA-62 (White/silver on satin black)
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, 996, 228);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 136px "Arial Narrow", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 4;
    ctx.fillText('4711-EA-62', 512, 134);
  } else {
    // 3. Switzerland 1964: LU 6789 (Black on white with Swiss & Luzern shields)
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, 996, 228);

    // Left Swiss cross shield
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(58, 66, 76, 94);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(88, 82, 16, 62);
    ctx.fillRect(65, 105, 62, 16);

    // Right Luzern blue/white shield
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(890, 66, 38, 94);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(928, 66, 38, 94);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(890, 66, 76, 94);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 142px "Arial Narrow", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LU 6789', 512, 134);
  }

  // Subtle corner mounting rivets
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = variant === 2 ? '#64748b' : '#475569';
  for (const [rx, ry] of [
    [42, 42],
    [982, 42],
    [42, 214],
    [982, 214],
  ]) {
    ctx.beginPath();
    ctx.arc(rx, ry, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Builds all exterior Q-Branch gadgets wired to the center armrest switchgear:
 * 1. Front & Rear Revolving 3-Way Number Plates (BMT 216A / 4711-EA-62 / LU 6789)
 * 2. Front & Rear Telescoping Hydraulic Battering Rams
 * 3. Rear Armored Bullet-Resistant Shield
 * 4. Passenger-Side Ejector Seat Roof Hatch
 * 5. Rear Exhaust Smoke Screen (Custom GLSL FBM Cloud Shaders) & Oil Slick (Arc Stream + Iridescent Puddle)
 */
/** Builds a true 4-sided tetrahedral steel caltrop geometry (one spike always points straight up). */
function buildTetraCaltropGeometry(radius = 0.022): THREE.BufferGeometry {
  const dirs = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(Math.sqrt(8 / 9), -1 / 3, 0),
    new THREE.Vector3(-Math.sqrt(2 / 9), -1 / 3, Math.sqrt(2 / 3)),
    new THREE.Vector3(-Math.sqrt(2 / 9), -1 / 3, -Math.sqrt(2 / 3)),
  ];
  const positions: number[] = [];
  const baseR = radius * 0.22;
  const upRef = new THREE.Vector3(0, 1, 0);
  const altRef = new THREE.Vector3(1, 0, 0);

  for (const d of dirs) {
    const tip = d.clone().multiplyScalar(radius);
    const ref = Math.abs(d.dot(upRef)) > 0.9 ? altRef : upRef;
    const t1 = new THREE.Vector3().crossVectors(d, ref).normalize().multiplyScalar(baseR);
    const t2 = new THREE.Vector3().crossVectors(d, t1).normalize().multiplyScalar(baseR);
    const b0 = t1.clone();
    const b1 = t1.clone().multiplyScalar(-0.5).addScaledVector(t2, Math.sqrt(3) / 2);
    const b2 = t1.clone().multiplyScalar(-0.5).addScaledVector(t2, -Math.sqrt(3) / 2);

    for (const [a, b] of [[b0, b1], [b1, b2], [b2, b0]]) {
      positions.push(tip.x, tip.y, tip.z, a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

export function createQBranchGadgetsRig(
  trunkShieldProfile?: Array<{ x: number; y: number }>,
  tailLightSplits?: TailLightSplitData,
  ejectorExtract?: EjectorExtractData
): QBranchGadgetsRig {
  const root = new THREE.Group();
  root.name = 'QBranch_ExteriorGadgets';

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.96,
    roughness: 0.08,
  });
  const gunmetalMat = new THREE.MeshStandardMaterial({
    color: 0x262a33,
    metalness: 0.84,
    roughness: 0.34,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4a038,
    metalness: 0.88,
    roughness: 0.22,
  });
  const rubberPadMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    metalness: 0.05,
    roughness: 0.82,
  });
  const silverBirchMat = new THREE.MeshPhysicalMaterial({
    color: 0xaab4be,
    metalness: 0.82,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.25,
  });

  const subParts: GadgetSubPart[] = [];
  const register = (
    mesh: THREE.Mesh,
    label: string,
    materialLabel: string,
    qBranchNote: string,
    semanticDir: [number, number, number]
  ) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    subParts.push({ mesh, label, materialLabel, qBranchNote, semanticDir });
    return mesh;
  };

  // =========================================================================
  // 1. REVOLVING 3-WAY NUMBER PLATES (Front Valance & Rear Boot)
  // =========================================================================
  const plateMats = ([0, 1, 2] as const).map(
    (v) =>
      new THREE.MeshStandardMaterial({
        map: createPlateTexture(v),
        roughness: 0.26,
        metalness: 0.22,
      })
  );

  const buildPlateAssembly = (isFront: boolean): { group: THREE.Group; drum: THREE.Group } => {
    const group = new THREE.Group();
    const plateW = 0.36;
    const plateH = 0.082;
    const bezelThick = 0.012;

    // Chamfered chrome surround bezel with rectangular window
    const outer = new THREE.Shape();
    outer.moveTo(-plateW / 2 - bezelThick, -plateH / 2 - bezelThick);
    outer.lineTo(plateW / 2 + bezelThick, -plateH / 2 - bezelThick);
    outer.lineTo(plateW / 2 + bezelThick, plateH / 2 + bezelThick);
    outer.lineTo(-plateW / 2 - bezelThick, plateH / 2 + bezelThick);
    outer.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-plateW / 2, -plateH / 2);
    hole.lineTo(plateW / 2, -plateH / 2);
    hole.lineTo(plateW / 2, plateH / 2);
    hole.lineTo(-plateW / 2, plateH / 2);
    hole.closePath();
    outer.holes.push(hole);

    const bezelGeo = new THREE.ExtrudeGeometry(outer, {
      depth: 0.014,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
    });
    const bezel = register(
      new THREE.Mesh(bezelGeo, chromeMat),
      isFront ? 'Front Revolving Plate Bezel' : 'Rear Revolving Plate Bezel',
      'Chrome-Plated Brass Frame',
      'Concealed motorized frame housing the 3-sided rotating identity plates.',
      isFront ? [0, -0.1, 1.3] : [0, 0.1, -1.3]
    );
    bezel.position.z = -0.008;
    group.add(bezel);

    // Triangular prism drum rotating around X-axis
    const drum = new THREE.Group();
    group.add(drum);

    const apothem = 0.023;
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, plateW - 0.01, 3), gunmetalMat);
    core.rotation.z = Math.PI / 2;
    drum.add(core);

    const plateFaceGeo = new THREE.BoxGeometry(plateW - 0.006, plateH - 0.004, 0.004);
    for (let i = 0; i < 3; i++) {
      const angle = i * ((Math.PI * 2) / 3);
      const facePivot = new THREE.Group();
      facePivot.rotation.x = -angle;
      const faceMesh = register(
        new THREE.Mesh(plateFaceGeo, plateMats[i]),
        `${isFront ? 'Front' : 'Rear'} Number Plate (${['BMT 216A', '4711-EA-62', 'LU 6789'][i]})`,
        'Pressed Aluminum Plate',
        '3-way Q-Branch identity plate synced to the brass E-gate selector in the center armrest.',
        isFront ? [0, -0.08, 1.35] : [0, 0.08, -1.35]
      );
      faceMesh.position.z = apothem;
      facePivot.add(faceMesh);
      drum.add(facePivot);
    }

    return { group, drum };
  };

  const frontPlate = buildPlateAssembly(true);
  frontPlate.group.position.set(0, 0.342, 2.258);
  root.add(frontPlate.group);

  const rearPlate = buildPlateAssembly(false);
  rearPlate.group.position.set(0, 0.635, -2.194);
  rearPlate.group.rotation.y = Math.PI;
  rearPlate.group.rotation.x = 0.12; // Matches DB5 rear boot slope
  root.add(rearPlate.group);

  // =========================================================================
  // 2. FRONT & REAR HYDRAULIC BATTERING RAMS
  // =========================================================================
  const buildRamUnit = (x: number, y: number, z: number, isFront: boolean): THREE.Group => {
    const unit = new THREE.Group();
    unit.position.set(x, y, z);
    if (!isFront) unit.rotation.y = Math.PI;
    root.add(unit);

    // Fixed outer hydraulic sleeve + brass gland nut
    const sleeve = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.14, 18), gunmetalMat),
      `${isFront ? 'Front' : 'Rear'} Ram Hydraulic Cylinder`,
      'High-Pressure Steel Sleeve',
      'Concealed bumper-mount hydraulic ram cylinder.',
      [x * 0.5, 0, isFront ? 1.15 : -1.15]
    );
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.z = -0.07;
    unit.add(sleeve);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.016, 16), brassMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.z = -0.005;
    unit.add(collar);

    // Telescoping piston + sculpted chrome/rubber over-rider head
    const ramHead = new THREE.Group();
    unit.add(ramHead);

    const piston = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 16), chromeMat),
      `${isFront ? 'Front' : 'Rear'} Ram Piston Rod`,
      'Hard-Chrome Hydraulic Rod',
      'Telescoping steel piston extending the bumper over-rider 26cm forward on command.',
      [x * 0.6, 0, isFront ? 1.35 : -1.35]
    );
    piston.rotation.x = Math.PI / 2;
    piston.position.z = -0.14;
    ramHead.add(piston);

    // Classic DB5 vertical over-rider silhouette
    const overRiderShape = new THREE.Shape();
    overRiderShape.moveTo(-0.028, -0.065);
    overRiderShape.lineTo(0.028, -0.065);
    overRiderShape.quadraticCurveTo(0.036, 0, 0.024, 0.068);
    overRiderShape.lineTo(-0.024, 0.068);
    overRiderShape.quadraticCurveTo(-0.036, 0, -0.028, -0.065);

    const overRiderGeo = new THREE.ExtrudeGeometry(overRiderShape, {
      depth: 0.042,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.006,
      bevelSegments: 3,
    });
    const overRider = register(
      new THREE.Mesh(overRiderGeo, chromeMat),
      `${isFront ? 'Front' : 'Rear'} Hydraulic Battering Ram`,
      'Reinforced Chrome Over-Rider',
      'Heavy-duty Q-Branch hydraulic ramming bumper horn.',
      [x * 0.8, 0.05, isFront ? 1.45 : -1.45]
    );
    overRider.position.z = -0.01;
    ramHead.add(overRider);

    const rubberPad = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.095, 0.016), rubberPadMat);
    rubberPad.position.z = 0.038;
    ramHead.add(rubberPad);

    return ramHead;
  };

  const frontRams = [
    buildRamUnit(-0.30, 0.428, 2.255, true),
    buildRamUnit(0.30, 0.428, 2.255, true),
  ];
  const rearRams = [
    buildRamUnit(-0.34, 0.455, -2.265, false),
    buildRamUnit(0.34, 0.455, -2.265, false),
  ];

  // =========================================================================
  // 3. BULLET-RESISTANT REAR ARMOR SHIELD (Raycast-Fitted Trunk Slot + Planar Plate)
  // =========================================================================
  const SHIELD_Z = -1.71;
  const SHIELD_HALF_W = 0.432;

  // Interpolate exact raycasted SK_Trunk_101 surface Y(x) so slot & cap never sink or gap
  const sampleTrunkY = (x: number): number => {
    if (!trunkShieldProfile || trunkShieldProfile.length === 0) {
      return 0.994 - 0.32 * x * x;
    }
    const pts = trunkShieldProfile;
    if (x <= pts[0].x) return pts[0].y;
    if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
        return pts[i].y + (pts[i + 1].y - pts[i].y) * t;
      }
    }
    return pts[0].y;
  };
  const centerTrunkY = sampleTrunkY(0);

  const buildCrownedPlanarGeo = (
    halfW: number,
    thicknessZ: number,
    topYAt: (x: number) => number,
    botYAt: (x: number) => number,
    bevelZ = 0.0,
    segs = 32
  ): THREE.BufferGeometry => {
    const positions: number[] = [];
    const indices: number[] = [];
    const halfT = thicknessZ / 2;
    const innerT = Math.max(0.001, halfT - bevelZ);

    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const x = (u * 2 - 1) * halfW;
      const yBot = botYAt(x);
      const yTop = topYAt(x);
      positions.push(
        x, yBot, +halfT,
        x, yTop, +innerT,
        x, yTop, -innerT,
        x, yBot, -halfT
      );
    }

    for (let i = 0; i < segs; i++) {
      const a = i * 4;
      const b = (i + 1) * 4;
      indices.push(a + 0, b + 0, b + 1, a + 0, b + 1, a + 1);
      indices.push(a + 1, b + 1, b + 2, a + 1, b + 2, a + 2);
      indices.push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3);
      indices.push(a + 3, b + 3, b + 0, a + 3, b + 0, a + 0);
    }
    indices.push(0, 1, 2, 0, 2, 3);
    const last = segs * 4;
    indices.push(last + 0, last + 2, last + 1, last + 0, last + 3, last + 2);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  // Beveled dark rubber/anodized slot frame matching the exact shield width & trunk Y(x)
  const slotBezelGeo = buildCrownedPlanarGeo(
    SHIELD_HALF_W + 0.007,
    0.017,
    (x) => sampleTrunkY(x) + 0.0032,
    (x) => sampleTrunkY(x) - 0.0025,
    0.0022,
    36
  );
  const slotBezel = register(
    new THREE.Mesh(slotBezelGeo, rubberPadMat),
    'Bullet Shield Boot Slot Seal',
    'Beveled Weatherstrip Seal',
    'Flush-fitted beveled slot channel across the upper rear boot lid.',
    [0, 0.72, -1.15]
  );
  slotBezel.position.set(0, 0, SHIELD_Z);
  root.add(slotBezel);

  // Dark inner recess strip inside the bezel so the slot reads as a physical opening
  const slotWellGeo = buildCrownedPlanarGeo(
    SHIELD_HALF_W + 0.003,
    0.011,
    (x) => sampleTrunkY(x) + 0.0034,
    (x) => sampleTrunkY(x) + 0.0010,
    0.0,
    36
  );
  const slotWell = new THREE.Mesh(slotWellGeo, new THREE.MeshBasicMaterial({ color: 0x050608 }));
  slotWell.position.set(0, 0, SHIELD_Z);
  root.add(slotWell);

  // Rising planar ballistic steel shield + flush Silver Birch top cap
  // Stowed offset = -0.326m so top cap sits flush inside the beveled slot bezel
  const bulletShieldGroup = new THREE.Group();
  bulletShieldGroup.position.set(0, -0.326, SHIELD_Z);
  root.add(bulletShieldGroup);

  const brushedArmorMat = new THREE.MeshStandardMaterial({
    color: 0xc2c8d0,
    metalness: 0.36,
    roughness: 0.38,
  });

  const shieldGeo = buildCrownedPlanarGeo(
    SHIELD_HALF_W,
    0.008,
    (x) => sampleTrunkY(x) + 0.326,
    () => centerTrunkY - 0.16,
    0.0,
    36
  );
  const shieldPlate = register(
    new THREE.Mesh(shieldGeo, brushedArmorMat),
    'Bullet-Resistant Rear Shield',
    'Satin Ballistic Armor Steel',
    'Planar hydraulic armor plate rising vertically from the flush boot-deck slot.',
    [0, 0.95, -1.25]
  );
  bulletShieldGroup.add(shieldPlate);

  // Beveled Silver Birch top cap sitting flush inside the slot bezel when stowed
  const capGeo = buildCrownedPlanarGeo(
    SHIELD_HALF_W + 0.003,
    0.012,
    (x) => sampleTrunkY(x) + 0.3302,
    (x) => sampleTrunkY(x) + 0.324,
    0.0015,
    36
  );
  const shieldCap = register(
    new THREE.Mesh(capGeo, silverBirchMat),
    'Bullet Shield Top Cap',
    'Silver Birch Aluminum Trim',
    'Body-colored flush cap crowning the bullet-resistant rear shield.',
    [0, 1.05, -1.25]
  );
  bulletShieldGroup.add(shieldCap);

  // =========================================================================
  // 4. PASSENGER EJECTOR SEAT & JETTISONABLE ROOF PANEL (RHD: Passenger = +X)
  // =========================================================================
  // Full passenger-side roof opening (wider & longer than the bucket seat for zero metal clash)
  const HATCH_MIN_X = 0.005;
  const HATCH_MAX_X = 0.565;
  const HATCH_MIN_Z = -0.520;
  const HATCH_MAX_Z = 0.095;
  const HATCH_CX = (HATCH_MIN_X + HATCH_MAX_X) * 0.5;
  const HATCH_CZ = (HATCH_MIN_Z + HATCH_MAX_Z) * 0.5;
  const HATCH_HW = (HATCH_MAX_X - HATCH_MIN_X) * 0.5;
  const HATCH_HZ = (HATCH_MAX_Z - HATCH_MIN_Z) * 0.5;

  const sampleRoofY = (x: number, z: number): number => {
    if (ejectorExtract?.roofSurfaceY) {
      return ejectorExtract.roofSurfaceY(x, z);
    }
    return 1.380 - 0.14 * x * x - 0.08 * (z + 0.18) * (z + 0.18);
  };

  // Build rounded rectangular perimeter ring following the exact 3D roof crown sampleRoofY(x, z)
  const buildRoofOpeningRingGeo = (
    outerMargin: number,
    innerMargin: number,
    topOffset: number,
    botOffset: number,
    cornerRadius = 0.042,
    segs = 64
  ): THREE.BufferGeometry => {
    const getRoundedRectPt = (u: number, hw: number, hz: number, r: number): [number, number] => {
      const a = u * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // Superellipse exponent n=5 produces crisp automotive rounded-rectangle corners matching the photo
      const exp = 0.22;
      const sx = Math.sign(ca) * Math.pow(Math.abs(ca), exp);
      const sz = Math.sign(sa) * Math.pow(Math.abs(sa), exp);
      return [
        HATCH_CX + sx * (hw - r * 0.15),
        HATCH_CZ + sz * (hz - r * 0.15),
      ];
    };

    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const [ox, oz] = getRoundedRectPt(u, HATCH_HW + outerMargin, HATCH_HZ + outerMargin, cornerRadius);
      const [ix, iz] = getRoundedRectPt(u, HATCH_HW + innerMargin, HATCH_HZ + innerMargin, cornerRadius);
      const oy = sampleRoofY(ox, oz);
      const iy = sampleRoofY(ix, iz);
      // 4 vertices per cross-section: 0=outerBot, 1=outerTop, 2=innerTop, 3=innerBot
      positions.push(
        ox, oy + botOffset, oz,
        ox, oy + topOffset, oz,
        ix, iy + topOffset, iz,
        ix, iy + botOffset, iz
      );
    }
    for (let i = 0; i < segs; i++) {
      const a = i * 4;
      const b = (i + 1) * 4;
      indices.push(a + 0, b + 0, b + 1, a + 0, b + 1, a + 1);
      indices.push(a + 1, b + 1, b + 2, a + 1, b + 2, a + 2);
      indices.push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3);
      indices.push(a + 3, b + 3, b + 0, a + 3, b + 0, a + 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  // Recessed perimeter weatherstrip & channel lip (tucked below outer Silver Birch skin so closed roof is 100% flush & seamless)
  const roofSealGeo = buildRoofOpeningRingGeo(0.006, -0.010, -0.0025, -0.022, 0.044, 72);
  const roofSealMesh = register(
    new THREE.Mesh(roofSealGeo, rubberPadMat),
    'Ejector Roof Opening Weatherstrip',
    'Recessed Neoprene Perimeter Seal',
    'Recessed perimeter seal lining the passenger roof cutout, revealed only once the roof panel jettisons.',
    [0.25, 1.15, -0.15]
  );
  root.add(roofSealMesh);

  const innerFlangeGeo = buildRoofOpeningRingGeo(-0.006, -0.016, -0.004, -0.024, 0.042, 64);
  const innerFlangeMesh = new THREE.Mesh(innerFlangeGeo, gunmetalMat);
  root.add(innerFlangeMesh);

  // Jettisonable Roof Panel Group (extracted live from SM_Roof_101 + headliner so it sits 100% flush & seamless when closed)
  const roofHatchBasePos = ejectorExtract?.roofPanelCenter
    ? ejectorExtract.roofPanelCenter.clone()
    : new THREE.Vector3(HATCH_CX, sampleRoofY(HATCH_CX, HATCH_CZ), HATCH_CZ);
  const roofHatchGroup = new THREE.Group();
  roofHatchGroup.position.copy(roofHatchBasePos);
  root.add(roofHatchGroup);

  if (ejectorExtract && ejectorExtract.roofPanelMeshes.length > 0) {
    for (const rm of ejectorExtract.roofPanelMeshes) {
      register(
        rm,
        'Jettisonable Passenger Roof Panel',
        'Silver Birch Aluminum Roof Section',
        'Flush passenger-side roof panel sheared cleanly by pneumatic bolts prior to compressed-air seat ejection.',
        [0.45, 1.45, -0.15]
      );
      roofHatchGroup.add(rm);
    }
  } else {
    const fallbackHatch = register(
      new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.014, 0.61), silverBirchMat),
      'Jettisonable Passenger Roof Panel',
      'Silver Birch Aluminum Roof Section',
      'Flush passenger-side roof panel sheared cleanly by pneumatic bolts prior to compressed-air seat ejection.',
      [0.45, 1.45, -0.15]
    );
    roofHatchGroup.add(fallbackHatch);
  }

  // Passenger Ejector Seat Group (minimal bucket seat + compact tucked-in compressed-air base)
  const passengerSeatBasePos = ejectorExtract?.passengerSeatCenter
    ? ejectorExtract.passengerSeatCenter.clone()
    : new THREE.Vector3(0.32, 0.56, -0.14);
  const passengerSeatGroup = new THREE.Group();
  passengerSeatGroup.position.copy(passengerSeatBasePos);
  root.add(passengerSeatGroup);

  if (ejectorExtract && ejectorExtract.passengerSeatMeshes.length > 0) {
    for (const sm of ejectorExtract.passengerSeatMeshes) {
      register(
        sm,
        'Q-Branch Passenger Ejector Seat',
        'Connolly Leather Bucket Seat',
        'Minimal-clearance passenger bucket seat propelled vertically by twin compressed-air cylinders.',
        [0.35, 1.25, -0.15]
      );
      passengerSeatGroup.add(sm);
    }
  }

  // Compact twin compressed-air launch pistons tucked cleanly beneath the seat cushion
  for (const rx of [-0.095, 0.095]) {
    const airPiston = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.16, 14), chromeMat),
      'Compressed-Air Ejector Piston',
      'High-Pressure Pneumatic Rod',
      'Telescoping compressed-air piston rod driving jet-cockpit style vertical ejection.',
      [0.35, 0.85, -0.14]
    );
    airPiston.position.set(rx, -0.14, -0.02);
    passengerSeatGroup.add(airPiston);
  }

  // Fixed floor-mounted compressed-air receiver cylinders anchored beneath the seat
  for (const rx of [-0.095, 0.095]) {
    const floorTube = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.16, 14), gunmetalMat),
      'Compressed-Air Floor Cylinder',
      'High-Pressure Pneumatic Reservoir',
      'Twin compressed-air cylinders bolted to the cabin floor pan beneath the passenger seat.',
      [0.35, 0.45, -0.14]
    );
    floorTube.position.set(passengerSeatBasePos.x + rx, 0.34, passengerSeatBasePos.z - 0.02);
    root.add(floorTube);
  }

  // Compressed-Air Vapour Burst Particle System (white-blue pneumatic blast on ejection)
  const EJECT_AIR_COUNT = 72;
  const ejectAirPos = new Float32Array(EJECT_AIR_COUNT * 3);
  const ejectAirAge = new Float32Array(EJECT_AIR_COUNT);
  const ejectAirSize = new Float32Array(EJECT_AIR_COUNT);
  const ejectAirSeed = new Float32Array(EJECT_AIR_COUNT);
  const ejectAirRot = new Float32Array(EJECT_AIR_COUNT);
  const ejectAirParticles: SmokeParticle[] = [];
  for (let i = 0; i < EJECT_AIR_COUNT; i++) {
    ejectAirParticles.push({
      active: false,
      age: 0,
      life: 0.55,
      pos: new THREE.Vector3(0, -10, 0),
      vel: new THREE.Vector3(),
      baseSize: 0.35,
      seed: Math.random() * 100,
      rot: Math.random() * Math.PI * 2,
    });
    ejectAirPos[i * 3 + 1] = -10;
  }
  const ejectAirGeo = new THREE.BufferGeometry();
  ejectAirGeo.setAttribute('position', new THREE.BufferAttribute(ejectAirPos, 3));
  ejectAirGeo.setAttribute('aAge', new THREE.BufferAttribute(ejectAirAge, 1));
  ejectAirGeo.setAttribute('aSize', new THREE.BufferAttribute(ejectAirSize, 1));
  ejectAirGeo.setAttribute('aSeed', new THREE.BufferAttribute(ejectAirSeed, 1));
  ejectAirGeo.setAttribute('aRot', new THREE.BufferAttribute(ejectAirRot, 1));

  const ejectAirMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: `
      attribute float aAge;
      attribute float aSize;
      attribute float aRot;
      varying float vAge;
      varying float vRot;
      uniform float uPixelRatio;
      void main() {
        vAge = aAge;
        vRot = aRot;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float grow = mix(0.25, 1.65, clamp(aAge, 0.0, 1.0));
        gl_PointSize = aSize * grow * uPixelRatio * (380.0 / max(0.4, -mvPosition.z));
      }
    `,
    fragmentShader: `
      varying float vAge;
      varying float vRot;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float dist = length(uv) * 2.0;
        if (dist > 1.0) discard;
        float soft = pow(1.0 - dist, 1.8);
        float fadeIn = smoothstep(0.0, 0.08, vAge);
        float fadeOut = 1.0 - smoothstep(0.25, 1.0, vAge);
        float alpha = soft * fadeIn * fadeOut * 0.72;
        if (alpha < 0.01) discard;
        vec3 col = mix(vec3(0.78, 0.90, 1.0), vec3(0.96, 0.99, 1.0), soft);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const ejectAirPoints = new THREE.Points(ejectAirGeo, ejectAirMat);
  ejectAirPoints.frustumCulled = false;
  ejectAirPoints.renderOrder = 45;
  root.add(ejectAirPoints);

  // =========================================================================
  // 5. REAR SMOKE, LEFT-TAILLIGHT OIL PUMP, & RIGHT-TAILLIGHT CALTROP DISPENSER
  // =========================================================================
  for (const sideX of [-0.43, 0.43]) {
    const smokeNozzle = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.09, 16), gunmetalMat),
      'Rear Smoke Screen Nozzle',
      'Heat-Treated Exhaust Shroud',
      'High-output smoke oil injector mounted beside the twin exhaust pipes.',
      [sideX * 0.6, -0.1, -1.25]
    );
    smokeNozzle.rotation.x = Math.PI / 2;
    smokeNozzle.position.set(sideX, 0.295, -2.265);
    root.add(smokeNozzle);
  }

  // --- 5A. LEFT TAILLIGHT (+X): Hinged Amber Lamp + Internal Oil Pump & Nozzle ---
  const leftOilLampPivot = new THREE.Group();
  leftOilLampPivot.position.copy(
    tailLightSplits?.leftTopPivotPos ?? new THREE.Vector3(0.6325, 0.828, -2.168)
  );
  root.add(leftOilLampPivot);

  if (tailLightSplits) {
    for (const m of tailLightSplits.leftTopMeshes) {
      register(
        m,
        'Left Amber Indicator (Oil Nozzle Cover)',
        'Hinged Lucas Amber Lamp',
        'Top-hinged left rear amber indicator lifting 75° to expose the pressurized oil slick nozzle.',
        [0.85, 0.35, -1.25]
      );
      leftOilLampPivot.add(m);
    }
  }

  const cavityMat = new THREE.MeshStandardMaterial({
    color: 0x090b0f,
    roughness: 0.85,
    metalness: 0.2,
  });
  const leftCavity = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.080, 0.065), cavityMat);
  leftCavity.position.set(0.6325, 0.785, -2.150);
  root.add(leftCavity);

    const leftOilArms: THREE.Mesh[] = [];
    for (const sx of [0.614, 0.650]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.006, 0.036), chromeMat);
      arm.position.set(sx - 0.6325, -0.012, 0.002);
      arm.visible = false;
      leftOilLampPivot.add(arm);
      leftOilArms.push(arm);
    }

    // Hollow machined dispensing pipe (LatheGeometry with real inner bore facing -Z)
    const nozzlePipeGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0125, -0.0375),
        new THREE.Vector2(0.0125, 0.022),
        new THREE.Vector2(0.0108, 0.026),
        new THREE.Vector2(0.0108, 0.0365),
        new THREE.Vector2(0.0092, 0.0375),
        new THREE.Vector2(0.0056, 0.0375),
        new THREE.Vector2(0.0052, -0.015),
        new THREE.Vector2(0.0, -0.015),
      ],
      24
    );
    const leftOilNozzle = register(
      new THREE.Mesh(nozzlePipeGeo, chromeMat),
      'Left Taillight Oil Slick Nozzle',
      'Machined Hollow Aluminum Pipe',
      'Retractable hollow high-pressure oil dispensing pipe concealed behind the hinged left amber indicator.',
      [0.88, 0.25, -1.22]
    );
    leftOilNozzle.rotation.x = -Math.PI / 2; // +Y hollow tip points toward -Z (rear)
    leftOilNozzle.position.set(0.6325, 0.785, -2.165);
    root.add(leftOilNozzle);

    const aluFrameMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.86,
      roughness: 0.26,
    });
    const oilRackFrame = register(
      new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.20, 0.064), aluFrameMat),
      'Q-Branch Oil Pump Mounting Frame',
      'Slotted Machined Aluminum',
      'Internal left-wing structural frame supporting the hydraulic oil pump and upper nozzle.',
      [0.92, 0.20, -1.10]
    );
    oilRackFrame.position.set(0.585, 0.68, -2.06);
    root.add(oilRackFrame);

    const oilPumpCylinder = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.135, 20), aluFrameMat),
      'Pressurized Oil Slick Pump Cylinder',
      'Turned Aluminum & Brass Manifold',
      'High-pressure hydraulic pump driving slick oil up the braided hose to the left taillight.',
      [0.95, 0.16, -1.05]
    );
    oilPumpCylinder.rotation.x = Math.PI / 2;
    oilPumpCylinder.position.set(0.582, 0.635, -1.97);
    root.add(oilPumpCylinder);

    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.582, 0.655, -1.91),
      new THREE.Vector3(0.585, 0.745, -1.95),
      new THREE.Vector3(0.625, 0.785, -2.12),
    ]);
    const oilHose = register(
      new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 16, 0.0085, 10, false), rubberPadMat),
      'High-Pressure Oil Feed Hose',
      'Reinforced Braided Hydraulic Line',
      'Pressurized feed line routing oil from the wing pump to the hinged taillight nozzle.',
      [0.94, 0.22, -1.08]
    );
    root.add(oilHose);

    // --- 5B. RIGHT TAILLIGHT (-X): Bottom-Hinged Cluster + Caltrop / Nail Dispenser ---
    const rightCaltropPivot = new THREE.Group();
    rightCaltropPivot.position.copy(
      tailLightSplits?.rightClusterPivotPos ?? new THREE.Vector3(-0.6325, 0.578, -2.172)
    );
    root.add(rightCaltropPivot);

    if (tailLightSplits) {
      for (const m of tailLightSplits.rightClusterMeshes) {
        register(
          m,
          'Right Taillight Cluster (Caltrop Hatch)',
          'Bottom-Hinged Lucas Cluster',
          'Entire 3-lens right taillight assembly hinged at the bottom to drop open and release road caltrops.',
          [-0.85, 0.25, -1.25]
        );
        rightCaltropPivot.add(m);
      }
    }

    const rightCavity = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.235, 0.075), cavityMat);
    rightCavity.position.set(-0.6325, 0.704, -2.148);
    root.add(rightCavity);

    const rightHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.068, 12), chromeMat);
    rightHinge.rotation.z = Math.PI / 2;
    rightCaltropPivot.add(rightHinge);

    const caltropHopper = register(
      new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.20, 0.085), aluFrameMat),
      'Caltrop Magazine & Ejector Rack',
      'Machined Aluminum Hopper',
      'Internal right-wing vertical magazine feeding 4-sided steel tire-shredding caltrops.',
      [-0.92, 0.20, -1.10]
    );
    caltropHopper.position.set(-0.6325, 0.70, -2.06);
    root.add(caltropHopper);

    for (const cx of [-0.646, -0.619]) {
      const chute = register(
        new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.095, 14), gunmetalMat),
        'Caltrop Ejector Chute',
        'Hardened Steel Launch Tube',
        'Spring-loaded dual launch chute expelling four-sided caltrops onto the road behind.',
        [-0.90, 0.22, -1.20]
      );
      chute.rotation.x = Math.PI / 2 + 0.14;
      chute.position.set(cx, 0.675, -2.14);
      root.add(chute);
    }

    // --- A. Volumetric Billowing Smoke Screen (Half-Lambert Lit FBM Cloud Shader) ---
    const SMOKE_COUNT = 420;
    const smokePositions = new Float32Array(SMOKE_COUNT * 3);
    const smokeAges = new Float32Array(SMOKE_COUNT);
    const smokeSizes = new Float32Array(SMOKE_COUNT);
    const smokeSeeds = new Float32Array(SMOKE_COUNT);
    const smokeRots = new Float32Array(SMOKE_COUNT);
    const smokeParticles: SmokeParticle[] = [];

    for (let i = 0; i < SMOKE_COUNT; i++) {
      smokeParticles.push({
        active: false,
        age: 0,
        life: 3.4,
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
        baseSize: 1.0,
        seed: Math.random() * 100,
        rot: Math.random() * Math.PI * 2,
      });
      smokePositions[i * 3 + 1] = -10;
    }

    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    smokeGeo.setAttribute('aAge', new THREE.BufferAttribute(smokeAges, 1));
    smokeGeo.setAttribute('aSize', new THREE.BufferAttribute(smokeSizes, 1));
    smokeGeo.setAttribute('aSeed', new THREE.BufferAttribute(smokeSeeds, 1));
    smokeGeo.setAttribute('aRot', new THREE.BufferAttribute(smokeRots, 1));

    const smokeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uLightDir: { value: new THREE.Vector3(0.4, 0.85, 0.35).normalize() },
      },
      vertexShader: `
      attribute float aAge;
      attribute float aSize;
      attribute float aSeed;
      attribute float aRot;
      varying float vAge;
      varying float vSeed;
      varying float vRot;
      uniform float uPixelRatio;
      void main() {
        vAge = aAge;
        vSeed = aSeed;
        vRot = aRot;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float grow = mix(0.35, 4.4, pow(clamp(aAge, 0.0, 1.0), 0.72));
        gl_PointSize = aSize * grow * uPixelRatio * (620.0 / max(0.5, -mvPosition.z));
      }
    `,
      fragmentShader: `
      uniform vec3 uLightDir;
      varying float vAge;
      varying float vSeed;
      varying float vRot;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.05;
          a *= 0.5;
        }
        return v;
      }
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float c = cos(vRot + vAge * 1.1);
        float s = sin(vRot + vAge * 1.1);
        vec2 ruv = mat2(c, -s, s, c) * uv;
        float dist = length(uv) * 2.0;
        if (dist > 1.0) discard;

        float n = fbm(ruv * 3.6 + vec2(vSeed, vAge * 0.75));
        float radial = pow(1.0 - dist, 1.15);
        float density = smoothstep(0.10, 0.62, radial * (0.72 + 0.85 * n));
        float fadeIn = smoothstep(0.0, 0.08, vAge);
        float fadeOut = 1.0 - smoothstep(0.55, 1.0, vAge);
        float alpha = density * fadeIn * fadeOut * 0.84;
        if (alpha < 0.01) discard;

        // Spherical billboard normal perturbed by FBM for 3D volumetric cloud shading
        vec2 nxy = uv * 2.0;
        float nz = sqrt(max(0.0, 1.0 - dot(nxy, nxy)));
        vec3 N = normalize(vec3(nxy.x + (n - 0.5) * 0.55, -nxy.y + (n - 0.5) * 0.45, nz));
        float halfLambert = dot(N, uLightDir) * 0.5 + 0.5;

        vec3 shadowCol = vec3(0.28, 0.31, 0.36);
        vec3 litCol = vec3(0.94, 0.95, 0.97);
        vec3 col = mix(shadowCol, litCol, pow(halfLambert, 1.2));
        gl_FragColor = vec4(col, alpha);
      }
    `,
    });

    const smokePoints = new THREE.Points(smokeGeo, smokeMat);
    smokePoints.frustumCulled = false;
    smokePoints.renderOrder = 50; // Always render after transparent car glass, lights, dashboard, and badges
    root.add(smokePoints);

    // --- B. Cohesive High-Viscosity Oil Stream, Connected Liquid Packets & Metaball Puddle ---
    const OIL_COUNT = 180;
    const oilDroplets: OilDroplet[] = [];
    const oilSeeds = new Float32Array(OIL_COUNT);
    for (let i = 0; i < OIL_COUNT; i++) {
      oilDroplets.push({
        active: false,
        age: 0,
        life: 1.35,
        radius: 0.0085,
        elongation: 5.5,
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
      });
      oilSeeds[i] = (i * 0.42) % 62.8;
    }

    const blobGeo = new THREE.SphereGeometry(1.0, 18, 14);
    blobGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(oilSeeds, 1));

    // Shared Beer-Lambert + IOR 1.47 dielectric shader with smooth cohesive capsule deformation
    const oilBlobMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float aSeed;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying float vAxial;
        uniform float uTime;
        void main() {
          // Smooth high-viscosity liquid packet modulation along flow axis
          vec3 p = position;
          float wave = 1.0
            + 0.12 * sin(p.z * 2.4 + aSeed - uTime * 6.0)
            + 0.06 * cos(p.y * 2.8 + aSeed * 0.7 + uTime * 4.5);
          float taper = 1.0 - 0.12 * p.z * p.z;
          p.xy *= wave * taper;
          vAxial = abs(p.z);

          mat4 m = modelMatrix * instanceMatrix;
          vec4 wp = m * vec4(p, 1.0);
          // Compute true cylindrical normal perpendicular to the stream axis so overlapping packets blend seamlessly without orange end-cap stripes
          vec3 cylNormal = normalize(vec3(normal.xy, normal.z * 0.14));
          vNormal = normalize(mat3(m) * normalize(cylNormal + vec3(0.06 * sin(p.z * 2.4 + aSeed), 0.06 * cos(p.z * 2.4), 0.0)));
          vViewDir = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying float vAxial;
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewDir);
          float ndotv = clamp(dot(N, V), 0.0, 1.0);

          // Subtle, dark natural motor-oil coloration (deep espresso-black core with muted dark-brown edges, never glowing orange)
          float opticalDepth = mix(0.65, 2.8, pow(ndotv, 0.65));
          vec3 absorption = exp(-vec3(3.2, 5.2, 9.5) * opticalDepth);
          vec3 subtleBrown = vec3(0.22, 0.12, 0.04) * absorption;
          vec3 coreOil = mix(vec3(0.010, 0.008, 0.006), subtleBrown, 0.45 * (1.0 - 0.6 * vAxial));

          // Neutral dark-studio dielectric reflection (muted warm-slate sheen, zero orange/white hotspots)
          float F0 = 0.0362;
          float fresnel = F0 + (0.18 - F0) * pow(1.0 - ndotv, 4.0);
          vec3 L1 = normalize(vec3(0.35, 0.90, 0.25));
          float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 32.0);
          vec3 L2 = normalize(vec3(-0.4, 0.75, -0.45));
          float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 18.0);

          vec3 studioSheen = vec3(0.16, 0.15, 0.14) * fresnel;
          vec3 studioHighlight = vec3(0.24, 0.21, 0.17) * (spec1 * 0.20 + spec2 * 0.10);
          vec3 col = clamp(coreOil + studioSheen + studioHighlight, 0.0, 0.28);
          float alpha = mix(0.94, 1.0, smoothstep(0.06, 0.40, ndotv));
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const oilBlobInstanced = new THREE.InstancedMesh(blobGeo, oilBlobMat, OIL_COUNT);
    oilBlobInstanced.frustumCulled = false;
    oilBlobInstanced.renderOrder = 2;
    root.add(oilBlobInstanced);

    // Nozzle-anchored continuous ballistic viscous oil stream (matches gravity parabolic trajectory)
    const filCurvePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const distZ = u * 0.72; // Extends 0.72m along the ballistic arc before pinching into long ribbons
      const flightT = distZ / 1.38;
      const dropY = 0.04 * flightT - 0.5 * 3.8 * flightT * flightT;
      filCurvePts.push(new THREE.Vector3(0, dropY, -distZ));
    }
    const filCurve = new THREE.CatmullRomCurve3(filCurvePts);
    const filGeo = new THREE.TubeGeometry(filCurve, 44, 1.0, 16, false);
    const filPos = filGeo.attributes.position;
    const filUv = filGeo.attributes.uv;
    const filPt = new THREE.Vector3();
    for (let i = 0; i < filPos.count; i++) {
      const u = filUv.getX(i);
      const c = filCurve.getPointAt(THREE.MathUtils.clamp(u, 0, 1));
      const r = THREE.MathUtils.lerp(0.0062, 0.0040, Math.pow(u, 0.65));
      filPt.fromBufferAttribute(filPos, i).sub(c).multiplyScalar(r).add(c);
      filPos.setXYZ(i, filPt.x, filPt.y, filPt.z);
    }
    filGeo.computeVertexNormals();

    const oilFilamentMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      uniforms: {
        uTime: { value: 0 },
        uActive: { value: 0 },
        uLength: { value: 1 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        uniform float uTime;
        uniform float uLength;
        void main() {
          vUv = uv;
          float u = uv.x;
          vec3 p = position;
          // High-viscosity Rayleigh-Plateau traveling surface tension waves & organic sway
          float env = smoothstep(0.03, 0.25, u);
          float wave1 = sin(u * 15.0 - uTime * 11.5);
          float wave2 = cos(u * 26.0 - uTime * 17.0);
          float radiusMod = 1.0 + (0.28 * wave1 + 0.14 * wave2) * env;
          p.xy += normal.xy * ((radiusMod - 1.0) * 0.0034);
          p.x += sin(u * 6.5 - uTime * 5.2) * 0.0065 * u * env;
          p.y += cos(u * 8.0 - uTime * 6.0) * 0.0045 * u * env;

          vec4 wp = modelMatrix * vec4(p, 1.0);
          vec3 pertN = normalize(normal + vec3(0.18 * wave1 * env, 0.14 * wave2 * env, 0.0));
          vNormal = normalize(mat3(modelMatrix) * pertN);
          vViewDir = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        uniform float uActive;
        uniform float uLength;
        void main() {
          if (uActive <= 0.01 || vUv.x > uLength) discard;
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewDir);
          float ndotv = clamp(dot(N, V), 0.0, 1.0);
          // Natural dark high-viscosity motor oil (matches connected stream packets seamlessly, no glowing orange)
          float opticalDepth = mix(0.65, 2.75, pow(ndotv, 0.65)) * mix(1.05, 0.75, vUv.x);
          vec3 absorption = exp(-vec3(3.2, 5.2, 9.5) * opticalDepth);
          vec3 col = mix(vec3(0.010, 0.008, 0.006), vec3(0.22, 0.12, 0.04) * absorption, 0.45);
          float F0 = 0.0362;
          float fresnel = F0 + (0.18 - F0) * pow(1.0 - ndotv, 4.0);
          vec3 L1 = normalize(vec3(0.35, 0.90, 0.25));
          float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 32.0);
          vec3 L2 = normalize(vec3(-0.4, 0.75, -0.45));
          float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 18.0);
          col += vec3(0.16, 0.15, 0.14) * fresnel + vec3(0.24, 0.21, 0.17) * (spec1 * 0.20 + spec2 * 0.10);
          col = clamp(col, 0.0, 0.28);
          float tipFade = 1.0 - smoothstep(uLength - 0.15, uLength, vUv.x);
          gl_FragColor = vec4(col, uActive * mix(0.94, 1.0, tipFade));
        }
      `,
    });
    const oilFilamentMesh = new THREE.Mesh(filGeo, oilFilamentMat);
    oilFilamentMesh.position.set(0.6325, 0.785, -2.250);
    oilFilamentMesh.renderOrder = 2;
    root.add(oilFilamentMesh);

    const MAX_METABALLS = 36;
    const oilMetaballs: OilMetaball[] = [];
    const oilBallUniforms: THREE.Vector4[] = [];
    for (let i = 0; i < MAX_METABALLS; i++) {
      oilMetaballs.push({ active: false, x: 0, z: -10, vx: 0, vz: 0, r: 0 });
      oilBallUniforms.push(new THREE.Vector4(0, -10, 0, 0));
    }
    const oilImpact = new THREE.Vector3(0.63, -3.5, 10.0);

    const oilPuddleMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uBalls: { value: oilBallUniforms },
        uImpact: { value: oilImpact },
        uTime: { value: 0.0 },
      },
      vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
      fragmentShader: `
      varying vec3 vWorldPos;
      uniform vec4 uBalls[36];
      uniform vec3 uImpact;
      uniform float uTime;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
      float fbm(vec2 p) {
        float v = 0.0; float a = 0.5;
        for (int i = 0; i < 3; i++) {
          v += a * noise(p);
          p *= 2.07; a *= 0.5;
        }
        return v;
      }

      float evalField(vec2 p) {
        float F = 0.0;
        for (int i = 0; i < 36; i++) {
          vec4 b = uBalls[i];
          if (b.z <= 0.001) continue;
          vec2 d = p - b.xy;
          F += (b.z * b.z) / (dot(d, d) + 0.0005);
        }
        if (F < 0.35) return F;
        // Domain-warped organic fingers so puddle never looks circular or uniform
        vec2 q = p * 3.8;
        float warp = (fbm(q) - 0.5) * 0.55 + (fbm(q * 2.4 + vec2(3.1, 1.7)) - 0.5) * 0.22;
        return F + warp * smoothstep(0.35, 1.05, F);
      }

      void main() {
        vec2 p = vWorldPos.xz;
        float F = evalField(p);
        if (F < 0.86) discard;

        // Wet ground staining right around & under the oil contact line
        if (F < 1.0) {
          float stain = smoothstep(0.86, 1.0, F) * 0.50;
          gl_FragColor = vec4(0.008, 0.008, 0.010, stain);
          return;
        }

        // Finite-difference gradient of perturbed field for irregular creeping meniscus normals
        float eps = 0.004;
        vec2 gradF = vec2(evalField(p + vec2(eps, 0.0)) - F, evalField(p + vec2(0.0, eps)) - F) / eps;

        // High-surface-tension rounded bulging meniscus: steep rise at F=1.0+
        float excess = clamp(F - 1.0, 0.0, 2.2);
        float dh_dF = 0.010 / max(0.06, sqrt(excess));

        // Subtle, slow-moving concentric ripples ONLY at the point of impact
        vec2 impD = p - uImpact.xy;
        float impDist = length(impD);
        float impEnv = exp(-impDist * 7.5) * exp(-uImpact.z * 1.4);
        float ripplePhase = impDist * 46.0 - uImpact.z * 7.5;
        float rippleSlope = impEnv * cos(ripplePhase) * 0.13;
        vec2 rippleGrad = (impDist > 0.001) ? (impD / impDist) * rippleSlope : vec2(0.0);

        vec2 totalGrad = gradF * dh_dF + rippleGrad;
        vec3 N = normalize(vec3(-totalGrad.x, 1.0, -totalGrad.y));
        vec3 V = normalize(cameraPosition - vWorldPos);
        float ndotv = clamp(dot(N, V), 0.0, 1.0);

        // Subtle Beer-Lambert depth absorption: thin meniscus edge is muted dark warm-brown, center -> deep near-black
        float depth = excess * 1.35;
        vec3 absorb = exp(-vec3(3.0, 5.2, 9.8) * depth);
        vec3 thinAmber = vec3(0.24, 0.13, 0.04) * absorb;
        vec3 deepCenter = vec3(0.009, 0.007, 0.005);
        vec3 oilBody = mix(deepCenter, thinAmber, exp(-depth * 2.8) * 0.55);

        // Subtle dark-studio sheen & muted meniscus highlight (no glowing orange rim or white spot reflection)
        float F0 = 0.0362;
        float fresnel = F0 + (0.16 - F0) * pow(1.0 - ndotv, 4.0);
        vec3 L1 = normalize(vec3(0.22, 0.92, 0.32));
        float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 36.0);
        vec3 L2 = normalize(vec3(-0.35, 0.82, -0.44));
        float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 22.0);

        vec3 warmEnv = vec3(0.15, 0.14, 0.13) * fresnel;
        vec3 warmSpec = vec3(0.25, 0.21, 0.16) * (spec1 * 0.22 + spec2 * 0.10);
        vec3 col = clamp(oilBody + warmEnv + warmSpec, 0.0, 0.28);

        gl_FragColor = vec4(col, 0.97);
      }
    `,
    });

    const oilPuddle = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.4), oilPuddleMat);
    oilPuddle.rotation.x = -Math.PI / 2;
    oilPuddle.position.set(0.60, 0.023, -3.90);
    oilPuddle.renderOrder = 1;
    root.add(oilPuddle);

    // --- C. Four-Sided Steel Caltrops (InstancedMesh, Right Taillight Dispenser) ---
    const CALTROP_COUNT = 48;
    const caltrops: CaltropItem[] = [];
    for (let i = 0; i < CALTROP_COUNT; i++) {
      caltrops.push({
        active: false,
        settled: false,
        age: 0,
        life: 6.0,
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(),
        angVel: new THREE.Vector3(),
      });
    }
    const caltropGeo = buildTetraCaltropGeometry(0.024);
    const caltropMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.9,
      roughness: 0.28,
    });
    const caltropInstanced = new THREE.InstancedMesh(caltropGeo, caltropMat, CALTROP_COUNT);
    caltropInstanced.frustumCulled = false;
    root.add(caltropInstanced);

    return {
      root,
      frontPlateDrum: frontPlate.drum,
      rearPlateDrum: rearPlate.drum,
      frontRams,
      rearRams,
      bulletShieldGroup,
      roofHatchGroup,
      roofHatchBasePos,
      passengerSeatGroup,
      passengerSeatBasePos,
      ejectAirPoints,
      ejectAirParticles,
      leftOilLampPivot,
      leftOilNozzle,
      leftOilArms,
      rightCaltropPivot,
      subParts,
      plateAngle: 0,
      ramFrontExtend: 0,
      ramRearExtend: 0,
      shieldExtend: 0,
      hatchActivePrev: false,
      hatchTimer: 0,
      hatchOpen: 0,
      seatEjectProgress: 0,
      oilLidOpen: 0,
      caltropLidOpen: 0,
      smokePoints,
      smokeParticles,
      oilBlobInstanced,
      oilBlobMat,
      oilFilamentMesh,
      oilFilamentMat,
      oilDroplets,
      oilMetaballs,
      oilPuddleMat,
      oilImpact,
      oilSpawnAccum: 0,
      caltropInstanced,
      caltrops,
      time: 0,
    };
  }

  const _dummyObj = new THREE.Object3D();

  /**
   * Smoothly updates all exterior Q-Branch mechanical assemblies, custom GLSL smoke particles,
   * arcing oil droplets, and the iridescent spreading ground oil slick.
   */
  export function updateQBranchGadgetsRig(
    rig: QBranchGadgetsRig,
    state: QBranchGadgetStates,
    dt: number
  ): void {
    const safeDt = Math.min(dt, 0.05);
    rig.time += safeDt;

    // 1. Revolving 3-Way Number Plates
    const targetPlateAngle = state.plateIndex * ((Math.PI * 2) / 3);
    let diff = targetPlateAngle - rig.plateAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    rig.plateAngle += diff * Math.min(1, safeDt * 9);
    rig.frontPlateDrum.rotation.x = rig.plateAngle;
    rig.rearPlateDrum.rotation.x = rig.plateAngle;

    // 2. Front & Rear Hydraulic Battering Rams
    rig.ramFrontExtend += ((state.frontRam ? 1 : 0) - rig.ramFrontExtend) * Math.min(1, safeDt * 7);
    rig.ramRearExtend += ((state.rearRam ? 1 : 0) - rig.ramRearExtend) * Math.min(1, safeDt * 7);
    for (const r of rig.frontRams) r.position.z = rig.ramFrontExtend * 0.26;
    for (const r of rig.rearRams) r.position.z = rig.ramRearExtend * 0.26;

    // 3. Bullet-Resistant Rear Shield (rises vertically from -0.326m stowed to 0m deployed)
    rig.shieldExtend += ((state.bulletShield ? 1 : 0) - rig.shieldExtend) * Math.min(1, safeDt * 5.5);
    rig.bulletShieldGroup.position.y = -0.326 + rig.shieldExtend * 0.326;

    // 4. Passenger Ejector Seat & Jettisonable Roof Panel Sequence (Jet-Cockpit Compressed-Air Principle)
    // Stage 1 (0.00s -> 0.32s): Pneumatic bolts shear & blast the flush roof panel cleanly up and rearward out of the slipstream
    // Stage 2 (0.14s -> 0.54s): High-pressure compressed-air cylinders fire a white-blue vapour burst & rocket the seat skyward
    if (state.roofHatch && !rig.hatchActivePrev) {
      rig.hatchTimer = 0;
    }
    rig.hatchActivePrev = state.roofHatch;

    if (state.roofHatch) {
      rig.hatchTimer = Math.min(3.0, rig.hatchTimer + safeDt);
      const tPanel = THREE.MathUtils.clamp(rig.hatchTimer / 0.36, 0, 1);
      rig.hatchOpen = tPanel;
      const arcY = 2.65 * tPanel - 0.55 * tPanel * tPanel;
      const driftZ = -2.45 * tPanel * tPanel;
      const driftX = 0.28 * tPanel;
      rig.roofHatchGroup.position.set(
        rig.roofHatchBasePos.x + driftX,
        rig.roofHatchBasePos.y + arcY,
        rig.roofHatchBasePos.z + driftZ
      );
      rig.roofHatchGroup.rotation.set(-tPanel * 2.2, tPanel * 0.35, -tPanel * 0.65);
      rig.roofHatchGroup.visible = tPanel < 0.98;

      // Rapid compressed-air ballistic launch along seat-back angle (+Y, slightly -Z, zero lateral clash)
      const tSeatRaw = THREE.MathUtils.clamp((rig.hatchTimer - 0.14) / 0.38, 0, 1);
      const seatEase = 1 - Math.pow(1 - tSeatRaw, 3.2);
      rig.seatEjectProgress = seatEase;
      rig.passengerSeatGroup.position.set(
        rig.passengerSeatBasePos.x,
        rig.passengerSeatBasePos.y + 1.18 * seatEase,
        rig.passengerSeatBasePos.z - 0.22 * seatEase
      );
      rig.passengerSeatGroup.rotation.set(-0.16 * seatEase, 0, 0);
    } else {
      // Smoothly re-seat compressed-air seat and reseat flush roof panel when reset
      rig.hatchTimer = 0;
      rig.hatchOpen += (0 - rig.hatchOpen) * Math.min(1, safeDt * 8.0);
      rig.seatEjectProgress += (0 - rig.seatEjectProgress) * Math.min(1, safeDt * 8.0);
      rig.roofHatchGroup.visible = true;
      rig.roofHatchGroup.position.set(
        rig.roofHatchBasePos.x + 0.28 * rig.hatchOpen,
        rig.roofHatchBasePos.y + 1.85 * rig.hatchOpen,
        rig.roofHatchBasePos.z - 1.65 * rig.hatchOpen
      );
      rig.roofHatchGroup.rotation.set(-rig.hatchOpen * 1.4, rig.hatchOpen * 0.25, -rig.hatchOpen * 0.45);
      rig.passengerSeatGroup.position.set(
        rig.passengerSeatBasePos.x,
        rig.passengerSeatBasePos.y + 1.18 * rig.seatEjectProgress,
        rig.passengerSeatBasePos.z - 0.22 * rig.seatEjectProgress
      );
      rig.passengerSeatGroup.rotation.set(-0.16 * rig.seatEjectProgress, 0, 0);
    }

    // 4B. Compressed-Air Vapour Burst from Floor Cylinders during Ejection Launch
    const airPosAttr = rig.ejectAirPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const airAgeAttr = rig.ejectAirPoints.geometry.getAttribute('aAge') as THREE.BufferAttribute;
    const airSizeAttr = rig.ejectAirPoints.geometry.getAttribute('aSize') as THREE.BufferAttribute;
    const airRotAttr = rig.ejectAirPoints.geometry.getAttribute('aRot') as THREE.BufferAttribute;

    const isAirBlasting = state.roofHatch && rig.hatchTimer >= 0.12 && rig.hatchTimer <= 0.65;
    let airBudget = isAirBlasting ? 10 : 0;
    for (let i = 0; i < rig.ejectAirParticles.length; i++) {
      const ap = rig.ejectAirParticles[i];
      if (!ap.active && airBudget > 0) {
        airBudget--;
        ap.active = true;
        ap.age = 0;
        ap.life = 0.42 + Math.random() * 0.22;
        const rx = i % 2 === 0 ? -0.095 : 0.095;
        ap.pos.set(
          rig.passengerSeatBasePos.x + rx + (Math.random() - 0.5) * 0.04,
          0.42,
          rig.passengerSeatBasePos.z - 0.02 + (Math.random() - 0.5) * 0.04
        );
        ap.vel.set(
          (Math.random() - 0.5) * 0.75 + (rx > 0 ? 0.25 : -0.25),
          2.2 + Math.random() * 1.6,
          -0.35 + (Math.random() - 0.5) * 0.45
        );
        ap.baseSize = 0.28 + Math.random() * 0.22;
        ap.rot = Math.random() * Math.PI * 2;
      }

      if (ap.active) {
        ap.age += safeDt;
        const t = ap.age / ap.life;
        if (t >= 1) {
          ap.active = false;
          airPosAttr.setXYZ(i, 0, -10, 0);
          airAgeAttr.setX(i, 1);
        } else {
          ap.vel.multiplyScalar(Math.pow(0.18, safeDt));
          ap.pos.addScaledVector(ap.vel, safeDt);
          airPosAttr.setXYZ(i, ap.pos.x, ap.pos.y, ap.pos.z);
          airAgeAttr.setX(i, t);
          airSizeAttr.setX(i, ap.baseSize);
          airRotAttr.setX(i, ap.rot);
        }
      } else {
        airPosAttr.setXYZ(i, 0, -10, 0);
      }
    }
    airPosAttr.needsUpdate = true;
    airAgeAttr.needsUpdate = true;
    airSizeAttr.needsUpdate = true;
    airRotAttr.needsUpdate = true;

    // 5A. Volumetric Smoke Screen Particle Simulation
    const posAttr = rig.smokePoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const ageAttr = rig.smokePoints.geometry.getAttribute('aAge') as THREE.BufferAttribute;
    const sizeAttr = rig.smokePoints.geometry.getAttribute('aSize') as THREE.BufferAttribute;
    const seedAttr = rig.smokePoints.geometry.getAttribute('aSeed') as THREE.BufferAttribute;
    const rotAttr = rig.smokePoints.geometry.getAttribute('aRot') as THREE.BufferAttribute;

    let smokeSpawnBudget = state.smokeScreen ? 8 : 0;
    for (let i = 0; i < rig.smokeParticles.length; i++) {
      const p = rig.smokeParticles[i];
      if (!p.active && smokeSpawnBudget > 0) {
        smokeSpawnBudget--;
        p.active = true;
        p.age = 0;
        p.life = 2.6 + Math.random() * 1.6;
        const side = i % 2 === 0 ? -0.43 : 0.43;
        p.pos.set(side + (Math.random() - 0.5) * 0.06, 0.295, -2.31);
        p.vel.set(
          (Math.random() - 0.5) * 0.65 + (side > 0 ? 0.16 : -0.16),
          0.16 + Math.random() * 0.30,
          -(2.6 + Math.random() * 1.6)
        );
        p.baseSize = 0.85 + Math.random() * 0.7;
        p.seed = Math.random() * 100;
        p.rot = Math.random() * Math.PI * 2;
      }

      if (p.active) {
        p.age += safeDt;
        const t = p.age / p.life;
        if (t >= 1) {
          p.active = false;
          posAttr.setXYZ(i, 0, -10, 0);
          ageAttr.setX(i, 1);
        } else {
          // Strong aerodynamic drag + ground-hugging turbulent vortex wake
          p.vel.z *= Math.pow(0.38, safeDt);
          p.vel.x += Math.sin(rig.time * 2.8 + p.seed + p.pos.z * 1.4) * 0.75 * safeDt;
          p.vel.y += (0.24 - p.vel.y) * 0.65 * safeDt;
          p.pos.addScaledVector(p.vel, safeDt);
          if (p.pos.y < 0.16) p.pos.y = 0.16;

          posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
          ageAttr.setX(i, t);
          sizeAttr.setX(i, p.baseSize);
          seedAttr.setX(i, p.seed);
          rotAttr.setX(i, p.rot);
        }
      } else {
        posAttr.setXYZ(i, 0, -10, 0);
      }
    }
    posAttr.needsUpdate = true;
    ageAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    seedAttr.needsUpdate = true;
    rotAttr.needsUpdate = true;

    // 5B. Left Taillight Hinge & Nozzle-Anchored Viscous Filament -> Deformed Droplets -> Metaball Puddle
    rig.oilLidOpen += ((state.oilSlick ? 1 : 0) - rig.oilLidOpen) * Math.min(1, safeDt * 7.5);
    rig.leftOilLampPivot.rotation.x = rig.oilLidOpen * 1.32; // Lifts top amber lamp ~75° upward
    rig.leftOilNozzle.position.z = -2.165 - rig.oilLidOpen * 0.065;
    for (const arm of rig.leftOilArms) {
      arm.visible = rig.oilLidOpen > 0.08;
      arm.scale.z = Math.max(0.05, rig.oilLidOpen);
    }

    const nozzleTipZ = rig.leftOilNozzle.position.z - 0.036;
    const isPouring = state.oilSlick && rig.oilLidOpen > 0.65;
    // Smooth, heavy high-viscosity pump pressure wave (continuous cohesive flow, never chopped up)
    const pumpWave = 0.5 + 0.5 * Math.sin(rig.time * 4.2) + 0.25 * Math.sin(rig.time * 9.6);

    rig.oilBlobMat.uniforms.uTime.value = rig.time;
    rig.oilFilamentMesh.position.z = nozzleTipZ + 0.008;
    rig.oilFilamentMat.uniforms.uTime.value = rig.time;
    rig.oilFilamentMat.uniforms.uActive.value +=
      ((isPouring ? 1 : 0) - rig.oilFilamentMat.uniforms.uActive.value) * Math.min(1, safeDt * 9);
    rig.oilFilamentMat.uniforms.uLength.value = 0.78 + 0.20 * Math.sin(rig.time * 4.8);

    if (isPouring) {
      rig.oilSpawnAccum += safeDt;
      const spawnInterval = 0.0075; // High-density overlapping emission (~133 packets/sec)
      while (rig.oilSpawnAccum >= spawnInterval) {
        rig.oilSpawnAccum -= spawnInterval;
        const slot = rig.oilDroplets.find((d) => !d.active);
        if (!slot) break;
        slot.active = true;
        slot.age = 0;
        slot.life = 1.35;
        // Coherent travelling pressure pulses produce thick globs connected by stretched viscous ligaments
        const pulse = 0.5 + 0.5 * Math.sin(rig.time * 13.5);
        slot.radius = 0.0062 + 0.0038 * pulse;
        slot.elongation = 5.2 + 2.8 * (1.0 - pulse);
        const swayX = Math.sin(rig.time * 5.2) * 0.0022;
        const swayY = Math.cos(rig.time * 6.0) * 0.0018;
        slot.pos.set(0.6325 + swayX, 0.785 + swayY, nozzleTipZ - 0.004);
        const jetSpeed = 1.34 + 0.10 * pumpWave;
        slot.vel.set(
          Math.sin(rig.time * 4.6) * 0.032,
          0.038 + Math.cos(rig.time * 5.4) * 0.015,
          -jetSpeed
        );
      }
    }

    rig.oilImpact.z += safeDt;

    for (let i = 0; i < rig.oilDroplets.length; i++) {
      const d = rig.oilDroplets[i];
      if (d.active) {
        d.age += safeDt;
        d.vel.y -= 3.8 * safeDt;
        d.pos.addScaledVector(d.vel, safeDt);
        if (d.pos.y <= 0.025 || d.age >= d.life) {
          if (d.pos.y <= 0.025) {
            rig.oilImpact.set(d.pos.x, d.pos.z, 0);
            let merged = false;
            for (const mb of rig.oilMetaballs) {
              if (mb.active && Math.hypot(mb.x - d.pos.x, mb.z - d.pos.z) < 0.16) {
                mb.r = Math.min(0.32, Math.hypot(mb.r, d.radius * 1.55));
                mb.vx += (d.vel.x * 0.06 + (Math.random() - 0.5) * 0.03);
                mb.vz -= 0.018;
                merged = true;
                break;
              }
            }
            if (!merged) {
              const freeMb = rig.oilMetaballs.find((m) => !m.active);
              if (freeMb) {
                freeMb.active = true;
                freeMb.x = d.pos.x;
                freeMb.z = d.pos.z;
                freeMb.vx = (Math.random() - 0.5) * 0.06;
                freeMb.vz = -0.055 - Math.random() * 0.04;
                freeMb.r = 0.065 + Math.random() * 0.025;
              }
            }
          }
          d.active = false;
          _dummyObj.position.set(0, -10, 0);
          _dummyObj.scale.setScalar(0.0001);
        } else {
          _dummyObj.position.copy(d.pos);
          _dummyObj.lookAt(d.pos.clone().add(d.vel));
          // High-viscosity liquid columns stretch smoothly along their parabolic trajectory and swell near impact
          const flightProgress = THREE.MathUtils.clamp(d.age / 0.65, 0, 1);
          const rDynamic = d.radius * THREE.MathUtils.lerp(0.95, 1.18, flightProgress);
          const lenDynamic = d.radius * d.elongation * THREE.MathUtils.lerp(1.15, 0.78, flightProgress);
          _dummyObj.scale.set(rDynamic, rDynamic, lenDynamic);
        }
      } else {
        _dummyObj.position.set(0, -10, 0);
        _dummyObj.scale.setScalar(0.0001);
      }
      _dummyObj.updateMatrix();
      rig.oilBlobInstanced.setMatrixAt(i, _dummyObj.matrix);
    }
    rig.oilBlobInstanced.instanceMatrix.needsUpdate = true;

    // Slowly creeping high-viscosity damped metaballs on the ground
    const ballUniforms = rig.oilPuddleMat.uniforms.uBalls.value as THREE.Vector4[];
    const damp = Math.exp(-4.2 * safeDt);
    for (let i = 0; i < rig.oilMetaballs.length; i++) {
      const mb = rig.oilMetaballs[i];
      if (mb.active) {
        mb.vx *= damp;
        mb.vz *= damp;
        mb.x += mb.vx * safeDt;
        mb.z += mb.vz * safeDt;
        if (!state.oilSlick) {
          mb.r -= 0.045 * safeDt;
          if (mb.r <= 0.002) {
            mb.active = false;
            mb.r = 0;
          }
        }
        ballUniforms[i].set(mb.x, mb.z, mb.r, 0);
      } else {
        ballUniforms[i].set(0, -10, 0, 0);
      }
    }
    rig.oilPuddleMat.uniforms.uTime.value = rig.time;

    // 5C. Right Taillight Hinge & 4-Sided Steel Caltrop Dispenser
    rig.caltropLidOpen += ((state.caltrops ? 1 : 0) - rig.caltropLidOpen) * Math.min(1, safeDt * 7.5);
    rig.rightCaltropPivot.rotation.x = -rig.caltropLidOpen * 1.65; // Flips entire right cluster ~95° down

    let caltropSpawnBudget = state.caltrops && rig.caltropLidOpen > 0.65 ? 2 : 0;
    for (let i = 0; i < rig.caltrops.length; i++) {
      const c = rig.caltrops[i];
      if (!c.active && caltropSpawnBudget > 0) {
        caltropSpawnBudget--;
        c.active = true;
        c.settled = false;
        c.age = 0;
        c.life = 5.5 + Math.random() * 2.0;
        c.pos.set(-0.6325 + (Math.random() - 0.5) * 0.025, 0.68, -2.19);
        c.vel.set(
          (Math.random() - 0.5) * 0.55,
          0.15 + Math.random() * 0.35,
          -(1.8 + Math.random() * 1.4)
        );
        c.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        c.angVel.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      }

      if (c.active) {
        c.age += safeDt;
        if (c.age >= c.life && !state.caltrops) {
          c.active = false;
        } else if (!c.settled) {
          c.vel.y -= 6.5 * safeDt;
          c.pos.addScaledVector(c.vel, safeDt);
          c.rot.x += c.angVel.x * safeDt;
          c.rot.y += c.angVel.y * safeDt;
          c.rot.z += c.angVel.z * safeDt;
          if (c.pos.y <= 0.029) {
            c.pos.y = 0.029;
            if (Math.abs(c.vel.y) > 0.45) {
              c.vel.y = -c.vel.y * 0.32;
              c.vel.x *= 0.6;
              c.vel.z *= 0.6;
            } else {
              c.settled = true;
              // Settle flat with 1 spike pointing straight up
              c.rot.set(0, Math.random() * Math.PI * 2, 0);
            }
          }
        }
        if (c.active) {
          _dummyObj.position.copy(c.pos);
          _dummyObj.rotation.copy(c.rot);
          _dummyObj.scale.setScalar(1);
        } else {
          _dummyObj.position.set(0, -10, 0);
          _dummyObj.scale.setScalar(0.001);
        }
      } else {
        _dummyObj.position.set(0, -10, 0);
        _dummyObj.scale.setScalar(0.001);
      }
      _dummyObj.updateMatrix();
      rig.caltropInstanced.setMatrixAt(i, _dummyObj.matrix);
    }
    rig.caltropInstanced.instanceMatrix.needsUpdate = true;
  }
