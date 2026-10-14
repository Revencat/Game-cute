/**
 * Piezas 3D originales construidas con geometrías sencillas.
 * Estilo: clay / low-poly / toy-like — esferas achatadas, conos suaves,
 * materiales mate MeshStandardMaterial con roughness alto.
 */
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ItemKind } from '../../lib/types';

// ── helpers de geometría ─────────────────────────────────────────────
export function blobGeometry(
  r = 1,
  detail = 2,
  seed = 1,
  squashY = 1,
): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n =
      Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 + seed * 1.3) +
      Math.sin(v.z * 3.7 + seed * 0.7) * 0.5;
    v.multiplyScalar(r + n * r * 0.16);
    v.y *= squashY;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, ...extra });
void mat; // utilidad reservada para materiales compartidos futuros

// memo global simple de materiales/geometrías para no recrearlos
const geoCache = new Map<string, THREE.BufferGeometry>();
export function cachedBlob(key: string, r: number, detail: number, seed: number, squash = 1) {
  let g = geoCache.get(key);
  if (!g) {
    g = blobGeometry(r, detail, seed, squash);
    geoCache.set(key, g);
  }
  return g;
}

interface PartProps {
  color: string;
  accent?: string;
  scale?: number;
}

// ── Árbol bolita ─────────────────────────────────────────────────────
export function RoundTree({ color, accent = '#9A7054', scale = 1 }: PartProps) {
  const foliage = cachedBlob('tree-foliage', 1, 2, 2.1, 0.88);
  const small = cachedBlob('tree-small', 0.62, 2, 5.4, 0.9);
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.55, 0]} geometry={undefined}>
        <cylinderGeometry args={[0.16, 0.24, 1.1, 7]} />
        <meshStandardMaterial color={accent} roughness={0.95} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]} geometry={foliage}>
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0.55, 1.15, 0.25]} geometry={small}>
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[-0.45, 1.2, -0.3]} geometry={small}>
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

// ── Pino adormilado (conos apilados) ─────────────────────────────────
export function PineTree({ color, accent = '#9A7054', scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.13, 0.2, 0.8, 6]} />
        <meshStandardMaterial color={accent} roughness={0.95} flatShading />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[0, 0.9 + i * 0.55, 0]}>
          <coneGeometry args={[0.85 - i * 0.22, 0.95 - i * 0.12, 8]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ── Flor (cabeza grande, tallo corto) ────────────────────────────────
export function Flower({ color, accent = '#F5DF91', scale = 1 }: PartProps) {
  const petals = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), []);
  return (
    <group scale={scale}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.5, 5]} />
        <meshStandardMaterial color="#527D59" roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 0.18, 0]} rotation={[0, 0, -0.9]}>
        <sphereGeometry args={[0.09, 6, 5]} />
        <meshStandardMaterial color="#527D59" roughness={0.9} flatShading />
      </mesh>
      {petals.map((a, i) => (
        <mesh key={i} castShadow position={[Math.cos(a) * 0.16, 0.52, Math.sin(a) * 0.16]}>
          <sphereGeometry args={[0.13, 7, 6]} />
          <meshStandardMaterial color={color} roughness={0.85} flatShading />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.54, 0]}>
        <sphereGeometry args={[0.11, 7, 6]} />
        <meshStandardMaterial color={accent} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// ── Tulipán ──────────────────────────────────────────────────────────
export function Tulip({ color, scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.6, 5]} />
        <meshStandardMaterial color="#527D59" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.16, 0.1, 0.28, 8, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.11, 6, 5]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

// ── Lavanda (espiga) ─────────────────────────────────────────────────
export function LavenderSprig({ color, scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      {[-0.12, 0, 0.12].map((x, i) => (
        <group key={i} position={[x, 0, i === 1 ? 0.06 : -0.04]} rotation={[0, 0, x * 1.6]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 0.55, 4]} />
            <meshStandardMaterial color="#527D59" roughness={0.9} />
          </mesh>
          {[0.55, 0.68, 0.8].map((y, j) => (
            <mesh key={j} castShadow position={[0, y, 0]}>
              <sphereGeometry args={[0.09 - j * 0.015, 6, 5]} />
              <meshStandardMaterial color={color} roughness={0.85} flatShading />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ── Campanilla ───────────────────────────────────────────────────────
export function Bluebell({ color, scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.6, 5]} />
        <meshStandardMaterial color="#527D59" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.05, 0.58, 0]} rotation={[0.35, 0, 0.4]}>
        <coneGeometry args={[0.13, 0.26, 7]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// ── Estrella floral ──────────────────────────────────────────────────
export function StarBloom({ color, accent = '#D1C5F2', scale = 1 }: PartProps) {
  const pts = useMemo(() => Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2), []);
  return (
    <group scale={scale}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.55, 5]} />
        <meshStandardMaterial color="#527D59" roughness={0.9} />
      </mesh>
      {pts.map((a, i) => (
        <mesh key={i} castShadow position={[Math.cos(a) * 0.2, 0.58, Math.sin(a) * 0.2]} rotation={[0, -a, 0.5]}>
          <boxGeometry args={[0.22, 0.05, 0.1]} />
          <meshStandardMaterial color={color} roughness={0.8} flatShading />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.1, 7, 6]} />
        <meshStandardMaterial color={accent} roughness={0.7} emissive={accent} emissiveIntensity={0.25} flatShading />
      </mesh>
    </group>
  );
}

// ── Arbusto esfera ───────────────────────────────────────────────────
export function Shrub({ color, scale = 1 }: PartProps) {
  const g = cachedBlob(`shrub-${color}`, 0.55, 2, 3.3, 0.8);
  const g2 = cachedBlob(`shrub2-${color}`, 0.36, 2, 7.1, 0.85);
  return (
    <group scale={scale}>
      <mesh castShadow geometry={g} position={[0, 0.4, 0]}>
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow geometry={g2} position={[0.5, 0.28, 0.2]}>
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

// ── Seta ─────────────────────────────────────────────────────────────
export function Mushroom({ color, accent = '#FFF8EC', scale = 1, tall = false }: PartProps & { tall?: boolean }) {
  const h = tall ? 1.1 : 0.42;
  const capR = tall ? 0.62 : 0.34;
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, h / 2, 0]}>
        <cylinderGeometry args={[tall ? 0.14 : 0.1, tall ? 0.18 : 0.14, h, 7]} />
        <meshStandardMaterial color={accent} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, h, 0]}>
        <sphereGeometry args={[capR, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
      {!tall && (
        <>
          <mesh position={[0.12, h + 0.08, 0.14]}>
            <sphereGeometry args={[0.055, 5, 4]} />
            <meshStandardMaterial color={accent} roughness={0.8} />
          </mesh>
          <mesh position={[-0.14, h + 0.05, -0.05]}>
            <sphereGeometry args={[0.045, 5, 4]} />
            <meshStandardMaterial color={accent} roughness={0.8} />
          </mesh>
        </>
      )}
      {tall && (
        <mesh castShadow position={[0.55, 0.22, 0.3]} scale={0.45}>
          <group>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.1, 0.14, 0.4, 6]} />
              <meshStandardMaterial color={accent} roughness={0.9} flatShading />
            </mesh>
          </group>
        </mesh>
      )}
    </group>
  );
}

// ── Helecho ──────────────────────────────────────────────────────────
export function Fern({ color, scale = 1 }: PartProps) {
  const fronds = useMemo(() => Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2), []);
  return (
    <group scale={scale}>
      {fronds.map((a, i) => (
        <mesh key={i} castShadow position={[Math.cos(a) * 0.18, 0.3, Math.sin(a) * 0.18]} rotation={[Math.sin(a) * 0.7, -a, Math.cos(a) * -0.7]}>
          <coneGeometry args={[0.1, 0.7, 4]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ── Roca arcilla ─────────────────────────────────────────────────────
export function Rock({ color, accent, scale = 1 }: PartProps) {
  const g = cachedBlob(`rock-${color}`, 0.45, 1, 8.7, 0.72);
  return (
    <group scale={scale}>
      <mesh castShadow geometry={g} position={[0, 0.25, 0]}>
        <meshStandardMaterial color={color} roughness={0.95} flatShading />
      </mesh>
      {accent && (
        <mesh castShadow position={[0.28, 0.14, 0.18]} scale={0.5}>
          <icosahedronGeometry args={[0.4, 1]} />
          <meshStandardMaterial color={color} roughness={0.95} flatShading />
        </mesh>
      )}
      {accent && (
        <mesh position={[0, 0.52, 0]} scale={[0.9, 0.28, 0.9]}>
          <sphereGeometry args={[0.4, 7, 5]} />
          <meshStandardMaterial color={accent} roughness={0.9} flatShading />
        </mesh>
      )}
    </group>
  );
}

// ── Torre de piedras zen ─────────────────────────────────────────────
export function RockStack({ color, accent = '#F6C5A2', scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      {[0.28, 0.2, 0.13].map((r, i) => (
        <mesh key={i} castShadow position={[i === 1 ? 0.03 : 0, r + (i === 0 ? 0 : i === 1 ? 0.42 : 0.72), 0]} scale={[1, 0.72, 1]}>
          <sphereGeometry args={[r, 7, 6]} />
          <meshStandardMaterial color={i === 2 ? accent : color} roughness={0.92} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ── Farolito ─────────────────────────────────────────────────────────
export function Lantern({ color = '#F5DF91', accent = '#9A7054', scale = 1 }: PartProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const m = ref.current.userData.reduceMotion ? 0 : 1;
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.8) * 0.04 * m;
    }
  });
  return (
    <group scale={scale} ref={ref}>
      <mesh castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 1.4, 6]} />
        <meshStandardMaterial color={accent} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[0.3, 0.34, 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 1.74, 0]}>
        <coneGeometry args={[0.24, 0.16, 4]} />
        <meshStandardMaterial color={accent} roughness={0.9} flatShading />
      </mesh>
      <pointLight position={[0, 1.5, 0]} intensity={1.6} distance={3.2} color="#FFE9B8" />
    </group>
  );
}

// ── Fuente mini ──────────────────────────────────────────────────────
export function Fountain({ color = '#8BD8D0', accent = '#D8EED7', scale = 1 }: PartProps) {
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (water.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.04;
      water.current.scale.set(s, 1, s);
    }
  });
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.62, 0.7, 0.24, 10]} />
        <meshStandardMaterial color={accent} roughness={0.9} flatShading />
      </mesh>
      <mesh ref={water} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 10]} />
        <meshStandardMaterial color={color} roughness={0.35} transparent opacity={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 0.55, 7]} />
        <meshStandardMaterial color={accent} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.14, 7, 6]} />
        <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

// ── Banquita ─────────────────────────────────────────────────────────
export function Bench({ color = '#9A7054', scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[1, 0.12, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.62, -0.18]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[1, 0.34, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} castShadow position={[x, 0.14, 0]}>
          <boxGeometry args={[0.09, 0.3, 0.36]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ── Cartel ───────────────────────────────────────────────────────────
export function Signpost({ color = '#F6C5A2', accent = '#9A7054', scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 1, 6]} />
        <meshStandardMaterial color={accent} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0.18, 0.82, 0]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[0.55, 0.2, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[-0.14, 0.6, 0]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.42, 0.16, 0.05]} />
        <meshStandardMaterial color={accent} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

// ── Casitas ──────────────────────────────────────────────────────────
export function Cottage({ color = '#FFF8EC', accent = '#E5829F', scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.1, 0.9, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.12, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.92, 0.62, 4]} />
        <meshStandardMaterial color={accent} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[0, 0.32, 0.48]}>
        <boxGeometry args={[0.26, 0.44, 0.04]} />
        <meshStandardMaterial color="#9A7054" roughness={0.9} />
      </mesh>
      <mesh position={[0.32, 0.6, 0.48]}>
        <boxGeometry args={[0.18, 0.18, 0.04]} />
        <meshStandardMaterial color="#BDE6F5" emissive="#BDE6F5" emissiveIntensity={0.3} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[-0.35, 1.15, -0.2]}>
        <boxGeometry args={[0.16, 0.4, 0.16]} />
        <meshStandardMaterial color="#A9A49A" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

export function MushroomHouse({ color = '#F5B8CA', accent = '#FFFEFA', scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.42, 0.52, 1.1, 9]} />
        <meshStandardMaterial color={accent} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.78, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
      {[0.3, -0.35, 0.05].map((x, i) => (
        <mesh key={i} position={[x, 1.42 - Math.abs(x) * 0.3, 0.5 - i * 0.15]}>
          <sphereGeometry args={[0.1, 6, 5]} />
          <meshStandardMaterial color={accent} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.35, 0.5]}>
        <cylinderGeometry args={[0.16, 0.16, 0.5, 8, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#9A7054" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.35, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.17, 8]} />
        <meshStandardMaterial color="#9A7054" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Animales ─────────────────────────────────────────────────────────
export function Bird({ color = '#BDE6F5', accent = '#F6C5A2', scale = 1 }: PartProps) {
  const body = cachedBlob('bird-body', 0.28, 2, 4.2, 0.92);
  const hop = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (hop.current) hop.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 1.6)) * 0.06;
  });
  return (
    <group scale={scale} ref={hop}>
      <mesh castShadow geometry={body} position={[0, 0.3, 0]}>
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[0.2, 0.44, 0]} scale={0.6}>
        <sphereGeometry args={[0.28, 7, 6]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.36, 0.44, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.06, 0.12, 5]} />
        <meshStandardMaterial color={accent} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.28, 0.5, 0.1]}>
        <sphereGeometry args={[0.03, 5, 4]} />
        <meshStandardMaterial color="#35483B" roughness={0.5} />
      </mesh>
      <mesh position={[0.28, 0.5, -0.1]}>
        <sphereGeometry args={[0.03, 5, 4]} />
        <meshStandardMaterial color="#35483B" roughness={0.5} />
      </mesh>
      <mesh position={[-0.05, 0.32, 0.16]} rotation={[0, 0, 0.4]} scale={[1, 0.4, 0.8]}>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshStandardMaterial color={accent} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

export function Bunny({ color = '#FFFEFA', accent = '#F5B8CA', scale = 1 }: PartProps) {
  const body = cachedBlob('bunny-body', 0.34, 2, 6.6, 0.85);
  return (
    <group scale={scale}>
      <mesh castShadow geometry={body} position={[0, 0.28, 0]}>
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0.18, 0.55, 0]} scale={0.62}>
        <sphereGeometry args={[0.34, 7, 6]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      {[-0.09, 0.09].map((z) => (
        <mesh key={z} castShadow position={[0.16, 0.85, z]} rotation={[0, 0, z > 0 ? 0.25 : -0.2]} scale={[0.35, 1, 0.5]}>
          <capsuleGeometry args={[0.09, 0.24, 3, 6]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      ))}
      <mesh position={[0.3, 0.56, 0.08]}>
        <sphereGeometry args={[0.028, 5, 4]} />
        <meshStandardMaterial color="#35483B" />
      </mesh>
      <mesh position={[0.3, 0.56, -0.08]}>
        <sphereGeometry args={[0.028, 5, 4]} />
        <meshStandardMaterial color="#35483B" />
      </mesh>
      <mesh position={[0.34, 0.5, 0]} scale={0.5}>
        <sphereGeometry args={[0.06, 5, 4]} />
        <meshStandardMaterial color={accent} roughness={0.8} />
      </mesh>
      <mesh position={[-0.32, 0.28, 0]}>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

export function Fox({ color = '#F6C5A2', accent = '#9A7054', scale = 1 }: PartProps) {
  const body = cachedBlob('fox-body', 0.32, 2, 9.1, 0.8);
  return (
    <group scale={scale}>
      <mesh castShadow geometry={body} position={[0, 0.3, 0]}>
        <meshStandardMaterial color={color} roughness={0.88} flatShading />
      </mesh>
      <mesh castShadow position={[0.32, 0.5, 0]} scale={0.62}>
        <sphereGeometry args={[0.32, 7, 6]} />
        <meshStandardMaterial color={color} roughness={0.88} flatShading />
      </mesh>
      {[-0.12, 0.12].map((z) => (
        <mesh key={z} castShadow position={[0.3, 0.72, z]}>
          <coneGeometry args={[0.08, 0.18, 4]} />
          <meshStandardMaterial color={accent} roughness={0.88} flatShading />
        </mesh>
      ))}
      <mesh position={[0.5, 0.46, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.05, 0.1, 5]} />
        <meshStandardMaterial color="#35483B" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0.42, 0.56, 0.1]}>
        <sphereGeometry args={[0.028, 5, 4]} />
        <meshStandardMaterial color="#35483B" />
      </mesh>
      <mesh position={[0.42, 0.56, -0.1]}>
        <sphereGeometry args={[0.028, 5, 4]} />
        <meshStandardMaterial color="#35483B" />
      </mesh>
      <mesh castShadow position={[-0.42, 0.34, 0]} rotation={[0, 0, 0.7]} scale={[1.4, 0.5, 0.5]}>
        <sphereGeometry args={[0.24, 6, 5]} />
        <meshStandardMaterial color={color} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[-0.56, 0.42, 0]} rotation={[0, 0, 0.7]} scale={[1.2, 0.45, 0.45]}>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshStandardMaterial color="#FFFEFA" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

// ── Mágicos ──────────────────────────────────────────────────────────
export function Crystal({ color = '#D1C5F2', scale = 1 }: PartProps) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.25;
  });
  return (
    <group scale={scale}>
      <mesh castShadow geometry={cachedBlob('crystal-base', 0.4, 1, 2.3, 0.5)} position={[0, 0.12, 0]}>
        <meshStandardMaterial color="#BCB6AC" roughness={0.95} flatShading />
      </mesh>
      <group ref={group} position={[0, 0.2, 0]}>
        {[0, 1.9, 3.6].map((a, i) => (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.12, 0.4 + i * 0.05, Math.sin(a) * 0.12]} rotation={[0.12 * Math.cos(a), a, 0.12 * Math.sin(a)]}>
            <octahedronGeometry args={[0.24 - i * 0.04, 0]} />
            <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.5} flatShading transparent opacity={0.92} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 0.7, 0]} intensity={1.1} distance={2.6} color={color} />
    </group>
  );
}

export function MagicArch({ color = '#8BD8D0', accent = '#F5B8CA', scale = 1 }: PartProps) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[-0.5, 0.7, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 1.4, 7]} />
        <meshStandardMaterial color="#BCB6AC" roughness={0.95} flatShading />
      </mesh>
      <mesh castShadow position={[0.5, 0.7, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 1.4, 7]} />
        <meshStandardMaterial color="#BCB6AC" roughness={0.95} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.12, 8, 14, Math.PI]} />
        <meshStandardMaterial color="#BCB6AC" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <circleGeometry args={[0.46, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.3, 1.6, 0.1]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.24, 0.06, 0.06]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} flatShading />
      </mesh>
    </group>
  );
}

// ── Nube decorativa ──────────────────────────────────────────────────
export function CloudPuff({ scale = 1, seed = 1 }: { scale?: number; seed?: number }) {
  const g1 = cachedBlob(`cloud-a-${seed}`, 0.5, 2, seed * 3.7, 0.72);
  const g2 = cachedBlob(`cloud-b-${seed}`, 0.34, 2, seed * 5.1, 0.75);
  return (
    <group scale={scale}>
      <mesh geometry={g1}>
        <meshStandardMaterial color="#FFFEFA" roughness={1} flatShading transparent opacity={0.95} />
      </mesh>
      <mesh geometry={g2} position={[0.5, 0.05, 0.1]}>
        <meshStandardMaterial color="#FFFEFA" roughness={1} flatShading transparent opacity={0.95} />
      </mesh>
      <mesh geometry={g2} position={[-0.45, -0.02, -0.1]} scale={0.85}>
        <meshStandardMaterial color="#FFFEFA" roughness={1} flatShading transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

// ── Despachador por tipo de catálogo ─────────────────────────────────
export function ItemModel({ kind, itemId, color, accent }: { kind: ItemKind; itemId: string; color: string; accent?: string }) {
  switch (kind) {
    case 'tree':
      if (itemId === 'tree_tall') return <PineTree color={color} accent={accent} />;
      return <RoundTree color={color} accent={accent} />;
    case 'flower':
      if (itemId === 'flower_tulip') return <Tulip color={color} />;
      if (itemId === 'flower_lavender') return <LavenderSprig color={color} />;
      if (itemId === 'flower_bluebell') return <Bluebell color={color} />;
      if (itemId === 'flower_starbloom') return <StarBloom color={color} accent={accent} />;
      return <Flower color={color} accent={accent ?? '#F5DF91'} />;
    case 'plant':
      if (itemId === 'shrub_ball') return <Shrub color={color} />;
      if (itemId === 'fern_patch') return <Fern color={color} />;
      if (itemId === 'mushroom_tall') return <Mushroom color={color} accent={accent} tall />;
      return <Mushroom color={color} accent={accent} />;
    case 'rock':
      if (itemId === 'rock_stack') return <RockStack color={color} accent={accent} />;
      return <Rock color={color} accent={accent} />;
    case 'deco':
      if (itemId === 'lamp_lantern') return <Lantern color={color} accent={accent} />;
      if (itemId === 'fountain_small') return <Fountain color={color} accent={accent} />;
      if (itemId === 'bench_wood') return <Bench color={color} />;
      if (itemId === 'signpost') return <Signpost color={color} accent={accent} />;
      return null;
    case 'house':
      if (itemId === 'house_mushroom') return <MushroomHouse color={color} accent={accent} />;
      return <Cottage color={color} accent={accent} />;
    case 'animal':
      if (itemId === 'animal_bunny') return <Bunny color={color} accent={accent} />;
      if (itemId === 'animal_fox') return <Fox color={color} accent={accent} />;
      return <Bird color={color} accent={accent} />;
    case 'magic':
      if (itemId === 'magic_arch') return <MagicArch color={color} accent={accent} />;
      return <Crystal color={color} />;
    default:
      return null;
  }
}
