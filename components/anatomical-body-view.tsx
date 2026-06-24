"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useCursor, useFBX } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { bodyRegionLabels, type BodyRegion } from "@/lib/diagnostic-records";

export type AnatomyRegionSummary = {
  count: number;
  currentCount: number;
};

type AnatomyLayer = "surface" | "organs";
type SurfaceDisplayMode = "clinical" | "context";

const anatomicalModelUrl =
  "https://raw.githubusercontent.com/Z-Anatomy/Unity-app_Z-Anatomy/PC-Version/Resources/Models/FBX/Regions%20of%20human%20body100.fbx";
const visceralModelUrl =
  "https://raw.githubusercontent.com/Z-Anatomy/Unity-app_Z-Anatomy/PC-Version/Resources/Models/FBX/VisceralSystem100.fbx";
const referenceBodyHeight = 174.37225661187355;
const referenceBodyCenter: [number, number, number] = [-3.734500054594573, 87.14788533796111, 1.1369439999576674];
const referenceBodyScale = 6.25 / referenceBodyHeight;

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
  const [isOrganLoading, setIsOrganLoading] = useState(false);
  const handleOrganReady = useCallback(() => setIsOrganLoading(false), []);

  return (
    <div className="anatomy-explorer">
      <div className="anatomy-control-bar">
        <div className="anatomy-layer-control segmented-control compact" aria-label="Anatomy layer">
          <button
            aria-pressed={layer === "surface"}
            className={layer === "surface" ? "active" : ""}
            onClick={() => {
              setLayer("surface");
              setIsOrganLoading(false);
            }}
            type="button"
          >
            Body
          </button>
          <button
            aria-pressed={layer === "organs"}
            className={layer === "organs" ? "active" : ""}
            onClick={() => {
              setLayer("organs");
              setIsOrganLoading(true);
            }}
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
          <group position={[0, -0.15, 0]}>
            <Suspense fallback={null}>
              <AnatomicalSurfaceModel
                displayMode={layer === "surface" ? "clinical" : "context"}
                onSelect={onSelect}
                selectedRegion={selectedRegion}
                summaries={summaries}
              />
            </Suspense>
            {layer === "organs" ? (
              <Suspense fallback={null}>
                <>
                  <VisceralSystemModel onReady={handleOrganReady} onSelect={onSelect} selectedRegion={selectedRegion} summaries={summaries} />
                  <SupplementalOrgans onSelect={onSelect} selectedRegion={selectedRegion} summaries={summaries} />
                </>
              </Suspense>
            ) : null}
          </group>
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

      {isOrganLoading ? <div className="anatomy-layer-status" role="status">Loading detailed organs...</div> : null}

      <div className="anatomy-orientation" aria-hidden="true">
        <span>R</span>
        <strong>3D</strong>
        <span>L</span>
      </div>
    </div>
  );
}

function AnatomicalSurfaceModel({
  displayMode,
  selectedRegion,
  summaries,
  onSelect
}: {
  displayMode: SurfaceDisplayMode;
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
      const meshName = object.name.toLowerCase();
      const isSensitiveGeometry = meshName.includes("urogenital_region") || meshName === "pubic_hairs";
      if (meshName.endsWith("j") || isSensitiveGeometry || !object.geometry.attributes.position?.count) {
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
  const modestyGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.28, 0.18);
    shape.lineTo(0.28, 0.18);
    shape.lineTo(0.25, 0.02);
    shape.lineTo(0.14, -0.25);
    shape.lineTo(-0.14, -0.25);
    shape.lineTo(-0.25, 0.02);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 3 });
  }, []);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshPhysicalMaterial)) return;
      if (displayMode === "context") {
        object.material.color.set("#d7dee7");
        object.material.opacity = 0.1;
        object.material.transparent = true;
        object.material.depthWrite = false;
        object.material.emissive.set("#000000");
        object.material.emissiveIntensity = 0;
        object.material.needsUpdate = true;
        return;
      }
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
  }, [displayMode, hoveredRegion, model, selectedRegion, summaries]);

  function regionFromEvent(event: ThreeEvent<PointerEvent | MouseEvent>) {
    return event.object.userData.bodyRegion as BodyRegion | undefined;
  }

  return (
    <>
      <primitive
        object={model}
        onClick={displayMode === "clinical" ? (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          const region = regionFromEvent(event);
          if (region) onSelect(region);
        } : undefined}
        onPointerMove={displayMode === "clinical" ? (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHoveredRegion(regionFromEvent(event) ?? null);
        } : undefined}
        onPointerOut={displayMode === "clinical" ? () => setHoveredRegion(null) : undefined}
      />
      {displayMode === "clinical" ? (
        <mesh geometry={modestyGeometry} position={[0.134, -0.06, 0.31]}>
          <meshPhysicalMaterial color="#647584" roughness={0.78} clearcoat={0.04} />
        </mesh>
      ) : null}
    </>
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

function VisceralSystemModel({
  selectedRegion,
  summaries,
  onSelect,
  onReady
}: {
  selectedRegion: BodyRegion;
  summaries: Partial<Record<BodyRegion, AnatomyRegionSummary>>;
  onSelect: (region: BodyRegion) => void;
  onReady: () => void;
}) {
  const source = useFBX(visceralModelUrl);
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
  useCursor(Boolean(hoveredRegion));

  const model = useMemo(() => {
    const clone = source.clone(true);
    clone.scale.setScalar(referenceBodyScale);
    clone.position.set(
      -referenceBodyCenter[0] * referenceBodyScale,
      -referenceBodyCenter[1] * referenceBodyScale,
      -referenceBodyCenter[2] * referenceBodyScale
    );
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const descriptor = describeVisceralStructure(object.name);
      if (!descriptor || !object.geometry.attributes.position?.count) {
        object.visible = false;
        return;
      }
      object.userData.bodyRegion = descriptor.region;
      object.userData.baseColor = descriptor.color;
      object.castShadow = true;
      object.receiveShadow = true;
      object.material = new THREE.MeshPhysicalMaterial({
        color: descriptor.color,
        roughness: 0.58,
        metalness: 0,
        clearcoat: 0.12,
        clearcoatRoughness: 0.74,
        side: THREE.DoubleSide
      });
    });
    return clone;
  }, [source]);

  useEffect(() => onReady(), [onReady, source]);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshPhysicalMaterial)) return;
      const region = object.userData.bodyRegion as BodyRegion | undefined;
      const baseColor = new THREE.Color(String(object.userData.baseColor || "#b86d61"));
      const highlighted = Boolean(region && (selectedRegion === region || hoveredRegion === region));
      object.material.color.copy(baseColor);
      object.material.emissive.set(highlighted ? "#12365d" : "#000000");
      object.material.emissiveIntensity = highlighted ? 0.18 : 0;
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
    />
  );
}

function describeVisceralStructure(meshName: string): { region: BodyRegion; color: string } | null {
  const name = meshName.toLowerCase();
  if (name.endsWith("j") || /cavity|cross_section|profile|mucosa|omentum|mesocolon|taenia/.test(name)) return null;

  if (/lobe_of_(left|right)_lung|main_bronchus|^trachea$/.test(name)) return { region: "chest", color: "#c8787b" };
  if (name === "liver") return { region: "abdomen", color: "#8e3c32" };
  if (/^gallbladder$|^bile_duct$/.test(name)) return { region: "abdomen", color: "#728848" };
  if (name === "pancreas") return { region: "abdomen", color: "#d6a269" };
  if (/^stomach$|^oesophagus$/.test(name)) return { region: "abdomen", color: "#c88168" };
  if (/^duodenum$|^jejunum$|_colon$|vermiform_appendix/.test(name)) return { region: "abdomen", color: "#d59a78" };
  if (/^kidney[lr]$|^renal_pelvis[lr]$|^ureter[lr]$/.test(name)) return { region: "abdomen", color: "#8d5546" };
  if (/^urinary_bladder$|^urethra$|prostate|testis|epididymis|ductus_deferens|seminal_gland/.test(name)) {
    return { region: "pelvis", color: "#b77972" };
  }
  if (/thyroid_gland|parathyroid_gland|^tongue$|salivary_gland|^uvula_of_palate$|^soft_palate$|pharynx/.test(name)) {
    return { region: "head-neck", color: "#c88488" };
  }
  if (/suprarenal_gland/.test(name)) return { region: "abdomen", color: "#c79255" };
  return null;
}

function SupplementalOrgans({
  selectedRegion,
  summaries,
  onSelect
}: {
  selectedRegion: BodyRegion;
  summaries: Partial<Record<BodyRegion, AnatomyRegionSummary>>;
  onSelect: (region: BodyRegion) => void;
}) {
  return (
    <group scale={0.92}>
      <group position={[0.07, 1.06, 0.27]} rotation={[0, 0, -0.2]}>
        <OrganPart color="#a4142e" label="Heart" onSelect={onSelect} position={[-0.09, 0.08, 0]} region="chest" scale={[0.16, 0.2, 0.16]} selectedRegion={selectedRegion} summaries={summaries} />
        <OrganPart color="#a4142e" label="Heart" onSelect={onSelect} position={[0.09, 0.08, 0]} region="chest" scale={[0.16, 0.2, 0.16]} selectedRegion={selectedRegion} summaries={summaries} />
        <AnatomyPart color="#981329" geometry={<coneGeometry args={[0.25, 0.46, 28]} />} opacity={1} onSelect={onSelect} position={[0, -0.15, 0]} region="chest" rotation={[0, 0, Math.PI]} selectedRegion={selectedRegion} summaries={summaries} />
      </group>
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
  const highlighted = selected || hovered;

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
        color={baseColor}
        depthWrite={opacity > 0.5}
        emissive={highlighted ? "#12365d" : "#000000"}
        emissiveIntensity={highlighted ? 0.22 : 0}
        metalness={0.02}
        opacity={opacity}
        roughness={0.6}
        side={THREE.DoubleSide}
        transparent={opacity < 1}
      />
    </mesh>
  );
}
