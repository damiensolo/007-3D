import * as THREE from 'three';

export interface GunRig {
  side: 'left' | 'right';
  scaleFactor: number;
  root: THREE.Group;
  indicatorFlap: THREE.Group;
  gunCarriage: THREE.Group;
  barrelGroup: THREE.Group;
  muzzleFlash: THREE.Mesh;
  muzzleLight: THREE.PointLight;
  /** Child meshes registered for raycasting, explode, and inspector */
  subParts: Array<{
    mesh: THREE.Mesh;
    label: string;
    materialLabel: string;
    qBranchNote: string;
    semanticDir: [number, number, number];
  }>;
}

/**
 * Builds a realistic, mechanically viable Browning M1919 .30-caliber machine gun
 * and hinged Lucas indicator bay sized to fit flush inside a carved front-wing port.
 *
 * @param side 'left' or 'right' front wing
 * @param anchorPos exact world-space center of the front indicator light
 * @param portRadius world-space radius of the indicator opening (~0.033)
 */
export function createBrowningGunRig(
  side: 'left' | 'right',
  anchorPos: THREE.Vector3,
  portRadius: number
): GunRig {
  const isLeft = side === 'left';
  const sideLabel = isLeft ? 'Left' : 'Right';
  const sideX = isLeft ? -1 : 1;

  const root = new THREE.Group();
  root.name = `QBranch_GunBay_${side}`;
  root.position.copy(anchorPos);

  // Shared PBR Materials
  const parkerizedSteel = new THREE.MeshStandardMaterial({
    color: 0x26292e,
    metalness: 0.85,
    roughness: 0.38,
  });
  const bluedBarrel = new THREE.MeshStandardMaterial({
    color: 0x16191e,
    metalness: 0.92,
    roughness: 0.24,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.96,
    roughness: 0.1,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4a017,
    metalness: 0.88,
    roughness: 0.25,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.85,
    roughness: 0.3,
  });
  const amberLensMat = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    emissive: 0x92400e,
    emissiveIntensity: 0.3,
    metalness: 0.08,
    roughness: 0.14,
    transmission: 0.4,
    transparent: true,
    opacity: 0.92,
  });
  const bayInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x07090d,
    metalness: 0.35,
    roughness: 0.88,
    side: THREE.DoubleSide,
  });

  const subParts: GunRig['subParts'] = [];
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

  // Scale factor relative to a 0.033 nominal port radius
  const s = portRadius / 0.033;

  // 1. Machined Cylindrical Gun-Port Collar & Recessed Bay Sleeve (sits inside the carved hole)
  const collarGeo = new THREE.TorusGeometry(portRadius * 0.98, 0.004 * s, 12, 28);
  const portCollar = register(
    new THREE.Mesh(collarGeo, parkerizedSteel),
    `${sideLabel} Gun-Port Steel Collar`,
    'Machined Ordnance Steel',
    'Reinforced circular port ring cut into the Silver Birch front wing behind the indicator.',
    [sideX * 0.4, 0.15, 0.55]
  );
  portCollar.position.set(0, 0, -0.006 * s);
  root.add(portCollar);

  const sleeveLen = 0.30 * s;
  const sleeveGeo = new THREE.CylinderGeometry(
    portRadius * 0.96,
    portRadius * 0.96,
    sleeveLen,
    24,
    1,
    true
  );
  sleeveGeo.rotateX(Math.PI / 2);
  const sleeve = register(
    new THREE.Mesh(sleeveGeo, bayInteriorMat),
    `${sideLabel} Recessed Wing Gun Tunnel`,
    'Matte Black Steel Sleeve',
    'Enclosed cylindrical weapon bay recessed inside the front wing ahead of the wheel arch.',
    [sideX * 0.5, 0.2, 0.35]
  );
  sleeve.position.set(0, 0, -sleeveLen * 0.5 - 0.008 * s);
  root.add(sleeve);

  // Rear bulkhead cap so you never see through the car when looking down the barrel
  const capGeo = new THREE.CircleGeometry(portRadius * 0.96, 20);
  const rearCap = new THREE.Mesh(capGeo, bayInteriorMat);
  rearCap.position.set(0, 0, -sleeveLen - 0.008 * s);
  root.add(rearCap);

  // 2. Hinged Lucas Indicator Flap (pivots at bottom lip: y = -portRadius, z = 0)
  const indicatorFlap = new THREE.Group();
  indicatorFlap.position.set(0, -portRadius, 0);
  root.add(indicatorFlap);

  const bezelGeo = new THREE.TorusGeometry(portRadius * 0.96, 0.0055 * s, 14, 28);
  const bezel = register(
    new THREE.Mesh(bezelGeo, chromeMat),
    `${sideLabel} Hinged Lucas Indicator Bezel`,
    'Chrome-Plated Brass',
    'Stock-appearing Lucas turn-signal bezel on a concealed lower pivot hinge; swings 95° down when armed.',
    [sideX * 0.45, -0.45, 1.45]
  );
  bezel.position.set(0, portRadius, 0.002 * s);
  indicatorFlap.add(bezel);

  const lensGeo = new THREE.SphereGeometry(portRadius * 0.92, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
  lensGeo.rotateX(Math.PI / 2);
  lensGeo.scale(1, 1, 0.45);
  const lens = register(
    new THREE.Mesh(lensGeo, amberLensMat),
    `${sideLabel} Lucas Indicator Lens`,
    'Amber Acrylic Dome Lens',
    'Seals the front-wing gun port flush when stowed; flips downward with the bezel on deployment.',
    [sideX * 0.45, -0.5, 1.55]
  );
  lens.position.set(0, portRadius, 0.001 * s);
  indicatorFlap.add(lens);

  // Hinge bracket arms at the bottom lip
  const hingeGeo = new THREE.BoxGeometry(0.018 * s, 0.006 * s, 0.012 * s);
  const hingeBracket = new THREE.Mesh(hingeGeo, parkerizedSteel);
  hingeBracket.position.set(0, 0.002 * s, -0.004 * s);
  indicatorFlap.add(hingeBracket);

  // 3. Sliding Gun Carriage (recessed at -0.23*s so muzzle tip at +0.207*s stays -0.023*s behind the closed lens)
  const gunCarriage = new THREE.Group();
  gunCarriage.position.set(0, 0, -0.23 * s);
  gunCarriage.visible = false;
  root.add(gunCarriage);

  // Twin Chrome Slide Rails attached to carriage
  const railGeo = new THREE.CylinderGeometry(0.0032 * s, 0.0032 * s, 0.18 * s, 10);
  railGeo.rotateX(Math.PI / 2);
  const railL = register(
    new THREE.Mesh(railGeo, chromeMat),
    `${sideLabel} Pneumatic Slide Rail`,
    'Hardened Chrome Steel',
    'Linear guide rod & pneumatic actuator extending the Browning M1919 out of the wing.',
    [sideX * 0.6, 0.1, 0.7]
  );
  railL.position.set(-0.016 * s, -0.014 * s, -0.04 * s);
  gunCarriage.add(railL);

  const railR = register(
    new THREE.Mesh(railGeo, chromeMat),
    `${sideLabel} Actuator Piston Rod`,
    'Hardened Chrome Steel',
    '12V solenoid-controlled actuator piston driving weapon deployment.',
    [sideX * 0.6, -0.1, 0.7]
  );
  railR.position.set(0.016 * s, -0.014 * s, -0.04 * s);
  gunCarriage.add(railR);

  // Compact M1919 Receiver
  const receiver = register(
    new THREE.Mesh(new THREE.BoxGeometry(0.036 * s, 0.038 * s, 0.11 * s), parkerizedSteel),
    `${sideLabel} Browning M1919 Receiver`,
    'Parkerized Ordnance Steel',
    'Compact recoil-operated .30-caliber Browning receiver riding on twin wing rails.',
    [sideX * 0.75, 0.35, 1.1]
  );
  receiver.position.set(0, 0.0, -0.055 * s);
  gunCarriage.add(receiver);

  // Top Feed Cover
  const topCover = register(
    new THREE.Mesh(new THREE.BoxGeometry(0.03 * s, 0.008 * s, 0.09 * s), bluedBarrel),
    `${sideLabel} Receiver Top Feed Cover`,
    'Blued Steel',
    'Hinged top cover for belt-fed .30-06 Springfield ammunition.',
    [sideX * 0.75, 0.65, 1.1]
  );
  topCover.position.set(0, 0.022 * s, -0.05 * s);
  gunCarriage.add(topCover);

  // Charging Handle
  const cockingStem = register(
    new THREE.Mesh(new THREE.BoxGeometry(0.014 * s, 0.007 * s, 0.01 * s), chromeMat),
    `${sideLabel} Charging Handle`,
    'Machined Steel',
    'Side-mounted bolt charging handle.',
    [sideX * 1.1, 0.45, 1.05]
  );
  cockingStem.position.set(sideX * 0.023 * s, 0.004 * s, -0.045 * s);
  gunCarriage.add(cockingStem);

  // Ammo Belt with Brass Cartridges (inboard side)
  const ammoGroup = new THREE.Group();
  ammoGroup.position.set(-sideX * 0.024 * s, 0.0, -0.04 * s);
  gunCarriage.add(ammoGroup);

  const beltMesh = register(
    new THREE.Mesh(new THREE.BoxGeometry(0.014 * s, 0.024 * s, 0.04 * s), parkerizedSteel),
    `${sideLabel} .30-06 Disintegrating Link Belt`,
    'Stamped Spring Steel Links',
    'Feeds 250 rounds of .30-06 ammunition from the concealed wing magazine.',
    [-sideX * 0.4, 0.3, 0.9]
  );
  ammoGroup.add(beltMesh);

  for (let i = 0; i < 3; i++) {
    const casingGeo = new THREE.CylinderGeometry(0.0026 * s, 0.0026 * s, 0.018 * s, 8);
    casingGeo.rotateZ(Math.PI / 2);
    const casing = register(
      new THREE.Mesh(casingGeo, brassMat),
      `${sideLabel} .30-06 Brass Cartridge #${i + 1}`,
      'Drawn Cartridge Brass',
      'Live .30 caliber round linked into the M1919 feedway.',
      [-sideX * 0.55, 0.35 + i * 0.08, 0.95]
    );
    casing.position.set(0, -0.007 * s + i * 0.007 * s, -0.01 * s + i * 0.01 * s);
    ammoGroup.add(casing);

    const tipGeo = new THREE.ConeGeometry(0.0025 * s, 0.008 * s, 8);
    tipGeo.rotateZ(isLeft ? Math.PI / 2 : -Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, copperMat);
    tip.position.set(isLeft ? -0.012 * s : 0.012 * s, -0.007 * s + i * 0.007 * s, -0.01 * s + i * 0.01 * s);
    ammoGroup.add(tip);
  }

  // Barrel & Perforated Cooling Jacket Group (recoils during firing!)
  const barrelGroup = new THREE.Group();
  gunCarriage.add(barrelGroup);

  const jacketGeo = new THREE.CylinderGeometry(0.0165 * s, 0.0165 * s, 0.11 * s, 20);
  jacketGeo.rotateX(Math.PI / 2);
  const jacket = register(
    new THREE.Mesh(jacketGeo, parkerizedSteel),
    `${sideLabel} Perforated Cooling Jacket`,
    'Ventilated Steel Shroud',
    'Air-cooled perforated barrel shroud characteristic of the Browning M1919.',
    [sideX * 0.75, 0.25, 1.45]
  );
  jacket.position.set(0, 0.0, 0.055 * s);
  barrelGroup.add(jacket);

  for (let r = 0; r < 5; r++) {
    const ringGeo = new THREE.TorusGeometry(0.0168 * s, 0.0016 * s, 8, 20);
    const ring = new THREE.Mesh(ringGeo, bluedBarrel);
    ring.position.set(0, 0.0, (0.015 + r * 0.02) * s);
    barrelGroup.add(ring);
  }

  // Rifled Inner Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.0075 * s, 0.0082 * s, 0.16 * s, 16);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = register(
    new THREE.Mesh(barrelGeo, bluedBarrel),
    `${sideLabel} .30-Caliber Rifled Barrel`,
    'High-Carbon Blued Steel',
    'Twin forward-firing barrels (acetylene gas simulators on the Goldfinger film car).',
    [sideX * 0.75, 0.2, 1.75]
  );
  barrel.position.set(0, 0.0, 0.11 * s);
  barrelGroup.add(barrel);

  // Flared Muzzle Flash Hider
  const muzzleGeo = new THREE.CylinderGeometry(0.0115 * s, 0.0075 * s, 0.024 * s, 16);
  muzzleGeo.rotateX(Math.PI / 2);
  const muzzle = register(
    new THREE.Mesh(muzzleGeo, chromeMat),
    `${sideLabel} Conical Muzzle Brake`,
    'Heat-Treated Chrome Steel',
    'Flared muzzle tip projecting cleanly ahead of the front wing.',
    [sideX * 0.75, 0.2, 1.95]
  );
  muzzle.position.set(0, 0.0, 0.195 * s);
  barrelGroup.add(muzzle);

  // Muzzle Flash Star & Dynamic PointLight (hidden unless firing)
  const flashGeo = new THREE.ConeGeometry(0.026 * s, 0.11 * s, 8);
  flashGeo.rotateX(Math.PI / 2);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.position.set(0, 0.0, 0.255 * s);
  muzzleFlash.visible = false;
  barrelGroup.add(muzzleFlash);

  const muzzleLight = new THREE.PointLight(0xffaa33, 0, 1.4);
  muzzleLight.position.set(0, 0.0, 0.23 * s);
  barrelGroup.add(muzzleLight);

  return {
    side,
    scaleFactor: s,
    root,
    indicatorFlap,
    gunCarriage,
    barrelGroup,
    muzzleFlash,
    muzzleLight,
    subParts,
  };
}

/**
 * Updates the mechanical animation state of a BrowningGunRig.
 * @param deploy 0 (stowed behind sealed indicator) to 1 (fully extended & armed)
 * @param isFiring whether test-fire recoil & muzzle flash are active
 * @param elapsedSec clock time in seconds for rapid-fire oscillation
 * @param isExploded whether the main Explode slider is active
 */
export function updateBrowningGunRig(
  rig: GunRig,
  deploy: number,
  isFiring: boolean,
  elapsedSec: number,
  isExploded = false
): void {
  const s = rig.scaleFactor;

  // Phase 1 (0.00 -> 0.38): Indicator flap swings 97° downward to fully clear the port first
  const flapProgress = THREE.MathUtils.clamp(deploy / 0.38, 0, 1);
  const smoothFlap = flapProgress * flapProgress * (3 - 2 * flapProgress);
  rig.indicatorFlap.rotation.x = smoothFlap * (Math.PI * 0.54);

  // Keep carriage hidden when fully stowed (deploy <= 0.04) unless exploded
  rig.gunCarriage.visible = deploy > 0.04 || isExploded;

  // Phase 2 (0.40 -> 1.00): Only AFTER the indicator flap is fully open, slide gun carriage forward
  const slideProgress = THREE.MathUtils.clamp((deploy - 0.40) / 0.60, 0, 1);
  const smoothSlide = slideProgress * slideProgress * (3 - 2 * slideProgress);
  rig.gunCarriage.position.z = THREE.MathUtils.lerp(-0.23 * s, 0.02 * s, smoothSlide);

  // Phase 3: Firing recoil + muzzle flash
  if (isFiring && deploy >= 0.85) {
    const pulse = Math.sin(elapsedSec * 55 + (rig.side === 'right' ? 1.4 : 0));
    const flashOn = pulse > 0.25;
    rig.muzzleFlash.visible = flashOn;
    rig.muzzleFlash.scale.set(
      0.8 + Math.random() * 0.5,
      0.8 + Math.random() * 0.5,
      0.7 + Math.random() * 0.7
    );
    rig.muzzleFlash.rotation.z = elapsedSec * 25;
    rig.muzzleLight.intensity = flashOn ? 4.5 : 0.4;
    rig.barrelGroup.position.z = flashOn ? -0.014 : 0;
  } else {
    rig.muzzleFlash.visible = false;
    rig.muzzleLight.intensity = 0;
    rig.barrelGroup.position.z = 0;
  }
}
