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
  pos: THREE.Vector3;
  vel: THREE.Vector3;
}

export interface QBranchGadgetsRig {
  root: THREE.Group;
  frontPlateDrum: THREE.Group;
  rearPlateDrum: THREE.Group;
  frontRams: THREE.Group[];
  rearRams: THREE.Group[];
  bulletShieldGroup: THREE.Group;
  roofHatchPivot: THREE.Group;
  subParts: GadgetSubPart[];
  plateAngle: number;
  ramFrontExtend: number;
  ramRearExtend: number;
  shieldExtend: number;
  hatchOpen: number;
  smokePoints: THREE.Points;
  smokeParticles: SmokeParticle[];
  oilInstanced: THREE.InstancedMesh;
  oilDroplets: OilDroplet[];
  oilPuddleMat: THREE.ShaderMaterial;
  oilSpread: number;
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

/** Generates a Q-Branch hazard stencil texture for the underside of the ejector roof hatch. */
function createRoofHatchUndersideTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#181a20';
  ctx.fillRect(0, 0, 512, 512);

  // Diagonal hazard stripes along edges
  ctx.fillStyle = '#eab308';
  for (let i = -512; i < 1024; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 24, 0);
    ctx.lineTo(i - 16, 40);
    ctx.lineTo(i - 40, 40);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(i, 472);
    ctx.lineTo(i + 24, 472);
    ctx.lineTo(i - 16, 512);
    ctx.lineTo(i - 40, 512);
    ctx.fill();
  }

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 6;
  ctx.strokeRect(32, 62, 448, 388);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Q-BRANCH MK.IV', 256, 200);
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('DANGER: EJECTOR HATCH', 256, 265);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('PYROTECHNIC RELEASE LOCK', 256, 325);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
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
export function createQBranchGadgetsRig(): QBranchGadgetsRig {
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
  const armorSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e2229,
    metalness: 0.88,
    roughness: 0.38,
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
  // 3. BULLET-RESISTANT REAR ARMOR SHIELD
  // =========================================================================
  const bulletShieldGroup = new THREE.Group();
  bulletShieldGroup.position.set(0, 0.62, -1.52);
  root.add(bulletShieldGroup);

  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(-0.46, 0);
  shieldShape.lineTo(0.46, 0);
  shieldShape.lineTo(0.39, 0.34);
  shieldShape.lineTo(-0.39, 0.34);
  shieldShape.closePath();

  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  const shieldPlate = register(
    new THREE.Mesh(shieldGeo, armorSteelMat),
    'Bullet-Resistant Rear Shield',
    'Hardened Ballistic Steel',
    'Hydraulically raised armor plate protecting the cabin from rear small-arms fire.',
    [0, 0.85, -1.2]
  );
  bulletShieldGroup.add(shieldPlate);

  // Twin vertical stiffener ribs & hydraulic lift rods
  for (const rx of [-0.26, 0.26]) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.30, 0.010), gunmetalMat);
    rib.position.set(rx, 0.17, 0.016);
    bulletShieldGroup.add(rib);

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 12), chromeMat);
    strut.position.set(rx, 0.16, -0.012);
    bulletShieldGroup.add(strut);
  }

  // =========================================================================
  // 4. PASSENGER EJECTOR SEAT ROOF HATCH (RHD: Passenger = +X)
  // =========================================================================
  const roofHatchPivot = new THREE.Group();
  // Hinge along outer passenger edge (x = +0.50) so it swings open cleanly
  roofHatchPivot.position.set(0.49, 1.325, -0.15);
  root.add(roofHatchPivot);

  const hatchOuter = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.014, 0.56), silverBirchMat);
  register(
    hatchOuter,
    'Ejector Seat Roof Hatch',
    'Silver Birch Aluminum Panel',
    'Explosive-bolt passenger roof panel linked to the Q-Branch Roof Hatch arming switch.',
    [0.55, 1.35, 0]
  );
  hatchOuter.position.set(-0.225, 0.012, 0);
  roofHatchPivot.add(hatchOuter);

  const hatchUnderMat = new THREE.MeshStandardMaterial({
    map: createRoofHatchUndersideTexture(),
    roughness: 0.45,
    metalness: 0.2,
  });
  const hatchInner = new THREE.Mesh(new THREE.PlaneGeometry(0.41, 0.52), hatchUnderMat);
  hatchInner.rotation.x = Math.PI / 2;
  hatchInner.position.set(-0.225, 0.004, 0);
  roofHatchPivot.add(hatchInner);

  // =========================================================================
  // 5. REAR SMOKE SCREEN & OIL SLICK HARDWARE + CUSTOM GLSL FX
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

  for (const sideX of [-0.19, 0.19]) {
    const oilNozzle = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.07, 14), brassMat),
      'Rear Oil Slick Injector',
      'Turned Brass Pressure Nozzle',
      'Pressurized under-valance nozzle spraying slick hydraulic oil behind the rear tyres.',
      [sideX * 0.5, -0.15, -1.2]
    );
    oilNozzle.rotation.x = Math.PI / 2 + 0.18;
    oilNozzle.position.set(sideX, 0.265, -2.235);
    root.add(oilNozzle);
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
  root.add(smokePoints);

  // --- B. Pressurized Oil Slick Arc Stream (InstancedMesh) + Wet Specular Iridescent Puddle ---
  const OIL_COUNT = 120;
  const oilDroplets: OilDroplet[] = [];
  for (let i = 0; i < OIL_COUNT; i++) {
    oilDroplets.push({
      active: false,
      age: 0,
      life: 0.7,
      pos: new THREE.Vector3(0, -10, 0),
      vel: new THREE.Vector3(),
    });
  }
  const oilDropGeo = new THREE.SphereGeometry(0.016, 8, 6);
  const oilDropMat = new THREE.MeshPhysicalMaterial({
    color: 0x070709,
    roughness: 0.04,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
  });
  const oilInstanced = new THREE.InstancedMesh(oilDropGeo, oilDropMat, OIL_COUNT);
  oilInstanced.frustumCulled = false;
  root.add(oilInstanced);

  const oilPuddleMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSpread: { value: 0.0 },
      uTime: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      uniform float uSpread;
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
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.05; a *= 0.5;
        }
        return v;
      }
      void main() {
        if (uSpread <= 0.01) discard;
        vec2 p = (vUv - 0.5) * 2.0;
        float n1 = fbm(p * 3.4 + vec2(0.0, uTime * 0.08));
        float n2 = fbm(p * 7.2 - vec2(uTime * 0.04, 0.0));
        float warp = n1 * 0.38 + n2 * 0.14;

        // Twin pressurized oil streams merging into a thick, irregular asphalt slick
        float d1 = length(vec2((p.x - 0.22) * 1.65, p.y * 0.92)) - warp * 0.52;
        float d2 = length(vec2((p.x + 0.22) * 1.65, p.y * 0.92)) - warp * 0.52;
        float d = min(d1, d2);
        float radius = mix(0.06, 0.88, uSpread);
        float mask = 1.0 - smoothstep(radius - 0.07, radius, d);
        if (mask <= 0.01) discard;

        // View-dependent Fresnel + wet studio softbox specular reflection
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 N = normalize(vec3((n1 - 0.5) * 0.10, 1.0, (n2 - 0.5) * 0.10));
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

        vec3 L1 = normalize(vec3(0.20, 0.92, 0.34));
        float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 76.0);
        vec3 L2 = normalize(vec3(-0.32, 0.85, -0.42));
        float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 48.0);

        float film = n1 * 4.0 + fresnel * 2.2 + length(p) * 2.0;
        vec3 rainbow = 0.5 + 0.5 * cos(film + vec3(0.0, 2.1, 4.2));
        vec3 baseOil = vec3(0.012, 0.013, 0.016);
        vec3 col = mix(baseOil, rainbow * 0.45, clamp(fresnel * 0.78 + 0.12, 0.0, 0.52));
        col += vec3(0.95, 0.97, 1.0) * (spec1 * 0.95 + spec2 * 0.6);

        gl_FragColor = vec4(col, mask * 0.96 * min(1.0, uSpread * 2.4));
      }
    `,
  });

  const oilPuddle = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.2), oilPuddleMat);
  oilPuddle.rotation.x = -Math.PI / 2;
  oilPuddle.position.set(0, 0.023, -3.95);
  root.add(oilPuddle);

  return {
    root,
    frontPlateDrum: frontPlate.drum,
    rearPlateDrum: rearPlate.drum,
    frontRams,
    rearRams,
    bulletShieldGroup,
    roofHatchPivot,
    subParts,
    plateAngle: 0,
    ramFrontExtend: 0,
    ramRearExtend: 0,
    shieldExtend: 0,
    hatchOpen: 0,
    smokePoints,
    smokeParticles,
    oilInstanced,
    oilDroplets,
    oilPuddleMat,
    oilSpread: 0,
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

  // 3. Bullet-Resistant Rear Shield (rises behind rear glass + matches fastback rake)
  rig.shieldExtend += ((state.bulletShield ? 1 : 0) - rig.shieldExtend) * Math.min(1, safeDt * 5.5);
  rig.bulletShieldGroup.position.y = 0.60 + rig.shieldExtend * 0.44;
  rig.bulletShieldGroup.position.z = -1.52 + rig.shieldExtend * 0.19;
  rig.bulletShieldGroup.rotation.x = rig.shieldExtend * 0.36;

  // 4. Passenger Ejector Seat Roof Hatch
  rig.hatchOpen += ((state.roofHatch ? 1 : 0) - rig.hatchOpen) * Math.min(1, safeDt * 6.5);
  rig.roofHatchPivot.rotation.z = -rig.hatchOpen * 1.15;
  rig.roofHatchPivot.position.y = 1.325 + rig.hatchOpen * 0.035;

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

  // 5B. Oil Slick Fluid Arc Stream + Spreading Iridescent Puddle
  let oilSpawnBudget = state.oilSlick ? 5 : 0;
  for (let i = 0; i < rig.oilDroplets.length; i++) {
    const d = rig.oilDroplets[i];
    if (!d.active && oilSpawnBudget > 0) {
      oilSpawnBudget--;
      d.active = true;
      d.age = 0;
      d.life = 0.55 + Math.random() * 0.28;
      const side = i % 2 === 0 ? -0.19 : 0.19;
      d.pos.set(side + (Math.random() - 0.5) * 0.03, 0.265, -2.26);
      d.vel.set((Math.random() - 0.5) * 0.35, -0.15 + Math.random() * 0.22, -(2.4 + Math.random() * 1.1));
    }

    if (d.active) {
      d.age += safeDt;
      d.vel.y -= 5.4 * safeDt;
      d.pos.addScaledVector(d.vel, safeDt);
      if (d.pos.y <= 0.025 || d.age >= d.life) {
        d.active = false;
        _dummyObj.position.set(0, -10, 0);
        _dummyObj.scale.setScalar(0.001);
      } else {
        _dummyObj.position.copy(d.pos);
        _dummyObj.lookAt(d.pos.clone().add(d.vel));
        _dummyObj.scale.set(0.85, 0.85, 3.6);
      }
    } else {
      _dummyObj.position.set(0, -10, 0);
      _dummyObj.scale.setScalar(0.001);
    }
    _dummyObj.updateMatrix();
    rig.oilInstanced.setMatrixAt(i, _dummyObj.matrix);
  }
  rig.oilInstanced.instanceMatrix.needsUpdate = true;

  rig.oilSpread += ((state.oilSlick ? 1 : 0) - rig.oilSpread) * Math.min(1, safeDt * (state.oilSlick ? 1.8 : 0.8));
  rig.oilPuddleMat.uniforms.uSpread.value = rig.oilSpread;
  rig.oilPuddleMat.uniforms.uTime.value = rig.time;
}
