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

export interface RearWheelSpinnerExtractData {
  leftSpinnerMeshes: THREE.Mesh[];
  leftSpinnerPivotPos: THREE.Vector3;
  rightSpinnerMeshes: THREE.Mesh[];
  rightSpinnerPivotPos: THREE.Vector3;
}

interface CaltropItem {
  active: boolean;
  settled: boolean;
  bounces: number;
  age: number;
  life: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  angVel: THREE.Vector3;
  restRotY: number;
}

interface EjectAirParticle {
  active: boolean;
  age: number;
  life: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  baseSize: number;
  seed: number;
  rot: number;
}

export interface TyreSlasherUnit {
  sideSign: number; // +1 for Left (+X), -1 for Right (-X)
  rootGroup: THREE.Group;
  spinGroup: THREE.Group;
  stage1Sleeve: THREE.Group;
  stage2Shaft: THREE.Group;
  spinnerHeadGroup: THREE.Group;
}

export interface QBranchGadgetsRig {
  root: THREE.Group;
  frontPlateDrum: THREE.Group;
  rearPlateDrum: THREE.Group;
  frontRams: THREE.Group[];
  rearRams: THREE.Group[];
  tyreSlasherUnits: TyreSlasherUnit[];
  tyreSlasherExtend: number;
  tyreSlasherSpin: number;
  bulletShieldGroup: THREE.Group;
  roofHatchGroup: THREE.Group;
  roofHatchBasePos: THREE.Vector3;
  outerBevelMesh: THREE.Mesh;
  panelSkirtMesh: THREE.Mesh;
  roofSealMesh: THREE.Mesh;
  innerFlangeMesh: THREE.Mesh;
  passengerSeatGroup: THREE.Group;
  passengerSeatBasePos: THREE.Vector3;
  ejectAirPoints: THREE.Points;
  ejectAirParticles: EjectAirParticle[];
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
  seatPhase: 'stowed' | 'rails' | 'airborne' | 'skid' | 'settled';
  seatPos: THREE.Vector3;
  seatVel: THREE.Vector3;
  seatRot: THREE.Euler;
  seatAngVel: THREE.Vector3;
  seatBounces: number;
  roofPos: THREE.Vector3;
  roofVel: THREE.Vector3;
  roofRot: THREE.Euler;
  roofAngVel: THREE.Vector3;
  roofBounces: number;
  roofSettled: boolean;
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
  ejectorExtract?: EjectorExtractData,
  rearSpinnerExtract?: RearWheelSpinnerExtractData
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
  // Full passenger-side roof opening matching clipMeshByRoundedRect:
  // - x ∈ [0.005, 0.518]: sits cleanly on the roof crown inboard of the left cant rail / rain gutter (x = 0.558) so the left edge never overhangs the door
  // - z ∈ [-0.595, +0.215]: 0.81m fore-aft span aligned with the left door chrome window frame (z ∈ [-0.615, +0.248]) for generous seat + passenger clearance
  const HATCH_MIN_X = 0.005;
  const HATCH_MAX_X = 0.518;
  const HATCH_MIN_Z = -0.595;
  const HATCH_MAX_Z = 0.215;
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

  // Build exact rounded-rectangle perimeter ring with true circular corner arcs matching sdRect (r = 0.068)
  const buildRoofOpeningRingGeo = (
    outerMargin: number,
    innerMargin: number,
    topOffset: number,
    botOffset: number,
    cornerRadius = 0.068,
    segs = 256
  ): THREE.BufferGeometry => {
    const getRoundedRectPt = (u: number, hw: number, hz: number, r: number): [number, number] => {
      const rr = Math.min(r, hw * 0.8, hz * 0.8);
      const sx = hw - rr;
      const sz = hz - rr;
      const perim = 4 * sx + 4 * sz + 2 * Math.PI * rr;
      let d = (((u % 1) + 1) % 1) * perim;
      const arcLen = 0.5 * Math.PI * rr;

      // Walk clockwise around the 4 straight edges and 4 true circular corner arcs
      if (d < sx) return [HATCH_CX + d, HATCH_CZ + hz];
      d -= sx;
      if (d < arcLen) {
        const a = Math.PI / 2 - (d / arcLen) * (Math.PI / 2);
        return [HATCH_CX + sx + Math.cos(a) * rr, HATCH_CZ + sz + Math.sin(a) * rr];
      }
      d -= arcLen;
      if (d < 2 * sz) return [HATCH_CX + hw, HATCH_CZ + sz - d];
      d -= 2 * sz;
      if (d < arcLen) {
        const a = -(d / arcLen) * (Math.PI / 2);
        return [HATCH_CX + sx + Math.cos(a) * rr, HATCH_CZ - sz + Math.sin(a) * rr];
      }
      d -= arcLen;
      if (d < 2 * sx) return [HATCH_CX + sx - d, HATCH_CZ - hz];
      d -= 2 * sx;
      if (d < arcLen) {
        const a = -Math.PI / 2 - (d / arcLen) * (Math.PI / 2);
        return [HATCH_CX - sx + Math.cos(a) * rr, HATCH_CZ - sz + Math.sin(a) * rr];
      }
      d -= arcLen;
      if (d < 2 * sz) return [HATCH_CX - hw, HATCH_CZ - sz + d];
      d -= 2 * sz;
      if (d < arcLen) {
        const a = Math.PI - (d / arcLen) * (Math.PI / 2);
        return [HATCH_CX - sx + Math.cos(a) * rr, HATCH_CZ + sz + Math.sin(a) * rr];
      }
      d -= arcLen;
      return [HATCH_CX - sx + d, HATCH_CZ + hz];
    };

    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const [ox, oz] = getRoundedRectPt(u, HATCH_HW + outerMargin, HATCH_HZ + outerMargin, cornerRadius + outerMargin);
      const [ix, iz] = getRoundedRectPt(u, HATCH_HW + innerMargin, HATCH_HZ + innerMargin, Math.max(0.01, cornerRadius + innerMargin));
      const oy = sampleRoofY(ox, oz);
      const iy = sampleRoofY(ix, iz);
      // 4 vertices per cross-section: 0=outerBot, 1=outerTop, 2=innerTop, 3=innerBot
      positions.push(
        ox, oy + botOffset, oz,
        ox, oy + topOffset, oz,
        ix, iy + topOffset - 0.003, iz,
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

  // Rolled Silver Birch machined bevel collar around the cutout lip (hidden when closed so closed roof is 100% seamless without pins or latch lines)
  const outerBevelGeo = buildRoofOpeningRingGeo(0.002, -0.008, -0.0005, -0.014, 0.068, 256);
  const outerBevelMesh = new THREE.Mesh(outerBevelGeo, silverBirchMat);
  outerBevelMesh.visible = false;
  root.add(outerBevelMesh);

  // Recessed perimeter weatherstrip & channel lip (recessed below outer Silver Birch skin and hidden when closed)
  const roofSealGeo = buildRoofOpeningRingGeo(-0.003, -0.015, -0.004, -0.022, 0.068, 256);
  const roofSealMesh = register(
    new THREE.Mesh(roofSealGeo, rubberPadMat),
    'Ejector Roof Opening Weatherstrip & Flange',
    'Molded Neoprene & Anodized Channel',
    'Recessed perimeter weatherstrip and inner roof channel lip revealed when the roof panel jettisons.',
    [0.28, 1.15, -0.20]
  );
  roofSealMesh.visible = false;
  root.add(roofSealMesh);

  const innerFlangeGeo = buildRoofOpeningRingGeo(-0.011, -0.020, -0.008, -0.024, 0.068, 256);
  const innerFlangeMesh = new THREE.Mesh(innerFlangeGeo, gunmetalMat);
  innerFlangeMesh.visible = false;
  root.add(innerFlangeMesh);

  // Jettisonable Roof Panel Group (extracted live from SM_Roof_101 so it sits 100% flush & seamless when closed, zero pins or surface indicators)
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
        'Flush seamless passenger roof section released by pneumatic shear bolts prior to compressed-air seat ejection.',
        [0.45, 1.45, -0.20]
      );
      roofHatchGroup.add(rm);
    }
  } else {
    const fallbackHatch = register(
      new THREE.Mesh(new THREE.BoxGeometry(0.513, 0.014, 0.81), silverBirchMat),
      'Jettisonable Passenger Roof Panel',
      'Silver Birch Aluminum Roof Section',
      'Flush seamless passenger roof section released by pneumatic shear bolts prior to compressed-air seat ejection.',
      [0.45, 1.45, -0.20]
    );
    roofHatchGroup.add(fallbackHatch);
  }

  // Clean recessed Silver Birch edge lip on the jettisoned roof panel (no hazard stencil plate or alignment pins)
  const panelSkirtGeo = buildRoofOpeningRingGeo(-0.0005, -0.010, -0.0005, -0.013, 0.068, 256);
  panelSkirtGeo.translate(-roofHatchBasePos.x, -roofHatchBasePos.y, -roofHatchBasePos.z);
  const panelSkirtMesh = new THREE.Mesh(panelSkirtGeo, silverBirchMat);
  panelSkirtMesh.visible = false;
  roofHatchGroup.add(panelSkirtMesh);

  // Minimal Passenger Bucket Seat Group + Compact Twin Compressed-Air Pistons
  const passengerSeatBasePos = ejectorExtract?.passengerSeatCenter
    ? ejectorExtract.passengerSeatCenter.clone()
    : new THREE.Vector3(0.33, 0.56, -0.14);
  const passengerSeatGroup = new THREE.Group();
  passengerSeatGroup.position.copy(passengerSeatBasePos);
  root.add(passengerSeatGroup);

  if (ejectorExtract && ejectorExtract.passengerSeatMeshes.length > 0) {
    for (const sm of ejectorExtract.passengerSeatMeshes) {
      register(
        sm,
        'Q-Branch Passenger Ejector Seat',
        'Connolly Leather Bucket Seat',
        'Minimal front passenger bucket seat launched skyward by high-pressure compressed-air cylinders.',
        [0.35, 1.25, -0.15]
      );
      passengerSeatGroup.add(sm);
    }
  }

  // Compact twin compressed-air inner pistons tucked cleanly directly under the seat cushion (no oversized launch tray or long protruding rods)
  for (const rx of [-0.10, 0.10]) {
    const airPiston = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.22, 14), chromeMat),
      'Compressed-Air Ejector Seat Piston',
      'Polished Stainless Pneumatic Ram',
      'Compact high-pressure pneumatic piston tucked beneath the passenger bucket seat cushion.',
      [0.35, 0.85, -0.15]
    );
    airPiston.position.set(rx, -0.22, -0.04);
    passengerSeatGroup.add(airPiston);
  }

  // Compact twin floor-mounted compressed-air receiver cylinders anchored beneath the seat
  for (const rx of [-0.10, 0.10]) {
    const floorTube = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.18, 16), gunmetalMat),
      'Compressed-Air Ejector Floor Cylinder',
      'High-Pressure Pneumatic Launch Cylinder',
      'Twin compressed-air launch cylinders anchored to the passenger floor pan.',
      [0.35, 0.45, -0.15]
    );
    floorTube.position.set(passengerSeatBasePos.x + rx, 0.32, passengerSeatBasePos.z - 0.04);
    root.add(floorTube);
  }

  // High-pressure white-blue compressed-air vapour burst (fires from twin floor cylinders in tight sync with pneumatic seat launch)
  const EJECT_AIR_COUNT = 130;
  const ejectAirGeo = new THREE.BufferGeometry();
  const ejectAirPos = new Float32Array(EJECT_AIR_COUNT * 3);
  const ejectAirAge = new Float32Array(EJECT_AIR_COUNT);
  const ejectAirSize = new Float32Array(EJECT_AIR_COUNT);
  const ejectAirSeed = new Float32Array(EJECT_AIR_COUNT);
  const ejectAirRot = new Float32Array(EJECT_AIR_COUNT);
  const ejectAirParticles: EjectAirParticle[] = [];
  for (let i = 0; i < EJECT_AIR_COUNT; i++) {
    ejectAirPos[i * 3 + 1] = -10;
    ejectAirAge[i] = 1;
    ejectAirSize[i] = 0.085;
    const s = Math.random() * 100;
    const r = Math.random() * Math.PI * 2;
    ejectAirSeed[i] = s;
    ejectAirRot[i] = r;
    ejectAirParticles.push({
      active: false,
      age: 0,
      life: 0.36,
      pos: new THREE.Vector3(0, -10, 0),
      vel: new THREE.Vector3(),
      baseSize: 0.085,
      seed: s,
      rot: r,
    });
  }
  ejectAirGeo.setAttribute('position', new THREE.BufferAttribute(ejectAirPos, 3));
  ejectAirGeo.setAttribute('aAge', new THREE.BufferAttribute(ejectAirAge, 1));
  ejectAirGeo.setAttribute('aSize', new THREE.BufferAttribute(ejectAirSize, 1));
  ejectAirGeo.setAttribute('aSeed', new THREE.BufferAttribute(ejectAirSeed, 1));
  ejectAirGeo.setAttribute('aRot', new THREE.BufferAttribute(ejectAirRot, 1));

  const ejectAirMat = new THREE.ShaderMaterial({
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
        // Compact adiabatic pneumatic mist expansion (stays strictly inside the passenger footwell & open roof column)
        float growth = mix(0.45, 1.75, pow(clamp(aAge, 0.0, 1.0), 0.58));
        gl_PointSize = aSize * growth * uPixelRatio * (340.0 / max(-mvPosition.z, 0.15));
        gl_Position = projectionMatrix * mvPosition;
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
          p *= 2.12;
          a *= 0.5;
        }
        return v;
      }
      void main() {
        if (vAge >= 1.0) discard;
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;

        float c = cos(vRot);
        float s = sin(vRot);
        vec2 rp = mat2(c, -s, s, c) * p;

        // Fine, high-pressure adiabatic condensation streaks & micro-turbulence (crisp pneumatic mist, not heavy oil smoke)
        vec2 q = rp * 3.1 + vec2(vSeed, vSeed * 0.71) + vec2(0.0, vAge * 2.2);
        float n1 = fbm(q);
        float n2 = fbm(q * 2.3 + vec2(n1 * 1.6, -vAge * 2.4));
        float wisps = mix(n1, n2, 0.58);

        // Directional pneumatic jet core + eroded wispy condensation halo
        float jetStreak = exp(-rp.x * rp.x * 3.2) * (1.0 - r * 0.75);
        float edgeMask = 1.0 - smoothstep(0.08, 0.90, r - (wisps - 0.48) * 0.42 - jetStreak * 0.14);
        if (edgeMask <= 0.005) discard;

        vec3 normal = normalize(vec3(
          p.x + (n1 - 0.5) * 0.65,
          -p.y + (n2 - 0.5) * 0.65,
          sqrt(max(0.0, 1.0 - dot(p, p)))
        ));
        float ndotl = dot(normal, uLightDir) * 0.5 + 0.5;
        float nozzleShock = (1.0 - smoothstep(0.0, 0.18, vAge)) * jetStreak;

        vec3 shadowCol = vec3(0.54, 0.61, 0.70);
        vec3 litCol = vec3(0.90, 0.95, 1.00);
        vec3 col = mix(shadowCol, litCol, pow(ndotl, 1.1)) + vec3(0.12, 0.15, 0.18) * nozzleShock;

        // Instantaneous pneumatic shock onset (0.01s) and rapid adiabatic evaporation in air
        float alpha = edgeMask * smoothstep(0.0, 0.025, vAge) * pow(1.0 - vAge, 1.75) * 0.42;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const ejectAirPoints = new THREE.Points(ejectAirGeo, ejectAirMat);
  ejectAirPoints.frustumCulled = false;
  ejectAirPoints.renderOrder = 48;
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
    tailLightSplits?.leftTopPivotPos ?? new THREE.Vector3(0.6325, 0.812, -2.172)
  );
  root.add(leftOilLampPivot);

  if (tailLightSplits) {
    for (const m of tailLightSplits.leftTopMeshes) {
      register(
        m,
        'Left Amber Indicator (Oil Nozzle Cover)',
        'Hinged Lucas Amber Lamp',
        'Top-hinged left rear amber indicator lifting 75° to expose the pressurized oil slick nozzle.',
        [0.88, 0.25, -1.15]
      );
      leftOilLampPivot.add(m);
    }
  }

  // Sealed cylindrical dark-anodized backing cup mounted flush behind the amber indicator chrome bezel
  const lampBackCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.041, 0.039, 0.012, 32),
    gunmetalMat
  );
  lampBackCup.rotation.x = Math.PI / 2;
  lampBackCup.position.set(0, -0.042, 0.002);
  leftOilLampPivot.add(lampBackCup);

  const cavityMat = new THREE.MeshStandardMaterial({
    color: 0x090b0f,
    roughness: 0.85,
    metalness: 0.2,
  });

  // Recessed Cylindrical Nozzle Well Housing (replaces raw black BoxGeometry, seamlessly joins the rear bulkhead manifold)
  const aluFrameMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.86,
    roughness: 0.26,
  });

  const leftWellGroup = new THREE.Group();
  leftWellGroup.position.set(0.6325, 0.770, -2.155);
  const wellOuterShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.040, 0.040, 0.044, 32),
    gunmetalMat
  );
  wellOuterShell.rotation.x = Math.PI / 2;
  leftWellGroup.add(wellOuterShell);

  const wellChromeRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.039, 0.0025, 12, 32),
    chromeMat
  );
  wellChromeRim.position.set(0, 0, -0.021);
  leftWellGroup.add(wellChromeRim);

  const wellInnerRecess = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.042, 28),
    cavityMat
  );
  wellInnerRecess.rotation.x = Math.PI / 2;
  wellInnerRecess.position.set(0, 0, -0.002);
  leftWellGroup.add(wellInnerRecess);
  root.add(leftWellGroup);

  const leftOilArms: THREE.Mesh[] = [];
  for (const sx of [0.614, 0.651]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.005, 0.028), chromeMat);
    arm.position.set(sx - 0.6325, -0.008, 0.004);
    arm.visible = false;
    leftOilLampPivot.add(arm);
    leftOilArms.push(arm);
  }

  // Hollow machined dispensing pipe (LatheGeometry with real inner bore facing -Z, centered on the top amber lamp axis y = 0.770)
  const nozzlePipeGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0135, -0.042),
      new THREE.Vector2(0.0135, 0.018),
      new THREE.Vector2(0.0112, 0.023),
      new THREE.Vector2(0.0112, 0.0365),
      new THREE.Vector2(0.0094, 0.0375),
      new THREE.Vector2(0.0056, 0.0375),
      new THREE.Vector2(0.0052, -0.015),
      new THREE.Vector2(0.0, -0.015),
    ],
    28
  );
  const leftOilNozzle = register(
    new THREE.Mesh(nozzlePipeGeo, chromeMat),
    'Left Taillight Oil Slick Nozzle',
    'Machined Hollow Aluminum Pipe',
    'Retractable hollow high-pressure oil dispensing pipe concealed inside the cylindrical left amber lamp recess.',
    [0.88, 0.25, -1.15]
  );
  leftOilNozzle.rotation.x = -Math.PI / 2; // +Y hollow tip points toward -Z (rear)
  leftOilNozzle.position.set(0.6325, 0.770, -2.165);
  root.add(leftOilNozzle);

  // Cohesive Machined Q-Branch Oil Pump & Manifold Assembly (tucked cleanly inside the rear left fender cavity at x <= 0.56)
  // Uses a shared semanticDir so the entire pump, rack, and braided hose explode together as one connected mechanical unit!
  const oilUnitSemanticDir: [number, number, number] = [0.88, 0.25, -1.15];

  const rackGeo = new THREE.BoxGeometry(0.048, 0.195, 0.058);
  // Add upper manifold neck and lower pump cradle bosses directly into the rack mesh
  const oilRackFrame = register(
    new THREE.Mesh(rackGeo, aluFrameMat),
    'Q-Branch Oil Pump Mounting Frame',
    'CNC-Machined Billet Aluminum Bulkhead',
    'Internal left-wing structural bulkhead supporting the pressurized oil pump, hex fittings, and upper nozzle well.',
    oilUnitSemanticDir
  );
  oilRackFrame.position.set(0.578, 0.695, -2.112);

  // Upper horizontal manifold block connecting the bulkhead column cleanly to the rear of the cylindrical nozzle well
  const upperManifold = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, 0.046, 0.048),
    aluFrameMat
  );
  upperManifold.position.set(0.026, 0.075, -0.020);
  oilRackFrame.add(upperManifold);

  // Brass AN-8 hex bulkhead inlet fitting on the upper manifold where the braided hose terminates
  const upperHexFitting = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.024, 6),
    brassMat
  );
  upperHexFitting.rotation.x = Math.PI / 2;
  upperHexFitting.position.set(-0.014, 0.075, 0.018);
  oilRackFrame.add(upperHexFitting);

  // Twin machined mounting clamps holding the pressurized cylinder to the vertical bulkhead
  for (const cz of [0.025, 0.085]) {
    const clampCollar = new THREE.Mesh(
      new THREE.BoxGeometry(0.044, 0.022, 0.018),
      gunmetalMat
    );
    clampCollar.position.set(-0.008, -0.058, cz);
    oilRackFrame.add(clampCollar);
  }
  root.add(oilRackFrame);

  const oilPumpCylinder = register(
    new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.145, 24), aluFrameMat),
    'Pressurized Oil Slick Pump Cylinder',
    'Turned Aluminum & Brass Manifold',
    'High-pressure hydraulic accumulator and pump driving slick oil through the braided line to the taillight nozzle.',
    oilUnitSemanticDir
  );
  oilPumpCylinder.rotation.x = Math.PI / 2;
  oilPumpCylinder.position.set(0.564, 0.635, -2.035);

  // Front & rear turned gunmetal end-caps + top brass AN-8 outlet fitting on the pump cylinder (local +Y is world +Z)
  const frontEndCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0255, 0.0255, 0.014, 24),
    gunmetalMat
  );
  frontEndCap.position.set(0, 0.068, 0);
  oilPumpCylinder.add(frontEndCap);

  const rearEndCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0255, 0.0255, 0.014, 24),
    gunmetalMat
  );
  rearEndCap.position.set(0, -0.068, 0);
  oilPumpCylinder.add(rearEndCap);

  const lowerHexFitting = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.022, 6),
    brassMat
  );
  lowerHexFitting.rotation.x = -Math.PI / 2; // points upward in world Y (local -Z)
  lowerHexFitting.position.set(0, 0.052, -0.026);
  oilPumpCylinder.add(lowerHexFitting);
  root.add(oilPumpCylinder);

  // Closed-cap braided hydraulic hose routing smoothly from the pump's brass outlet fitting to the upper manifold's brass inlet fitting
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.564, 0.655, -1.983),
    new THREE.Vector3(0.564, 0.725, -1.972),
    new THREE.Vector3(0.564, 0.768, -2.018),
    new THREE.Vector3(0.564, 0.770, -2.088),
  ]);
  const oilHose = register(
    new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 28, 0.0082, 14, false), rubberPadMat),
    'High-Pressure Oil Feed Hose',
    'Reinforced Braided Hydraulic Line',
    'Pressurized hydraulic feed line with swaged brass ferrules connecting the pump cylinder to the upper nozzle manifold.',
    oilUnitSemanticDir
  );
  // Swaged chrome hose ferrules sealing both ends of the tube so there is zero open geometry
  const ferruleLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0102, 0.0102, 0.016, 14),
    chromeMat
  );
  ferruleLower.position.set(0.564, 0.662, -1.983);
  oilHose.add(ferruleLower);

  const ferruleUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0102, 0.0102, 0.016, 14),
    chromeMat
  );
  ferruleUpper.rotation.x = Math.PI / 2;
  ferruleUpper.position.set(0.564, 0.770, -2.085);
  oilHose.add(ferruleUpper);
  root.add(oilHose);

  // --- 5B. RIGHT TAILLIGHT (-X): Bottom-Hinged Cluster + Caltrop / Nail Dispenser ---
  const caltropUnitSemanticDir: [number, number, number] = [-0.88, 0.25, -1.15];
  const rightCaltropPivot = new THREE.Group();
  rightCaltropPivot.position.copy(
    tailLightSplits?.rightClusterPivotPos ?? new THREE.Vector3(-0.6325, 0.556, -2.172)
  );
  root.add(rightCaltropPivot);

  if (tailLightSplits) {
    for (const m of tailLightSplits.rightClusterMeshes) {
      register(
        m,
        'Right Taillight Cluster (Caltrop Hatch)',
        'Bottom-Hinged Lucas Cluster',
        'Entire 3-lens right taillight assembly hinged at the bottom to drop open and release road caltrops.',
        caltropUnitSemanticDir
      );
      rightCaltropPivot.add(m);
    }
  }

  // Contoured stadium-profile backing plate behind the 3-lens right taillight cluster
  for (const ly of [0.042, 0.128, 0.214]) {
    const clusterBackCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.041, 0.039, 0.012, 28),
      gunmetalMat
    );
    clusterBackCup.rotation.x = Math.PI / 2;
    clusterBackCup.position.set(0, ly, 0.002);
    rightCaltropPivot.add(clusterBackCup);
  }

  // Contoured recessed caltrop housing behind the right taillight cluster
  const rightHousingGroup = new THREE.Group();
  rightHousingGroup.position.set(-0.6325, 0.684, -2.155);
  for (const wy of [-0.086, 0.0, 0.086]) {
    const wellShell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.040, 0.040, 0.044, 28),
      gunmetalMat
    );
    wellShell.rotation.x = Math.PI / 2;
    wellShell.position.set(0, wy, 0);
    rightHousingGroup.add(wellShell);

    const wellInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.042, 24),
      cavityMat
    );
    wellInner.rotation.x = Math.PI / 2;
    wellInner.position.set(0, wy, -0.002);
    rightHousingGroup.add(wellInner);
  }
  root.add(rightHousingGroup);

  const rightHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.056, 12), chromeMat);
  rightHinge.rotation.z = Math.PI / 2;
  rightCaltropPivot.add(rightHinge);

  const caltropHopper = register(
    new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.195, 0.072), aluFrameMat),
    'Caltrop Magazine & Ejector Rack',
    'Machined Aluminum Hopper',
    'Internal right-wing vertical magazine feeding 4-sided steel tire-shredding caltrops into the twin launch chutes.',
    caltropUnitSemanticDir
  );
  caltropHopper.position.set(-0.585, 0.684, -2.095);
  const hopperNeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.16, 0.045),
    gunmetalMat
  );
  hopperNeck.position.set(-0.028, 0, -0.038);
  caltropHopper.add(hopperNeck);
  root.add(caltropHopper);

  // Hollow machined caltrop launch chutes (LatheGeometry with dark recessed inner bore)
  const chuteGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0135, -0.045),
      new THREE.Vector2(0.0135, 0.045),
      new THREE.Vector2(0.0115, 0.046),
      new THREE.Vector2(0.0095, 0.046),
      new THREE.Vector2(0.0090, -0.035),
      new THREE.Vector2(0.0, -0.035),
    ],
    20
  );
  for (const cx of [-0.646, -0.619]) {
    const chute = register(
      new THREE.Mesh(chuteGeo, gunmetalMat),
      'Caltrop Ejector Chute',
      'Hardened Steel Launch Tube',
      'Spring-loaded dual hollow launch chute expelling four-sided caltrops onto the road behind.',
      caltropUnitSemanticDir
    );
    chute.rotation.x = -Math.PI / 2 + 0.12;
    chute.position.set(cx, 0.675, -2.138);
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
  for (let i = 0; i < OIL_COUNT; i++) {
    _dummyObj.position.set(0, -10, 0);
    _dummyObj.scale.setScalar(0.0001);
    _dummyObj.updateMatrix();
    oilBlobInstanced.setMatrixAt(i, _dummyObj.matrix);
  }
  oilBlobInstanced.instanceMatrix.needsUpdate = true;
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
  oilFilamentMesh.position.set(0.6325, 0.770, -2.250);
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
  const CALTROP_COUNT = 64;
  const caltrops: CaltropItem[] = [];
  for (let i = 0; i < CALTROP_COUNT; i++) {
    caltrops.push({
      active: false,
      settled: false,
      bounces: 0,
      age: 0,
      life: 6.5,
      pos: new THREE.Vector3(0, -10, 0),
      vel: new THREE.Vector3(),
      rot: new THREE.Euler(),
      angVel: new THREE.Vector3(),
      restRotY: 0,
    });
  }
  const caltropGeo = buildTetraCaltropGeometry(0.024);
  const caltropMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.9,
    roughness: 0.28,
  });
  const caltropInstanced = new THREE.InstancedMesh(caltropGeo, caltropMat, CALTROP_COUNT);
  for (let i = 0; i < CALTROP_COUNT; i++) {
    _dummyObj.position.set(0, -10, 0);
    _dummyObj.scale.setScalar(0.001);
    _dummyObj.updateMatrix();
    caltropInstanced.setMatrixAt(i, _dummyObj.matrix);
  }
  caltropInstanced.instanceMatrix.needsUpdate = true;
  caltropInstanced.frustumCulled = false;
  root.add(caltropInstanced);

  // =========================================================================
  // 6. REAR WHEEL TELESCOPING ROMAN-CHARIOT TYRE SLASHERS (Goldfinger, 1964)
  // =========================================================================
  // Uses the actual 3-eared Borrani knock-off spinner extracted directly from the rear wire-wheel GLB mesh
  // (Comp 77/64 on Ani_Wheel_BL44 and Comp 33 on Ani_Disc_Scale_BR6), while the inner splined wheel hub barrel
  // and all 72 wire spokes remain mounted on the wheel!
  // - When stowed (0%): the original 3-eared knock-off spinner sits at its exact factory position (0.0mm offset) on the wheel hub.
  // - When activated: the original 3-eared knock-off spinner separates outward from the wheel hub on a CNC-machined
  //   telescoping steel axle shaft emerging out of the center of the stationary wheel hub bore while spinning at wheel speed!
  const tyreSlasherUnits: TyreSlasherUnit[] = [];
  const rearHubConfigs: Array<{
    side: 'Left' | 'Right';
    sideSign: number;
    pivotPos: THREE.Vector3;
    extractedMeshes: THREE.Mesh[];
  }> = [
      {
        side: 'Left',
        sideSign: 1,
        pivotPos:
          rearSpinnerExtract?.leftSpinnerPivotPos ??
          new THREE.Vector3(0.8175, 0.3582, -1.0177),
        extractedMeshes: rearSpinnerExtract?.leftSpinnerMeshes ?? [],
      },
      {
        side: 'Right',
        sideSign: -1,
        pivotPos:
          rearSpinnerExtract?.rightSpinnerPivotPos ??
          new THREE.Vector3(-0.8177, 0.3585, -1.0181),
        extractedMeshes: rearSpinnerExtract?.rightSpinnerMeshes ?? [],
      },
    ];

  // Precision LatheGeometry profile for the stationary wheel-hub axle collar & splined bore seat
  // (revealed on the wheel hub face when the 3-eared knock-off spinner telescopes outward)
  const hubSeatPoints = [
    new THREE.Vector2(0.0, 0.002),
    new THREE.Vector2(0.0175, 0.002),
    new THREE.Vector2(0.0185, -0.008),
    new THREE.Vector2(0.0255, -0.008),
    new THREE.Vector2(0.0275, -0.004),
    new THREE.Vector2(0.0315, -0.002),
    new THREE.Vector2(0.0335, -0.004),
    new THREE.Vector2(0.0345, -0.016),
  ];
  const hubSeatGeo = new THREE.LatheGeometry(hubSeatPoints, 32);

  // Stage-1 Machined Fluted Telescoping Outer Drive Sleeve (LatheGeometry with 4 turned lubrication/locking lands)
  const stage1Points: THREE.Vector2[] = [
    new THREE.Vector2(0.0165, 0.0),
    new THREE.Vector2(0.0228, 0.0),
    new THREE.Vector2(0.0235, 0.008),
    new THREE.Vector2(0.0218, 0.010),
  ];
  for (let g = 0; g < 4; g++) {
    const y0 = 0.014 + g * 0.026;
    stage1Points.push(
      new THREE.Vector2(0.0218, y0),
      new THREE.Vector2(0.0200, y0 + 0.002),
      new THREE.Vector2(0.0200, y0 + 0.007),
      new THREE.Vector2(0.0218, y0 + 0.009)
    );
  }
  stage1Points.push(
    new THREE.Vector2(0.0218, 0.122),
    new THREE.Vector2(0.0226, 0.125),
    new THREE.Vector2(0.0226, 0.132),
    new THREE.Vector2(0.0165, 0.134)
  );
  const stage1LatheGeo = new THREE.LatheGeometry(stage1Points, 32);

  // Stage-2 Inner Telescoping Drive Shaft (dark-nitride guide journal + mirror-polished chrome extension shaft + flared spinner boss)
  const stage2ChromeGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0155, 0.048),
      new THREE.Vector2(0.0178, 0.050),
      new THREE.Vector2(0.0178, 0.155),
      new THREE.Vector2(0.0215, 0.168),
      new THREE.Vector2(0.0275, 0.175),
      new THREE.Vector2(0.0, 0.175),
    ],
    32
  );

  for (const cfg of rearHubConfigs) {
    const slasherSemanticDir: [number, number, number] = [cfg.sideSign * 1.35, 0.08, -0.35];
    const rootGroup = new THREE.Group();
    rootGroup.position.copy(cfg.pivotPos);
    root.add(rootGroup);

    // Spin group rotates around the world X axle axis (outward is +X on Left, -X on Right)
    const spinGroup = new THREE.Group();
    rootGroup.add(spinGroup);

    // Axial group orienting local +Y outward along the wheel axle (+X for Left, -X for Right) for cylindrical lathe parts
    const axleAligned = new THREE.Group();
    axleAligned.rotation.z = cfg.sideSign > 0 ? -Math.PI / 2 : Math.PI / 2;
    spinGroup.add(axleAligned);

    // 1. Stationary/Hub-Seated Machined Splined Axle Collar (stays attached to the wheel hub face when the spinner separates)
    const hubCollar = register(
      new THREE.Mesh(hubSeatGeo, chromeMat),
      `Rear ${cfg.side} Wheel Hub Axle Seat`,
      'CNC-Machined Chrome Splined Hub',
      'Precision-machined center-lock wheel hub collar and internal axle bore from which the telescoping tyre-slasher shaft emerges.',
      slasherSemanticDir
    );
    axleAligned.add(hubCollar);

    const hubBoreSeal = new THREE.Mesh(
      new THREE.TorusGeometry(0.0225, 0.0022, 12, 28),
      gunmetalMat
    );
    hubBoreSeal.rotation.x = Math.PI / 2;
    hubBoreSeal.position.y = -0.001;
    axleAligned.add(hubBoreSeal);

    // 2. Stage-1 Fluted Telescoping Outer Sleeve (emerges from inside the wheel hub bore when activated)
    const stage1Sleeve = new THREE.Group();
    stage1Sleeve.visible = false;
    axleAligned.add(stage1Sleeve);

    const flutedSleeveMesh = register(
      new THREE.Mesh(stage1LatheGeo, chromeMat),
      `Rear ${cfg.side} Tyre Slasher Stage-1 Fluted Sleeve`,
      'Turned & Grooved High-Tensile Steel',
      'First-stage telescoping fluted steel sleeve emerging from the center of the rear wire-wheel hub.',
      slasherSemanticDir
    );
    stage1Sleeve.add(flutedSleeveMesh);

    // Dark gunmetal oil-seal wiper rings seated in the turned grooves
    for (let g = 0; g < 4; g++) {
      const yGroove = 0.0185 + g * 0.026;
      const wiper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0204, 0.0204, 0.0045, 24),
        gunmetalMat
      );
      wiper.position.y = yGroove;
      stage1Sleeve.add(wiper);
    }

    // 3. Stage-2 Telescoping Inner Shaft (dark-nitride guide journal + polished chrome shaft terminating at the back of the original knock-off spinner)
    const stage2Shaft = new THREE.Group();
    stage2Shaft.visible = false;
    axleAligned.add(stage2Shaft);

    const nitrideJournal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0182, 0.0186, 0.052, 28),
      gunmetalMat
    );
    nitrideJournal.position.y = 0.025;
    stage2Shaft.add(nitrideJournal);

    const chromeExtensionShaft = register(
      new THREE.Mesh(stage2ChromeGeo, chromeMat),
      `Rear ${cfg.side} Tyre Slasher Telescoping Axle Shaft`,
      'Mirror-Polished Hardened Chrome Steel',
      'Second-stage telescoping drive shaft carrying the wheel’s 3-eared knock-off spinner outward to shred an adjacent car’s tires.',
      slasherSemanticDir
    );
    stage2Shaft.add(chromeExtensionShaft);

    // Dark machined backing plate sealing the rear face of the separated knock-off spinner
    const spinnerBackingPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0275, 0.0235, 0.006, 28),
      gunmetalMat
    );
    spinnerBackingPlate.position.y = 0.173;
    stage2Shaft.add(spinnerBackingPlate);

    // 4. Original 3-Eared Knock-Off Wheel Spinner (extracted live from the rear wheel GLB mesh!)
    // Sitting at (0,0,0) in spinGroup when stowed (100% identical to factory wheel hub),
    // and translating outward along local X (cfg.sideSign * dist) at the tip of the telescoping shaft when activated!
    const spinnerHeadGroup = new THREE.Group();
    spinGroup.add(spinnerHeadGroup);

    if (cfg.extractedMeshes.length > 0) {
      for (const sm of cfg.extractedMeshes) {
        register(
          sm,
          `Rear ${cfg.side} 3-Eared Knock-Off Tyre Slasher Spinner`,
          'Original Borrani 3-Eared Chrome Knock-Off',
          'The wheel’s actual 3-eared center-lock knock-off spinner: separates outward from the wheel hub on the telescoping axle shaft and spins at wheel speed.',
          slasherSemanticDir
        );
        spinnerHeadGroup.add(sm);
      }
    }

    tyreSlasherUnits.push({
      sideSign: cfg.sideSign,
      rootGroup,
      spinGroup,
      stage1Sleeve,
      stage2Shaft,
      spinnerHeadGroup,
    });
  }

  return {
    root,
    frontPlateDrum: frontPlate.drum,
    rearPlateDrum: rearPlate.drum,
    frontRams,
    rearRams,
    tyreSlasherUnits,
    tyreSlasherExtend: 0,
    tyreSlasherSpin: 0,
    bulletShieldGroup,
    roofHatchGroup,
    roofHatchBasePos,
    outerBevelMesh,
    panelSkirtMesh,
    roofSealMesh,
    innerFlangeMesh,
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
    seatPhase: 'stowed',
    seatPos: passengerSeatBasePos.clone(),
    seatVel: new THREE.Vector3(),
    seatRot: new THREE.Euler(),
    seatAngVel: new THREE.Vector3(),
    seatBounces: 0,
    roofPos: roofHatchBasePos.clone(),
    roofVel: new THREE.Vector3(),
    roofRot: new THREE.Euler(),
    roofAngVel: new THREE.Vector3(),
    roofBounces: 0,
    roofSettled: false,
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
const _lookTarget = new THREE.Vector3();

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

  // 2B. Rear Wheel Telescoping Roman-Chariot Tyre Slashers:
  // The wheel's single original 3-eared knock-off spinner separates from the wheel hub on the telescoping axle shaft and spins!
  const targetSlasher = state.tyreSlashers ? 1 : 0;
  rig.tyreSlasherExtend += (targetSlasher - rig.tyreSlasherExtend) * Math.min(1, safeDt * 6.5);
  if (state.tyreSlashers || rig.tyreSlasherExtend > 0.002) {
    const spinSpeed = THREE.MathUtils.lerp(0, 26.0, rig.tyreSlasherExtend);
    rig.tyreSlasherSpin += spinSpeed * safeDt;
  } else {
    rig.tyreSlasherSpin = 0;
  }
  for (const unit of rig.tyreSlasherUnits) {
    const ext = rig.tyreSlasherExtend;
    const isExtended = ext > 0.004;
    unit.stage1Sleeve.visible = isExtended;
    unit.stage2Shaft.visible = isExtended;

    // Stage 1 fluted sleeve slides out up to 0.115m; Stage 2 inner chrome shaft slides out from Stage 1 up to 0.285m total extension
    const s1 = THREE.MathUtils.clamp(ext / 0.50, 0, 1);
    const s2 = THREE.MathUtils.clamp((ext - 0.20) / 0.80, 0, 1);

    const stage1Tip = s1 * 0.115;
    const totalOutwardDist = stage1Tip + s2 * 0.170; // 0.285m full extension

    // Position Stage-1 sleeve and Stage-2 shaft so they telescope out from the wheel hub bore (y <= 0)
    // and their outer tip always meets the back of the separated knock-off spinner at y = totalOutwardDist!
    unit.stage1Sleeve.position.y = stage1Tip - 0.130;
    unit.stage2Shaft.position.y = totalOutwardDist - 0.175;

    // Move the wheel's original 3-eared knock-off spinner outward along the axle (local X) by totalOutwardDist
    unit.spinnerHeadGroup.position.x = unit.sideSign * totalOutwardDist;

    // Spin the entire telescoping shaft & knock-off spinner around the wheel axle (local X)
    unit.spinGroup.rotation.x = -rig.tyreSlasherSpin;
  }

  // 3. Bullet-Resistant Rear Shield (rises vertically from -0.326m stowed to 0m deployed)
  rig.shieldExtend += ((state.bulletShield ? 1 : 0) - rig.shieldExtend) * Math.min(1, safeDt * 5.5);
  rig.bulletShieldGroup.position.y = -0.326 + rig.shieldExtend * 0.326;

  // 4. Two-Stage Jet-Cockpit Compressed-Air Ejection Sequence
  // Triggered ONLY when Ejector Switch is armed AND Red Gear-Knob Button is pressed (state.seatEjected)
  // Stage 1 (0.00s ->): Pneumatic bolts shear and blast the flush roof panel upward & rearward to the tarmac
  // Stage 2 (0.07s -> 0.19s): Seat accelerates up the vertical guide rails through the roof opening with compressed-air burst
  // Stage 3 (0.19s ->): Free ballistic flight under gravity (g = 9.81 m/s²), clearing the car and impacting/bouncing/skidding on the ground
  const triggerEjectBurst = state.seatEjected && !rig.hatchActivePrev;
  if (triggerEjectBurst) {
    rig.hatchTimer = 0;
    rig.seatPhase = 'rails';
    rig.seatPos.copy(rig.passengerSeatBasePos);
    rig.seatVel.set(0, 0, 0);
    rig.seatRot.set(0, 0, 0);
    rig.seatAngVel.set(0, 0, 0);
    rig.seatBounces = 0;
    rig.roofPos.copy(rig.roofHatchBasePos);
    rig.roofVel.set(0.75, 5.8, -3.2);
    rig.roofRot.set(0, 0, 0);
    rig.roofAngVel.set(-4.8, 1.2, -2.5);
    rig.roofBounces = 0;
    rig.roofSettled = false;
  }
  rig.hatchActivePrev = state.seatEjected;

  let airBurstBudget = 0;
  if (state.seatEjected) {
    rig.hatchTimer += safeDt;
    const tPanel = THREE.MathUtils.clamp(rig.hatchTimer / 0.25, 0, 1);
    rig.hatchOpen = tPanel;
    const showCutoutTrim = tPanel > 0.015;
    rig.outerBevelMesh.visible = showCutoutTrim;
    rig.panelSkirtMesh.visible = showCutoutTrim;
    rig.roofSealMesh.visible = showCutoutTrim;
    rig.innerFlangeMesh.visible = showCutoutTrim;

    // Stage 1: Ballistic roof panel flight & ground impact
    if (!rig.roofSettled) {
      if (rig.roofPos.y > 0.036 || rig.roofVel.y > 0) {
        rig.roofVel.y -= 9.81 * safeDt;
        rig.roofPos.addScaledVector(rig.roofVel, safeDt);
        rig.roofRot.x += rig.roofAngVel.x * safeDt;
        rig.roofRot.y += rig.roofAngVel.y * safeDt;
        rig.roofRot.z += rig.roofAngVel.z * safeDt;

        if (rig.roofPos.y <= 0.035) {
          rig.roofPos.y = 0.035;
          rig.roofBounces++;
          if (Math.abs(rig.roofVel.y) > 0.7 && rig.roofBounces <= 2) {
            rig.roofVel.y = Math.abs(rig.roofVel.y) * 0.28;
            rig.roofVel.x *= 0.55;
            rig.roofVel.z *= 0.55;
            rig.roofAngVel.multiplyScalar(0.42);
          } else {
            rig.roofVel.y = 0;
          }
        }
      } else {
        rig.roofPos.y = 0.035;
        const skid = Math.exp(-6.0 * safeDt);
        rig.roofVel.x *= skid;
        rig.roofVel.z *= skid;
        rig.roofPos.x += rig.roofVel.x * safeDt;
        rig.roofPos.z += rig.roofVel.z * safeDt;
        const flatX = Math.round(rig.roofRot.x / Math.PI) * Math.PI;
        rig.roofRot.x += (flatX - rig.roofRot.x) * Math.min(1, safeDt * 12);
        rig.roofRot.z += (0 - rig.roofRot.z) * Math.min(1, safeDt * 12);
        if (rig.roofVel.x * rig.roofVel.x + rig.roofVel.z * rig.roofVel.z < 0.002) {
          rig.roofSettled = true;
        }
      }
    }
    rig.roofHatchGroup.visible = true;
    rig.roofHatchGroup.position.copy(rig.roofPos);
    rig.roofHatchGroup.rotation.copy(rig.roofRot);

    // Stage 2 & 3: Seat rail launch -> free ballistic flight -> tarmac impact & bounce
    if (rig.seatPhase === 'rails') {
      const tRailRaw = THREE.MathUtils.clamp((rig.hatchTimer - 0.07) / 0.12, 0, 1);
      const railEase = tRailRaw * tRailRaw * (2 - tRailRaw);
      rig.seatEjectProgress = railEase;
      rig.seatPos.set(
        rig.passengerSeatBasePos.x - 0.02 * railEase,
        rig.passengerSeatBasePos.y + 1.05 * railEase,
        rig.passengerSeatBasePos.z - 0.18 * railEase
      );
      rig.seatRot.set(-0.14 * railEase, 0, 0);
      if (rig.hatchTimer >= 0.19) {
        rig.seatPhase = 'airborne';
        rig.seatVel.set(1.95, 7.2, -1.35);
        rig.seatAngVel.set(-2.4, 0.85, -1.75);
      }
    } else if (rig.seatPhase === 'airborne') {
      rig.seatEjectProgress = 1;
      rig.seatVel.y -= 9.81 * safeDt;
      rig.seatPos.addScaledVector(rig.seatVel, safeDt);
      rig.seatRot.x += rig.seatAngVel.x * safeDt;
      rig.seatRot.y += rig.seatAngVel.y * safeDt;
      rig.seatRot.z += rig.seatAngVel.z * safeDt;

      const seatGroundY = 0.25;
      if (rig.seatPos.y <= seatGroundY) {
        rig.seatPos.y = seatGroundY;
        rig.seatBounces++;
        if (Math.abs(rig.seatVel.y) > 0.75 && rig.seatBounces <= 3) {
          const restitution = Math.max(0.16, 0.28 - rig.seatBounces * 0.04);
          rig.seatVel.y = Math.abs(rig.seatVel.y) * restitution;
          rig.seatVel.x *= 0.56;
          rig.seatVel.z *= 0.56;
          rig.seatAngVel.multiplyScalar(0.45);
        } else {
          rig.seatVel.y = 0;
          rig.seatPhase = 'skid';
        }
      }
    } else if (rig.seatPhase === 'skid') {
      rig.seatPos.y = 0.25;
      const skid = Math.exp(-5.5 * safeDt);
      rig.seatVel.x *= skid;
      rig.seatVel.z *= skid;
      rig.seatPos.x += rig.seatVel.x * safeDt;
      rig.seatPos.z += rig.seatVel.z * safeDt;
      const settleLerp = Math.min(1, safeDt * 10);
      const targetRestX = Math.round(rig.seatRot.x / (Math.PI * 0.5)) * (Math.PI * 0.5);
      rig.seatRot.x += (targetRestX - rig.seatRot.x) * settleLerp;
      rig.seatRot.z += (0 - rig.seatRot.z) * settleLerp;
      if (rig.seatVel.x * rig.seatVel.x + rig.seatVel.z * rig.seatVel.z < 0.002) {
        rig.seatPhase = 'settled';
      }
    }

    rig.passengerSeatGroup.position.copy(rig.seatPos);
    rig.passengerSeatGroup.rotation.copy(rig.seatRot);

    if (rig.hatchTimer >= 0.04 && rig.hatchTimer <= 0.20) {
      airBurstBudget = 16; // Immediate high-pressure valve release flash right as launch begins
    } else if (rig.hatchTimer > 0.20 && rig.hatchTimer <= 0.38) {
      airBurstBudget = 7;  // Trailing pneumatic exhaust plume as pistons clear the floor cylinders
    }
  } else {
    // Smoothly retract seat and reseat roof panel 100% flush & seamless when reset
    rig.hatchTimer = 0;
    rig.seatPhase = 'stowed';
    const resetLerp = Math.min(1, safeDt * 7.5);
    rig.hatchOpen += (0 - rig.hatchOpen) * resetLerp;
    const showCutoutTrim = rig.hatchOpen > 0.015;
    rig.outerBevelMesh.visible = showCutoutTrim;
    rig.panelSkirtMesh.visible = showCutoutTrim;
    rig.roofSealMesh.visible = showCutoutTrim;
    rig.innerFlangeMesh.visible = showCutoutTrim;
    rig.seatEjectProgress += (0 - rig.seatEjectProgress) * resetLerp;

    rig.roofPos.lerp(rig.roofHatchBasePos, resetLerp);
    rig.roofRot.x += (0 - rig.roofRot.x) * resetLerp;
    rig.roofRot.y += (0 - rig.roofRot.y) * resetLerp;
    rig.roofRot.z += (0 - rig.roofRot.z) * resetLerp;
    rig.roofHatchGroup.visible = true;
    rig.roofHatchGroup.position.copy(rig.roofPos);
    rig.roofHatchGroup.rotation.copy(rig.roofRot);

    rig.seatPos.lerp(rig.passengerSeatBasePos, resetLerp);
    rig.seatRot.x += (0 - rig.seatRot.x) * resetLerp;
    rig.seatRot.y += (0 - rig.seatRot.y) * resetLerp;
    rig.seatRot.z += (0 - rig.seatRot.z) * resetLerp;
    rig.passengerSeatGroup.position.copy(rig.seatPos);
    rig.passengerSeatGroup.rotation.copy(rig.seatRot);
  }

  // Update compressed-air vapour burst particles from the twin floor cylinders
  // Physically constrained by:
  //  1) The rising leather seat cushion underside (deflects around the cushion perimeter, never passes through the seat)
  //  2) The solid enclosed passenger cabin walls (left door interior card + closed window glass at x <= 0.455m,
  //     center transmission tunnel at x >= 0.075m, front footwell bulkhead, rear bench, and roof surround)
  // so pneumatic vapour can ONLY escape upward through the open roof hatch (x ∈ [0.04, 0.49], z ∈ [-0.56, 0.18])!
  const airPosAttr = rig.ejectAirPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
  const airAgeAttr = rig.ejectAirPoints.geometry.getAttribute('aAge') as THREE.BufferAttribute;
  const airSizeAttr = rig.ejectAirPoints.geometry.getAttribute('aSize') as THREE.BufferAttribute;
  const airSeedAttr = rig.ejectAirPoints.geometry.getAttribute('aSeed') as THREE.BufferAttribute;
  const airRotAttr = rig.ejectAirPoints.geometry.getAttribute('aRot') as THREE.BufferAttribute;
  const seatPos = rig.passengerSeatGroup.position;
  // Bottom surface of the leather bucket seat cushion is ~0.18m below passengerSeatGroup origin; allow a 4cm buffer
  const seatUndersideY = seatPos.y - 0.21;
  const seatHalfW = 0.24;
  const seatHalfL = 0.26;
  let airDirty = false;
  for (let i = 0; i < rig.ejectAirParticles.length; i++) {
    const ap = rig.ejectAirParticles[i];
    if (!ap.active && airBurstBudget > 0) {
      airBurstBudget--;
      ap.active = true;
      ap.age = 0;
      ap.life = 0.26 + Math.random() * 0.22;
      const sideX = i % 2 === 0 ? -0.10 : 0.10;
      const cylX = rig.passengerSeatBasePos.x + sideX;
      const cylZ = rig.passengerSeatBasePos.z - 0.04;
      // Spawn tightly at the twin floor cylinder collars (y = 0.41m), strictly below the rising seat cushion
      const spawnY = Math.min(0.41 + Math.random() * 0.025, Math.max(0.37, seatUndersideY - 0.015));
      ap.pos.set(
        cylX + (Math.random() - 0.5) * 0.016,
        spawnY,
        cylZ + (Math.random() - 0.5) * 0.016
      );
      // High-velocity vertical pneumatic jet directed straight up the piston axis toward the open roof hatch
      // (zero artificial outward X blast toward the solid door!)
      ap.vel.set(
        (Math.random() - 0.5) * 0.32,
        2.65 + Math.random() * 1.85,
        -0.38 + (Math.random() - 0.5) * 0.35
      );
      ap.baseSize = 0.068 + Math.random() * 0.052;
      ap.seed = Math.random() * 100;
      ap.rot = Math.random() * Math.PI * 2;
    }
    if (ap.active) {
      airDirty = true;
      ap.age += safeDt;
      const t = ap.age / ap.life;
      if (t >= 1) {
        ap.active = false;
        airPosAttr.setXYZ(i, 0, -10, 0);
        airAgeAttr.setX(i, 1);
      } else {
        // Pneumatic air drag + upward chimney draft through the open roof hatch
        ap.vel.multiplyScalar(Math.pow(0.22, safeDt));
        ap.vel.y += 0.85 * safeDt;
        ap.rot += (i % 2 === 0 ? 2.1 : -2.1) * safeDt;
        ap.pos.addScaledVector(ap.vel, safeDt);

        // 1. Physical collision & deflection against the rising seat cushion underside
        const dxSeat = ap.pos.x - seatPos.x;
        const dzSeat = ap.pos.z - (seatPos.z + 0.01);
        if (
          Math.abs(dxSeat) < seatHalfW &&
          Math.abs(dzSeat) < seatHalfL &&
          ap.pos.y > seatUndersideY &&
          ap.pos.y < seatPos.y + 0.30
        ) {
          ap.pos.y = seatUndersideY;
          const upSpeed = Math.max(0, ap.vel.y);
          ap.vel.y = Math.min(ap.vel.y, 0.35);
          // Deflect predominantly fore/aft and inboard (away from the close left door panel) so vapour vents up behind/around the seat
          const pushX = dxSeat >= 0 ? Math.min(0.28, dxSeat * 1.4) : -0.55;
          const pushZ = dzSeat >= 0 ? 0.55 : -0.65;
          ap.vel.x += pushX * (upSpeed * 0.55 + 0.25);
          ap.vel.z += pushZ * (upSpeed * 0.65 + 0.30);
        }

        // 2. Solid Cabin Enclosure Collisions (Left Door Panel + Closed Window Glass, Center Tunnel, Footwell & Rear Bulkhead)
        // Below the roof hatch opening (y < 1.32m), the passenger cabin is a sealed solid enclosure
        if (ap.pos.y < 1.34) {
          // Left passenger door inner leather card (x = 0.601m) & closed door window glass (x = 0.562m):
          // Account for sprite world radius (~0.09m) by clamping strictly at x <= 0.455m and redirecting flow upward!
          const maxCabinX = ap.pos.y < 0.88 ? 0.465 : 0.450;
          if (ap.pos.x > maxCabinX) {
            ap.pos.x = maxCabinX;
            const hitSpeedX = Math.max(0, ap.vel.x);
            ap.vel.x = -hitSpeedX * 0.25;
            ap.vel.y += hitSpeedX * 0.65; // Wall boundary layer redirects pneumatic jet upward toward the open roof hatch
          }
          // Center transmission tunnel & armrest console (x >= 0.080m)
          if (ap.pos.x < 0.080) {
            ap.pos.x = 0.080;
            if (ap.vel.x < 0) ap.vel.x = -ap.vel.x * 0.25;
          }
          // Front dashboard / footwell bulkhead (z <= 0.16m) and rear seat bulkhead (z >= -0.52m)
          if (ap.pos.z > 0.16) {
            ap.pos.z = 0.16;
            if (ap.vel.z > 0) ap.vel.z = -ap.vel.z * 0.25;
          } else if (ap.pos.z < -0.52) {
            ap.pos.z = -0.52;
            if (ap.vel.z < 0) ap.vel.z = -ap.vel.z * 0.25;
          }
        }

        // 3. Floor pan boundary (y >= 0.35m)
        if (ap.pos.y < 0.35) {
          ap.pos.y = 0.35;
          if (ap.vel.y < 0) ap.vel.y = Math.abs(ap.vel.y) * 0.25;
        }

        airPosAttr.setXYZ(i, ap.pos.x, ap.pos.y, ap.pos.z);
        airAgeAttr.setX(i, t);
        airSizeAttr.setX(i, ap.baseSize);
        airSeedAttr.setX(i, ap.seed);
        airRotAttr.setX(i, ap.rot);
      }
    }
  }
  if (airDirty) {
    airPosAttr.needsUpdate = true;
    airAgeAttr.needsUpdate = true;
    airSizeAttr.needsUpdate = true;
    airSeedAttr.needsUpdate = true;
    airRotAttr.needsUpdate = true;
  }

  // 5A. Volumetric Smoke Screen Particle Simulation
  const posAttr = rig.smokePoints.geometry.getAttribute('position') as THREE.BufferAttribute;
  const ageAttr = rig.smokePoints.geometry.getAttribute('aAge') as THREE.BufferAttribute;
  const sizeAttr = rig.smokePoints.geometry.getAttribute('aSize') as THREE.BufferAttribute;
  const seedAttr = rig.smokePoints.geometry.getAttribute('aSeed') as THREE.BufferAttribute;
  const rotAttr = rig.smokePoints.geometry.getAttribute('aRot') as THREE.BufferAttribute;

  let smokeSpawnBudget = state.smokeScreen ? 8 : 0;
  let smokeDirty = false;
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
      smokeDirty = true;
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
    }
  }
  if (smokeDirty) {
    posAttr.needsUpdate = true;
    ageAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    seedAttr.needsUpdate = true;
    rotAttr.needsUpdate = true;
  }

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
      slot.pos.set(0.6325 + swayX, 0.770 + swayY, nozzleTipZ - 0.004);
      const jetSpeed = 1.34 + 0.10 * pumpWave;
      slot.vel.set(
        Math.sin(rig.time * 4.6) * 0.032,
        0.038 + Math.cos(rig.time * 5.4) * 0.015,
        -jetSpeed
      );
    }
  }

  rig.oilImpact.z += safeDt;

  let oilDirty = false;
  for (let i = 0; i < rig.oilDroplets.length; i++) {
    const d = rig.oilDroplets[i];
    if (d.active) {
      oilDirty = true;
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
        _lookTarget.copy(d.pos).add(d.vel);
        _dummyObj.lookAt(_lookTarget);
        // High-viscosity liquid columns stretch smoothly along their parabolic trajectory and swell near impact
        const flightProgress = THREE.MathUtils.clamp(d.age / 0.65, 0, 1);
        const rDynamic = d.radius * THREE.MathUtils.lerp(0.95, 1.18, flightProgress);
        const lenDynamic = d.radius * d.elongation * THREE.MathUtils.lerp(1.15, 0.78, flightProgress);
        _dummyObj.scale.set(rDynamic, rDynamic, lenDynamic);
      }
      _dummyObj.updateMatrix();
      rig.oilBlobInstanced.setMatrixAt(i, _dummyObj.matrix);
    }
  }
  if (oilDirty) {
    rig.oilBlobInstanced.instanceMatrix.needsUpdate = true;
  }

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
  let caltropDirty = false;
  for (let i = 0; i < rig.caltrops.length; i++) {
    const c = rig.caltrops[i];
    if (!c.active && caltropSpawnBudget > 0) {
      caltropSpawnBudget--;
      c.active = true;
      c.settled = false;
      c.bounces = 0;
      c.age = 0;
      c.life = 6.0 + Math.random() * 2.5;
      // Alternate between the twin launch chutes (-0.646 outboard, -0.619 inboard) with divergent fan angles
      const isInboardChute = i % 2 === 0;
      const chuteX = isInboardChute ? -0.619 : -0.646;
      c.pos.set(
        chuteX + (Math.random() - 0.5) * 0.010,
        0.675 + (Math.random() - 0.5) * 0.008,
        -2.185
      );
      // Fan horizontally across the road lane behind the car (slight inboard bias toward car centerline + wide lateral cone)
      const chuteBiasX = isInboardChute ? 0.36 : -0.22;
      const fanSpreadX = (Math.random() - 0.44) * 1.65;
      const launchSpeedZ = -(1.55 + Math.random() * 1.65);
      c.vel.set(
        chuteBiasX + fanSpreadX,
        0.18 + Math.random() * 0.38,
        launchSpeedZ
      );
      c.rot.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      c.angVel.set(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 18
      );
      c.restRotY = Math.random() * Math.PI * 2;
    }

    if (c.active) {
      caltropDirty = true;
      c.age += safeDt;
      if (c.age >= c.life && !state.caltrops) {
        c.active = false;
      } else if (!c.settled) {
        if (c.pos.y > 0.030) {
          // Ballistic flight + steel-on-tarmac bouncing
          c.vel.y -= 7.4 * safeDt;
          c.pos.addScaledVector(c.vel, safeDt);
          c.rot.x += c.angVel.x * safeDt;
          c.rot.y += c.angVel.y * safeDt;
          c.rot.z += c.angVel.z * safeDt;

          if (c.pos.y <= 0.029) {
            c.pos.y = 0.029;
            c.bounces++;
            // Hardened 4-spike steel tetrahedron hitting asphalt: off-axis spike contact imparts realistic lateral ricochet
            if (Math.abs(c.vel.y) > 0.32 && c.bounces <= 4) {
              const restitution = THREE.MathUtils.clamp(0.44 - c.bounces * 0.07, 0.18, 0.44);
              const impactEnergy = Math.min(1.2, Math.abs(c.vel.y));
              c.vel.y = Math.abs(c.vel.y) * restitution;
              // Spike tip deflection scatters velocity laterally while preserving forward/rearward momentum
              c.vel.x = c.vel.x * 0.80 + (Math.random() - 0.47) * 0.58 * impactEnergy;
              c.vel.z = c.vel.z * 0.78 + (Math.random() - 0.5) * 0.38 * impactEnergy;
              c.angVel.set(
                (Math.random() - 0.5) * 16 * restitution,
                (Math.random() - 0.5) * 20 * restitution,
                (Math.random() - 0.5) * 16 * restitution
              );
            } else {
              // Transition to ground skitter / sliding phase before coming to rest
              c.vel.y = 0;
              c.restRotY = c.rot.y;
            }
          }
        } else {
          // Ground skitter phase: caltrop slides and rocks to a stop on its 3 base spikes with 1 spike pointing straight up
          c.pos.y = 0.029;
          const slideFriction = Math.exp(-6.5 * safeDt);
          c.vel.x *= slideFriction;
          c.vel.z *= slideFriction;
          c.pos.x += c.vel.x * safeDt;
          c.pos.z += c.vel.z * safeDt;

          const speedSq = c.vel.x * c.vel.x + c.vel.z * c.vel.z;
          const settleLerp = Math.min(1, safeDt * 14);
          c.rot.x += (0 - c.rot.x) * settleLerp;
          c.rot.z += (0 - c.rot.z) * settleLerp;
          c.restRotY += c.angVel.y * safeDt * 0.25;
          c.angVel.y *= slideFriction;
          c.rot.y = c.restRotY;

          if (speedSq < 0.0012 && Math.abs(c.rot.x) < 0.02 && Math.abs(c.rot.z) < 0.02) {
            c.rot.set(0, c.restRotY, 0);
            c.settled = true;
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
      _dummyObj.updateMatrix();
      rig.caltropInstanced.setMatrixAt(i, _dummyObj.matrix);
    }
  }
  if (caltropDirty) {
    rig.caltropInstanced.instanceMatrix.needsUpdate = true;
  }
}
