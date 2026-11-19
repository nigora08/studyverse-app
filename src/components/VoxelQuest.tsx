import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Text, Box } from '@react-three/drei';
import * as THREE from 'three';
import type { Concept } from '../utils/contentExtractor';

interface VoxelQuestProps {
  concept: Concept;
  onProgress: (progress: number, score: number) => void;
}

function Player({ onInteract }: { onInteract: (pos: THREE.Vector3) => void }) {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({ w: false, a: false, s: false, d: false, space: false });

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (k === 'w') keys.current.w = down;
      if (k === 'a') keys.current.a = down;
      if (k === 's') keys.current.s = down;
      if (k === 'd') keys.current.d = down;
      if (e.code === 'Space') keys.current.space = down;
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((_, delta) => {
    const speed = 8;
    direction.current.set(0, 0, 0);
    if (keys.current.w) direction.current.z -= 1;
    if (keys.current.s) direction.current.z += 1;
    if (keys.current.a) direction.current.x -= 1;
    if (keys.current.d) direction.current.x += 1;
    direction.current.normalize();

    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(camera.quaternion);
    direction.current.applyEuler(new THREE.Euler(0, euler.y, 0));

    velocity.current.x = direction.current.x * speed;
    velocity.current.z = direction.current.z * speed;
    velocity.current.y = keys.current.space ? 4 : -2;

    camera.position.addScaledVector(velocity.current, delta);
    camera.position.y = Math.max(1.6, camera.position.y);

    if (camera.position.y < 1.6) camera.position.y = 1.6;
  });

  useEffect(() => {
    const onE = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e') {
        onInteract(camera.position);
      }
    };
    window.addEventListener('keydown', onE);
    return () => window.removeEventListener('keydown', onE);
  }, [camera, onInteract]);

  return null;
}

function VoxelBlock({ position, color, onClick }: { position: [number, number, number]; color: string; onClick?: () => void }) {
  return (
    <Box position={position} args={[1, 1, 1]} onClick={onClick}>
      <meshStandardMaterial color={color} />
    </Box>
  );
}

export default function VoxelQuest({ concept, onProgress }: VoxelQuestProps) {
  const [force, setForce] = useState(10);
  const [mass, setMass] = useState(2);
  const [accel, setAccel] = useState(5);
  const [unlocked, setUnlocked] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [collected, setCollected] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setAccel(Number((force / mass).toFixed(2)));
  }, [force, mass]);

  const checkPhysics = () => {
    const computed = force / mass;
    const correct = Math.abs(computed - accel) < 0.1;
    if (correct && force > 0 && mass > 0) {
      setUnlocked(true);
      setFeedback('Correct! a = F/m. Gate unlocked. You applied Newton\'s Second Law from your notes.');
      onProgress(70, 50 + collected * 10);
    } else {
      setFeedback(`Not quite. Compute a = ${force} / ${mass} = ${(force / mass).toFixed(2)}. Adjust so observed matches calculation.`);
    }
  };

  const handleCollect = useCallback((pos: THREE.Vector3) => {
    const collectibles = [[5, 1, 5], [-5, 1, 8], [0, 1, -10]];
    collectibles.forEach(([x, y, z], i) => {
      const dist = pos.distanceTo(new THREE.Vector3(x, y, z));
      if (dist < 2 && collected <= i) {
        setCollected(c => c + 1);
        onProgress(20 + collected * 15, collected * 15);
      }
    });
    if (pos.distanceTo(new THREE.Vector3(10, 1, 0)) < 3) {
      setShowPanel(true);
    }
  }, [collected, onProgress]);

  const finish = () => {
    setCompleted(true);
    onProgress(100, 100);
    setFeedback('Level complete! You mastered the concepts through gameplay.');
  };

  return (
    <>
      <Canvas camera={{ position: [0, 1.6, 10], fov: 75 }} shadows>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#1a1a3a" />
        </mesh>

        {Array.from({ length: 8 }).map((_, i) => (
          <VoxelBlock key={i} position={[-10 + i * 2, 0, -5]} color="#4a2a8a" />
        ))}
        <VoxelBlock position={[0, 0, 0]} color="#2a4a8a" />
        <VoxelBlock position={[2, 0, 2]} color="#2a4a8a" />
        <VoxelBlock position={[-2, 0, 4]} color="#2a4a8a" />

        {!collected && (
          <>
            <mesh position={[5, 1.5, 5]}>
              <sphereGeometry args={[0.4]} />
              <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
            </mesh>
            <Text position={[5, 2.5, 5]} fontSize={0.3} color="#00ffff">F=ma</Text>
          </>
        )}
        {collected < 2 && (
          <mesh position={[-5, 1.5, 8]}>
            <sphereGeometry args={[0.4]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
          </mesh>
        )}
        {collected < 3 && (
          <mesh position={[0, 1.5, -10]}>
            <sphereGeometry args={[0.4]} />
            <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.5} />
          </mesh>
        )}

        <VoxelBlock position={[10, 0, 0]} color="#ff6b00" onClick={() => setShowPanel(true)} />
        <Text position={[10, 2, 0]} fontSize={0.4} color="#ffaa00">Physics Station</Text>
        <Text position={[10, 1.5, 0]} fontSize={0.2} color="#ffffff">Press E or click</Text>

        {!unlocked ? (
          <mesh position={[15, 1.5, 0]}>
            <boxGeometry args={[0.5, 3, 4]} />
            <meshStandardMaterial color="#aa0000" />
          </mesh>
        ) : (
          <Text position={[15, 2, 0]} fontSize={0.5} color="#00ff00">UNLOCKED</Text>
        )}

        {unlocked && (
          <VoxelBlock position={[18, 0, 0]} color="#00aa00" onClick={finish} />
        )}

        <Player onInteract={handleCollect} />
        <PointerLockControls />
      </Canvas>

      {showPanel && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur border border-cyan-500 rounded-2xl p-6 w-96 z-50 shadow-2xl">
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Newton's Second Law Station</h3>
          <p className="text-sm text-slate-300 mb-4">From your notes: {concept.definitions[0] || 'F = ma'}</p>
          <div className="space-y-3">
            <label className="flex justify-between">
              Force (N): <input type="range" min="1" max="50" value={force} onChange={e => setForce(+e.target.value)} className="w-40" /> {force}
            </label>
            <label className="flex justify-between">
              Mass (kg): <input type="range" min="0.5" max="10" step="0.5" value={mass} onChange={e => setMass(+e.target.value)} className="w-40" /> {mass}
            </label>
            <div className="text-center py-2 bg-slate-800 rounded">
              Computed a = F/m = <span className="text-cyan-400 font-bold">{(force / mass).toFixed(2)} m/s²</span>
            </div>
            <label className="flex justify-between">
              Observed acceleration: <input type="number" value={accel} onChange={e => setAccel(+e.target.value)} className="w-24 bg-slate-800 px-2 rounded" />
            </label>
            <button onClick={checkPhysics} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold">
              Apply & Check
            </button>
            {feedback && <p className="text-sm text-green-400 mt-2">{feedback}</p>}
            <button onClick={() => setShowPanel(false)} className="text-xs text-slate-400">Close</button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-xs text-slate-400 bg-black/50 px-3 py-2 rounded">
        WASD to move · Mouse to look · Click canvas to lock pointer · E to interact · Collect glowing knowledge orbs · Reach Physics Station
      </div>

      {completed && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-green-500 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-green-400 mb-4">Level Complete!</h2>
            <p>You explored the voxel world and mastered the concept through interactive force application.</p>
            <p className="mt-2 text-cyan-300">Score: 100 · Progress saved</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-green-600 rounded-lg">Restart</button>
          </div>
        </div>
      )}
    </>
  );
}
