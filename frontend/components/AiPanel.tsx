import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export default function AiPanel() {
  return (
    <div className="ai-panel-placeholder">
      AI Tools coming soon...
    </div>
  );
} 