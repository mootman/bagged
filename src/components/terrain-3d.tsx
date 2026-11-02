/* eslint-disable react/no-unknown-property, react-hooks/immutability, react-hooks/refs, react-hooks/purity -- three.js JSX props, per-frame camera mutation and gesture refs are how react-three-fiber works. The file opts out of React Compiler below. */
'use no memo';
import { useEffect, useMemo, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { PanResponder, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import { Colors } from '@/constants/theme';
import { Canvas, useFrame, useThree } from '@/lib/r3f';
import { skyAt } from '@/lib/sky';
import { heightmap, TERRAIN_SPAN_M } from '@/lib/terrain';

const c = Colors.dark;
const SIZE = 10; // scene units across the 5 km window
const EXAGGERATION = 1.35;

/** Colors by real elevation and slope: forest, tundra, rock, snow. */
function terrainColor(elev: number, slope: number, rimFade: number, out: THREE.Color) {
  const forest = new THREE.Color('#24392C');
  const tundra = new THREE.Color('#6B6A4C');
  const rock = new THREE.Color('#8C837A');
  const snow = new THREE.Color('#F3F1EC');
  if (elev < 3400) out.copy(forest);
  else if (elev < 3750) out.copy(forest).lerp(tundra, (elev - 3400) / 350);
  else if (elev < 3950) out.copy(tundra).lerp(rock, (elev - 3750) / 200);
  else out.copy(rock);
  // Snow holds on high, gentler ground.
  if (elev > 3900 && slope < 0.85) out.lerp(snow, Math.min(1, ((elev - 3900) / 300) * (1 - slope)));
  out.lerp(new THREE.Color('#2A2620'), rimFade * 0.6);
}

function useTerrainGeometry(peakId: string) {
  return useMemo(() => {
    const hm = heightmap(peakId);
    if (!hm) return null;
    const { h, grid, min } = hm;
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, grid - 1, grid - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const scale = (SIZE / TERRAIN_SPAN_M) * EXAGGERATION;
    const cellM = TERRAIN_SPAN_M / (grid - 1);
    const col = new THREE.Color();

    for (let j = 0; j < grid; j++) {
      for (let i = 0; i < grid; i++) {
        const idx = j * grid + i;
        const elev = h[idx];
        // Round "diorama": terrain sinks to the base outside a circle.
        const nx = (i / (grid - 1)) * 2 - 1;
        const nz = (j / (grid - 1)) * 2 - 1;
        const r = Math.sqrt(nx * nx + nz * nz);
        const fall = r < 0.82 ? 1 : Math.max(0, 1 - (r - 0.82) / 0.16);
        const ease = fall * fall * (3 - 2 * fall);
        pos.setY(idx, (elev - min) * scale * ease);

        const dx = (h[j * grid + Math.min(grid - 1, i + 1)] - h[j * grid + Math.max(0, i - 1)]) / (2 * cellM);
        const dz = (h[Math.min(grid - 1, j + 1) * grid + i] - h[Math.max(0, j - 1) * grid + i]) / (2 * cellM);
        const slope = Math.min(1, Math.sqrt(dx * dx + dz * dz));
        terrainColor(elev, slope, 1 - ease, col);
        colors.set([col.r, col.g, col.b], idx * 3);
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // Cut the square down to a disc so it sits like a museum relief model.
    const index = geo.getIndex()!;
    const keep: number[] = [];
    const radial = (v: number) => {
      const i = v % grid;
      const j = Math.floor(v / grid);
      const nx = (i / (grid - 1)) * 2 - 1;
      const nz = (j / (grid - 1)) * 2 - 1;
      return Math.sqrt(nx * nx + nz * nz);
    };
    for (let k = 0; k < index.count; k += 3) {
      const a = index.getX(k);
      const b = index.getX(k + 1);
      const d = index.getX(k + 2);
      if (radial(a) <= 1 && radial(b) <= 1 && radial(d) <= 1) keep.push(a, b, d);
    }
    geo.setIndex(keep);
    geo.computeVertexNormals();
    const center = Math.floor(grid / 2);
    const summitY = (h[center * grid + center] - min) * scale;
    return { geo, summitY };
  }, [peakId]);
}

function Scene({
  peakId,
  time,
  orbit,
}: {
  peakId: string;
  time: number;
  orbit: React.RefObject<{ yaw: number; pitch: number; dragging: boolean; lastTouch: number }>;
}) {
  const terrain = useTerrainGeometry(peakId);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const { camera, scene } = useThree();
  const s = skyAt(time);

  useEffect(() => {
    scene.background = new THREE.Color(s.sky);
    scene.fog = new THREE.Fog(s.horizon, 14, 30);
  }, [scene, s.sky, s.horizon]);

  useFrame((_, dt) => {
    const o = orbit.current;
    if (!o) return;
    // Slow auto-rotate when nobody is touching it.
    if (!o.dragging && Date.now() - o.lastTouch > 2500) o.yaw += dt * 0.12;
    const radius = 18.5;
    const y = Math.sin(o.pitch) * radius;
    const flat = Math.cos(o.pitch) * radius;
    camera.position.set(Math.sin(o.yaw) * flat, y + (terrain?.summitY ?? 0) * 0.4, Math.cos(o.yaw) * flat);
    camera.lookAt(0, (terrain?.summitY ?? 0) * 0.3, 0);
  });

  if (!terrain) return null;
  const az = s.azimuth;
  const el = s.elevation;
  const sunPos: [number, number, number] = [Math.cos(az) * Math.cos(el) * 20, Math.sin(el) * 20 + 1, Math.sin(az) * Math.cos(el) * 20];

  return (
    <>
      <hemisphereLight ref={hemi} args={[s.horizon, '#1A1612', s.ambient]} />
      <directionalLight ref={sun} position={sunPos} color={s.sun} intensity={s.sunIntensity} />
      <directionalLight position={[-sunPos[0], 6, -sunPos[2]]} color={s.sky} intensity={0.6} />
      <mesh geometry={terrain.geo}>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>
      {/* Plinth under the relief */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[SIZE / 2 + 0.05, SIZE / 2 + 0.12, 0.36, 96]} />
        <meshStandardMaterial color="#C9CEC3" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[SIZE / 2 - 0.02, SIZE / 2 + 0.06, 128]} />
        <meshBasicMaterial color={c.text} />
      </mesh>
      {/* Summit pin */}
      <mesh position={[0, terrain.summitY + 0.55, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color={c.accent} />
      </mesh>
      <mesh position={[0, terrain.summitY + 0.27, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.55, 6]} />
        <meshBasicMaterial color={c.accent} />
      </mesh>
    </>
  );
}

/** Real terrain around the summit in 3D. Drag to spin and tilt; it slowly turns on its own. */
export function Terrain3D({ peakId, time, height = 380 }: { peakId: string; time: number; height?: number }) {
  const orbit = useRef({ yaw: 0.6, pitch: 0.7, dragging: false, lastTouch: 0 });
  const start = useRef({ yaw: 0, pitch: 0 });

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          orbit.current.dragging = true;
          start.current = { yaw: orbit.current.yaw, pitch: orbit.current.pitch };
        },
        onPanResponderMove: (_, g) => {
          orbit.current.yaw = start.current.yaw - g.dx * 0.008;
          orbit.current.pitch = Math.max(0.18, Math.min(1.25, start.current.pitch + g.dy * 0.006));
        },
        onPanResponderRelease: () => {
          orbit.current.dragging = false;
          orbit.current.lastTouch = Date.now();
        },
        onPanResponderTerminate: () => {
          orbit.current.dragging = false;
          orbit.current.lastTouch = Date.now();
        },
      }),
    [],
  );

  return (
    <View style={[styles.wrap, { height }]} {...pan.panHandlers}>
      <Canvas camera={{ fov: 38, near: 0.1, far: 100, position: [8, 6, 8] }} gl={{ antialias: true }}>
        <Scene peakId={peakId} time={time} orbit={orbit} />
      </Canvas>
      <LinearGradient pointerEvents="none" colors={['transparent', c.background]} style={styles.fade} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: c.background },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
});
