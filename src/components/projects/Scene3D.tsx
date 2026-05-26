'use client';

import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html, GizmoHelper, GizmoViewport, Environment, Text } from '@react-three/drei';
import { Sun, Moon, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TableType } from '@/types';
import * as THREE from 'three';

export function Scene3D({ tableType, tiltAngle }: { tableType: TableType; tiltAngle: number }) {
  const [showLabels, setShowLabels] = useState(true);
  const [showPanels, setShowPanels] = useState(true);
  const [showFoundation, setShowFoundation] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const { panelsPerTable, parts } = tableType;
  const panelLength = 2278; // mm — schematic default since we no longer track panel dimensions
  const panelWidth = 1134;

  // Approximate geometry from parts: pick representative heights
  const frontColumn = parts.find((p) => /ön|on|front/i.test(p.name) || /P1/i.test(p.code));
  const backColumn = parts.find((p) => /arka|back/i.test(p.name) || /P2/i.test(p.code));
  const purlin = parts.find((p) => /aşık|asik|purlin/i.test(p.name) || /P3/i.test(p.code));

  const frontHeight = (frontColumn?.length || 1500) / 1000; // m
  const backHeight = (backColumn?.length || 2500) / 1000;
  const purlinLength = (purlin?.length || 3890) / 1000;

  const panelL = panelLength / 1000;
  const panelW = panelWidth / 1000;
  const tilt = (tiltAngle * Math.PI) / 180;

  return (
    <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Control Panel */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-lg p-3 w-56">
        <p className="text-xs font-semibold text-slate-700 mb-2">Görüntü Kontrolleri</p>
        <div className="space-y-1.5">
          <ToggleRow icon={showLabels ? Eye : EyeOff} label="Etiketler" value={showLabels} onChange={setShowLabels} />
          <ToggleRow icon={showPanels ? Eye : EyeOff} label="Panelleri Göster" value={showPanels} onChange={setShowPanels} />
          <ToggleRow icon={showFoundation ? Eye : EyeOff} label="Beton Temel" value={showFoundation} onChange={setShowFoundation} />
          <ToggleRow icon={darkTheme ? Moon : Sun} label="Koyu Tema" value={darkTheme} onChange={setDarkTheme} />
        </div>
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setResetKey((k) => k + 1)}>
          <RotateCcw className="w-3.5 h-3.5" /> Kamerayı Sıfırla
        </Button>
      </div>

      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-lg p-3 max-w-xs">
        <p className="text-xs font-semibold text-slate-700">3D Sehpa Önizleme</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Eğim <b>{tiltAngle}°</b> · Panel <b>{panelsPerTable}</b> · Parça <b>{parts.length}</b>
        </p>
        <p className="text-[11px] text-slate-400 mt-1.5">Fareyle döndür, ortayla kaydır, scroll ile zoom</p>
      </div>

      <div style={{ height: 600, background: darkTheme ? '#0f172a' : '#f8fafc' }}>
        <Canvas key={resetKey} shadows camera={{ position: [8, 6, 10], fov: 50 }}>
          <ambientLight intensity={darkTheme ? 0.3 : 0.6} />
          <directionalLight position={[10, 15, 5]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]}>
            <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 0.1, 50]} />
          </directionalLight>
          <hemisphereLight args={[darkTheme ? '#1e293b' : '#bae6fd', darkTheme ? '#020617' : '#22c55e', 0.4]} />

          <Suspense fallback={null}>
            {/* Ground */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[40, 30]} />
              <meshStandardMaterial color={darkTheme ? '#1e293b' : '#a3a3a3'} roughness={0.9} />
            </mesh>

            {/* Grid */}
            <Grid args={[40, 30]} cellSize={1} cellThickness={0.5} cellColor={darkTheme ? '#475569' : '#94a3b8'} sectionSize={5} sectionThickness={1} sectionColor={darkTheme ? '#64748b' : '#475569'} fadeDistance={30} fadeStrength={1} infiniteGrid={false} position={[0, 0.001, 0]} />

            {/* Foundation blocks */}
            {showFoundation && (
              <>
                <Foundation position={[-1.5, 0.15, -purlinLength / 2]} />
                <Foundation position={[1.5, 0.15, -purlinLength / 2]} />
                <Foundation position={[-1.5, 0.15, purlinLength / 2]} />
                <Foundation position={[1.5, 0.15, purlinLength / 2]} />
              </>
            )}

            {/* Columns — front (short) */}
            <Column position={[-1.5, frontHeight / 2 + 0.3, -purlinLength / 2]} height={frontHeight} color="#FF9800" label={showLabels ? `P1 Ön Kolon · ${(frontHeight * 1000).toFixed(0)}mm` : undefined} />
            <Column position={[-1.5, frontHeight / 2 + 0.3, purlinLength / 2]} height={frontHeight} color="#FF9800" />

            {/* Columns — back (tall) */}
            <Column position={[1.5, backHeight / 2 + 0.3, -purlinLength / 2]} height={backHeight} color="#FF7043" label={showLabels ? `P2 Arka Kolon · ${(backHeight * 1000).toFixed(0)}mm` : undefined} />
            <Column position={[1.5, backHeight / 2 + 0.3, purlinLength / 2]} height={backHeight} color="#FF7043" />

            {/* Purlins (horizontal beams) */}
            <Purlin start={[-1.5, frontHeight + 0.3, 0]} end={[1.5, backHeight + 0.3, 0]} label={showLabels ? `P3 Aşık · ${(purlinLength * 1000).toFixed(0)}mm` : undefined} />

            {/* Diagonal brace */}
            <Diagonal start={[-1.5, 0.3, 0]} end={[1.5, backHeight * 0.6 + 0.3, 0]} />

            {/* Panels */}
            {showPanels && (
              <PanelArray
                panelsPerTable={panelsPerTable}
                panelL={panelL}
                panelW={panelW}
                tilt={tilt}
                frontHeight={frontHeight}
                backHeight={backHeight}
                purlinLength={purlinLength}
              />
            )}

            {showLabels && (
              <Text position={[0, backHeight + 1.2, 0]} fontSize={0.25} color={darkTheme ? '#e2e8f0' : '#1e293b'} anchorX="center" anchorY="middle">
                {`${tiltAngle}° tilt`}
              </Text>
            )}
          </Suspense>

          <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={4} maxDistance={50} target={[0, 1, 0]} />
          <GizmoHelper alignment="bottom-left" margin={[60, 60]}>
            <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
          </GizmoHelper>
        </Canvas>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, value, onChange }: { icon: any; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer text-xs gap-2">
      <span className="flex items-center gap-1.5 text-slate-700">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-primary cursor-pointer" />
    </label>
  );
}

function Foundation({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[0.5, 0.3, 0.5]} />
      <meshStandardMaterial color="#9ca3af" roughness={0.95} />
    </mesh>
  );
}

function Column({ position, height, color, label }: { position: [number, number, number]; height: number; color: string; label?: string }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.18, height, 0.08]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
      </mesh>
      {label && (
        <Html position={[0.3, 0, 0]} distanceFactor={10}>
          <div className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Purlin({ start, end, label }: { start: [number, number, number]; end: [number, number, number]; label?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const s = new THREE.Vector3(...start);
  const e = new THREE.Vector3(...end);
  const length = s.distanceTo(e);
  const mid: [number, number, number] = [(s.x + e.x) / 2, (s.y + e.y) / 2, (s.z + e.z) / 2];
  const angle = Math.atan2(e.y - s.y, e.x - s.x);
  return (
    <group position={mid} rotation={[0, 0, angle]}>
      <mesh ref={ref} castShadow receiveShadow>
        <boxGeometry args={[length, 0.08, 0.05]} />
        <meshStandardMaterial color="#FFC107" metalness={0.4} roughness={0.5} />
      </mesh>
      {label && (
        <Html position={[0, 0.2, 0]} distanceFactor={10}>
          <div className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Diagonal({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const s = new THREE.Vector3(...start);
  const e = new THREE.Vector3(...end);
  const length = s.distanceTo(e);
  const mid: [number, number, number] = [(s.x + e.x) / 2, (s.y + e.y) / 2, (s.z + e.z) / 2];
  const angle = Math.atan2(e.y - s.y, e.x - s.x);
  return (
    <mesh position={mid} rotation={[0, 0, angle]} castShadow>
      <boxGeometry args={[length, 0.06, 0.04]} />
      <meshStandardMaterial color="#FB923C" metalness={0.3} roughness={0.6} />
    </mesh>
  );
}

function PanelArray({ panelsPerTable, panelL, panelW, tilt, frontHeight, backHeight, purlinLength }: any) {
  // Panels in portrait, arranged along Z-axis (along purlin)
  // Tilted by tilt around Z axis
  const totalCols = panelsPerTable;
  // Place panels evenly along purlin length
  const spacing = (purlinLength + 0.2) / totalCols;
  const avgHeight = (frontHeight + backHeight) / 2 + 0.35;

  return (
    <group rotation={[0, 0, -tilt]}>
      {Array.from({ length: totalCols }, (_, i) => {
        const offsetZ = (i - totalCols / 2 + 0.5) * spacing;
        return (
          <mesh
            key={i}
            position={[0, avgHeight, offsetZ]}
            rotation={[0, 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[panelL, 0.04, Math.min(spacing * 0.9, panelW)]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.3} emissive="#0c2266" emissiveIntensity={0.15} />
          </mesh>
        );
      })}
    </group>
  );
}
