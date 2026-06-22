"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useCursor, useFBX } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { bodyRegionLabels, type BodyRegion } from "@/lib/diagnostic-records";

export type AnatomyRegionSummary = {
  count: number;
  currentCount: number;
};

type AnatomyLayer = "surface" | "organs";

const anatomicalModelUrl =
  "https://raw.githubusercontent.com/Z-Anatomy/Unity-app_Z-Anatomy/PC-Version/Resources/Models/FBX/Regions%20of%20human%20body100.fbx";

export function AnatomicalBodyView({
  selectedRegion,
  summaries,
  onSelect
}: {
  selectedRegion: BodyRegion;
  summaries: Partial<Record<BodyRegion, AnatomyRegionSummary>>;
  onSelect: (region: BodyRegion) => void;
}) {
  const [layer, setLayer] = useState<AnatomyLayer>("surface");

  return (
    <div className="anatomy-explorer">
      <div className="anatomy-control-bar">
        <div className="anatomy-layer-control segmented-control compact" aria-label="Anatomy layer">
          <button
            aria-pressed={layer === "surface"}
            className={layer === "surface" ? "active" : ""}
            onClick={() => setLayer("surface")}
            type="button"
          >
            Body
          </button>
          <button
            aria-pressed={layer === "organs"}
            className={layer === "organs" ? "active" : ""}
            onClick={() => setLayer("organs")}
            type="button"
          >
            Organs
          </button>
        </div>
        <label className="anatomy-region-select">
          <span>Region</span>
          <select onChange={(event) => onSelect(event.target.value as BodyRegion)} value={selectedRegion}>
            {Object.entries(bodyRegionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="anatomy-canvas-wrap">
        <Canvas
          camera={{ fov: 31, near: 0.1, far: 100, position: [0, 0.1, 11.6] }}
          dpr={[1, 1.75]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          shadows
        >
          <color args={["#f8fafc"]} attach="background" />
          <ambientLight intensity={1.25} />
          <directionalLight castShadow intensity={2.2} position={[4, 7, 6]} />
          <directionalLight color="#b9d7ff" intensity={1.1} position={[-4, 2, 3]} />
          <Suspense fallback={null}>
            <group position={[0, -0.15, 0]}>
              <AnatomicalSurfaceModel
                onSelect={onSelect}
                selectedRegion={selectedRegion}
                summaries={summaries}
                visible={layer === "surface"}
              />
              {layer === "organs" ? (
                <>
                  <HumanSurface layer="organs" onSelect={onSelect} selectedRegion={selectedRegion} summaries={summaries} />
                  <InternalOrgans onSelect={onSelect} selectedRegion={selectedRegion} summaries={summaries} />
                </>
              ) : null}
            </group>
          </Suspense>
          <mesh position={[0, -3.65, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.15, 64]} />
            <shadowMaterial opacity={0.14} />
          </mesh>
          <OrbitControls
            enablePan={false}
            maxDistance={15}
            minDistance={8.2}
            target={[0, -0.3, 0]}
          />
        </Canvas>
      </div>

      <div className="anatomy-orientation" aria-hidden="true">
        <span>R</span>
        <strong>3D</strong>
        <span>L</span>
      </div>
    </div>
  );
}

function AnatomicalSurfaceModel({
  visible,
  selectedRegion,
  summaries,
  onSelect
}: {
  visible: boolean;
  selectedRegion: BodyRegion;
  summaries: Partial<Record<BodyRegion, AnatomyRegionSummary>>;
  onSelect: (region: BodyRegion) => void;
}) {
  const source = useFBX(anatomicalModelUrl);
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
  useCursor(Boolean(hoveredRegion));

  const model = useMemo(() => {
    const clone = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    const height = bounds.max.y - bounds.min.y;
    const scale = 6.25 / height;

    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object.name.toLowerCase().endsWith("j") || !object.geometry.attributes.position?.count) {
        object.visible = false;
        return;
      }
      const region = inferModelRegion(object.name);
      if (region) object.userData.bodyRegion = region;
      object.castShadow = true;
      object.receiveShadow = true;
      object.material = new THREE.MeshPhysicalMaterial({
        color: "#d9b29d",
        roughness: 0.72,
        metalness: 0,
        clearcoat: 0.08,
        clearcoatRoughness: 0.7,
        side: THREE.DoubleSide
      });
    });

    return clone;
  }, [source]);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshPhysicalMaterial)) return;
      const region = object.userData.bodyRegion as BodyRegion | undefined;
      const summary = region ? summaries[region] : undefined;
      const highlighted = Boolean(region && (selectedRegion === region || hoveredRegion === region));
      const color = highlighted
        ? "#2f74bd"
        : summary?.currentCount
          ? "#3f9591"
          : summary?.count
            ? "#bc8138"
            : "#d9b29d";
      object.material.color.set(color);
      object.material.opacity = 0.96;
      object.material.transparent = false;
      object.material.depthWrite = true;
      object.material.emissive.set(highlighted ? "#12365d" : "#000000");
      object.material.emissiveIntensity = highlighted ? 0.16 : 0;
      object.material.needsUpdate = true;
    });
  }, [hoveredRegion, model, selectedRegion, summaries]);

  function regionFromEvent(event: ThreeEvent<PointerEvent | MouseEvent>) {
    return event.object.userData.bodyRegion as BodyRegion | undefined;
  }

  return (
    <primitive
      object={model}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const region = regionFromEvent(event);
        if (region) onSelect(region);
      }}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHoveredRegion(regionFromEvent(event) ?? null);
      }}
      onPointerOut={() => setHoveredRegion(null)}
      visible={visible}
    />
  );
}

function inferModelRegion(meshName: string): BodyRegion | null {
  const name = meshName.toLowerCase();
  const side = name.endsWith("l") ? "left" : name.endsWith("r") ? "right" : null;

  if (/(foot|toe|halluc|heel|sole|malleol|ankle)/.test(name)) {
    return side === "left" ? "left-foot" : "right-foot";
  }
  if (/(leg|knee|thigh|femoral|popliteal)/.test(name)) {
    return side === "left" ? "left-leg" : "right-leg";
  }
  if (/(hand|finger|digit|palm|wrist|forearm|arm|elbow|cubital|bicipital|deltoid)/.test(name)) {
    return side === "left" ? "left-arm" : "right-arm";
  }
  if (/(gluteal|hip|inguinal|perine|pubic|genital|pelvi)/.test(name)) return "pelvis";
  if (/(abdomen|abdominal|umbilic|epigastric|hypogastric|hypochondriac)/.test(name)) return "abdomen";
  if (/(back|lumbar|sacral|vertebral|scapular)/.test(name)) return "back";
  if (/(chest|thorax|thoracic|sternal|pectoral|breast|mammar|clavicular)/.test(name)) return "chest";
  if (/(head|neck|cran|fac|forehead|frontal|temporal|occipital|auricul|ear|eye|nas|nose|oral|mouth|lip|chin|mental|cheek|buccal|jaw)/.test(name)) {
    return "head-neck";
  }
  return null;
}

useFBX.preload(anatomicalModelUrl);

function HumanSurface({
  layer,
  selectedRegion,
  summaries,
  onSelect
}: {
  layer: AnatomyLayer;
  selectedRegion: BodyRegion;
  summaries: Partial<Record<BodyRegion, AnatomyRegionSummary>>;
  onSelect: (region: BodyRegion) => void;
}) {
  const opacity = layer === "organs" ? 0.2 : 0.92;

  return (
    <group scale={0.92}>
      <AnatomyPart
        geometry={<sphereGeometry args={[0.42, 42, 32]} />}
        opacity={opacity}
        onSelect={onSelect}
        position={[0, 2.58, 0]}
        region="head-neck"
        scale={[0.88, 1.08, 0.9]}
        selectedRegion={selectedRegion}
        summaries={summaries}
      />
      <AnatomyPart
        geometry={<capsuleGeometry args={[0.2, 0.24, 8, 24]} />}
        opacity={opacity}
        onSelect={onSelect}
        position={[0, 2.06, 0]}
        region="head-neck"
        selectedRegion={selectedRegion}
        summaries={summaries}
      />
      <AnatomyPart
        geometry={<capsuleGeometry args={[0.67, 0.96, 12, 36]} />}
        opacity={opacity}
        onSelect={onSelect}
        position={[0, 1.25, 0]}
        region="chest"
        scale={[1.08, 1, 0.63]}
        selectedRegion={selectedRegion}
        summaries={summaries}
      />
      <AnatomyPart
        geometry={<capsuleGeometry args={[0.52, 0.55, 12, 32]} />}
        opacity={opacity}
        onSelect={onSelect}
        position={[0, 0.34, 0]}
        region="abdomen"
        scale={[1, 1, 0.68]}
        selectedRegion={selectedRegion}
        summaries={summaries}
      />
      <AnatomyPart
        geometry={<sphereGeometry args={[0.61, 36, 24]} />}
        opacity={opacity}
        onSelect={onSelect}
        position={[0, -0.28, 0]}
        region="pelvis"
        scale={[1.1, 0.66, 0.72]}
        selectedRegion={selectedRegion}
        summaries={summaries}
      />
      <Limb side="right" opacity={opacity} onSelect={onSelect} selectedRegion={selectedRegion} summaries={summaries} />
      <Limb side="left" opacity={opacity} onSelect={onSelect} selectedRegion={selectedRegion} summaries={summaries} />
      <Leg side="right" opacity={opacity} onSelect={onSelect} selectedRegion={selectedRegion} summaries={summaries} />
      <Leg side="left" opacity={opacity} onSelect={onSelect} selectedRegion={selectedRegion} summaries={summaries} />
    </group>
  );
}

function Limb({ side, ...props }: AnatomySideProps) {
  const sign = side === "right" ? -1 : 1;
  const region: BodyRegion = side === "right" ? "right-arm" : "left-arm";
  return (
    <group>
      <AnatomyPart {...props} geometry={<sphereGeometry args={[0.25, 28, 20]} />} position={[sign * 0.79, 1.62, 0]} region={region} scale={[1, 1.12, 0.92]} />
      <AnatomyPart {...props} geometry={<capsuleGeometry args={[0.2, 0.9, 8, 24]} />} position={[sign * 1.02, 0.92, 0]} region={region} rotation={[0, 0, sign * 0.18]} scale={[1, 1, 0.92]} />
      <AnatomyPart {...props} geometry={<capsuleGeometry args={[0.16, 0.78, 8, 24]} />} position={[sign * 1.21, -0.03, 0]} region={region} rotation={[0, 0, sign * 0.16]} scale={[1, 1, 0.9]} />
      <AnatomyPart {...props} geometry={<capsuleGeometry args={[0.17, 0.2, 8, 20]} />} position={[sign * 1.3, -0.62, 0]} region={region} scale={[0.88, 1.2, 0.55]} />
    </group>
  );
}

function Leg({ side, ...props }: AnatomySideProps) {
  const sign = side === "right" ? -1 : 1;
  const legRegion: BodyRegion = side === "right" ? "right-leg" : "left-leg";
  const footRegion: BodyRegion = side === "right" ? "right-foot" : "left-foot";
  return (
    <group>
      <AnatomyPart {...props} geometry={<capsuleGeometry args={[0.28, 1.18, 10, 28]} />} position={[sign * 0.35, -1.2, 0]} region={legRegion} rotation={[0, 0, sign * 0.04]} scale={[1, 1, 0.9]} />
      <AnatomyPart {...props} geometry={<sphereGeometry args={[0.24, 28, 20]} />} position={[sign * 0.38, -2.02, 0]} region={legRegion} scale={[1, 1.1, 0.9]} />
      <AnatomyPart {...props} geometry={<capsuleGeometry args={[0.2, 1.02, 10, 26]} />} position={[sign * 0.4, -2.75, 0]} region={legRegion} scale={[0.9, 1, 0.82]} />
      <AnatomyPart {...props} geometry={<capsuleGeometry args={[0.21, 0.42, 8, 24]} />} position={[sign * 0.4, -3.42, 0.13]} region={footRegion} rotation={[Math.PI / 2.4, 0, 0]} scale={[0.9, 1.15, 0.7]} />
    </group>
  );
}

type AnatomySideProps = {
  side: "left" | "right";
  opacity: number;
  selectedRegion: BodyRegion;
  summaries: Partial<Record<BodyRegion, AnatomyRegionSummary>>;
  onSelect: (region: BodyRegion) => void;
};

function InternalOrgans({
  selectedRegion,
  summaries,
  onSelect
}: Omit<AnatomySideProps, "side" | "opacity">) {
  return (
    <group scale={0.92}>
      <OrganPart color="#d9a9a0" label="Brain" onSelect={onSelect} position={[0, 2.6, 0.04]} region="head-neck" scale={[0.32, 0.38, 0.28]} selectedRegion={selectedRegion} summaries={summaries} />
      <OrganPart color="#d68282" label="Right lung" onSelect={onSelect} position={[-0.27, 1.31, 0.08]} region="chest" scale={[0.3, 0.58, 0.22]} selectedRegion={selectedRegion} summaries={summaries} />
      <OrganPart color="#d68282" label="Left lung" onSelect={onSelect} position={[0.27, 1.31, 0.08]} region="chest" scale={[0.3, 0.58, 0.22]} selectedRegion={selectedRegion} summaries={summaries} />
      <OrganPart color="#a4142e" label="Heart" onSelect={onSelect} position={[0.08, 1.08, 0.28]} region="chest" rotation={[0, 0, -0.22]} scale={[0.22, 0.3, 0.2]} selectedRegion={selectedRegion} summaries={summaries} />
      <OrganPart color="#8d3129" label="Liver" onSelect={onSelect} position={[-0.18, 0.52, 0.15]} region="abdomen" rotation={[0, 0, 0.12]} scale={[0.48, 0.24, 0.24]} selectedRegion={selectedRegion} summaries={summaries} />
      <OrganPart color="#d99573" label="Stomach" onSelect={onSelect} position={[0.27, 0.34, 0.16]} region="abdomen" rotation={[0, 0, -0.35]} scale={[0.25, 0.35, 0.2]} selectedRegion={selectedRegion} summaries={summaries} />
      <OrganPart color="#875035" label="Right kidney" onSelect={onSelect} position={[-0.3, 0.12, -0.12]} region="abdomen" scale={[0.14, 0.25, 0.12]} selectedRegion={selectedRegion} summaries={summaries} />
      <OrganPart color="#875035" label="Left kidney" onSelect={onSelect} position={[0.3, 0.12, -0.12]} region="abdomen" scale={[0.14, 0.25, 0.12]} selectedRegion={selectedRegion} summaries={summaries} />
    </group>
  );
}

function OrganPart({
  label,
  ...props
}: Omit<AnatomyPartProps, "geometry" | "opacity" | "tooltip"> & { label: string }) {
  return (
    <AnatomyPart
      {...props}
      geometry={<sphereGeometry args={[1, 32, 24]} />}
      opacity={1}
      tooltip={label}
    />
  );
}

type AnatomyPartProps = {
  region: BodyRegion;
  selectedRegion: BodyRegion;
  summaries: Partial<Record<BodyRegion, AnatomyRegionSummary>>;
  onSelect: (region: BodyRegion) => void;
  geometry: React.ReactNode;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  opacity: number;
  color?: string;
  tooltip?: string;
};

function AnatomyPart({
  region,
  selectedRegion,
  summaries,
  onSelect,
  geometry,
  position,
  rotation,
  scale,
  opacity,
  color,
  tooltip
}: AnatomyPartProps) {
  const [hovered, setHovered] = useState(false);
  const summary = summaries[region];
  const selected = selectedRegion === region;
  useCursor(hovered);
  const baseColor = color ?? (summary?.currentCount ? "#4c9e9c" : summary?.count ? "#c79046" : "#dbe3eb");
  const displayColor = selected || hovered ? "#3378c5" : baseColor;

  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(region);
  }

  return (
    <mesh
      castShadow
      name={tooltip ?? region}
      onClick={select}
      onPointerOut={() => setHovered(false)}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {geometry}
      <meshPhysicalMaterial
        color={displayColor}
        depthWrite={opacity > 0.5}
        metalness={0.02}
        opacity={opacity}
        roughness={0.6}
        side={THREE.DoubleSide}
        transparent={opacity < 1}
      />
    </mesh>
  );
}
