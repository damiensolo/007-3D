---
trigger: always_on
description: Enforces 3D geometry fitment, dark-studio GLSL shader calibration, high-viscosity particle continuity, and verified db5.glb coordinates for the 007-3D Aston Martin DB5 project.
---

# 007-3D — 3D Geometry, Shader & Particle Realism Rules

Follow all rules in [AGENTS.md](../../AGENTS.md) at the root of the workspace:
1. **GLB Mesh Modification & Fitment:** Never delete triangles from low/medium-poly body meshes (`SK_Trunk_101`); raycast live contours (`y(x)`) and use flush beveled bezels with deep skirts. Always verify stowed vs. deployed clearance (`arm.visible = openFactor > 0.08`, internal wing components tucked inward of outer fender skin).
2. **Dark-Studio Shader Calibration:** Never use unattenuated pure-white specular (`vec3(1.0) * spec`) or full `1.0` sky Fresnel on dark dielectrics (oil, rubber, dark glass) under `ACESFilmicToneMapping`. Keep Beer-Lambert oil absorption subtle (`opticalDepth >= 0.65`, dark espresso/warm-brown, never glowing orange) and use cylindrical normal correction (`normal.z * 0.14`) on stretched `InstancedMesh` packets.
3. **Cohesive High-Viscosity Particle Streams:** Anchor a gravity-matched parabolic core filament inside the hollow nozzle bore and emit `120+/sec` velocity-aligned, `75%+` overlapping elongated packets using smooth time-coherent waves rather than random velocity scatter.
4. **Build & Visual Verification:** Always verify `npm run build` passes with exit code `0` after any geometry or shader edit.
