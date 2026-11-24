import { Component, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, RoundedBox } from '@react-three/drei';

class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[460px] rounded-2xl border border-slate-200 bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <p className="font-bold text-base">3D WebGL context is unavailable on this device.</p>
          <p className="text-xs text-slate-400 mt-1">Switch to the 2D Layout toggle above to select seats.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const SEAT_COLORS = {
  available: '#16A34A',
  booked: '#DC2626',
  selected: '#2563EB',
  unavailable: '#64748B',
};

function SeatMesh({ seat, isSelected, currentUserId, onToggleSeat, position }) {
  const [hovered, setHovered] = useState(false);

  const isLockedByMe = seat.status === 'locked' && seat.lockedBy === currentUserId;
  const isLockedByOther = seat.status === 'locked' && seat.lockedBy !== currentUserId;

  let visualState = 'available';
  if (seat.status === 'unavailable') visualState = 'unavailable';
  else if (seat.status === 'booked' || isLockedByOther) visualState = 'booked';
  else if (isSelected || isLockedByMe) visualState = 'selected';

  const color = SEAT_COLORS[visualState];
  const isClickable = visualState === 'available' || visualState === 'selected';
  const isSleeper = seat.seatType === 'sleeper';

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (isClickable) onToggleSeat(seat);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = isClickable ? 'pointer' : 'not-allowed';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {isSleeper ? (
        <group>
          <RoundedBox args={[0.72, 0.16, 1.35]} radius={0.04} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color={color} emissive={hovered && isClickable ? color : '#000000'} emissiveIntensity={0.25} />
          </RoundedBox>
          <RoundedBox args={[0.56, 0.1, 0.28]} radius={0.03} position={[0, 0.11, -0.45]}>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
        </group>
      ) : (
        <group>
          <RoundedBox args={[0.58, 0.14, 0.56]} radius={0.04} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color={color} emissive={hovered && isClickable ? color : '#000000'} emissiveIntensity={0.25} />
          </RoundedBox>
          <RoundedBox args={[0.56, 0.62, 0.12]} radius={0.04} position={[0, 0.34, 0.22]} castShadow>
            <meshStandardMaterial color={color} emissive={hovered && isClickable ? color : '#000000'} emissiveIntensity={0.2} />
          </RoundedBox>
        </group>
      )}

      {hovered && (
        <Html distanceFactor={8} position={[0, isSleeper ? 0.45 : 0.9, 0]} center>
          <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
            <div className="font-bold">Seat {seat.seatNumber}</div>
            <div className="text-slate-300 capitalize">
              {seat.deck} deck • {seat.seatType} • ₹{seat.price}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function BusCabin({ maxRow, hasUpperDeck }) {
  const busLength = Math.max(10, maxRow * 1.45 + 3);
  const centerZ = (maxRow * 1.35) / 2 - 1;

  return (
    <group>
      <mesh position={[0, -0.15, centerZ]} receiveShadow>
        <boxGeometry args={[3.8, 0.15, busLength]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[-0.25, -0.07, centerZ]} receiveShadow>
        <boxGeometry args={[0.65, 0.02, busLength - 1.5]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[-1.9, 0.8, centerZ]}>
        <boxGeometry args={[0.06, 1.8, busLength]} />
        <meshStandardMaterial color="#94A3B8" transparent opacity={0.22} />
      </mesh>
      <mesh position={[1.9, 0.8, centerZ]}>
        <boxGeometry args={[0.06, 1.8, busLength]} />
        <meshStandardMaterial color="#94A3B8" transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, 0.9, -2.2]}>
        <boxGeometry args={[3.8, 1.9, 0.08]} />
        <meshStandardMaterial color="#38BDF8" transparent opacity={0.18} />
      </mesh>
      <group position={[-1.2, 0.2, -1.5]}>
        <RoundedBox args={[0.65, 0.6, 0.6]} radius={0.05}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        <mesh position={[0, 0.55, -0.35]} rotation={[0.5, 0, 0]}>
          <torusGeometry args={[0.24, 0.04, 12, 24]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
      </group>
      {hasUpperDeck && (
        <mesh position={[0, 1.32, centerZ + 0.3]}>
          <boxGeometry args={[3.65, 0.06, busLength - 1.8]} />
          <meshStandardMaterial color="#1E293B" transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}

export default function BusSeat3DCanvas({
  seats = [],
  selectedSeatIds = [],
  currentUserId,
  onToggleSeat,
  activeDeck = 'all',
}) {
  const visibleSeats = useMemo(() => {
    if (activeDeck === 'all') return seats;
    return seats.filter((s) => s.deck === activeDeck);
  }, [seats, activeDeck]);

  const maxRow = useMemo(() => {
    return seats.reduce((max, s) => Math.max(max, s.row || 1), 6);
  }, [seats]);

  const hasUpperDeck = useMemo(() => seats.some((s) => s.deck === 'upper'), [seats]);

  const getSeatPosition = (seat) => {
    const isSleeper = seat.seatType === 'sleeper';
    const zSpacing = isSleeper ? 1.55 : 1.15;
    const z = (seat.row - 1) * zSpacing;
    const y = seat.deck === 'upper' ? 1.5 : 0.12;

    let x = 0;
    if (isSleeper) {
      if (seat.col === 1) x = -1.35;
      else if (seat.col === 2) x = 0.45;
      else x = 1.35;
    } else {
      if (seat.col === 1) x = -1.45;
      else if (seat.col === 2) x = -0.8;
      else if (seat.col === 3) x = 0.65;
      else x = 1.35;
    }

    return [x, y, z];
  };

  return (
    <WebGLErrorBoundary>
      <div className="w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-900 to-slate-800 relative">
        <div className="absolute top-3 left-3 z-10 bg-slate-950/75 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur">
          Drag to rotate • Scroll to zoom • Click any green seat to select
        </div>

        <Canvas shadows camera={{ position: [5.5, 5.2, -3.5], fov: 48 }}>
          <ambientLight intensity={0.65} />
          <directionalLight position={[6, 10, 4]} intensity={1.1} castShadow />
          <pointLight position={[0, 4, 4]} intensity={0.5} />

          <BusCabin maxRow={maxRow} hasUpperDeck={hasUpperDeck} />

          {visibleSeats.map((seat) => (
            <SeatMesh
              key={seat._id}
              seat={seat}
              isSelected={selectedSeatIds.includes(seat._id)}
              currentUserId={currentUserId}
              onToggleSeat={onToggleSeat}
              position={getSeatPosition(seat)}
            />
          ))}

          <OrbitControls
            enablePan
            enableZoom
            minDistance={3}
            maxDistance={18}
            target={[0, 0.7, (maxRow * 1.15) / 2]}
          />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
