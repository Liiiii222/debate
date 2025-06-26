import React, { useState, useEffect, useRef } from 'react';

export default function CountdownTimer({ showBar, onStopBar, onTimerSet }: { showBar: boolean, onStopBar: () => void, onTimerSet: () => void }) {
  // State for modal visibility
  const [modalOpen, setModalOpen] = useState(false);

  // Timer durations in seconds (default 3 minutes each)
  const [leftDuration, setLeftDuration] = useState(180);
  const [rightDuration, setRightDuration] = useState(180);

  // Remaining times
  const [leftTime, setLeftTime] = useState(leftDuration);
  const [rightTime, setRightTime] = useState(rightDuration);

  // Which timer is active? 'left', 'right', or null
  const [activeTimer, setActiveTimer] = useState<null | 'left' | 'right'>(null);

  // Timer running or paused
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);

  // Ref for interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // When durations change, update remaining times (but only if not running)
  useEffect(() => {
    if (!running && !paused) {
      setLeftTime(leftDuration);
      setRightTime(rightDuration);
    }
  }, [leftDuration, rightDuration, running, paused]);

  // Countdown effect
  useEffect(() => {
    if (running && !paused && activeTimer) {
      intervalRef.current = setInterval(() => {
        if (activeTimer === 'left') {
          setLeftTime((t) => {
            if (t <= 1) {
              clearInterval(intervalRef.current!);
              // Auto-switch to right timer
              setActiveTimer('right');
              setPaused(false);
              setRunning(true);
              return 0;
            }
            return t - 1;
          });
        } else if (activeTimer === 'right') {
          setRightTime((t) => {
            if (t <= 1) {
              clearInterval(intervalRef.current!);
              // Reset everything and show Start Countdown button
              setActiveTimer(null);
              setRunning(false);
              setPaused(false);
              setTimeout(() => {
                setLeftTime(leftDuration);
                setRightTime(rightDuration);
              }, 500);
              return 0;
            }
            return t - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, paused, activeTimer, leftDuration, rightDuration]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Button handlers
  const handleStart = () => {
    setActiveTimer('left');
    setRunning(true);
    setPaused(false);
  };
  const handlePause = () => {
    setPaused(true);
    setRunning(false);
  };
  const handleUnpause = () => {
    setPaused(false);
    setRunning(true);
  };
  const handleStartRight = () => {
    setActiveTimer('right');
    setRunning(true);
    setPaused(false);
  };
  const handleReset = () => {
    setRunning(false);
    setPaused(false);
    setActiveTimer(null);
    setLeftTime(leftDuration);
    setRightTime(rightDuration);
  };

  // Save times from modal inputs (in minutes), convert to seconds
  const onSaveTimes = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as typeof e.target & {
      leftMinutes: { value: string };
      rightMinutes: { value: string };
    };
    const leftMin = parseInt(form.leftMinutes.value);
    const rightMin = parseInt(form.rightMinutes.value);
    if (isNaN(leftMin) || leftMin <= 0 || isNaN(rightMin) || rightMin <= 0) {
      alert('Please enter valid positive numbers for minutes.');
      return;
    }
    setLeftDuration(leftMin * 60);
    setRightDuration(rightMin * 60);
    setLeftTime(leftMin * 60);
    setRightTime(rightMin * 60);
    setActiveTimer(null);
    setRunning(false);
    setPaused(false);
    setModalOpen(false);
    onTimerSet();
  };

  // Determine if left or right timer should be red (time 0)
  const leftIsRed = leftTime === 0;
  const rightIsRed = rightTime === 0;

  // UI logic for center button(s)
  let centerButtons: React.ReactNode = null;
  if (activeTimer === null && leftTime === leftDuration && rightTime === rightDuration) {
    // Initial state
    centerButtons = (
      <button
        onClick={handleStart}
        className="btn-primary font-bold text-xl py-2 rounded w-full"
        aria-label="Start Countdown"
      >
        Start Countdown
      </button>
    );
  } else if (activeTimer === 'left' && running && !paused && leftTime > 0) {
    // Left timer running
    centerButtons = (
      <div className="flex gap-2 w-full">
        <button
          onClick={handlePause}
          className="btn-secondary font-bold text-xl py-2 rounded flex-1"
        >
          Pause
        </button>
        <button
          onClick={handleStartRight}
          className="btn-primary font-bold text-xl py-2 rounded flex-1"
        >
          Switch to Right
        </button>
      </div>
    );
  } else if (activeTimer === 'left' && !running && paused && leftTime > 0) {
    // Left timer paused
    centerButtons = (
      <div className="flex gap-2 w-full">
        <button
          onClick={handleUnpause}
          className="btn-primary font-bold text-xl py-2 rounded flex-1"
        >
          Unpause
        </button>
        <button
          onClick={handleStartRight}
          className="btn-primary font-bold text-xl py-2 rounded flex-1"
        >
          Switch to Right
        </button>
      </div>
    );
  } else if (activeTimer === 'left' && leftTime === 0) {
    // Left timer finished (should not show this, auto-switch happens)
    centerButtons = null;
  } else if (activeTimer === 'right' && running && !paused && rightTime > 0) {
    // Right timer running
    centerButtons = (
      <div className="flex gap-2 w-full">
        <button
          onClick={handlePause}
          className="btn-secondary font-bold text-xl py-2 rounded flex-1"
        >
          Pause
        </button>
        <button
          onClick={handleReset}
          className="btn-primary font-bold text-xl py-2 rounded flex-1"
        >
          Reset
        </button>
      </div>
    );
  } else if (activeTimer === 'right' && !running && paused && rightTime > 0) {
    // Right timer paused
    centerButtons = (
      <div className="flex gap-2 w-full">
        <button
          onClick={handleUnpause}
          className="btn-primary font-bold text-xl py-2 rounded flex-1"
        >
          Unpause
        </button>
        <button
          onClick={handleReset}
          className="btn-primary font-bold text-xl py-2 rounded flex-1"
        >
          Reset
        </button>
      </div>
    );
  } else if (activeTimer === 'right' && rightTime === 0) {
    // Right timer finished (show Stop Timer and Reset)
    centerButtons = (
      <div className="flex gap-2 w-full">
        <button
          onClick={handleStopBar}
          className="btn-secondary font-bold text-xl py-2 rounded flex-1"
        >
          Stop Timer
        </button>
        <button
          onClick={handleReset}
          className="btn-primary font-bold text-xl py-2 rounded flex-1"
        >
          Reset
        </button>
      </div>
    );
  } else {
    // Fallback: allow reset
    centerButtons = (
      <button
        onClick={handleReset}
        className="btn-primary font-bold text-xl py-2 rounded w-full"
      >
        Reset
      </button>
    );
  }

  // Show bar if showBar prop is true and at least one timer is set
  const showTopBar = showBar && (leftDuration > 0 || rightDuration > 0);

  const handleStopBar = () => {
    setRunning(false);
    setPaused(false);
    setActiveTimer(null);
    setLeftTime(leftDuration);
    setRightTime(rightDuration);
    onStopBar();
  };

  return (
    // Only render the top bar, no modal or extra buttons
    showBar ? (
      <div className="fixed top-0 left-0 right-0 z-[50] bg-gray-100 flex items-center justify-between p-4 border-b border-gray-300 shadow" style={{height: '72px'}}>
        {/* Left timer */}
        <div
          className={`w-1/4 text-center font-mono text-2xl ${
            leftIsRed ? 'text-red-500 font-bold' : ''
          }`}
        >
          {formatTime(leftTime)}
        </div>

        {/* Middle button */}
        <div className="w-2/4 flex flex-col items-center justify-center">
          {centerButtons}
        </div>

        {/* Right timer */}
        <div
          className={`w-1/4 text-center font-mono text-2xl ${
            rightIsRed ? 'text-red-500 font-bold' : ''
          }`}
        >
          {formatTime(rightTime)}
        </div>
      </div>
    ) : null
  );
} 