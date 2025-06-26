import React from "react";

interface FullScreenDebateLayoutProps {
  mediaContent: React.ReactNode;
  aiPanelContent: React.ReactNode;
}

const FullScreenDebateLayout: React.FC<FullScreenDebateLayoutProps> = ({ mediaContent, aiPanelContent }) => {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        justifyContent: "stretch",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: "0 0 40vw", height: "100vh", maxWidth: "100vw", minWidth: 0, minHeight: 0, background: "#fff", display: "flex", flexDirection: "column" }}>
        {mediaContent}
      </div>
      <div style={{ flex: "1 1 0", height: "100vh", minWidth: 0, minHeight: 0, background: "#f8fafc", display: "flex", flexDirection: "column" }}>
        {aiPanelContent}
      </div>
    </div>
  );
};

export default FullScreenDebateLayout; 