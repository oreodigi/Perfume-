"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fragrances, type Fragrance } from "@/data/fragrances";

type SceneProps = { view: "home" | "detail"; selectedSlug: string };

/** The only WebGL canvas in the experience; all bottles track ordinary DOM anchors. */
function BottleModel({ scent }: { scent: Fragrance }) {
  const coloredLiquid = useMemo(() => new THREE.Color(scent.color), [scent.color]);
  const capIsRound = Number(scent.number) % 3 === 0;
  return (
    <group>
      <mesh position={[0, -0.19, 0]} castShadow>
        <boxGeometry args={[1.15, 1.48, 0.49]} />
        <meshPhysicalMaterial color="#e5c9ad" roughness={0.09} metalness={0} transmission={0.97} thickness={1.4} ior={1.48} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.3} />
      </mesh>
      <mesh position={[0, -0.34, 0]}>
        <boxGeometry args={[1.02, 1.15, 0.39]} />
        <meshPhysicalMaterial color={coloredLiquid} transparent opacity={0.84} roughness={0.17} metalness={0.04} transmission={0.15} thickness={0.3} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.22, 0.27, 32]} />
        <meshStandardMaterial color="#bc986d" metalness={0.88} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.93, 0]} castShadow>
        {capIsRound ? <cylinderGeometry args={[0.34, 0.34, 0.52, 48]} /> : <boxGeometry args={[0.59, 0.54, 0.55]} />}
        <meshStandardMaterial color={Number(scent.number) % 2 ? "#35231f" : "#a68a64"} roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.94, 0.286]}>
        <boxGeometry args={[capIsRound ? 0.22 : 0.42, 0.026, 0.012]} />
        <meshStandardMaterial color="#dab97a" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.23, 0.253]}>
        <boxGeometry args={[0.78, 0.8, 0.025]} />
        <meshStandardMaterial color="#ead7be" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.035, 0.27]}>
        <boxGeometry args={[0.5, 0.013, 0.003]} />
        <meshStandardMaterial color="#8f6a44" metalness={0.25} roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.41, 0.27]}>
        <boxGeometry args={[0.5, 0.012, 0.003]} />
        <meshStandardMaterial color="#8f6a44" metalness={0.25} roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.18, 0.271]}>
        <ringGeometry args={[0.107, 0.125, 8]} />
        <meshStandardMaterial color="#9c713f" metalness={0.45} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.45, -0.05, 0.26]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.055, 1.1, 0.008]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function AnchoredBottle({ scent, view, selectedSlug }: { scent: Fragrance } & SceneProps) {
  const group = useRef<THREE.Group>(null);
  const { size, camera } = useThree();
  const anchors = useRef<HTMLElement[]>([]);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const desiredScale = useMemo(() => new THREE.Vector3(), []);
  const initialized = useRef(false);

  useEffect(() => {
    // Anchors change between home/detail. DOM stays the source of truth for positions.
    const updateAnchors = () => {
      anchors.current = Array.from(document.querySelectorAll<HTMLElement>(`[data-bottle-anchor="${scent.slug}"]`));
    };
    updateAnchors();
    const raf = requestAnimationFrame(updateAnchors);
    return () => cancelAnimationFrame(raf);
  }, [scent.slug, view, selectedSlug]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    let best: DOMRect | null = null;
    let nearest = Infinity;
    for (const anchor of anchors.current) {
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > size.height + 100 || rect.right < 0 || rect.left > size.width) continue;
      const distance = Math.abs(rect.top + rect.height / 2 - size.height / 2);
      if (distance < nearest) { nearest = distance; best = rect; }
    }
    const isCurrent = scent.slug === selectedSlug;
    const shouldShow = Boolean(best) && (view === "home" || isCurrent || best!.width > 0);
    if (!best || !shouldShow) {
      group.current.visible = false;
      initialized.current = false;
      return;
    }
    group.current.visible = true;
    const cam = camera as THREE.OrthographicCamera;
    const zoom = cam.zoom || 100;
    desired.set((best.left + best.width / 2 - size.width / 2) / zoom, (size.height / 2 - (best.top + best.height / 2)) / zoom, 0);
    const scale = Math.min(2, Math.max(0.32, best.height / (2.5 * zoom)));
    desiredScale.setScalar(scale);
    const easing = 1 - Math.exp(-Math.min(delta, 0.06) * 9);
    if (!initialized.current) {
      group.current.position.copy(desired);
      group.current.scale.copy(desiredScale);
      initialized.current = true;
    } else {
      group.current.position.lerp(desired, easing);
      group.current.scale.lerp(desiredScale, easing);
    }
    const turn = view === "detail" && isCurrent && best.height > 290 ? window.scrollY * 0.0003 : 0;
    group.current.rotation.y += ((turn + Math.sin(clock.elapsedTime * 0.4 + Number(scent.number)) * 0.08) - group.current.rotation.y) * Math.min(1, easing);
    group.current.rotation.z = view === "home" ? Math.sin(clock.elapsedTime * 0.55 + Number(scent.number)) * 0.015 : 0;
  });

  return <group ref={group} visible={false}><BottleModel scent={scent} /></group>;
}

export default function BottleScene({ view, selectedSlug }: SceneProps) {
  useEffect(() => () => document.documentElement.classList.remove("webgl-ready"), []);
  return (
    <div className="webgl-layer" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 12], zoom: 100, near: 0.1, far: 80 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); document.documentElement.classList.add("webgl-ready"); }}
      >
        <ambientLight intensity={2.4} />
        <directionalLight position={[-3, 6, 9]} intensity={3.4} color="#fff5e8" />
        <directionalLight position={[5, 1, -3]} intensity={2.2} color="#d3a9a3" />
        <pointLight position={[0, -1, 5]} intensity={1.3} color="#ffffff" />
        {fragrances.map((scent) => <AnchoredBottle key={scent.slug} scent={scent} view={view} selectedSlug={selectedSlug} />)}
      </Canvas>
    </div>
  );
}
