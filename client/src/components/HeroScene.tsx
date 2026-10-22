// Bosh sahifadagi 3D dala: shamolda tebranayotgan bug'doy poyalari.
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 900;

function Field() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const blades = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: (Math.random() - 0.5) * 14,
        z: (Math.random() - 0.5) * 8 - 1,
        h: 0.5 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );
  const colors = useMemo(() => {
    const c = new THREE.Color();
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      c.set(Math.random() > 0.35 ? '#e3a33b' : '#c98a2a').offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
      c.toArray(arr, i * 3);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const m = mesh.current;
    if (!m) return;
    blades.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2 - 0.6, b.z);
      dummy.rotation.set(0, 0, Math.sin(t * 1.4 + b.phase + b.x * 0.4) * 0.18);
      dummy.scale.set(1, b.h, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <coneGeometry args={[0.035, 1, 4]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </coneGeometry>
      <meshStandardMaterial vertexColors roughness={0.8} />
    </instancedMesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0.6, 5], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1.6} color="#fff3d6" />
      <mesh position={[2.6, 1.7, -4]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#f5c76b" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, -1]}>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#2c5a37" />
      </mesh>
      <Field />
    </Canvas>
  );
}
