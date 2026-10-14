/**
 * La isla flotante: terreno, base de tierra/roca, riachuelo, nubes,
 * partículas mágicas, ranuras de colocación e interacción por clic.
 */
import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import { cachedBlob, CloudPuff, ItemModel } from './parts';
import { itemById } from '../../data/catalog';
import { ISLAND_SLOTS, useWorld } from '../../state/worldStore';

// ── Miniatura 3D reutilizable (colección, biomas) ────────────────────
export function ItemThumbnail({ itemId, size = 96 }: { itemId: string; size?: number }) {
  const item = itemById(itemId);
  if (!item) return null;
  return (
    <div style={{ width: size, height: size }} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [3.2, 2.6, 3.2], fov: 34 }}
        style={{ width: size, height: size }}
      >
        <ambientLight intensity={0.85} color="#FFF4E0" />
        <directionalLight position={[3, 5, 2]} intensity={1.2} color="#FFF0D8" />
        <hemisphereLight args={['#CDEAF7', '#DCEBCB', 0.5]} />
        <group position={[0, -0.6, 0]}>
          <ItemModel kind={item.kind} itemId={item.id} color={item.color} accent={item.accent} />
        </group>
      </Canvas>
    </div>
  );
}

// ── Posiciones de las ranuras sobre la isla (distribución orgánica) ──
const LAYOUT: [number, number][] = [
  [-1.7, -0.9], // 0 árbol principal
  [1.6, -1.3],  // 1 casita
  [-2.6, 0.9],  // 2
  [0.2, 1.8],   // 3 sendero
  [-0.8, -2.2], // 4 flores
  [2.5, 0.6],   // 5
  [-2.9, -1.6], // 6
  [0.9, -0.4],  // 7 roca inicial
  [2.9, -0.4],  // 8
  [-0.2, -1.2], // 9 flores
  [-2.1, 2.0],  // 10
  [1.9, 1.7],   // 11 arbustos
  [-1.2, 0.7],  // 12 mariposas
  [0.6, 2.6],   // 13
  [-2.8, 0.0],  // 14
  [2.2, -2.1],  // 15
  [-1.6, -2.9], // 16
  [1.2, 0.9],   // 17
  [-0.6, 2.9],  // 18
  [2.8, 1.6],   // 19
  [0.0, 0.2],   // 20 centro mágico
  [-2.4, -2.6], // 21
  [2.6, 2.4],   // 22
  [-0.9, 1.6],  // 23
  [1.5, -2.7],  // 24
  [-2.2, -0.2], // 25
];

export function groundHeight(x: number, z: number): number {
  return Math.sin(x * 0.9) * 0.06 + Math.cos(z * 0.8) * 0.05;
}

export function slotPosition(slot: number): [number, number, number] {
  const [x, z] = LAYOUT[slot % LAYOUT.length];
  return [x, groundHeight(x, z), z];
}

function groundY(slot: number): number {
  const [, y] = slotPosition(slot);
  return y + 0.32;
}

// ── Terreno de la isla ───────────────────────────────────────────────
function IslandTerrain({ ground }: { ground: string }) {
  const grassGeo = useMemo(() => {
    const R = 3.4;
    const g = new THREE.CylinderGeometry(R, R * 0.98, 0.5, 24, 4);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.y > 0.2) {
        v.y += Math.sin(v.x * 1.1) * 0.07 + Math.cos(v.z * 1.3) * 0.06;
        const r = Math.hypot(v.x, v.z);
        if (r > 0.1) {
          const wob = 1 + Math.sin(Math.atan2(v.z, v.x) * 3 + 1.2) * 0.035;
          v.x *= wob; v.z *= wob;
        }
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const dirtGeo = useMemo(() => {
    const R = 3.4;
    const g = new THREE.ConeGeometry(R * 0.97, 2.6, 18, 3);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const ang = Math.atan2(v.z, v.x);
      const wob = 1 + Math.sin(ang * 3 + 2) * 0.06;
      v.x *= wob; v.z *= wob;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const rockTip = useMemo(() => cachedBlob('island-tip', 0.55, 1, 4.4, 1.4), []);

  return (
    <group>
      {/* capa de hierba — también es "suelo" clicable */}
      <mesh castShadow receiveShadow geometry={grassGeo} position={[0, 0.1, 0]}>
        <meshStandardMaterial color={ground} roughness={0.95} flatShading />
      </mesh>
      {/* anillo de tierra bajo el borde */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[3.4 * 0.985, 3.4 * 0.9, 0.7, 24]} />
        <meshStandardMaterial color="#A87C5F" roughness={0.98} flatShading />
      </mesh>
      {/* cono de tierra/roca inferior */}
      <mesh castShadow geometry={dirtGeo} position={[0, -1.95, 0]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial color="#8B6A52" roughness={0.98} flatShading />
      </mesh>
      {/* punta rocosa colgante */}
      <mesh geometry={rockTip} position={[0.1, -3.5, 0]}>
        <meshStandardMaterial color="#7D6455" roughness={1} flatShading />
      </mesh>
      {/* piedritas flotando bajo la isla */}
      {([[0.5, -3.0, 0.4], [-0.4, -3.3, -0.3], [0.2, -4.1, -0.1]] as const).map((p, i) => (
        <FloatingPebble key={i} position={[p[0], p[1], p[2]]} seed={i + 3} />
      ))}
      <Stream />
    </group>
  );
}

function FloatingPebble({ position, seed }: { position: [number, number, number]; seed: number }) {
  const g = useMemo(() => cachedBlob(`pebble-${seed}`, 0.16, 1, seed * 2.2, 0.8), [seed]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.7 + seed) * 0.08;
  });
  return (
    <mesh ref={ref} geometry={g} position={position}>
      <meshStandardMaterial color="#7D6455" roughness={1} flatShading />
    </mesh>
  );
}

function Stream() {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.1, 0.02, 1.4),
      new THREE.Vector3(-1.6, 0.02, 2.2),
      new THREE.Vector3(0.2, 0.02, 1.9),
      new THREE.Vector3(1.6, 0.02, 2.4),
      new THREE.Vector3(2.9, 0.02, 1.6),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.16, 6, false);
  }, []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.08 + Math.sin(clock.elapsedTime * 1.4) * 0.05;
    }
  });
  return (
    <mesh ref={ref} geometry={geo} scale={[1, 0.25, 1]} position={[0, 0.34, -0.6]}>
      <meshStandardMaterial color="#8BD8D0" emissive="#8BD8D0" emissiveIntensity={0.1} roughness={0.3} transparent opacity={0.92} />
    </mesh>
  );
}

// ── Partículas mágicas ───────────────────────────────────────────────
function MagicMotes({ count = 24, reduceMotion }: { count?: number; reduceMotion: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + i * 1.7;
      const r = 1.2 + ((i * 7) % 10) / 10 * 3;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = 0.5 + ((i * 13) % 10) / 10 * 2.8;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [count]);
  useFrame(({ clock }) => {
    if (ref.current && !reduceMotion) {
      ref.current.rotation.y = clock.elapsedTime * 0.03;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.1;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#F5DF91" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── Mariposas ────────────────────────────────────────────────────────
function Butterflies({ reduceMotion }: { reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(() => [0, 2.1, 4.2], []);
  useFrame(({ clock }) => {
    if (!group.current || reduceMotion) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const s = seeds[i % seeds.length];
      child.position.set(
        Math.cos(t * 0.3 + s) * 1.8 + Math.sin(s) * 0.5,
        1.2 + Math.sin(t * 0.9 + s) * 0.35,
        Math.sin(t * 0.24 + s) * 1.8,
      );
      child.rotation.y = t * 0.3 + s;
      // aleteo
      child.children.forEach((wing, wi) => {
        wing.rotation.y = Math.sin(t * 9 + i) * (wi === 0 ? 0.7 : -0.7);
      });
    });
  });
  return (
    <group ref={group}>
      {seeds.map((_, i) => (
        <group key={i}>
          <mesh position={[-0.05, 0, 0]} rotation={[0, 0.6, 0.3]}>
            <planeGeometry args={[0.16, 0.12]} />
            <meshBasicMaterial color={i % 2 ? '#F5B8CA' : '#D1C5F2'} side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0.05, 0, 0]} rotation={[0, -0.6, -0.3]}>
            <planeGeometry args={[0.16, 0.12]} />
            <meshBasicMaterial color={i % 2 ? '#D1C5F2' : '#F5DF91'} side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Fireflies({ reduceMotion }: { reduceMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const seeds = useMemo(() => Array.from({ length: 8 }, (_, i) => i * 0.8), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = reduceMotion ? 0 : clock.elapsedTime;
    ref.current.children.forEach((c, i) => {
      c.position.set(
        Math.cos(t * 0.4 + seeds[i]) * (1.5 + (i % 3)),
        1 + Math.sin(t * 0.6 + seeds[i] * 2) * 0.6 + (i % 4) * 0.3,
        Math.sin(t * 0.35 + seeds[i]) * (1.5 + ((i + 1) % 3)),
      );
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.4 + Math.abs(Math.sin(t * 2 + seeds[i])) * 0.6;
    });
  });
  return (
    <group ref={ref}>
      {seeds.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.035, 5, 4]} />
          <meshBasicMaterial color="#F5DF91" transparent opacity={0.8} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Ranura visible en modo decoración ────────────────────────────────
function Slot({ index, placing, onSelect }: {
  index: number; placing: boolean; onSelect: (slot: number) => void;
}) {
  const [x, y, z] = slotPosition(index);
  const ref = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * 6, []);
  useFrame(({ clock }) => {
    if (ref.current && placing) {
      const s = 1 + Math.sin(clock.elapsedTime * 2.4 + phase) * 0.12;
      ref.current.scale.set(s, s, 1);
    }
  });
  if (!placing) return null;
  return (
    <mesh
      ref={ref}
      position={[x, y + 0.36, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(index); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <ringGeometry args={[0.26, 0.36, 20]} />
      <meshBasicMaterial color="#8BD8D0" transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Objeto colocado: hover, clic, aparición suave ────────────────────
function PlacedObject({ instanceId, decorateMode, reduceMotion }: {
  instanceId: string; decorateMode: boolean; reduceMotion: boolean;
}) {
  const placement = useWorld((s) => s.placements.find((p) => p.instanceId === instanceId));
  const selectedInstanceId = useWorld((s) => s.selectedInstanceId);
  const selectInstance = useWorld((s) => s.selectInstance);
  const item = placement ? itemById(placement.itemId) : undefined;
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const mounted = useRef(false);

  useFrame((_, delta) => {
    if (!group.current) return;
    // escala de aparición (pop-in)
    const target = mounted.current ? 1 : 0;
    const cur = group.current.scale.x;
    const next = THREE.MathUtils.damp(cur, target, 7, delta);
    group.current.scale.setScalar(next);
    // elevación sutil al pasar el cursor
    const lift = hovered && !reduceMotion ? 0.1 : 0;
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, groundY(placement?.slot ?? 0) + lift, 9, delta);
  });

  useEffect(() => {
    // marcar montado tras el primer frame para animar la entrada
    const t = setTimeout(() => { mounted.current = true; }, 30);
    return () => clearTimeout(t);
  }, [instanceId]);

  if (!item || !placement) return null;
  const [x, , z] = slotPosition(placement.slot);
  const selected = selectedInstanceId === instanceId;

  return (
    <group
      ref={group}
      position={[x, groundY(placement.slot), z]}
      rotation={[0, placement.rotation, 0]}
      scale={0.01}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); selectInstance(instanceId); }}
    >
      <ItemModel kind={item.kind} itemId={item.id} color={item.color} accent={item.accent} />
      {(hovered || selected) && (
        <Html center distanceFactor={10} position={[0, 2, 0]} zIndexRange={[40, 0]}>
          <div className="px-2.5 py-1 rounded-xl bg-white/95 text-[#35483B] text-xs font-bold shadow-lg whitespace-nowrap pointer-events-none">
            {item.name}
          </div>
        </Html>
      )}
      {selected && (
        <mesh position={[0, -groundY(placement.slot) + 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.62, 24]} />
          <meshBasicMaterial color="#F5DF91" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
      {decorateMode && hovered && !selected && (
        <mesh position={[0, -groundY(placement.slot) + 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.44, 0.52, 20]} />
          <meshBasicMaterial color="#8BD8D0" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// ── Nubes alrededor ──────────────────────────────────────────────────
function CloudRing({ reduceMotion }: { reduceMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !reduceMotion) ref.current.rotation.y = clock.elapsedTime * 0.015;
  });
  const clouds = useMemo(
    () => [
      { p: [4.6, 1.6, -1.2] as [number, number, number], s: 0.9, seed: 1 },
      { p: [-4.8, 2.2, 1.4] as [number, number, number], s: 1.1, seed: 2 },
      { p: [2.2, 2.8, 3.6] as [number, number, number], s: 0.7, seed: 3 },
      { p: [-3.2, 0.9, -3.8] as [number, number, number], s: 0.8, seed: 4 },
      { p: [0.4, 3.4, -4.2] as [number, number, number], s: 0.6, seed: 5 },
    ],
    [],
  );
  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={c.p}>
          <Float speed={reduceMotion ? 0 : 1.2} rotationIntensity={0} floatIntensity={reduceMotion ? 0 : 0.6}>
            <CloudPuff scale={c.s} seed={c.seed} />
          </Float>
        </group>
      ))}
    </group>
  );
}

// ── Isla completa ────────────────────────────────────────────────────
export interface IslandProps {
  biomeGround: string;
  level: number;
  reduceMotion: boolean;
  onSelectSlot: (slot: number) => void;
  onTerrainClick: () => void;
}

export default function Island({ biomeGround, level, reduceMotion, onSelectSlot, onTerrainClick }: IslandProps) {
  const placements = useWorld((s) => s.placements);
  const decorateMode = useWorld((s) => s.decorateMode);
  const unlockedItems = useWorld((s) => s.unlockedItems);

  const slots = useMemo(() => Array.from({ length: ISLAND_SLOTS }, (_, i) => i), []);
  const hasFireflies = unlockedItems.includes('magic_fireflies') && placements.some((p) => p.itemId === 'magic_fireflies');

  return (
    <group>
      <IslandTerrain ground={biomeGround} />
      <CloudRing reduceMotion={reduceMotion} />
      {level >= 4 && <Butterflies reduceMotion={reduceMotion} />}
      {hasFireflies && <Fireflies reduceMotion={reduceMotion} />}
      <MagicMotes reduceMotion={reduceMotion} />

      {placements.map((p) => (
        <PlacedObject
          key={p.instanceId}
          instanceId={p.instanceId}
          decorateMode={decorateMode}
          reduceMotion={reduceMotion}
        />
      ))}

      {slots.map((i) => (
        <Slot key={i} index={i} placing={decorateMode} onSelect={onSelectSlot} />
      ))}

      {/* suelo invisible grande: clic en vacío limpia selección */}
      <mesh
        position={[0, 0.3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onTerrainClick(); }}
        visible={false}
      >
        <circleGeometry args={[3.3, 24]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
