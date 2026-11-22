export type SubsystemId =
  | 'body'
  | 'doors'
  | 'hood_trunk'
  | 'powertrain'
  | 'wheels_brakes'
  | 'bumpers_lights'
  | 'cabin'
  | 'qbranch_weapons';

export interface SubsystemMeta {
  id: SubsystemId;
  name: string;
  shortName: string;
  color: string;
  description: string;
}

export const SUBSYSTEMS: SubsystemMeta[] = [
  {
    id: 'body',
    name: 'Bodywork & Coachwork',
    shortName: 'Body',
    color: '#94a3b8',
    description: 'Carrozzeria Touring Superleggera aluminum body shell, roof panel, and wing mirrors.',
  },
  {
    id: 'doors',
    name: 'Doors & Glazing',
    shortName: 'Doors',
    color: '#38bdf8',
    description: 'Left and right hinged doors, quarterlights, chrome window frames, and interior door cards.',
  },
  {
    id: 'hood_trunk',
    name: 'Bonnet & Boot',
    shortName: 'Bonnet / Boot',
    color: '#f59e0b',
    description: 'Front aluminum bonnet, rear luggage boot lid, and Aston Martin Vantage badging.',
  },
  {
    id: 'powertrain',
    name: 'Engine & Exhaust',
    shortName: 'Powertrain',
    color: '#ef4444',
    description: '4.0L DOHC inline-six engine (314 bhp Vantage spec), heat shielding, and twin exhaust.',
  },
  {
    id: 'wheels_brakes',
    name: 'Wheels & Braking',
    shortName: 'Wheels',
    color: '#10b981',
    description: '15-inch knock-off wire-spoke wheels, classic radial tyres, Girling discs, and calipers.',
  },
  {
    id: 'bumpers_lights',
    name: 'Bumpers & Lighting',
    shortName: 'Bumpers',
    color: '#a855f7',
    description: 'Chrome bumpers with over-riders, Lucas faired-in headlamps, and rear light clusters.',
  },
  {
    id: 'cabin',
    name: 'Cabin & Instruments',
    shortName: 'Cabin',
    color: '#eab308',
    description: 'Connolly leather upholstery, walnut trim, Smiths instrument fascia, and carpeting.',
  },
  {
    id: 'qbranch_weapons',
    name: 'Q-Branch Wing Guns',
    shortName: 'Wing Guns',
    color: '#f97316',
    description: 'Twin Browning M1919 .30-caliber machine guns concealed behind hinged Lucas front indicators.',
  },
];

export const SUBSYSTEM_MAP: Record<SubsystemId, SubsystemMeta> = SUBSYSTEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<SubsystemId, SubsystemMeta>
);

export interface PresetConfig {
  id: string;
  label: string;
  description: string;
  explode: number;
  visibleSubsystems: SubsystemId[];
  qBranchHighlight?: boolean;
  cameraPosition?: [number, number, number];
}

export const PRESETS: PresetConfig[] = [
  {
    id: 'assembled',
    label: 'Full Vehicle',
    description: 'Assembled 1964 Aston Martin DB5 Vantage',
    explode: 0,
    visibleSubsystems: ['body', 'doors', 'hood_trunk', 'powertrain', 'wheels_brakes', 'bumpers_lights', 'cabin', 'qbranch_weapons'],
    cameraPosition: [4.2, 2.0, 4.6],
  },
  {
    id: 'exploded',
    label: 'Exploded View',
    description: 'Full 3D exploded component inventory',
    explode: 0.72,
    visibleSubsystems: ['body', 'doors', 'hood_trunk', 'powertrain', 'wheels_brakes', 'bumpers_lights', 'cabin', 'qbranch_weapons'],
    cameraPosition: [5.4, 2.9, 5.8],
  },
  {
    id: 'wing_guns',
    label: 'Wing Guns',
    description: 'Zoom into the front-wing Browning .30-caliber machine guns',
    explode: 0,
    visibleSubsystems: ['body', 'doors', 'hood_trunk', 'powertrain', 'wheels_brakes', 'bumpers_lights', 'cabin', 'qbranch_weapons'],
    cameraPosition: [1.55, 0.85, 3.25],
  },
  {
    id: 'powertrain',
    label: 'Engine & Bay',
    description: 'Isolate 4.0L inline-six, exhaust, and bonnet',
    explode: 0.38,
    visibleSubsystems: ['powertrain', 'hood_trunk'],
    cameraPosition: [3.2, 2.1, 3.6],
  },
  {
    id: 'wheels_brakes',
    label: 'Wheels & Brakes',
    description: 'Exploded tyres, wire-spoke rims, discs, and calipers',
    explode: 0.45,
    visibleSubsystems: ['wheels_brakes'],
    cameraPosition: [4.0, 1.4, 4.0],
  },
  {
    id: 'cabin',
    label: 'Cabin & Trim',
    description: 'Interior leather, dashboard, and door panels',
    explode: 0.3,
    visibleSubsystems: ['cabin', 'doors'],
    cameraPosition: [3.3, 2.2, 3.1],
  },
  {
    id: 'qbranch',
    label: '007 Q-Branch',
    description: 'Highlight Goldfinger / Skyfall Q-Branch modifications',
    explode: 0.42,
    visibleSubsystems: ['body', 'doors', 'hood_trunk', 'powertrain', 'wheels_brakes', 'bumpers_lights', 'cabin', 'qbranch_weapons'],
    qBranchHighlight: true,
    cameraPosition: [4.8, 2.4, 5.1],
  },
];

export interface PartClassification {
  subsystem: SubsystemId;
  label: string;
  materialLabel: string;
  qBranchNote?: string;
  isQBranch?: boolean;
  /** Semantic directional bias in normalized car space (X=right, Y=up, Z=front) */
  semanticDir: [number, number, number];
}

function cleanMaterialLabel(matName: string): string {
  const m = matName.toLowerCase();
  if (m.includes('leather')) return 'Connolly Leather';
  if (m.includes('wood')) return 'Veneer / Wood Trim';
  if (m.includes('carpet')) return 'Wilton Wool Carpet';
  if (m.includes('dashboard')) return 'Instrument Fascia';
  if (m.includes('belt')) return 'Safety Harness';
  if (m.includes('glass')) return 'Triplex Laminated Glass';
  if (m.includes('mirror')) return 'Silvered Mirror';
  if (m.includes('tyre')) return 'Pirelli Cinturato Rubber';
  if (m.includes('rim')) return 'Chrome Wire-Spoke Rim';
  if (m.includes('brake')) return 'Girling Brake Assembly';
  if (m.includes('tinfoil')) return 'Thermal Foil Shield';
  if (m.includes('engine')) return 'Cast Alloy & Steel';
  if (m.includes('exhaust')) return 'Chrome / Brightwork';
  if (m.includes('light')) return 'Lucas Lamp Assembly';
  if (m.includes('logo')) return 'Enamel & Chrome Badge';
  if (m.includes('1330010001')) return 'Silver Birch Coachwork';
  if (m.includes('cabin')) return 'Interior Trim';
  return 'Automotive Component';
}

export function classifyMesh(meshName: string, materialName: string): PartClassification {
  const n = meshName.toLowerCase();
  const m = materialName.toLowerCase();
  const materialLabel = cleanMaterialLabel(materialName);

  // 1. Wheels, Tyres, Discs & Calipers
  if (
    n.includes('wheel') ||
    n.includes('disc') ||
    n.includes('caliper') ||
    n.includes('brake')
  ) {
    const isLeft = n.includes('_fl') || n.includes('_bl');
    const isFront = n.includes('_fl') || n.includes('_fr');
    const sideX = isLeft ? -1 : 1;
    const endZ = isFront ? 0.25 : -0.25;

    let partType = 'Wheel Assembly';
    let extraX = 1.0;
    if (m.includes('tyre')) {
      partType = 'Classic Radial Tyre';
      extraX = 1.45;
    } else if (m.includes('rim')) {
      partType = 'Wire-Spoke Rim';
      extraX = 1.1;
    } else if (n.includes('caliper')) {
      partType = 'Brake Caliper';
      extraX = 0.55;
    } else if (m.includes('brake') || n.includes('brake')) {
      partType = 'Girling Brake Disc';
      extraX = 0.78;
    }

    const corner =
      n.includes('_fl')
        ? 'Front Left'
        : n.includes('_fr')
          ? 'Front Right'
          : n.includes('_bl')
            ? 'Rear Left'
            : n.includes('_br')
              ? 'Rear Right'
              : 'Chassis';

    return {
      subsystem: 'wheels_brakes',
      label: `${corner} ${partType}`,
      materialLabel,
      isQBranch: m.includes('rim'),
      qBranchNote: m.includes('rim')
        ? 'Center-lock knock-off hub houses retractable Q-Branch tyre slashers (Goldfinger, 1964).'
        : undefined,
      semanticDir: [sideX * extraX, -0.08, endZ],
    };
  }

  // 2. Doors & Door Components
  if (n.includes('door_fl') || n.includes('door_fr')) {
    const isLeft = n.includes('door_fl');
    const side = isLeft ? 'Left' : 'Right';
    const dirX = isLeft ? -1.35 : 1.35;

    let detail = 'Door Shell';
    let offset = 0;
    if (m.includes('glass')) {
      detail = 'Door Window Glass';
      offset = 0.25;
    } else if (m.includes('leather')) {
      detail = 'Door Leather Card';
      offset = -0.22;
    } else if (m.includes('cabin')) {
      detail = 'Door Interior Panel';
      offset = -0.15;
    } else if (m.includes('exhaust')) {
      detail = 'Door Chrome Trim & Handle';
      offset = 0.15;
    }

    return {
      subsystem: 'doors',
      label: `${side} ${detail}`,
      materialLabel,
      semanticDir: [dirX + (isLeft ? -offset : offset), 0.12, 0.05],
    };
  }

  // 3. Hood & Trunk
  if (n.includes('hood')) {
    const detail = m.includes('engine')
      ? 'Bonnet Under-Frame'
      : m.includes('exhaust')
        ? 'Bonnet Chrome Scoop & Latch'
        : 'Aluminum Bonnet (Hood)';
    return {
      subsystem: 'hood_trunk',
      label: detail,
      materialLabel,
      semanticDir: [0, 0.95, 0.85],
    };
  }

  if (n.includes('trunk')) {
    const detail = m.includes('logo')
      ? 'Rear Aston Martin Badge'
      : m.includes('light')
        ? 'Boot Plate Lamp'
        : m.includes('engine')
          ? 'Boot Inner Liner'
          : m.includes('exhaust')
            ? 'Boot Chrome Handle'
            : 'Rear Boot Lid (Trunk)';
    return {
      subsystem: 'hood_trunk',
      label: detail,
      materialLabel,
      isQBranch: !m.includes('engine'),
      qBranchNote:
        'Rear boot compartment houses the hydraulic bulletproof shield & smoke-screen / oil-slick dispensers.',
      semanticDir: [0, 0.85, -0.95],
    };
  }

  // 4. Engine & Exhaust (use specific node prefixes so Unreal material slot names like MI_Exhaust_006 don't false-match)
  if (n.includes('sm_engine') || n.includes('sk_exhaust')) {
    if (n.includes('sk_exhaust')) {
      return {
        subsystem: 'powertrain',
        label: 'Twin Exhaust System',
        materialLabel,
        semanticDir: [0, -0.65, -0.35],
      };
    }
    const detail = m.includes('tinfoil')
      ? 'Engine Bay Heat Shield'
      : m.includes('engine_a1')
        ? '4.0L DOHC Cylinder Head & Cam Cover'
        : m.includes('1330010001')
          ? 'Engine Bay Frame'
          : '4.0L Inline-6 Engine Block';
    return {
      subsystem: 'powertrain',
      label: detail,
      materialLabel,
      semanticDir: [0, 0.72, 0.48],
    };
  }

  // 5. Bumpers & Lighting
  if (n.includes('bumper_f')) {
    return {
      subsystem: 'bumpers_lights',
      label: 'Front Chrome Bumper & Over-Riders',
      materialLabel,
      isQBranch: true,
      qBranchNote:
        'Hydraulic ramming bumper & revolving 3-way license plate mount (BMT 216A / 4711-EA-62 / LU 6789).',
      semanticDir: [0, -0.08, 1.35],
    };
  }

  if (n.includes('bumper_b')) {
    return {
      subsystem: 'bumpers_lights',
      label: m.includes('light') ? 'Rear Plate Illumination' : 'Rear Chrome Bumper & Over-Riders',
      materialLabel,
      isQBranch: true,
      qBranchNote: 'Rear revolving license plate & oil/nail dispenser ports.',
      semanticDir: [0, -0.08, -1.35],
    };
  }

  if (n.includes('light_f')) {
    return {
      subsystem: 'bumpers_lights',
      label: m.includes('glass')
        ? 'Front Headlamp Cowls'
        : m.includes('exhaust')
          ? 'Headlamp Chrome Bezels'
          : 'Lucas Front Headlamp Cluster',
      materialLabel,
      isQBranch: true,
      qBranchNote:
        'Faired-in Lucas headlamps conceal twin retractable .30-caliber Browning machine guns behind the indicators.',
      semanticDir: [0, 0.1, 1.15],
    };
  }

  if (n.includes('light_b')) {
    return {
      subsystem: 'bumpers_lights',
      label: m.includes('glass')
        ? 'Rear Tail Lamp Lenses'
        : m.includes('exhaust')
          ? 'Tail Lamp Chrome Housings'
          : 'Rear Tail Light Cluster',
      materialLabel,
      semanticDir: [0, 0.1, -1.15],
    };
  }

  // 6. Roof & Side Mirrors
  if (n.includes('roof')) {
    return {
      subsystem: 'body',
      label: m.includes('glass')
        ? 'Rear Windscreen Glass'
        : m.includes('logo')
          ? 'Roof Emblem'
          : m.includes('light')
            ? 'Cabin Dome Light'
            : 'Roof Panel & Pillars',
      materialLabel,
      isQBranch: !m.includes('glass') && !m.includes('light'),
      qBranchNote:
        'Passenger-side roof section ejects cleanly when the red gear-knob ejector seat switch is triggered.',
      semanticDir: [0, 1.15, -0.05],
    };
  }

  if (n.includes('sidemirror_l')) {
    return {
      subsystem: 'body',
      label: m.includes('mirror') ? 'Left Mirror Glass' : 'Left Wing Mirror Housing',
      materialLabel,
      semanticDir: [-1.1, 0.35, 0.25],
    };
  }

  if (n.includes('sidemirror_r')) {
    return {
      subsystem: 'body',
      label: m.includes('mirror') ? 'Right Mirror Glass' : 'Right Wing Mirror Housing',
      materialLabel,
      semanticDir: [1.1, 0.35, 0.25],
    };
  }

  // 7. Cabin / Interior materials (inside SM_Body or SK_Body_Bones)
  if (
    m.includes('cabin') ||
    m.includes('dashboard') ||
    m.includes('leather') ||
    m.includes('wood') ||
    m.includes('carpet') ||
    m.includes('belt') ||
    m.includes('mirror')
  ) {
    let label = 'Cabin Trim';
    let dirY = 0.35;
    if (m.includes('dashboard')) {
      label = 'Smiths Instrument Dashboard';
      dirY = 0.52;
    } else if (m.includes('wood')) {
      label = 'Walnut & Gear Console Trim';
      dirY = 0.45;
    } else if (m.includes('leather_a')) {
      label = 'Front Bucket Seats (Connolly Leather)';
      dirY = 0.58;
    } else if (m.includes('leather_b') || m.includes('leather_c') || m.includes('leather_d')) {
      label = 'Rear Bench & Bolsters';
      dirY = 0.48;
    } else if (m.includes('carpet')) {
      label = 'Cabin Wilton Carpeting';
      dirY = 0.18;
    } else if (m.includes('belt')) {
      label = 'Safety Harnesses';
      dirY = 0.62;
    } else if (m.includes('plastics')) {
      label = 'Steering Wheel & Switchgear';
      dirY = 0.55;
    }

    return {
      subsystem: 'cabin',
      label,
      materialLabel,
      isQBranch: m.includes('dashboard') || m.includes('wood') || m.includes('leather_a'),
      qBranchNote:
        m.includes('dashboard')
          ? 'Features concealed radar homing tracker screen & armrest gadget control panel.'
          : m.includes('leather_a')
            ? 'Passenger seat fitted with Martin-Baker Q-Branch ejector mechanism.'
            : m.includes('wood')
              ? 'Center console houses the flip-top gear knob ejector trigger.'
              : undefined,
      semanticDir: [0, dirY, 0],
    };
  }

  // 8. Glass on Main Body
  if (m.includes('glass')) {
    return {
      subsystem: 'doors',
      label: 'Front Windscreen & Quarter Glass',
      materialLabel,
      semanticDir: [0, 0.75, 0.35],
    };
  }

  // 9. Remaining Body Shell / Engine Bay Carpet / Chrome
  if (m.includes('engine')) {
    return {
      subsystem: 'powertrain',
      label: 'Engine Bay Bulkhead & Liner',
      materialLabel,
      semanticDir: [0, 0.25, 0.45],
    };
  }

  return {
    subsystem: 'body',
    label: m.includes('exhaust') ? 'Body Chrome Brightwork & Grille' : 'Superleggera Main Body Shell',
    materialLabel,
    semanticDir: [0, 0.05, 0],
  };
}
