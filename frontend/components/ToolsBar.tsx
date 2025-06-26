import React, { useState } from 'react';
import CountdownTimer from './CountdownTimer';

function FactCheckPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch() {
    setLoading(true);
    setError('');
    setResults([]);
    try {
      // Example: Wikipedia API
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
      const data = await res.json();
      setResults(data.query?.search || []);
    } catch (e) {
      setError('Failed to fetch results.');
    }
    setLoading(false);
  }

  return (
    <div className="fixed top-0 right-16 w-96 h-[calc(100vh-6rem)] mt-24 bg-white shadow-lg z-[150] flex flex-col p-4 border-l border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Fact Check</h2>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded px-2 py-1"
          placeholder="Search Wikipedia..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="bg-blue-600 text-white px-3 py-1 rounded">Search</button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="overflow-y-auto flex-1">
        {results.map((item: any) => (
          <div key={item.pageid} className="mb-3 p-2 border-b">
            <a
              href={`https://en.wikipedia.org/?curid=${item.pageid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-700 hover:underline"
            >
              {item.title}
            </a>
            <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: item.snippet }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimerPanel({ showBar, setShowBar, onTimerSet }: { showBar: boolean, setShowBar: (v: boolean) => void, onTimerSet: () => void }) {
  return (
    <div className="fixed top-0 right-16 w-96 h-full bg-white shadow-lg z-[150] flex flex-col p-4 border-l border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Debate Timer</h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <CountdownTimer showBar={showBar} onStopBar={() => setShowBar(false)} onTimerSet={onTimerSet} />
      </div>
    </div>
  );
}

interface TimerModalProps {
  open: boolean;
  onClose: () => void;
  onSetTimer: () => void;
  onStopTimer: () => void;
  leftDuration: number;
  rightDuration: number;
  setLeftDuration: (n: number) => void;
  setRightDuration: (n: number) => void;
}

function TimerModal({ open, onClose, onSetTimer, onStopTimer, leftDuration, rightDuration, setLeftDuration, setRightDuration }: TimerModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
      <form
        onSubmit={e => {
          e.preventDefault();
          onSetTimer();
          onClose();
        }}
        className="bg-white rounded p-6 w-80"
      >
        <h2 className="text-lg font-bold mb-4">Set Countdown Times (minutes)</h2>
        <label className="block mb-2">
          Left Timer:
          <input
            name="leftMinutes"
            type="number"
            value={leftDuration}
            min={1}
            onChange={e => setLeftDuration(Number(e.target.value))}
            className="border p-1 w-full mt-1"
          />
        </label>
        <label className="block mb-4">
          Right Timer:
          <input
            name="rightMinutes"
            type="number"
            value={rightDuration}
            min={1}
            onChange={e => setRightDuration(Number(e.target.value))}
            className="border p-1 w-full mt-1"
          />
        </label>
        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Set Timer
          </button>
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => { onStopTimer(); onClose(); }}
          >
            Stop Timer
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ToolsBar({ showTimerBar, setShowTimerBar, showTimerButton = true }: { showTimerBar: boolean, setShowTimerBar: (v: boolean) => void, showTimerButton?: boolean }) {
  const [openPanel, setOpenPanel] = useState<'fact' | 'timer' | null>(null);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [leftDuration, setLeftDuration] = useState(3);
  const [rightDuration, setRightDuration] = useState(3);

  const handleFactCheckClick = () => {
    setOpenPanel((prev) => (prev === 'fact' ? null : 'fact'));
  };
  const handleTimerClick = () => {
    setOpenPanel((prev) => {
      if (prev === 'timer') {
        return null;
      } else {
        return 'timer';
      }
    });
    setTimerModalOpen(true);
  };
  const handleTimerSet = () => {
    setShowTimerBar(true);
  };
  const handleTimerStop = () => {
    setShowTimerBar(false);
  };

  return (
    <div className="fixed right-0 top-0 h-full flex flex-col items-center justify-center z-40">
      <div className="bg-white shadow-lg rounded-l-xl flex flex-col gap-4 p-2 mt-24 border-l border-gray-200">
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white text-xl shadow hover:bg-blue-700 transition"
          title="Fact Check"
          onClick={handleFactCheckClick}
        >
          🧐
        </button>
        {showTimerButton && (
          <button
            className="w-12 h-12 flex items-center justify-center rounded-full bg-green-600 text-white text-xl shadow hover:bg-green-700 transition"
            title="Debate Timer"
            onClick={handleTimerClick}
          >
            ⏱️
          </button>
        )}
      </div>
      {openPanel === 'fact' && <FactCheckPanel />}
      <TimerModal
        open={timerModalOpen}
        onClose={() => setTimerModalOpen(false)}
        onSetTimer={handleTimerSet}
        onStopTimer={handleTimerStop}
        leftDuration={leftDuration}
        rightDuration={rightDuration}
        setLeftDuration={setLeftDuration}
        setRightDuration={setRightDuration}
      />
    </div>
  );
} 