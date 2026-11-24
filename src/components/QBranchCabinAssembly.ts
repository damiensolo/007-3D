import * as THREE from 'three';

export type QBranchGadgetKey =
  | 'oilSlick'
  | 'caltrops'
  | 'smokeScreen'
  | 'frontRam'
  | 'rearRam'
  | 'tyreSlashers'
  | 'wingGuns'
  | 'roofHatch'
  | 'bulletShield';

export interface QBranchGadgetStates {
  armrestOpen: boolean;
  gearCapOpen: boolean;
  gearButtonPressed: boolean;
  /** 0 = Position 1 (BMT 216A), 1 = Position 2 (4711-EA-62), 2 = Position 3 (LU 6789) */
  plateIndex: 0 | 1 | 2;
  oilSlick: boolean;
  caltrops: boolean;
  smokeScreen: boolean;
  frontRam: boolean;
  rearRam: boolean;
  tyreSlashers: boolean;
  wingGuns: boolean;
  roofHatch: boolean;
  seatEjected: boolean;
  bulletShield: boolean;
}

export interface CabinSubPart {
  mesh: THREE.Mesh;
  label: string;
  materialLabel: string;
  qBranchNote: string;
  semanticDir: [number, number, number];
  action?:
    | { type: 'toggleGearCap' }
    | { type: 'pressGearButton' }
    | { type: 'toggleArmrest' }
    | { type: 'cyclePlates' }
    | { type: 'toggleGadget'; key: QBranchGadgetKey };
}

export interface QBranchCabinRig {
  root: THREE.Group;
  gearGroup: THREE.Group;
  gearCapPivot: THREE.Group;
  gearRedButton: THREE.Mesh;
  armrestGroup: THREE.Group;
  armrestLidPivot: THREE.Group;
  plateLeverGroup: THREE.Group;
  togglePivots: Record<
    'oilSlick' | 'smokeScreen' | 'frontRam' | 'rearRam' | 'tyreSlashers' | 'caltrops',
    THREE.Group
  >;
  rockerPivots: Record<'wingGuns' | 'roofHatch' | 'bulletShield', THREE.Group>;
  switchLeds: Record<QBranchGadgetKey, THREE.MeshStandardMaterial>;
  subParts: CabinSubPart[];
}

/** Creates a rounded-rectangle THREE.Shape centered at (0, 0). */
function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

/**
 * Builds a closed THREE.Path with smooth quadratic-bezier corner fillets at every vertex.
 */
function createFilletedPath(points: THREE.Vector2[], radii: number[]): THREE.Path {
  const path = new THREE.Path();
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const r = radii[i] ?? 0;

    const vIn = new THREE.Vector2().subVectors(prev, curr);
    const vOut = new THREE.Vector2().subVectors(next, curr);
    const lenIn = vIn.length();
    const lenOut = vOut.length();
    const clampR = Math.min(r, lenIn * 0.45, lenOut * 0.45);

    const pStart = curr.clone().addScaledVector(vIn.normalize(), clampR);
    const pEnd = curr.clone().addScaledVector(vOut.normalize(), clampR);

    if (i === 0) {
      path.moveTo(pStart.x, pStart.y);
    } else {
      path.lineTo(pStart.x, pStart.y);
    }
    if (clampR > 1e-5) {
      path.quadraticCurveTo(curr.x, curr.y, pEnd.x, pEnd.y);
    }
  }
  path.closePath();
  return path;
}

/** Generates a subtle tileable Connolly leather micro-grain bump map (no atlas decals). */
function createLeatherBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 115 + Math.floor(Math.random() * 35);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/** Generates a crisp 5-speed + R engraved shift-pattern texture for the gear knob cap. */
function createShiftPatternTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0c0d10';
  ctx.fillRect(0, 0, 512, 512);

  const grad = ctx.createRadialGradient(220, 200, 20, 256, 256, 240);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.save();
  ctx.translate(256, 256);
  ctx.rotate(Math.PI / 2);
  ctx.translate(-256, -256);

  ctx.strokeStyle = '#f1f5f9';
  ctx.fillStyle = '#f1f5f9';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const xs = [165, 256, 347];
  const yTop = 185;
  const yMid = 256;
  const yBot = 327;

  ctx.beginPath();
  ctx.moveTo(xs[0], yMid);
  ctx.lineTo(xs[2], yMid);
  for (const x of xs) {
    ctx.moveTo(x, yTop);
    ctx.lineTo(x, yBot);
  }
  ctx.stroke();

  ctx.font = 'bold 46px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1', xs[0], yTop - 42);
  ctx.fillText('3', xs[1], yTop - 42);
  ctx.fillText('5', xs[2], yTop - 42);
  ctx.fillText('2', xs[0], yBot + 44);
  ctx.fillText('4', xs[1], yBot + 44);
  ctx.fillText('R', xs[2], yBot + 44);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Generates the authentic black-and-white Q-Branch schematic legend plate
 * mounted on the underside of the hinged center armrest lid.
 * Top of canvas aligns with +Z (front, toward gearstick); bottom aligns with -Z (rear).
 */
function createArmrestLegendTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, 512, 1024);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 472, 984);

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const drawToggleIcon = (cx: number, cy: number, topLabel: string, botLabel: string) => {
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(topLabel, cx, cy - 52);
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(botLabel, cx, cy + 52);
  };

  // Section 1 (Front / +Z, closest to gearstick): OIL SLICK | REAR SMOKE
  drawToggleIcon(145, 98, 'OIL', 'SLICK');
  drawToggleIcon(367, 98, 'REAR', 'SMOKE');
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 178);
  ctx.lineTo(472, 178);
  ctx.stroke();

  // Section 2: FRONT RAM | REAR RAM
  drawToggleIcon(145, 258, 'FRONT', 'RAM');
  drawToggleIcon(367, 258, 'REAR', 'RAM');
  ctx.beginPath();
  ctx.moveTo(40, 338);
  ctx.lineTo(472, 338);
  ctx.stroke();

  // Section 3: TYRE SLASHER | TIRE NAILS (completes the symmetric 2x3 bank of 6 toggles)
  drawToggleIcon(145, 418, 'TYRE', 'SLASHER');
  drawToggleIcon(367, 418, 'TIRE', 'NAILS');
  ctx.beginPath();
  ctx.moveTo(40, 498);
  ctx.lineTo(472, 498);
  ctx.stroke();

  // Section 4: FRONT GUNS | ROOF HATCH (slide-switch icons)
  const drawSliderIcon = (cx: number, cy: number, topLabel: string, botLabel: string) => {
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(topLabel, cx, cy - 64);
    ctx.lineWidth = 4;
    ctx.strokeRect(cx - 24, cy - 34, 48, 68);
    ctx.fillRect(cx - 20, cy - 30, 40, 30);
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy + 24);
    ctx.lineTo(cx - 40, cy - 24);
    ctx.lineTo(cx - 47, cy - 13);
    ctx.moveTo(cx - 40, cy - 24);
    ctx.lineTo(cx - 33, cy - 13);
    ctx.stroke();
    ctx.fillText(botLabel, cx, cy + 64);
  };

  drawSliderIcon(145, 598, 'FRONT', 'GUNS');
  drawSliderIcon(367, 598, 'ROOF', 'HATCH');
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 695);
  ctx.lineTo(472, 695);
  ctx.stroke();

  // Section 4 (Rear / -Z): E-Gate (1, 2, 3) on Left + BULLET on Right
  ctx.lineWidth = 6;
  ctx.strokeRect(86, 725, 22, 210);
  ctx.strokeRect(86, 725, 115, 22);
  ctx.strokeRect(86, 819, 85, 22);
  ctx.strokeRect(86, 913, 115, 22);
  const drawGateNum = (x: number, y: number, n: string) => {
    ctx.fillStyle = '#111317';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(n, x, y + 1);
  };
  drawGateNum(208, 736, '3');
  drawGateNum(178, 830, '2');
  drawGateNum(208, 924, '1');

  drawSliderIcon(367, 835, 'BULLET', 'SHIELD');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Generates an anodized engraved aluminum micro-plaque overlay for the switchboard deck
 * so every 3D toggle, rocker, and the 1-2-3 E-gate has crisp readable labels directly on the console.
 */
function createSwitchDeckLabelsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 1024);

  // Subtle brushed aluminum perimeter pinstripe on the recessed switch deck
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 476, 988);

  // Horizontal section divider hairlines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 2;
  for (const yLine of [185, 338, 492, 692]) {
    ctx.beginPath();
    ctx.moveTo(32, yLine);
    ctx.lineTo(480, yLine);
    ctx.stroke();
  }

  // Map world switch coordinates (x in [-0.062..+0.062], z in [+0.134..-0.134]) to canvas (512x1024)
  // PlaneGeometry rotated by -Math.PI/2 around X:
  //   local +X (u=1, canvas x=512) -> world +X
  //   local +Y (v=1, canvas y=0)   -> world -Z
  //   local -Y (v=0, canvas y=1024)-> world +Z
  // Furthermore, when viewed from +Y with camera.up = (0,0,+1), world +X is on screen-LEFT and world -X is on screen-RIGHT,
  // so we draw the text mirrored horizontally around each plaque center so that every plaque sits at the exact (wx, wz) switch position and reads left-to-right!
  const toCanvasX = (wx: number) => 256 + (wx / 0.124) * 512;
  const toCanvasY = (wz: number) => 512 + (wz / 0.268) * 1024;

  const drawMirroredPlaque = (wx: number, wz: number, text: string, accent = '#e2e8f0') => {
    const cx = toCanvasX(wx);
    const cy = toCanvasY(wz);
    const w = Math.max(96, text.length * 13.5 + 18);
    const h = 22;
    ctx.save();
    ctx.translate(cx, cy);
    // Flip local X and Y so when viewed from +Y with camera.up=(0,0,+1), text reads cleanly left-to-right and right-side up!
    ctx.scale(-1, -1);
    ctx.fillStyle = 'rgba(9, 11, 15, 0.90)';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    ctx.fillStyle = accent;
    ctx.font = 'bold 14px "Arial Narrow", "Helvetica", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);
    ctx.restore();
  };

  // Row 1 Toggles (z = +0.104): Oil Slick (+0.028) & Rear Smoke (-0.028)
  drawMirroredPlaque(0.028, 0.085, 'OIL SLICK', '#fde047');
  drawMirroredPlaque(-0.028, 0.085, 'SMOKE', '#cbd5e1');

  // Row 2 Toggles (z = +0.064): Front Ram (+0.028) & Rear Ram (-0.028)
  drawMirroredPlaque(0.028, 0.045, 'FRONT RAM', '#fca5a5');
  drawMirroredPlaque(-0.028, 0.045, 'REAR RAM', '#fca5a5');

  // Row 3 Toggles (z = +0.024): Tyre Slashers (+0.028) & Tire Nails (-0.028)
  drawMirroredPlaque(0.028, 0.005, 'SLASHER', '#38bdf8');
  drawMirroredPlaque(-0.028, 0.005, 'NAILS', '#6ee7b7');

  // Row 4 Rockers (z = -0.028): Wing Guns (+0.028) & Roof Hatch (-0.028)
  drawMirroredPlaque(0.028, -0.056, 'WING GUNS', '#fdba74');
  drawMirroredPlaque(-0.028, -0.056, 'ROOF HATCH', '#7dd3fc');

  // Row 5 Bottom: Revolving Plates E-Gate (+0.028, z = -0.094) & Bullet Shield Rocker (-0.028, z = -0.094)
  drawMirroredPlaque(0.028, -0.129, 'PLATES 1·2·3', '#fcd34d');
  drawMirroredPlaque(-0.028, -0.125, 'SHIELD', '#d8b4fe');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Builds the precision Q-Branch interior assemblies matching the Aston Martin DB5
 * Goldfinger / GoldenEye / Continuation reference photographs and Blueprint #38.
 */
export function createQBranchCabinRig(
  gearPos: THREE.Vector3,
  armrestPos: THREE.Vector3,
  gearScale = 1.0
): QBranchCabinRig {
  const root = new THREE.Group();
  root.name = 'QBranch_CabinControls';

  const leatherBump = createLeatherBumpTexture();

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.96,
    roughness: 0.08,
  });
  const machinedAluMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.88,
    roughness: 0.24,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4a038,
    metalness: 0.86,
    roughness: 0.22,
  });
  const glossBakeliteMat = new THREE.MeshStandardMaterial({
    color: 0x0b0c0f,
    metalness: 0.12,
    roughness: 0.14,
  });
  const darkFlockMat = new THREE.MeshStandardMaterial({
    color: 0x101216,
    metalness: 0.05,
    roughness: 0.92,
  });
  const matteSwitchMat = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    metalness: 0.18,
    roughness: 0.42,
  });
  const redButtonMat = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    emissive: 0x6b0f0f,
    emissiveIntensity: 0.35,
    metalness: 0.1,
    roughness: 0.16,
    clearcoat: 0.9,
  });

  // Clean procedural Charcoal/Black Connolly Leather matching the factory shifter boot & armrest (Photos 1, 4, 5)
  const blackLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c20,
    roughness: 0.58,
    metalness: 0.05,
    bumpMap: leatherBump,
    bumpScale: 0.0018,
  });

  const subParts: CabinSubPart[] = [];
  const register = (
    mesh: THREE.Mesh,
    label: string,
    materialLabel: string,
    qBranchNote: string,
    semanticDir: [number, number, number],
    action?: CabinSubPart['action']
  ) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    subParts.push({ mesh, label, materialLabel, qBranchNote, semanticDir, action });
    return mesh;
  };

  // =========================================================================
  // 1. GEAR-KNOB ACTUATOR ASSEMBLY (Matched to factory DB5 shifter dimensions: 0.248m tall)
  // =========================================================================
  const gearGroup = new THREE.Group();
  gearGroup.name = 'QBranch_GearKnobActuator';
  gearGroup.position.copy(gearPos);
  gearGroup.scale.setScalar(gearScale);
  root.add(gearGroup);

  // Black leather square tunnel surround sitting flush on carpet (matches factory boot base)
  const surroundShape = createRoundedRectShape(0.108, 0.112, 0.010);
  const surroundGeo = new THREE.ExtrudeGeometry(surroundShape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.0025,
    bevelSize: 0.0025,
    bevelSegments: 2,
  });
  surroundGeo.rotateX(Math.PI / 2);
  const bootSurround = register(
    new THREE.Mesh(surroundGeo, blackLeatherMat),
    'Gearstick Stitched Tunnel Surround',
    'Black Connolly Leather',
    'Flush-mounted stitched leather trim ring anchoring the shift boot to the center tunnel.',
    [0, 0.45, 0.12]
  );
  bootSurround.position.set(0, 0.006, 0);
  gearGroup.add(bootSurround);

  // Tapered black leather gaiter matching the factory boot height (0.0 -> 0.114m)
  const gaiterPoints = [
    new THREE.Vector2(0.040, 0.0),
    new THREE.Vector2(0.036, 0.022),
    new THREE.Vector2(0.026, 0.052),
    new THREE.Vector2(0.017, 0.082),
    new THREE.Vector2(0.011, 0.104),
    new THREE.Vector2(0.0078, 0.114),
  ];
  const gaiter = register(
    new THREE.Mesh(new THREE.LatheGeometry(gaiterPoints, 28), blackLeatherMat),
    'Gearstick Leather Gaiter',
    'Black Connolly Leather',
    'Tailored black leather shifter boot concealing the actuator microswitch wiring.',
    [0, 0.58, 0.14]
  );
  gearGroup.add(gaiter);

  // Vertical slender chrome gearstick shaft (matches factory vertical alignment)
  const stickPivot = new THREE.Group();
  stickPivot.position.set(0, 0.110, 0);
  gearGroup.add(stickPivot);

  const shaft = register(
    new THREE.Mesh(new THREE.CylinderGeometry(0.0046, 0.0054, 0.084, 20), chromeMat),
    'Gearstick Chrome Shaft',
    'Polished Chrome Steel',
    'Slender ZF 5-speed selector shaft routing the concealed trigger lead.',
    [0, 0.72, 0.14]
  );
  shaft.position.set(0, 0.042, 0);
  stickPivot.add(shaft);

  // Elongated Tulip/Bell DB5 Gear Knob (matches factory ~0.056m elongated silhouette + Blueprint #38)
  const knobGroup = new THREE.Group();
  knobGroup.position.set(0, 0.082, 0);
  stickPivot.add(knobGroup);

  const knurlCollar = register(
    new THREE.Mesh(new THREE.CylinderGeometry(0.0086, 0.0068, 0.007, 24), machinedAluMat),
    'Gear Knob Knurled Collar',
    'Knurled Chrome-Plated Brass',
    'Precision knurled locking collar at the base of the DB5 shift knob.',
    [0, 0.8, 0.15],
    { type: 'toggleGearCap' }
  );
  knurlCollar.position.set(0, 0.0035, 0);
  knobGroup.add(knurlCollar);

  // Elongated curved tulip profile (y = 0.006 to 0.048, flaring smoothly to 0.0162m shoulder)
  const knobBodyPoints = [
    new THREE.Vector2(0.0084, 0.006),
    new THREE.Vector2(0.0094, 0.013),
    new THREE.Vector2(0.0114, 0.022),
    new THREE.Vector2(0.0140, 0.032),
    new THREE.Vector2(0.0158, 0.041),
    new THREE.Vector2(0.0162, 0.046),
    new THREE.Vector2(0.0154, 0.0485),
    new THREE.Vector2(0.0135, 0.0485),
  ];
  const knobBody = register(
    new THREE.Mesh(new THREE.LatheGeometry(knobBodyPoints, 32), glossBakeliteMat),
    'Gear Knob Elongated Body',
    'High-Gloss Black Bakelite',
    'Elongated factory-profile DB5 shift knob housing the concealed Q-Branch actuator.',
    [0, 0.86, 0.18],
    { type: 'toggleGearCap' }
  );
  knobGroup.add(knobBody);

  const wellPoints = [
    new THREE.Vector2(0.002, 0.038),
    new THREE.Vector2(0.0095, 0.038),
    new THREE.Vector2(0.0122, 0.044),
    new THREE.Vector2(0.0138, 0.0482),
    new THREE.Vector2(0.0152, 0.0482),
  ];
  const machinedWell = register(
    new THREE.Mesh(new THREE.LatheGeometry(wellPoints, 28), machinedAluMat),
    'Machined Aluminum Actuator Well',
    'Turned Aircraft Aluminum',
    'Circular dished aluminum recess and hinge seat inside the top of the gear knob.',
    [0, 0.92, 0.18],
    { type: 'toggleGearCap' }
  );
  knobGroup.add(machinedWell);

  const gearRedButton = register(
    new THREE.Mesh(new THREE.CylinderGeometry(0.0076, 0.0080, 0.011, 24), redButtonMat),
    'Red Gear-Knob Master Trigger (Guns / Ejector)',
    'Polished Red Acrylic / Microswitch',
    'Dual-mode Goldfinger / Skyfall / Continuation actuator: fires the twin front-wing Browning machine guns when the guns are extended, or triggers the passenger ejector seat when the guns are retracted.',
    [0, 1.08, 0.2],
    { type: 'pressGearButton' }
  );
  gearRedButton.position.set(0, 0.0445, 0);
  knobGroup.add(gearRedButton);

  // Hinged Domed Flip-Top Safety Cap (completes the factory rounded dome at y = 0.0485..0.056)
  const gearCapPivot = new THREE.Group();
  gearCapPivot.position.set(0, 0.0485, 0.015);
  knobGroup.add(gearCapPivot);

  const capUnderside = register(
    new THREE.Mesh(new THREE.CylinderGeometry(0.0148, 0.0148, 0.0022, 28), machinedAluMat),
    'Flip-Top Lid Machined Underside',
    'Turned Aircraft Aluminum',
    'Precision-milled aluminum inner face and hinge lug of the flip-top safety cap.',
    [0, 1.12, 0.24],
    { type: 'toggleGearCap' }
  );
  capUnderside.position.set(0, 0.0011, -0.015);
  gearCapPivot.add(capUnderside);

  const hingeLug = new THREE.Mesh(new THREE.BoxGeometry(0.0055, 0.003, 0.005), machinedAluMat);
  hingeLug.position.set(0, 0.0, -0.0015);
  gearCapPivot.add(hingeLug);

  const shiftTex = createShiftPatternTexture();
  const shiftCapMat = new THREE.MeshStandardMaterial({
    map: shiftTex,
    roughness: 0.15,
    metalness: 0.08,
  });
  // Tapered rounded cap dome matching factory upper shoulder (r=0.0152 -> 0.0108)
  const capTop = register(
    new THREE.Mesh(new THREE.CylinderGeometry(0.0110, 0.0152, 0.0058, 28), shiftCapMat),
    'Gear-Knob 5-Speed Flip-Top Cap',
    'Engraved Black Bakelite',
    'Hinged 5-speed + R shift-pattern safety lid. Click to flip open and expose the red actuator.',
    [0, 1.15, 0.25],
    { type: 'toggleGearCap' }
  );
  capTop.position.set(0, 0.0048, -0.015);
  gearCapPivot.add(capTop);

  // =========================================================================
  // 2. Q-BRANCH CENTER ARMREST & CONCEALED SWITCHGEAR (180° corrected layout)
  // =========================================================================
  const armrestGroup = new THREE.Group();
  armrestGroup.name = 'QBranch_ArmrestConsole';
  armrestGroup.position.copy(armrestPos);
  root.add(armrestGroup);

  const boxWidth = 0.144;
  const boxLen = 0.29;
  const boxHeight = 0.082;
  const outerShape = createRoundedRectShape(boxWidth, boxLen, 0.022);
  const innerHole = createRoundedRectShape(boxWidth - 0.022, boxLen - 0.024, 0.012);
  outerShape.holes.push(innerHole);

  const wallGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: boxHeight,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 3,
  });
  wallGeo.rotateX(-Math.PI / 2);

  const armrestWalls = register(
    new THREE.Mesh(wallGeo, blackLeatherMat),
    'Q-Branch Armrest Leather Housing',
    'Charcoal Connolly Leather',
    'Between-seats rounded Connolly leather armrest housing concealing the Q-Branch gadget bay.',
    [0, 0.48, -0.1]
  );
  armrestGroup.add(armrestWalls);

  const floorShape = createRoundedRectShape(boxWidth - 0.02, boxLen - 0.022, 0.011);
  const floorGeo = new THREE.ExtrudeGeometry(floorShape, { depth: 0.056, bevelEnabled: false });
  floorGeo.rotateX(-Math.PI / 2);
  const bayFloor = register(
    new THREE.Mesh(floorGeo, darkFlockMat),
    'Q-Branch Flocked Switch Bay',
    'Flocked Charcoal Lining',
    'Recessed non-reflective switchboard deck inside the center armrest.',
    [0, 0.58, -0.1]
  );
  bayFloor.position.set(0, 0.004, 0);
  armrestGroup.add(bayFloor);

  const deckY = 0.061;

  // Engraved Anodized Micro-Plaque Label Overlay on the recessed switchboard deck
  const deckLabelsTex = createSwitchDeckLabelsTexture();
  const deckLabelsMat = new THREE.MeshStandardMaterial({
    map: deckLabelsTex,
    transparent: true,
    roughness: 0.45,
    metalness: 0.25,
    depthWrite: false,
  });
  const deckLabelsPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(boxWidth - 0.020, boxLen - 0.022),
    deckLabelsMat
  );
  deckLabelsPlane.rotation.x = -Math.PI / 2;
  deckLabelsPlane.position.set(0, deckY + 0.0003, 0);
  armrestGroup.add(deckLabelsPlane);

  // Hinge stays on +X side so lid opens from the current position toward passenger (+X)
  const hingePivotX = boxWidth / 2 - 0.004;
  const armrestLidPivot = new THREE.Group();
  armrestLidPivot.position.set(hingePivotX, boxHeight + 0.005, 0);
  armrestGroup.add(armrestLidPivot);

  const hingeBarrel = register(
    new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, boxLen - 0.045, 14), chromeMat),
    'Armrest Chrome Piano Hinge',
    'Polished Chrome Steel',
    'Full-length side-mounted piano hinge allowing the armrest lid to swing open toward the passenger.',
    [0.25, 0.85, -0.1],
    { type: 'toggleArmrest' }
  );
  hingeBarrel.rotation.x = Math.PI / 2;
  armrestLidPivot.add(hingeBarrel);

  const lidShape = createRoundedRectShape(boxWidth + 0.004, boxLen + 0.004, 0.022);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 3,
  });
  lidGeo.rotateX(-Math.PI / 2);
  const armrestLid = register(
    new THREE.Mesh(lidGeo, blackLeatherMat),
    'Q-Branch Hinged Armrest Lid',
    'Padded Connolly Leather',
    'Side-hinged leather armrest lid. Click to flip open 108° and expose the Q-Branch control bay.',
    [0.55, 0.95, -0.1],
    { type: 'toggleArmrest' }
  );
  armrestLid.position.set(-hingePivotX, 0.002, 0);
  armrestLidPivot.add(armrestLid);

  // Underside Schematic Legend Plate aligned 180° with the corrected switch bay
  const legendTex = createArmrestLegendTexture();
  const legendMat = new THREE.MeshStandardMaterial({
    map: legendTex,
    roughness: 0.35,
    metalness: 0.1,
  });
  const legendPlane = register(
    new THREE.Mesh(new THREE.PlaneGeometry(boxWidth - 0.026, boxLen - 0.036), legendMat),
    'Q-Branch Control Legend Plate',
    'Anodized Engraved Aluminum',
    'Official Q-Branch schematic diagram inside the armrest lid mapping every gadget control.',
    [0.5, 0.9, -0.1],
    { type: 'toggleArmrest' }
  );
  legendPlane.rotation.x = Math.PI / 2;
  legendPlane.position.set(-hingePivotX, -0.0045, 0);
  armrestLidPivot.add(legendPlane);

  // --- Symmetric Switchboard Layout (Front +Z near gearstick -> Rear -Z) ---
  // Top Bank: 6 Sculpted Black Duckbill Paddle Toggles in a clean 2x3 grid
  // Middle/Bottom Bank: 3 Arched-Shroud Rocker Switches + 3-Position Revolving Plates E-Gate
  const switchLeds = {} as Record<QBranchGadgetKey, THREE.MeshStandardMaterial>;
  const togglePivots = {} as Record<
    'oilSlick' | 'smokeScreen' | 'frontRam' | 'rearRam' | 'tyreSlashers' | 'caltrops',
    THREE.Group
  >;
  const rockerPivots = {} as Record<'wingGuns' | 'roofHatch' | 'bulletShield', THREE.Group>;

  // A. Front 2x3 Grid (6 Sculpted Black Duckbill Paddle Toggles)
  const toggleSpecs: Array<{
    key: 'oilSlick' | 'smokeScreen' | 'frontRam' | 'rearRam' | 'tyreSlashers' | 'caltrops';
    label: string;
    note: string;
    x: number;
    z: number;
    color: number;
  }> = [
    {
      key: 'oilSlick',
      label: 'Oil Slick Toggle Switch',
      note: 'Activates the hinged left rear taillight oil slick dispenser.',
      x: 0.028,
      z: 0.104,
      color: 0xeab308,
    },
    {
      key: 'smokeScreen',
      label: 'Rear Smoke Screen Toggle Switch',
      note: 'Deploys dense rear exhaust smoke screen.',
      x: -0.028,
      z: 0.104,
      color: 0x94a3b8,
    },
    {
      key: 'frontRam',
      label: 'Front Battering Ram Toggle Switch',
      note: 'Extends hydraulic front bumper over-rider rams.',
      x: 0.028,
      z: 0.064,
      color: 0xef4444,
    },
    {
      key: 'rearRam',
      label: 'Rear Battering Ram Toggle Switch',
      note: 'Extends hydraulic rear bumper over-rider rams.',
      x: -0.028,
      z: 0.064,
      color: 0xef4444,
    },
    {
      key: 'tyreSlashers',
      label: 'Rear Tyre Slasher Toggle Switch',
      note: 'Extends and spins the telescoping 3-eared Roman-chariot knock-off tyre slasher blades from the rear wire-wheel hubs.',
      x: 0.028,
      z: 0.024,
      color: 0x38bdf8,
    },
    {
      key: 'caltrops',
      label: 'Caltrop / Tire Nails Toggle Switch',
      note: 'Drops the right rear taillight cluster to scatter 4-pointed steel caltrops.',
      x: -0.028,
      z: 0.024,
      color: 0x10b981,
    },
  ];

  // Shared high-detail geometries for the 4 toggle switches
  const toggleCollarGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0108, 0.0),
      new THREE.Vector2(0.0108, 0.0012),
      new THREE.Vector2(0.0094, 0.0024),
      new THREE.Vector2(0.0072, 0.0024),
      new THREE.Vector2(0.0068, 0.0010),
    ],
    28
  );
  const toggleHexNutGeo = new THREE.CylinderGeometry(0.0064, 0.0064, 0.0028, 6);
  const toggleBallGeo = new THREE.SphereGeometry(0.0034, 16, 12);

  // Flared duckbill/teardrop paddle bat with smooth beveled edges
  const paddleShape = new THREE.Shape();
  paddleShape.moveTo(-0.0018, 0.0015);
  paddleShape.lineTo(0.0018, 0.0015);
  paddleShape.quadraticCurveTo(0.0034, 0.011, 0.0040, 0.0185);
  paddleShape.absarc(0, 0.0195, 0.0040, 0, Math.PI, false);
  paddleShape.quadraticCurveTo(-0.0034, 0.011, -0.0018, 0.0015);

  const togglePaddleGeo = new THREE.ExtrudeGeometry(paddleShape, {
    depth: 0.0026,
    bevelEnabled: true,
    bevelThickness: 0.0011,
    bevelSize: 0.0009,
    bevelSegments: 3,
    curveSegments: 16,
  });
  togglePaddleGeo.translate(0, 0, -0.0013);

  const satinPaddleMat = new THREE.MeshStandardMaterial({
    color: 0x16181d,
    metalness: 0.16,
    roughness: 0.32,
  });
  const miniRingGeo = new THREE.CylinderGeometry(0.0024, 0.0028, 0.0014, 16);

  for (const spec of toggleSpecs) {
    const collar = register(
      new THREE.Mesh(toggleCollarGeo, chromeMat),
      `${spec.label} Collar`,
      'Turned Chrome Bezel',
      spec.note,
      [spec.x * 2, 0.7, spec.z * 2],
      { type: 'toggleGadget', key: spec.key }
    );
    collar.position.set(spec.x, deckY, spec.z);
    armrestGroup.add(collar);

    const hexNut = new THREE.Mesh(toggleHexNutGeo, chromeMat);
    hexNut.position.set(spec.x, deckY + 0.0032, spec.z);
    armrestGroup.add(hexNut);

    const pivot = new THREE.Group();
    pivot.position.set(spec.x, deckY + 0.0052, spec.z);
    armrestGroup.add(pivot);

    const ball = new THREE.Mesh(toggleBallGeo, chromeMat);
    pivot.add(ball);

    const paddle = register(
      new THREE.Mesh(togglePaddleGeo, satinPaddleMat),
      spec.label,
      'Molded Black Duckbill Toggle',
      spec.note,
      [spec.x * 2, 0.82, spec.z * 2],
      { type: 'toggleGadget', key: spec.key }
    );
    pivot.add(paddle);
    togglePivots[spec.key] = pivot;

    // Flush machined indicator boss forward (+Z) of each toggle
    const ledRing = new THREE.Mesh(miniRingGeo, machinedAluMat);
    ledRing.position.set(spec.x, deckY + 0.0007, spec.z + 0.0145);
    armrestGroup.add(ledRing);

    const ledMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      emissive: spec.color,
      emissiveIntensity: 0.08,
      roughness: 0.2,
    });
    const led = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0014, 0.0016, 12), ledMat);
    led.position.set(spec.x, deckY + 0.0008, spec.z + 0.0145);
    armrestGroup.add(led);
    switchLeds[spec.key] = ledMat;
  }

  // B. Middle & Rear-Left: 3 Beveled & Arched-Shroud Rocker Switches (FRONT GUNS, ROOF HATCH, BULLET SHIELD)
  const rockerSpecs: Array<{
    key: 'wingGuns' | 'roofHatch' | 'bulletShield';
    label: string;
    note: string;
    x: number;
    z: number;
    color: number;
  }> = [
    {
      key: 'wingGuns',
      label: 'Front Guns Rocker Switch',
      note: 'Arms and deploys the twin front-wing Browning .30-caliber machine guns.',
      x: 0.028,
      z: -0.028,
      color: 0xf97316,
    },
    {
      key: 'roofHatch',
      label: 'Roof Hatch Arming Switch',
      note: 'Unlocks the passenger-side ejector seat roof hatch.',
      x: -0.028,
      z: -0.028,
      color: 0x38bdf8,
    },
    {
      key: 'bulletShield',
      label: 'Bullet Shield Rocker Switch',
      note: 'Raises the armored steel deflector plate behind the rear windscreen.',
      x: -0.028,
      z: -0.094,
      color: 0xa855f7,
    },
  ];

  // Outer beveled housing frame with recessed inner pocket
  const rockerFrameShape = createRoundedRectShape(0.041, 0.052, 0.0045);
  const rockerPocketHole = createRoundedRectShape(0.025, 0.035, 0.0028);
  rockerFrameShape.holes.push(rockerPocketHole);
  const rockerFrameGeo = new THREE.ExtrudeGeometry(rockerFrameShape, {
    depth: 0.0045,
    bevelEnabled: true,
    bevelThickness: 0.0014,
    bevelSize: 0.0012,
    bevelSegments: 3,
  });
  rockerFrameGeo.rotateX(-Math.PI / 2);

  // Curved arched side cheek-guards flanking +/-X of each rocker
  const archShape = new THREE.Shape();
  archShape.moveTo(-0.021, 0);
  archShape.lineTo(0.021, 0);
  archShape.quadraticCurveTo(0.020, 0.0075, 0, 0.0085);
  archShape.quadraticCurveTo(-0.020, 0.0075, -0.021, 0);
  const archGuardGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: 0.0036,
    bevelEnabled: true,
    bevelThickness: 0.0010,
    bevelSize: 0.0009,
    bevelSegments: 2,
    curveSegments: 16,
  });
  // Rotate so Z is along length (-0.021..0.021), Y is arch height, X is thickness
  archGuardGeo.rotateY(Math.PI / 2);
  archGuardGeo.translate(-0.0018, 0, 0);

  // Beveled tilting rocker paddle + sculpted rounded finger fin
  const rockerPaddleShape = createRoundedRectShape(0.022, 0.030, 0.0025);
  const rockerPaddleGeo = new THREE.ExtrudeGeometry(rockerPaddleShape, {
    depth: 0.0042,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0010,
    bevelSegments: 3,
  });
  rockerPaddleGeo.rotateX(-Math.PI / 2);

  const finShape = new THREE.Shape();
  finShape.moveTo(-0.0022, 0);
  finShape.lineTo(0.0022, 0);
  finShape.lineTo(0.0016, 0.0065);
  finShape.absarc(0, 0.0065, 0.0016, 0, Math.PI, false);
  finShape.lineTo(-0.0022, 0);
  const rockerFinGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.017,
    bevelEnabled: true,
    bevelThickness: 0.0009,
    bevelSize: 0.0007,
    bevelSegments: 2,
    curveSegments: 12,
  });
  rockerFinGeo.rotateY(Math.PI / 2);
  rockerFinGeo.translate(-0.0085, 0.0042, 0);

  for (const spec of rockerSpecs) {
    const housing = register(
      new THREE.Mesh(rockerFrameGeo, matteSwitchMat),
      `${spec.label} Housing`,
      'Beveled Molded Nylon Shroud',
      spec.note,
      [spec.x * 2, 0.7, spec.z * 2],
      { type: 'toggleGadget', key: spec.key }
    );
    housing.position.set(spec.x, deckY + 0.001, spec.z);
    armrestGroup.add(housing);

    for (const sideX of [-0.0165, 0.0165]) {
      const guard = new THREE.Mesh(archGuardGeo, matteSwitchMat);
      guard.position.set(spec.x + sideX, deckY + 0.0055, spec.z);
      armrestGroup.add(guard);
    }

    const rockerPivot = new THREE.Group();
    rockerPivot.position.set(spec.x, deckY + 0.0038, spec.z);
    armrestGroup.add(rockerPivot);

    const rockerTab = register(
      new THREE.Mesh(rockerPaddleGeo, satinPaddleMat),
      spec.label,
      'Beveled Tactile Rocker Actuator',
      spec.note,
      [spec.x * 2, 0.82, spec.z * 2],
      { type: 'toggleGadget', key: spec.key }
    );
    rockerPivot.add(rockerTab);

    const thumbFin = new THREE.Mesh(rockerFinGeo, satinPaddleMat);
    rockerPivot.add(thumbFin);

    rockerPivots[spec.key] = rockerPivot;

    const ledRing = new THREE.Mesh(miniRingGeo, machinedAluMat);
    ledRing.position.set(spec.x, deckY + 0.0007, spec.z + 0.0285);
    armrestGroup.add(ledRing);

    const ledMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      emissive: spec.color,
      emissiveIntensity: 0.08,
      roughness: 0.2,
    });
    const led = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0014, 0.0016, 12), ledMat);
    led.position.set(spec.x, deckY + 0.0008, spec.z + 0.0285);
    armrestGroup.add(led);
    switchLeds[spec.key] = ledMat;
  }

  // C. Rear-Right (+X, -Z): CNC-Beveled Aluminum E-Gate Plate & Turned Brass Lever (Revolving Plates 1/2/3)
  const gateX = 0.028;
  const gateZ = -0.094;

  const gateOuterShape = createRoundedRectShape(0.046, 0.074, 0.0035);
  const hw = 0.0036; // E-slot half-width
  const sxLeft = 0.0074;
  const sxRight = 0.0146;
  const tx = -0.013;
  const by0 = -0.023;
  const by1 = 0.0;
  const by2 = 0.023;

  const eVerts = [
    new THREE.Vector2(sxRight, by0 - hw),
    new THREE.Vector2(tx, by0 - hw),
    new THREE.Vector2(tx, by0 + hw),
    new THREE.Vector2(sxLeft, by0 + hw),
    new THREE.Vector2(sxLeft, by1 - hw),
    new THREE.Vector2(tx, by1 - hw),
    new THREE.Vector2(tx, by1 + hw),
    new THREE.Vector2(sxLeft, by1 + hw),
    new THREE.Vector2(sxLeft, by2 - hw),
    new THREE.Vector2(tx, by2 - hw),
    new THREE.Vector2(tx, by2 + hw),
    new THREE.Vector2(sxRight, by2 + hw),
  ];
  const eRadii = [
    0.0036, 0.0035, 0.0035, 0.0032, 0.0032, 0.0035, 0.0035, 0.0032, 0.0032, 0.0035, 0.0035, 0.0036,
  ];
  gateOuterShape.holes.push(createFilletedPath(eVerts, eRadii));

  const gatePlateGeo = new THREE.ExtrudeGeometry(gateOuterShape, {
    depth: 0.0028,
    bevelEnabled: true,
    bevelThickness: 0.0010,
    bevelSize: 0.0009,
    bevelSegments: 3,
    curveSegments: 16,
  });
  gatePlateGeo.rotateX(-Math.PI / 2);

  const gatePlate = register(
    new THREE.Mesh(gatePlateGeo, machinedAluMat),
    'Revolving Plates E-Gate Plate',
    'CNC-Machined Brushed Aluminum',
    'Beveled 3-position E-gate selector plate for the revolving number plates (1: BMT 216A, 2: 4711-EA-62, 3: LU 6789).',
    [0.1, 0.72, -0.25],
    { type: 'cyclePlates' }
  );
  gatePlate.position.set(gateX, deckY + 0.0012, gateZ);
  armrestGroup.add(gatePlate);

  // 8 tiny dome-head mounting screws matching reference E-gate corner pairs
  const screwGeo = new THREE.SphereGeometry(0.0013, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const screwCoords: Array<[number, number]> = [
    [-0.019, -0.032],
    [-0.014, -0.032],
    [0.014, -0.032],
    [0.019, -0.032],
    [-0.019, 0.032],
    [-0.014, 0.032],
    [0.014, 0.032],
    [0.019, 0.032],
  ];
  for (const [sx, sz] of screwCoords) {
    const screw = new THREE.Mesh(screwGeo, chromeMat);
    screw.position.set(gateX + sx, deckY + 0.0049, gateZ + sz);
    armrestGroup.add(screw);
  }

  // Start in Slot 1 (-Z = -0.023, branch tip X = gateX - 0.010)
  const plateLeverGroup = new THREE.Group();
  plateLeverGroup.position.set(gateX - 0.010, deckY + 0.0015, gateZ - 0.023);
  armrestGroup.add(plateLeverGroup);

  const leverStem = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.012, 16), chromeMat);
  leverStem.position.set(0, 0.006, 0);
  plateLeverGroup.add(leverStem);

  // Turned solid-brass frustum selector knob with chamfered crown
  const brassKnobPoints = [
    new THREE.Vector2(0.0023, 0.0105),
    new THREE.Vector2(0.0040, 0.0110),
    new THREE.Vector2(0.0044, 0.0145),
    new THREE.Vector2(0.0064, 0.0235),
    new THREE.Vector2(0.0071, 0.0275),
    new THREE.Vector2(0.0067, 0.0289),
    new THREE.Vector2(0.0056, 0.0294),
    new THREE.Vector2(0.0, 0.0295),
  ];
  const brassKnob = register(
    new THREE.Mesh(new THREE.LatheGeometry(brassKnobPoints, 32), brassMat),
    'Revolving Plates Brass Selector',
    'Turned Solid Brass',
    '3-position brass gate lever. Slides cleanly through the E-gate track to cycle plates (BMT 216A / 4711-EA-62 / LU 6789).',
    [0.1, 0.88, -0.28],
    { type: 'cyclePlates' }
  );
  plateLeverGroup.add(brassKnob);

  return {
    root,
    gearGroup,
    gearCapPivot,
    gearRedButton,
    armrestGroup,
    armrestLidPivot,
    plateLeverGroup,
    togglePivots,
    rockerPivots,
    switchLeds,
    subParts,
  };
}

/**
 * Smoothly animates the gear-knob flip-top cap, red button travel,
 * side-hinged armrest lid, 4 paddle toggles, 3 rocker switches,
 * and physically constrained 3-phase E-gate brass selector.
 */
export function updateQBranchCabinRig(
  rig: QBranchCabinRig,
  state: QBranchGadgetStates,
  lerpFactor = 0.18
): void {
  // Positive rotation.x around the +Z hinge swings the -Z cap cleanly UPWARD and OPEN
  const targetCapRot = state.gearCapOpen ? Math.PI * 0.68 : 0;
  rig.gearCapPivot.rotation.x += (targetCapRot - rig.gearCapPivot.rotation.x) * lerpFactor;

  const targetBtnY = state.gearButtonPressed ? 0.041 : 0.0445;
  rig.gearRedButton.position.y += (targetBtnY - rig.gearRedButton.position.y) * 0.35;
  const btnMat = rig.gearRedButton.material as THREE.MeshPhysicalMaterial;
  btnMat.emissiveIntensity = state.gearButtonPressed ? 1.5 : state.gearCapOpen ? 0.7 : 0.3;

  const targetArmRot = state.armrestOpen ? -Math.PI * 0.6 : 0;
  rig.armrestLidPivot.rotation.z += (targetArmRot - rig.armrestLidPivot.rotation.z) * lerpFactor;

  const toggleKeys: Array<
    'oilSlick' | 'smokeScreen' | 'frontRam' | 'rearRam' | 'tyreSlashers' | 'caltrops'
  > = [
    'oilSlick',
    'smokeScreen',
    'frontRam',
    'rearRam',
    'tyreSlashers',
    'caltrops',
  ];
  for (const key of toggleKeys) {
    const active = state[key];
    const pivot = rig.togglePivots[key];
    pivot.rotation.x += ((active ? 0.48 : -0.48) - pivot.rotation.x) * 0.25;
    rig.switchLeds[key].emissiveIntensity = active ? 2.0 : 0.08;
  }

  const rockerKeys: Array<'wingGuns' | 'roofHatch' | 'bulletShield'> = [
    'wingGuns',
    'roofHatch',
    'bulletShield',
  ];
  for (const key of rockerKeys) {
    const active = state[key];
    const pivot = rig.rockerPivots[key];
    pivot.rotation.x += ((active ? -0.22 : 0.22) - pivot.rotation.x) * 0.25;
    rig.switchLeds[key].emissiveIntensity = active ? 2.0 : 0.08;
  }

  // Physically constrained E-gate path: slide out to spine X -> slide along spine Z -> slide into target branch X
  const gateX = 0.028;
  const gateZ = -0.094;
  const spineX = gateX + 0.011;
  const branchTipX = gateX - 0.010;
  const slotOffsets = [-0.023, 0, 0.023];
  const targetZ = gateZ + slotOffsets[state.plateIndex];

  const pos = rig.plateLeverGroup.position;
  const step = Math.max(0.0012, lerpFactor * 0.022);
  const eps = 0.0008;

  if (Math.abs(pos.z - targetZ) > eps) {
    if (Math.abs(pos.x - spineX) > eps) {
      const dx = spineX - pos.x;
      pos.x += Math.sign(dx) * Math.min(Math.abs(dx), step);
    } else {
      pos.x = spineX;
      const dz = targetZ - pos.z;
      pos.z += Math.sign(dz) * Math.min(Math.abs(dz), step);
    }
  } else {
    pos.z = targetZ;
    const dx = branchTipX - pos.x;
    if (Math.abs(dx) > eps) {
      pos.x += Math.sign(dx) * Math.min(Math.abs(dx), step);
    } else {
      pos.x = branchTipX;
    }
  }
}
