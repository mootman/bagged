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
const EXAGGERATION = 1.2;

const FOREST = new THREE.Color('#355238');
const TUNDRA = new THREE.Color('#8A8660');
const ROCK = new THREE.Color('#9A9087');
const SNOW = new THREE.Color('#F6F5F1');
const BASE = -0.35;

/** Colors by real elevation and slope: forest below treeline, tundra, rock, snow on gentler high ground. */
function terrainColor(elev: number, slope: number, out: THREE.Color) {
  if (elev < 3450) out.copy(FOREST);
  else if (elev < 3700) out.copy(FOREST).lerp(TUNDRA, (elev - 3450) / 250);
  else if (elev < 3950) out.copy(TUNDRA).lerp(ROCK, (elev - 3700) / 250);
  else out.copy(ROCK);
  // Steep ground reads as rock at any height.
  if (slope > 0.75) out.lerp(ROCK, Math.min(1, (slope - 0.75) * 3));
  if (elev > 3950 && slope < 0.8) out.lerp(SNOW, Math.min(0.85, ((elev - 3950) / 350) * (1 - slope)));
}

/** A square block of real terrain with earth-coloured sides, like a relief model on a desk. */
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
        pos.setY(idx, (elev - min) * scale);
        const dx = (h[j * grid + Math.min(grid - 1, i + 1)] - h[j * grid + Math.max(0, i - 1)]) / (2 * cellM);
        const dz = (h[Math.min(grid - 1, j + 1) * grid + i] - h[Math.max(0, j - 1) * grid + i]) / (2 * cellM);
        terrainColor(elev, Math.min(1, Math.sqrt(dx * dx + dz * dz)), col);
        colors.set([col.r, col.g, col.b], idx * 3);
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // Sides: a wall from each edge of the surface down to the base.
    const edge = (k: number, side: number) => {
      // side 0: north row, 1: south row, 2: west column, 3: east column
      if (side === 0) return k;
      if (side === 1) return (grid - 1) * grid + k;
      if (side === 2) return k * grid;
      return k * grid + grid - 1;
    };
    const verts: number[] = [];
    for (let side = 0; side < 4; side++) {
      for (let k = 0; k < grid - 1; k++) {
        const a = edge(k, side);
        const b = edge(k + 1, side);
        const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
        const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
        verts.push(ax, ay, az, bx, by, bz, ax, BASE, az, bx, by, bz, bx, BASE, bz, ax, BASE, az);
      }
    }
    const sides = new THREE.BufferGeometry();
    sides.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    sides.computeVertexNormals();

    const center = Math.floor(grid / 2);
    const summitY = (h[center * grid + center] - min) * scale;
    return { geo, sides, summitY };
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
    // The page behind shows through: no painted sky, no fog.
    scene.background = null;
    scene.fog = null;
  }, [scene]);

  useFrame((_, dt) => {
    const o = orbit.current;
    if (!o) return;
    // Slow auto-rotate when nobody is touching it.
    if (!o.dragging && Date.now() - o.lastTouch > 2500) o.yaw += dt * 0.12;
    const radius = 21;
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
      <hemisphereLight ref={hemi} args={['#FFFFFF', '#6B6253', s.ambient + 0.35]} />
      <directionalLight ref={sun} position={sunPos} color={s.sun} intensity={s.sunIntensity} />
      <directionalLight position={[-sunPos[0], 6, -sunPos[2]]} color={s.sky} intensity={0.6} />
      <mesh geometry={terrain.geo}>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>
      <mesh geometry={terrain.sides}>
        <meshStandardMaterial color="#7A6A58" roughness={1} side={THREE.DoubleSide} />
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
  const orbit = useRef({ yaw: 0.6, pitch: 0.62, dragging: false, lastTouch: 0 });
  const sky = skyAt(time);
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
      {/* A soft sky that follows the light slider, washed out so it sits on the page. */}
      <LinearGradient pointerEvents="none" colors={[wash(sky.sky, 0.55), wash(sky.horizon, 0.7)]} style={StyleSheet.absoluteFill} />
      <Canvas camera={{ fov: 36, near: 0.1, far: 100, position: [8, 6, 8] }} gl={{ antialias: true, alpha: true }}>
        <Scene peakId={peakId} time={time} orbit={orbit} />
      </Canvas>
    </View>
  );
}

/** Mix a colour toward the page background so the sky never goes dark and heavy. */
function wash(hex: string, t: number) {
  const a = new THREE.Color(hex);
  return `#${a.lerp(new THREE.Color(c.backgroundElement), t).getHexString()}`;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: c.backgroundElement },
});
