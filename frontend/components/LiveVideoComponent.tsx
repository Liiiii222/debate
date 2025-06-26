import React, { forwardRef } from 'react';

interface LiveVideoComponentProps {
  stream: MediaStream | null;
  isSpeaking: boolean;
}

const LiveVideoComponent = forwardRef<HTMLVideoElement, LiveVideoComponentProps>(
  ({ stream, isSpeaking }, ref) => {
    return (
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="bg-black w-full h-full object-cover"
      />
    );
  }
);

LiveVideoComponent.displayName = 'LiveVideoComponent';

export default LiveVideoComponent; 