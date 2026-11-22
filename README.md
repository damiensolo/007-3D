# 007-3D — Aston Martin DB5 Vantage Interactive Explorer

Browser-based interactive 3D explorer for the **1964 Aston Martin DB5 Vantage** in **Silver Birch** metallic clearcoat, featuring an exploded-view blueprint mode, subsystem layer toggles, and mechanically animated **Q-Branch Front-Wing Browning M1919 .30-caliber machine guns**.

## Features
- **3D Studio Viewport (Three.js)**: Custom neutral automotive softbox studio lighting, `MeshPhysicalMaterial` Silver Birch clearcoat, `ACESFilmicToneMapping`, and `OrbitControls`.
- **Exploded View & Subsystem Layers**: Smooth directional separation across 8 subsystems (`Bodywork & Coachwork`, `Doors & Glazing`, `Bonnet & Boot`, `Engine & Exhaust`, `Wheels & Braking`, `Bumpers & Lighting`, `Cabin & Instruments`, and `Q-Branch Wing Guns`).
- **Q-Branch Wing Guns**: Carved circular front-wing gun ports with machined steel collars, hinged Lucas indicator flaps (`0%`–`38%`), sliding Browning M1919 carriages (`40%`–`100%`), and simulated firing recoil/muzzle flash.
- **Component Inspector**: Click or search `114` meshes to inspect material specs, triangle counts, 007 Q-Branch notes, isolate parts, or focus the camera.
- **Background Soundtrack**: Auto-looping theme audio with Play/Pause, Mute/Unmute, and Volume controls.

## Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
```
