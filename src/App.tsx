import { useState } from 'react';
import { extractConcepts, SAMPLE_PHYSICS, SAMPLE_CALC, SAMPLE_BIO, type Concept } from './utils/contentExtractor';
import VoxelQuest from './components/VoxelQuest';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function App() {
  const [notes, setNotes] = useState('');
  const [concept, setConcept] = useState<Concept | null>(null);
  const [mode, setMode] = useState<'voxel' | 'obby' | null>(null);
  const [course, setCourse] = useState('');
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [showGame, setShowGame] = useState(false);

  const handleGenerate = () => {
    const text = notes.trim() || SAMPLE_PHYSICS;
    const extracted = extractConcepts(text);
    setConcept(extracted);
    setMode('voxel');
    setShowGame(true);
    setProgress(0);
    setScore(0);
    localStorage.setItem('studyverse-last', JSON.stringify({ notes: text, course, progress: 0 }));
  };

  const loadSample = (sample: string) => {
    setNotes(sample);
  };

  const handleProgress = (p: number, s: number) => {
    setProgress(p);
    setScore(s);
    localStorage.setItem('studyverse-progress', JSON.stringify({ progress: p, score: s }));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      setNotes(text);
    } else {
      const text = await file.text();
      setNotes(text);
    }
  };

  if (showGame && concept && mode === 'voxel') {
    return (
      <div className="h-screen w-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white overflow-hidden relative">
        <div className="absolute top-4 left-4 z-50 flex gap-4 items-center bg-black/50 backdrop-blur px-4 py-2 rounded-xl border border-purple-500/50">
          <span className="text-cyan-400 font-bold">STUDYVERSE</span>
          <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span>Score: {score}</span>
          <button onClick={() => setShowGame(false)} className="ml-4 px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-sm">Exit</button>
        </div>
        <VoxelQuest concept={concept} onProgress={handleProgress} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white p-8">
      <header className="text-center mb-12">
        <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
          STUDYVERSE
        </h1>
        <p className="text-xl text-cyan-300 mt-2">Turn your notes into worlds worth exploring.</p>
        <p className="text-sm text-purple-300 mt-1">Yale Edition · No sign-up required</p>
      </header>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="bg-slate-900/60 backdrop-blur border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-500/20">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Upload or Paste Notes</h2>
          <input type="file" accept=".pdf,.txt,.md" onChange={handleFile} className="mb-3 text-sm text-cyan-300" />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Paste your notes about Newton's laws, derivatives, cells... or any academic content."
            className="w-full h-40 bg-slate-800 border border-purple-500/50 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <input
            type="text"
            placeholder="Optional Yale course label (e.g. PHYS 180)"
            value={course}
            onChange={e => setCourse(e.target.value)}
            className="w-full mt-3 bg-slate-800 border border-purple-500/50 rounded-xl px-4 py-2 text-sm"
          />
          <div className="flex gap-2 mt-4">
            <button onClick={() => loadSample(SAMPLE_PHYSICS)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium">Physics Demo</button>
            <button onClick={() => loadSample(SAMPLE_CALC)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium">Calculus Demo</button>
            <button onClick={() => loadSample(SAMPLE_BIO)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium">Biology Demo</button>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-500/20 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Choose Game Mode</h2>
            <div className="space-y-4">
              <div className="p-4 border border-cyan-500/50 rounded-xl hover:bg-cyan-500/10 cursor-pointer transition" onClick={handleGenerate}>
                <h3 className="font-bold text-lg">Voxel Quest</h3>
                <p className="text-sm text-slate-300">Explore a block world. Adjust forces, unlock gates by mastering F=ma and more.</p>
              </div>
              <div className="p-4 border border-purple-500/50 rounded-xl opacity-60">
                <h3 className="font-bold text-lg">Obby Academy <span className="text-xs">(Coming soon)</span></h3>
                <p className="text-sm text-slate-300">Obstacle course of concepts. Platforms activate with correct applications.</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="mt-6 w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02]"
          >
            Generate Voxel Quest World
          </button>
        </div>
      </div>

      <footer className="text-center mt-16 text-slate-500 text-sm">
        Built for Yale students · Progress saved locally · Interactive learning, not just quizzes
      </footer>
    </div>
  );
}
