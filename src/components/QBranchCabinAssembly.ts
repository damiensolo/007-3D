import * as THREE from 'three';

export type QBranchGadgetKey =
  | 'oilSlick'
  | 'smokeScreen'
  | 'frontRam'
  | 'rearRam'
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
  smokeScreen: boolean;
  frontRam: boolean;
  rearRam: boolean;
  wingGuns: boolean;
  roofHatch: boolean;
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
  togglePivots: Record<'oilSlick' | 'smokeScreen' | 'frontRam' | 'rearRam', THREE.Group>;
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
  drawToggleIcon(145, 118, 'OIL', 'SLICK');
  drawToggleIcon(367, 118, 'REAR', 'SMOKE');
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 215);
  ctx.lineTo(472, 215);
  ctx.stroke();

  // Section 2: FRONT RAM | REAR RAM
  drawToggleIcon(145, 315, 'FRONT', 'RAM');
  drawToggleIcon(367, 315, 'REAR', 'RAM');
  ctx.beginPath();
  ctx.moveTo(40, 415);
  ctx.lineTo(472, 415);
  ctx.stroke();

  // Section 3: FRONT GUNS | ROOF HATCH (slide-switch icons)
  const drawSliderIcon = (cx: number, cy: number, topLabel: string, botLabel: string) => {
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText(topLabel, cx, cy - 72);
    ctx.lineWidth = 4;
    ctx.strokeRect(cx - 26, cy - 38, 52, 76);
    ctx.fillRect(cx - 22, cy - 34, 44, 34);
    ctx.beginPath();
    ctx.moveTo(cx - 42, cy + 28);
    ctx.lineTo(cx - 42, cy - 28);
    ctx.lineTo(cx - 50, cy - 16);
    ctx.moveTo(cx - 42, cy - 28);
    ctx.lineTo(cx - 34, cy - 16);
    ctx.stroke();
    ctx.fillText(botLabel, cx, cy + 72);
  };

  drawSliderIcon(145, 535, 'FRONT', 'GUNS');
  drawSliderIcon(367, 535, 'ROOF', 'HATCH');
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 650);
  ctx.lineTo(472, 650);
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
    'Red Gear-Knob Actuator Button',
    'Polished Red Acrylic / Microswitch',
    'Spring-loaded Q-Branch tactical trigger: press to deploy & fire the twin Browning .30-caliber machine guns.',
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

  // --- Corrected Switchboard Layout (Front +Z near gearstick -> Rear -Z) ---
  const switchLeds = {} as Record<QBranchGadgetKey, THREE.MeshStandardMaterial>;
  const togglePivots = {} as Record<'oilSlick' | 'smokeScreen' | 'frontRam' | 'rearRam', THREE.Group>;
  const rockerPivots = {} as Record<'wingGuns' | 'roofHatch' | 'bulletShield', THREE.Group>;

  // A. Front 2x2 (+Z, closest to gearstick): 4 Black Paddle Toggle Switches
  const toggleSpecs: Array<{
    key: 'oilSlick' | 'smokeScreen' | 'frontRam' | 'rearRam';
    label: string;
    note: string;
    x: number;
    z: number;
    color: number;
  }> = [
    {
      key: 'oilSlick',
      label: 'Oil Slick Toggle Switch',
      note: 'Activates twin rear-bumper oil slick nozzles.',
      x: 0.028,
      z: 0.098,
      color: 0xeab308,
    },
    {
      key: 'smokeScreen',
      label: 'Rear Smoke Screen Toggle Switch',
      note: 'Deploys dense rear exhaust smoke screen.',
      x: -0.028,
      z: 0.098,
      color: 0x94a3b8,
    },
    {
      key: 'frontRam',
      label: 'Front Battering Ram Toggle Switch',
      note: 'Extends hydraulic front bumper over-rider rams.',
      x: 0.028,
      z: 0.052,
      color: 0xef4444,
    },
    {
      key: 'rearRam',
      label: 'Rear Battering Ram Toggle Switch',
      note: 'Extends hydraulic rear bumper over-rider rams.',
      x: -0.028,
      z: 0.052,
      color: 0xef4444,
    },
  ];

  for (const spec of toggleSpecs) {
    const nut = register(
      new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0105, 0.005, 16), chromeMat),
      `${spec.label} Nut`,
      'Knurled Chrome Collar',
      spec.note,
      [spec.x * 2, 0.7, spec.z * 2],
      { type: 'toggleGadget', key: spec.key }
    );
    nut.position.set(spec.x, deckY + 0.0025, spec.z);
    armrestGroup.add(nut);

    const pivot = new THREE.Group();
    pivot.position.set(spec.x, deckY + 0.005, spec.z);
    armrestGroup.add(pivot);

    const paddle = register(
      new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.020, 0.009), matteSwitchMat),
      spec.label,
      'Molded Black Paddle Toggle',
      spec.note,
      [spec.x * 2, 0.82, spec.z * 2],
      { type: 'toggleGadget', key: spec.key }
    );
    paddle.position.set(0, 0.010, 0);
    pivot.add(paddle);
    togglePivots[spec.key] = pivot;

    const ledMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      emissive: spec.color,
      emissiveIntensity: 0.1,
      roughness: 0.25,
    });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.0026, 10, 8), ledMat);
    led.position.set(spec.x, deckY + 0.0015, spec.z + 0.016);
    armrestGroup.add(led);
    switchLeds[spec.key] = ledMat;
  }

  // B. Middle & Rear-Left: 3 Beveled Black Rocker Switches (FRONT GUNS, ROOF HATCH, BULLET SHIELD)
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
      z: -0.012,
      color: 0xf97316,
    },
    {
      key: 'roofHatch',
      label: 'Roof Hatch Arming Switch',
      note: 'Unlocks the passenger-side ejector seat roof hatch.',
      x: -0.028,
      z: -0.012,
      color: 0x38bdf8,
    },
    {
      key: 'bulletShield',
      label: 'Bullet Shield Rocker Switch',
      note: 'Raises the armored steel deflector plate behind the rear windscreen.',
      x: -0.028,
      z: -0.088,
      color: 0xa855f7,
    },
  ];

  for (const spec of rockerSpecs) {
    const housing = register(
      new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.007, 0.052), matteSwitchMat),
      `${spec.label} Housing`,
      'Beveled Molded Nylon',
      spec.note,
      [spec.x * 2, 0.7, spec.z * 2],
      { type: 'toggleGadget', key: spec.key }
    );
    housing.position.set(spec.x, deckY + 0.0035, spec.z);
    armrestGroup.add(housing);

    const rockerPivot = new THREE.Group();
    rockerPivot.position.set(spec.x, deckY + 0.007, spec.z);
    armrestGroup.add(rockerPivot);

    const rockerTab = register(
      new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.008, 0.028), glossBakeliteMat),
      spec.label,
      'Tactile Rocker Actuator',
      spec.note,
      [spec.x * 2, 0.82, spec.z * 2],
      { type: 'toggleGadget', key: spec.key }
    );
    rockerTab.position.set(0, 0.003, 0);
    rockerPivot.add(rockerTab);

    const thumbRidge = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.006, 0.006), matteSwitchMat);
    thumbRidge.position.set(0, 0.008, 0);
    rockerPivot.add(thumbRidge);

    rockerPivots[spec.key] = rockerPivot;

    const ledMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      emissive: spec.color,
      emissiveIntensity: 0.1,
      roughness: 0.25,
    });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 10, 8), ledMat);
    led.position.set(spec.x, deckY + 0.0015, spec.z + 0.032);
    armrestGroup.add(led);
    switchLeds[spec.key] = ledMat;
  }

  // C. Rear-Right (+X, -Z): Brushed Aluminum E-Gate Plate & Turned Brass Lever (Revolving Plates 1/2/3)
  const gateX = 0.028;
  const gateZ = -0.088;
  const gatePlate = register(
    new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.004, 0.072), machinedAluMat),
    'Revolving Plates E-Gate Plate',
    'Brushed Aircraft Aluminum',
    'Slotted 3-position selector gate for the revolving number plates (1: BMT 216A, 2: 4711-EA-62, 3: LU 6789).',
    [0.1, 0.72, -0.25],
    { type: 'cyclePlates' }
  );
  gatePlate.position.set(gateX, deckY + 0.002, gateZ);
  armrestGroup.add(gatePlate);

  const slotSpine = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.0045, 0.056), darkFlockMat);
  slotSpine.position.set(gateX + 0.009, deckY + 0.0022, gateZ);
  armrestGroup.add(slotSpine);
  for (const sz of [-0.024, 0, 0.024]) {
    const branch = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0045, 0.007), darkFlockMat);
    branch.position.set(gateX - 0.002, deckY + 0.0022, gateZ + sz);
    armrestGroup.add(branch);
  }

  for (const sx of [-0.017, 0.017]) {
    for (const sz of [-0.031, 0.031]) {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.005, 8), chromeMat);
      screw.position.set(gateX + sx, deckY + 0.0025, gateZ + sz);
      armrestGroup.add(screw);
    }
  }

  const plateLeverGroup = new THREE.Group();
  plateLeverGroup.position.set(gateX - 0.008, deckY + 0.004, gateZ - 0.024);
  armrestGroup.add(plateLeverGroup);

  const leverStem = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.014, 12), chromeMat);
  leverStem.position.set(0, 0.007, 0);
  plateLeverGroup.add(leverStem);

  const brassKnob = register(
    new THREE.Mesh(new THREE.CylinderGeometry(0.0068, 0.0038, 0.018, 20), brassMat),
    'Revolving Plates Brass Selector',
    'Turned Solid Brass',
    '3-position brass gate lever. Click to cycle front & rear revolving number plates (BMT 216A / 4711-EA-62 / LU 6789).',
    [0.1, 0.88, -0.28],
    { type: 'cyclePlates' }
  );
  brassKnob.position.set(0, 0.021, 0);
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
 * side-hinged armrest lid, 4 paddle toggles, 3 rocker switches, and brass E-gate lever.
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

  const toggleKeys: Array<'oilSlick' | 'smokeScreen' | 'frontRam' | 'rearRam'> = [
    'oilSlick',
    'smokeScreen',
    'frontRam',
    'rearRam',
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

  const baseGateZ = -0.088;
  const slotOffsets = [-0.024, 0, 0.024];
  const targetLeverZ = baseGateZ + slotOffsets[state.plateIndex];
  rig.plateLeverGroup.position.z += (targetLeverZ - rig.plateLeverGroup.position.z) * 0.22;
}
