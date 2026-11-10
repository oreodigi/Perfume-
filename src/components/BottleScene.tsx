"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fragrances, type Fragrance } from "@/data/fragrances";

type SceneProps = { view: "home" | "detail"; selectedSlug: string };

function roundedPrism(width: number, height: number, depth: number, radius: number) {
  const x = -width / 2;
  const y = -height / 2;
  const r = radius;
  const path = new THREE.Shape();
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.quadraticCurveTo(x + width, y, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  const geometry = new THREE.ExtrudeGeometry(path, {
    depth, steps: 1, curveSegments: 12, bevelEnabled: true,
    bevelThickness: 0.065, bevelSize: 0.042, bevelSegments: 4,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function makeLabel(scent: Fragrance) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#f0e7d8";
  ctx.fillRect(0, 0, 600, 720);
  ctx.strokeStyle = "#a68a65";
  ctx.lineWidth = 3;
  ctx.strokeRect(29, 29, 542, 662);
  ctx.strokeStyle = "#ccb891";
  ctx.lineWidth = 1;
  ctx.strokeRect(38, 38, 524, 644);
  ctx.textAlign = "center";
  ctx.fillStyle = "#7d564a";
  ctx.font = "600 19px Arial";
  ctx.fillText("MAISON DE PARFUM", 300, 115);
  ctx.fillStyle = "#422123";
  ctx.font = "500 81px Georgia";
  ctx.fillText("ÉCORCE", 300, 263);
  ctx.fillStyle = "#b9975b";
  ctx.font = "48px Georgia";
  ctx.fillText("✳", 300, 344);
  const first = scent.name.toUpperCase();
  const fontSize = first.length > 12 ? 32 : 40;
  ctx.font = "600 " + fontSize + "px Georgia";
  ctx.fillStyle = "#452c2b";
  ctx.fillText(first, 300, 438);
  ctx.fillStyle = "#b9975b";
  ctx.fillRect(228, 478, 144, 2);
  ctx.font = "500 21px Arial";
  ctx.fillStyle = "#6f5550";
  ctx.fillText("EXTRAIT DE PARFUM", 300, 556);
  ctx.font = "500 18px Arial";
  ctx.fillText("50 ML  ·  NO. " + scent.number, 300, 618);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function BottleModel({ scent }: { scent: Fragrance }) {
  const design = (Number(scent.number) - 1) % 5;
  const bodyGeometry = useMemo(() => {
    if (design === 1) return roundedPrism(1.19, 1.53, 0.54, 0.3);
    if (design === 2) return roundedPrism(0.93, 1.68, 0.47, 0.11);
    if (design === 3) return new THREE.CylinderGeometry(0.6, 0.62, 1.52, 48);
    if (design === 4) return new THREE.CylinderGeometry(0.67, 0.64, 1.46, 8);
    return roundedPrism(1.24, 1.51, 0.55, 0.12);
  }, [design]);
  const label = useMemo(() => makeLabel(scent), [scent]);
  useEffect(() => () => { bodyGeometry.dispose(); label?.dispose(); }, [bodyGeometry, label]);
  const liquid = useMemo(() => new THREE.Color(scent.color), [scent.color]);
  const front = design === 3 || design === 4 ? 0.58 : design === 2 ? 0.29 : 0.33;
  const labelWidth = design === 2 ? 0.67 : 0.79;
  const cylinderCap = design === 1 || design === 3;
  const capColor = design === 2 ? "#241b18" : design === 4 ? "#59422f" : design === 1 ? "#c3a574" : "#30211d";

  return (
    <group>
      <mesh geometry={bodyGeometry} castShadow>
        <meshPhysicalMaterial color="#fff7ed" roughness={0.055} metalness={0.02}
          transmission={0.74} thickness={1.45} ior={1.48}
          clearcoat={1} clearcoatRoughness={0.045} envMapIntensity={1.9} />
      </mesh>
      <mesh geometry={bodyGeometry} scale={[0.91, 0.81, 0.82]} position={[0, -0.11, 0]}>
        <meshPhysicalMaterial color={liquid} transparent opacity={0.66}
          roughness={0.17} metalness={0.06} clearcoat={0.7} transmission={0.07} />
      </mesh>
      <mesh position={[0, 0.80, 0]} castShadow>
        <cylinderGeometry args={[0.23, 0.25, 0.25, 40]} />
        <meshStandardMaterial color="#c8a978" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.96, 0]} castShadow>
        {cylinderCap ? <cylinderGeometry args={[design === 1 ? 0.36 : 0.31, 0.34, 0.46, 48]} /> : design === 4 ?
          <cylinderGeometry args={[0.4, 0.39, 0.5, 8]} /> :
          <boxGeometry args={[design === 2 ? 0.53 : 0.7, 0.5, design === 2 ? 0.52 : 0.6]} />}
        <meshPhysicalMaterial color={capColor} metalness={design === 1 ? 0.86 : 0.26}
          roughness={design === 4 ? 0.55 : 0.22} clearcoat={0.45} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <cylinderGeometry args={[cylinderCap ? 0.31 : 0.28, cylinderCap ? 0.31 : 0.28, 0.036, 48]} />
        <meshStandardMaterial color="#d4b47d" metalness={0.9} roughness={0.19}/>
      </mesh>
      <mesh position={[0, 0.725, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.043, 40]}/>
        <meshStandardMaterial color="#d0b98b" metalness={0.85} roughness={0.17}/>
      </mesh>
      {label && (
        <mesh position={[0, -0.12, front + 0.01]}>
          <planeGeometry args={[labelWidth, 0.84]}/>
          <meshStandardMaterial map={label} roughness={0.83} transparent={false} metalness={0} side={THREE.DoubleSide}/>
        </mesh>
      )}
      <mesh position={[-0.39, -0.06, front + 0.013]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.052, 1.06]}/>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.73, front + 0.005]}>
        <boxGeometry args={[0.54, 0.025, 0.01]}/>
        <meshStandardMaterial color="#bfa077" roughness={0.24} metalness={0.64}/>
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
    const update = () => {
      anchors.current = Array.from(document.querySelectorAll<HTMLElement>('[data-bottle-anchor="' + scent.slug + '"]'));
    };
    update();
    const raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [scent.slug, view, selectedSlug]);

  useFrame(({ clock }, delta) => {
    const node = group.current;
    if (!node) return;
    let nearest = Infinity;
    let best: DOMRect | null = null;
    for (const anchor of anchors.current) {
      const rect = anchor.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10 || rect.bottom < -80 || rect.top > size.height + 80 || rect.right < -80 || rect.left > size.width + 80) continue;
      const distance = Math.abs(rect.top + rect.height / 2 - size.height / 2);
      if (distance < nearest) { best = rect; nearest = distance; }
    }
    if (!best) { node.visible = false; initialized.current = false; return; }
    const rect = best as DOMRect;
    node.visible = true;
    const zoom = (camera as THREE.OrthographicCamera).zoom || 100;
    desired.set((rect.left + rect.width / 2 - size.width / 2) / zoom, (size.height / 2 - (rect.top + rect.height / 2)) / zoom, 0);
    const factor = Math.min(2.15, Math.max(0.28, rect.height / (2.7 * zoom)));
    desiredScale.setScalar(factor);
    const ease = 1 - Math.exp(-Math.min(delta, 0.05) * 10);
    if (!initialized.current) {
      node.position.copy(desired); node.scale.copy(desiredScale); initialized.current = true;
    } else {
      node.position.lerp(desired, ease); node.scale.lerp(desiredScale, ease);
    }
    const turn = view === "detail" && scent.slug === selectedSlug && rect.height > 260 ? window.scrollY * 0.00027 : 0;
    node.rotation.y += (turn + Math.sin(clock.elapsedTime * 0.42 + Number(scent.number)) * 0.085 - node.rotation.y) * ease;
    node.rotation.z = view === "home" ? Math.sin(clock.elapsedTime * 0.5 + Number(scent.number)) * 0.012 : 0;
  });

  return <group ref={group} visible={false}><BottleModel scent={scent}/></group>;
}

export default function BottleScene({ view, selectedSlug }: SceneProps) {
  useEffect(() => () => document.documentElement.classList.remove("webgl-ready"), []);
  return (
    <div className="webgl-layer" aria-hidden="true">
      <Canvas orthographic camera={{ position: [0, 0, 12], zoom: 100, near: 0.1, far: 80 }}
        dpr={[1, 1.4]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); document.documentElement.classList.add("webgl-ready"); }}>
        <ambientLight intensity={2.1}/>
        <directionalLight position={[-4, 7, 10]} intensity={3.1} color="#fff4e2"/>
        <directionalLight position={[5, 1, -3]} intensity={2.4} color="#d5b0aa"/>
        <pointLight position={[0, -2, 4]} intensity={1.3} color="#fffdf8"/>
        {fragrances.map(item => <AnchoredBottle key={item.slug} scent={item} view={view} selectedSlug={selectedSlug}/>)}
      </Canvas>
    </div>
  );
}
