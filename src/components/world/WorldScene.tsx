/**
 * Escena 3D principal: cámara ortográfica isométrica, iluminación cálida,
 * cielo pastel con degradado y la isla flotante.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import Island from './Island';
import { biomeById } from '../../data/catalog';
import { useWorld } from '../../state/worldStore';

export function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

// Fondo: degradado vertical pintado en un plano grande lejano (sin post-proceso)
function SkyBackdrop({ sky }: { sky: string }) {
  const texture = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 8; cv.height = 256;
    const ctx = cv.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    const top = new THREE.Color(sky).lerp(new THREE.Color('#FFFFFF'), 0.15);
    const mid = new THREE.Color(sky);
    const bottom = new THREE.Color('#FFF8EC').lerp(mid, 0.35);
    grad.addColorStop(0, `#${top.getHexString()}`);
    grad.addColorStop(0.55, `#${mid.getHexString()}`);
    grad.addColorStop(1, `#${bottom.getHexString()}`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 256);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [sky]);
  return (
    <mesh position={[0, 2, -24]} renderOrder={-1}>
      <planeGeometry args={[70, 46]} />
      <meshBasicMaterial map={texture} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Acercamiento muy ligero cuando el mundo evoluciona (celebrateKey cambia). */
function FocusNudge({ trigger, reduceMotion }: { trigger: number; reduceMotion: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const last = useRef(trigger);
  const impulse = useRef(0);
  useFrame((_, delta) => {
    if (trigger !== last.current) {
      last.current = trigger;
      if (!reduceMotion) impulse.current = 0.07; // +7% de zoom suave
    }
    const base = 58;
    if (impulse.current > 0.001) {
      impulse.current = THREE.MathUtils.damp(impulse.current, 0, 1.6, delta);
      camera.zoom = base * (1 + impulse.current);
      camera.updateProjectionMatrix();
    } else if (Math.abs(camera.zoom - base) > 0.05) {
      camera.zoom = THREE.MathUtils.damp(camera.zoom, base, 3, delta);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

interface WorldSceneProps {
  celebrateKey: number;
}

export default function WorldScene({ celebrateKey }: WorldSceneProps) {
  const activeBiome = useWorld((s) => s.activeBiome);
  const level = useWorld((s) => s.level);
  const reduceMotion = useWorld((s) => s.settings.reduceMotion);
  const biome = biomeById(activeBiome);

  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; }}
      aria-label={`Vista 3D de tu mundo, bioma ${biome.name}`}
      role="img"
    >
      <OrthographicCamera makeDefault position={[9, 8, 9]} zoom={58} near={-40} far={80} />
      <ambientLight intensity={0.75} color="#FFF4E0" />
      <directionalLight
        position={[7, 11, 5]}
        intensity={1.35}
        color="#FFF0D8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
      <hemisphereLight args={['#CDEAF7', '#DCEBCB', 0.55]} />

      <Suspense fallback={null}>
        <SkyBackdrop sky={biome.sky} />
        <FocusNudge trigger={celebrateKey} reduceMotion={reduceMotion} />
        <Island
          biomeGround={biome.ground}
          level={level}
          reduceMotion={reduceMotion}
          onSelectSlot={(slot) => {
            const st = useWorld.getState();
            if (st.placingItemId) st.placeItem(st.placingItemId, slot);
            else st.selectSlot(slot);
          }}
          onTerrainClick={() => {
            const st = useWorld.getState();
            if (st.placingItemId) st.setPlacingItem(null);
            else { st.selectSlot(null); st.selectInstance(null); }
          }}
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom
        minZoom={40}
        maxZoom={100}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.35}
        rotateSpeed={0.45}
        zoomSpeed={0.6}
        target={[0, 0.4, 0]}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
