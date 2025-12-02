// Vehicle Type Configurations
// Defines tire grid layouts for different vehicle types

export const VEHICLE_TYPES = {
  CAR: 'car',
  TRUCK_2AXLE: 'truck_2axle',
  TRUCK_3AXLE: 'truck_3axle',
  TRACTOR: 'tractor',
  TRAILER_2AXLE: 'trailer_2axle',
  TRAILER_3AXLE: 'trailer_3axle',
};

// Tire position grid definitions
// Format: { type: 'steer' | 'drive' | 'differential' | 'single', position: [row, col], label: 'Display Label' }
export const VEHICLE_CONFIGS = {
  [VEHICLE_TYPES.CAR]: {
    name: 'Car',
    rows: 2,
    cols: 2,
    tires: [
      { id: 'FL', type: 'steer', position: [0, 0], label: 'Front Left', axle: 'front' },
      { id: 'FR', type: 'steer', position: [0, 1], label: 'Front Right', axle: 'front' },
      { id: 'RL', type: 'drive', position: [1, 0], label: 'Rear Left', axle: 'rear' },
      { id: 'RR', type: 'drive', position: [1, 1], label: 'Rear Right', axle: 'rear' },
    ],
  },

  [VEHICLE_TYPES.TRUCK_2AXLE]: {
    name: 'Truck (2-Axle)',
    rows: 2,
    cols: 2,
    tires: [
      { id: 'FL', type: 'steer', position: [0, 0], label: 'Front Left', axle: 'steer' },
      { id: 'FR', type: 'steer', position: [0, 1], label: 'Front Right', axle: 'steer' },
      { id: 'RL', type: 'drive', position: [1, 0], label: 'Rear Left', axle: 'drive' },
      { id: 'RR', type: 'drive', position: [1, 1], label: 'Rear Right', axle: 'drive' },
    ],
  },

  [VEHICLE_TYPES.TRUCK_3AXLE]: {
    name: 'Truck (3-Axle)',
    rows: 3,
    cols: 2,
    tires: [
      { id: 'FL', type: 'steer', position: [0, 0], label: 'Steer Left', axle: 'steer' },
      { id: 'FR', type: 'steer', position: [0, 1], label: 'Steer Right', axle: 'steer' },
      { id: 'DL', type: 'drive', position: [1, 0], label: 'Drive Left', axle: 'drive' },
      { id: 'DR', type: 'drive', position: [1, 1], label: 'Drive Right', axle: 'drive' },
      { id: 'TL', type: 'differential', position: [2, 0], label: 'Tradem Left', axle: 'trdem' },
      { id: 'TR', type: 'differential', position: [2, 1], label: 'Tradem Right', axle: 'trdem' },
    ],
  },

  [VEHICLE_TYPES.TRACTOR]: {
    name: 'Tractor',
    rows: 2,
    cols: 2,
    tires: [
      { id: 'FL', type: 'steer', position: [0, 0], label: 'Front Left', axle: 'front' },
      { id: 'FR', type: 'steer', position: [0, 1], label: 'Front Right', axle: 'front' },
      { id: 'DL', type: 'drive', position: [1, 0], label: 'Drive Left', axle: 'drive' },
      { id: 'DR', type: 'drive', position: [1, 1], label: 'Drive Right', axle: 'drive' },
    ],
  },

  [VEHICLE_TYPES.TRAILER_2AXLE]: {
    name: 'Trailer (2-Axle)',
    rows: 2,
    cols: 1,
    tires: [
      { id: 'TL', type: 'single', position: [0, 0], label: 'Trailer Left', axle: 'axle1' },
      { id: 'TR', type: 'single', position: [1, 0], label: 'Trailer Right', axle: 'axle2' },
    ],
  },

  [VEHICLE_TYPES.TRAILER_3AXLE]: {
    name: 'Trailer (3-Axle)',
    rows: 3,
    cols: 2,
    tires: [
      { id: 'T1L', type: 'single', position: [0, 0], label: 'Axle 1 Left', axle: 'axle1' },
      { id: 'T1R', type: 'single', position: [0, 1], label: 'Axle 1 Right', axle: 'axle1' },
      { id: 'T2L', type: 'single', position: [1, 0], label: 'Axle 2 Left', axle: 'axle2' },
      { id: 'T2R', type: 'single', position: [1, 1], label: 'Axle 2 Right', axle: 'axle2' },
      { id: 'T3L', type: 'single', position: [2, 0], label: 'Axle 3 Left', axle: 'axle3' },
      { id: 'T3R', type: 'single', position: [2, 1], label: 'Axle 3 Right', axle: 'axle3' },
    ],
  },
};

// Compose vehicle with optional trailer
export const composeVehicleWithTrailer = (vehicleType, trailerType = null) => {
  const vehicle = VEHICLE_CONFIGS[vehicleType];
  if (!trailerType) return vehicle;

  const trailer = VEHICLE_CONFIGS[trailerType];
  // Rename trailer tire IDs to avoid conflicts
  const trailerTires = trailer.tires.map(tire => ({
    ...tire,
    id: `TR_${tire.id}`,
    isTrailer: true,
  }));

  return {
    name: `${vehicle.name} + ${trailer.name}`,
    vehicle: vehicle,
    trailer: trailer,
    allTires: [...vehicle.tires, ...trailerTires],
  };
};

// Compose vehicle with up to two trailers and produce ordered, numbered positions
export const composeVehicleWithTrailers = (vehicleType, trailer1Type = null, trailer2Type = null) => {
  const vehicle = VEHICLE_CONFIGS[vehicleType];
  if (!vehicle) return null;

  // helper to clone trailer tires with prefix
  const expandTrailer = (trailerType, prefix) => {
    if (!trailerType) return [];
    const t = VEHICLE_CONFIGS[trailerType];
    if (!t) return [];
    return t.tires.map(tire => ({ ...tire, id: `${prefix}_${tire.id}`, isTrailer: true, trailerType }));
  };

  const trailer1 = expandTrailer(trailer1Type, 'T1');
  const trailer2 = expandTrailer(trailer2Type, 'T2');

  // ordering: vehicle tires ordered by row (front->back) then col (left->right)
  const sortByPosition = (a, b) => {
    const ra = (a.position && a.position[0]) || 0;
    const rb = (b.position && b.position[0]) || 0;
    if (ra !== rb) return ra - rb;
    const ca = (a.position && a.position[1]) || 0;
    const cb = (b.position && b.position[1]) || 0;
    return ca - cb;
  };

  const vehicleTires = [...vehicle.tires].sort(sortByPosition);

  // expand dual tyres: if tire.dual === true, create two entries (left-inner/left-outer) per side
  const expandDuals = (tires) => {
    const out = [];
    tires.forEach(t => {
      if (t.dual) {
        // create two distinct items
        out.push({ ...t, id: `${t.id}_A` });
        out.push({ ...t, id: `${t.id}_B` });
      } else {
        out.push(t);
      }
    });
    return out;
  };

  const combined = [...expandDuals(vehicleTires), ...expandDuals(trailer1), ...expandDuals(trailer2)];

  // Assign sequential position numbers starting from 1 (left front, across axle, toward back)
  const allTires = combined.map((tire, idx) => ({ ...tire, posNumber: idx + 1 }));

  return {
    name: `${vehicle.name}${trailer1.length ? ` + ${VEHICLE_CONFIGS[trailer1Type]?.name || trailer1Type}` : ''}${trailer2.length ? ` + ${VEHICLE_CONFIGS[trailer2Type]?.name || trailer2Type}` : ''}`,
    vehicle: vehicle,
    trailers: [trailer1, trailer2],
    allTires,
  };
};

// Get inspection fields for a specific tire
export const getTireInspectionFields = (tireType) => {
  const baseFields = [
    { name: 'treadDepth', label: 'Tread Depth (mm)', type: 'number', step: '0.1', required: true },
    { name: 'pressure', label: 'Pressure (bar)', type: 'number', step: '0.1', required: true },
    { name: 'damage', label: 'Visible Damage', type: 'text', required: false },
    { name: 'condition', label: 'Condition', type: 'select', options: ['Good', 'Fair', 'Poor', 'Critical'], required: false },
  ];
  return baseFields;
};
