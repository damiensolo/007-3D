# 007-3D (1964 Aston Martin DB5 Q-Branch) — 3D Geometry, Shader & Particle Realism Rules

These rules apply unconditionally to all 3D modeling, procedural geometry, GLSL shaders, materials, and particle simulations in this repository. They encode verified spatial coordinates and hard-won visual lessons so context is never lost across long sessions.

---

## 1. GLB Mesh Modification & Mechanical Fitment
1. **Never Delete Triangles from Low/Medium-Poly Exterior Body Panels:**
   - Exterior panels like `SK_Trunk_101` have ~`11cm` triangles (`z ∈ [-1.781, -1.671]`). Deleting triangles to carve openings produces jagged sawtooth edges.
   - Instead, keep the body panel mesh intact, raycast the live surface contour (`y(x)`) at load time, and fit flush beveled bezels/weatherstrip seals (`slotBezel`, `slotWell`) with a deep lower skirt (`-0.16m`) so rising plates (`bulletShield`) never float or expose gaps.
2. **Stowed & Closed Clearance Checks:**
   - Any articulated hinge arm, piston, pump, or feed hose (`leftOilArms`, `oilRackFrame`, `oilPumpCylinder`, `oilHose`) must be checked against the tapered outer fender/body skin in both stowed and deployed states.
   - Hide or scale internal linkage arms (`arm.visible = openFactor > 0.08`) when a lamp or hatch is closed so dark brackets never poke through translucent lenses or body panels.
3. **Hollow Dispensing Pipes & Nozzles:**
   - Dispensing pipes and barrels must be modeled as true hollow geometry (`LatheGeometry` with an inner bore profile or recessed dark bore), never solid rods.
   - Fluid or projectile emission must originate from the exact center of the hollow bore tip, never offset to the middle or side of the pipe.

---

## 2. Dark-Studio Material & GLSL Shader Calibration
The viewport ([src/components/DB5Viewport.tsx](src/components/DB5Viewport.tsx)) uses high-contrast dark studio lighting with `ACESFilmicToneMapping`. Custom shaders and materials must obey these bounds:
1. **No Blown-Out White Hotspots on Dark Dielectrics:**
   - Never add unattenuated pure-white specular highlights (`vec3(1.0) * spec`) or full `1.0` sky Fresnel reflections (`vec3(0.9, 0.94, 1.0) * fresnel`) to dark liquids (oil), rubber, or dark glass.
   - Cap dielectric Fresnel upper range (`F0 + (0.18 - F0) * pow(1.0 - ndotv, 4.0)`) and tint studio reflections/highlights to muted neutral or subtle warm values (`<= 0.25–0.28` max RGB) so surfaces look wet and glossy without white spotting.
2. **Subtle Beer-Lambert Absorption (No Glowing Orange/Red Banding):**
   - For viscous motor oil, keep Beer-Lambert optical depth starting at `>= 0.65` with muted dark-brown transmittance (`vec3(0.22, 0.12, 0.04) * exp(-vec3(3.2, 5.2, 9.5) * depth)`), blended at `0.45–0.55` weight over a deep espresso-black core (`vec3(0.010, 0.008, 0.006)`). Never use high-saturation orange/red that looks self-illuminated.
3. **Cylindrical Normal Correction on Stretched Instances:**
   - When an `InstancedMesh` sphere/capsule is stretched 5–8× along its local flow axis (`Z`), raw sphere normals at the front/back tips point along `±Z` and create repeating bright/colored stripes across overlapping packets.
   - Always attenuate the longitudinal normal component in the vertex shader (`vec3 cylNormal = normalize(vec3(normal.xy, normal.z * 0.14))`) and attenuate tip color by axial position (`1.0 - 0.6 * abs(p.z)`) so overlapping instances blend into one seamless column.

---

## 3. High-Viscosity Fluid & Particle Simulation Rules
1. **No Open Backfaces on Tube Streams:**
   - Never combine `THREE.DoubleSide` with fragment `discard` on a hollow `TubeGeometry` stream—it exposes the hollow interior walls and looks like a torn plastic hose.
2. **Cohesive High-Viscosity Liquid Streams:**
   - Never use sparse spherical droplets (`< 40/sec`) or per-frame random velocity jitter for viscous liquids like oil.
   - Anchor a continuous parabolic core filament (`oilFilamentMesh`, matching gravity `g = 3.8 m/s²`) inside the hollow nozzle bore (`nozzleTipZ + 0.008`).
   - Emit high-density (`120–135 packets/sec`, `spawnInterval = 0.0075s` with a sub-step `while` accumulator loop), velocity-aligned elongated liquid packets (`elongation: 5.2–8.0`, `OIL_COUNT >= 180`) modulated by smooth, time-coherent pressure and sway waves (`sin(time * freq)`) so adjacent packets overlap by `75%+`.
3. **Organic Ground Puddles:**
   - Ground puddles must never be a uniform flat circle. Combine damped creeping metaballs (`36` balls) with FBM domain warping (`fbm(p * 3.8)`), finite-difference meniscus normals for a rounded high-surface-tension edge, a subtle dark wet-ground contact stain ring (`F ∈ [0.86, 1.0]`), and localized impact ripples.

---

## 4. Verified Normalized `db5.glb` World Coordinates
Always reference these measured world coordinates when placing or modifying Q-Branch assemblies:
- **Front Bumper (`SM_Bumper_F_101`):** `x ∈ [-0.814, +0.814]`, `y ∈ [0.357, 0.593]`, `z ∈ [1.957, 2.300]`; over-riders at `x = ±0.30, y = 0.428, z = 2.255`.
- **Rear Bumper (`SM_Bumper_B_101`):** `x ∈ [-0.810, +0.810]`, `y ∈ [0.337, 0.579]`, `z ∈ [-2.300, -1.684]`; over-riders at `x = ±0.34, y = 0.455, z = -2.265`.
- **Rear Trunk Deck (`SK_Trunk_101`):** Raycasted at `z = -1.71` across `x ∈ [-0.48, +0.48]` (`49` points); bullet shield half-width `SHIELD_HALF_W = 0.432` (`0.864m` span covering the rear window).
- **Twin Exhaust Tips (`SK_Exhaust_101`):** `x ∈ [0.342, 0.534]`, `y ∈ [0.285, 0.348]`, `z ∈ [-2.289, -2.201]`.
- **Rear Taillights (`SM_Light_B_101`):**
  - **Left Taillight (`+X`, Oil Slick Dispenser):** `x ∈ [0.590, 0.675]`, top amber indicator `y ∈ [0.740, 0.832]`, `z ∈ [-2.218, -2.167]`, top hinge pivot `(0.6325, 0.828, -2.168)`, hollow nozzle centerline `(0.6325, 0.785, -2.165)`, internal wing pump/hose tucked at `x <= 0.585`.
  - **Right Taillight (`-X`, Caltrop / Nail Dispenser):** `x ∈ [-0.675, -0.590]`, full 3-lamp cluster `y ∈ [0.575, 0.832]`, `z ∈ [-2.218, -2.167]`, bottom hinge pivot `(-0.6325, 0.578, -2.172)`.
- **Roof Panel (`SM_Roof_101_MI_Exhaust_013`) & Passenger Ejector Seat (`SM_Body_101`):**
  - Roof overall bounds: `x ∈ [-0.592, +0.592]`, `y ∈ [1.250, 1.385]`, `z ∈ [-0.667, +0.300]`.
  - Jettisonable passenger roof cutout (aligned to `SM_Roof_101` & `MI_Cabin_Leather_C1` headliner vertex grid, never hinged): `x ∈ [0.002, +0.433]`, `z ∈ [-0.430, +0.040]`, center `(0.2175, 1.372, -0.195)`.
  - Passenger ejector bucket seat & safety harness (`MI_Cabin_Leather_A1`, `MI_Cabin_Belt_A1`, `MI_Cabin1_0` seat rails): `x ∈ [0.055, +0.620]`, `y ∈ [0.290, 0.960]`, `z ∈ [-0.620, +0.285]`, center `(0.34, 0.56, -0.16)`.

---

## 5. Verification Checklist Before Completing Any 3D Edit
1. Run `npm run build` (`tsc -b && vite build`) and confirm exit code `0`.
2. Check both **stowed/closed** and **deployed/active** states (plus **Exploded View** offsets) to ensure zero clipping, zero floating seams, and balanced dark-studio lighting.
