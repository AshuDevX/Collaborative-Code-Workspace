import React, { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";

export default function App() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [language, setLanguage] = useState("javascript");

  const [files, setFiles] = useState([
    { name: "index.js", content: "// index file" },
    { name: "app.js", content: "// app file" },
    { name: "utils.js", content: "// utils file" },
  ]);

  const [activeFile, setActiveFile] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [stdin, setStdin] = useState("");

  const runCode = useCallback(() => {
    setTerminalOutput("Running...\n");
    setTimeout(() => {
      setTerminalOutput(
        `> Program Output\n\nHello from ${files[activeFile].name}\n\nSTDIN: ${stdin}`
      );
    }, 800);
  }, [files, activeFile, stdin]);

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        runCode();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [runCode]);


  const users = [
    { name: "Ashu", color: "#ff4d4d" },
    { name: "Sneha", color: "#4dd2ff" },
    { name: "Amit", color: "#66ff66" },
  ];

  const handleEditorDidMount = (editor, monaco) => {
    monaco.editor.defineTheme("my-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: { "editor.background": "#1e1e1e" },
    });
    monaco.editor.setTheme("my-dark");
  };


  const renameFile = (index) => {
    const newName = prompt("Enter new file name:");
    if (!newName) return;
    setFiles((prev) => {
      const updated = [...prev];
      updated[index].name = newName;
      return updated;
    });
  };

  const deleteFile = (index) => {
    if (files.length === 1) return alert("At least one file required");
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setActiveFile(0);
  };

  const heroStyle = {
    height: "100vh",
    width: "100vw",
    backgroundImage:
      "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url('/bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Georgia, serif",
  };

  if (!joined) {
    return (
      <div style={heroStyle}>
        <div
          style={{
            width: "420px",
            background: "rgba(255,255,255,0.08)",
            padding: "50px",
            borderRadius: "16px",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h2 style={{ textAlign: "center" }}>Collaborative Workspace</h2>

          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              outline: "none",
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: "15px",
            }}
          />

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              outline: "none",
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: "15px",
            }}
          />

          <button
            onClick={() => {
              if (!roomId || !username) {
                alert("Enter Room ID and Username");
                return;
              }
              setJoined(true);
            }}
            style={{
              width: "60%",
              margin: "auto",
              padding: "12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ENTER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* NAVBAR */}
      <div
        style={{
          height: "50px",
          background: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          color: "#EAD7A4",
        }}
      >
        <div>Room: {roomId}</div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            background: "#1e1e1e",
            color: "#EAD7A4",
            border: "1px solid #d4af37",
            padding: "6px",
            borderRadius: "6px",
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button
          onClick={runCode}
          style={{
            background: "#d4af37",
            color: "#000",
            border: "none",
            padding: "6px 16px",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 0 10px rgba(212,175,55,0.6)",
          }}
        >
          ▶ RUN
        </button>
        <div>
          {users.map((u) => (
            <span key={u.name} style={{ margin: "0 5px", color: u.color }}>
              ● {u.name}
            </span>
          ))}
        </div>
      </div>

      {/* WORKSPACE */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ACTIVITY BAR */}
        <div
          style={{
            width: "55px",
            background: "#0d0d0d",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "10px",
          }}
        >
          <p>📁</p>
          <p>🔍</p>
          <p>👥</p>
          <p>⚙️</p>
        </div>

        {/* SIDEBAR */}
        <div
          style={{
            width: "200px",
            background: "#141414",
            padding: "10px",
            color: "#EAD7A4",
          }}
        >
          {files.map((file, i) => (
            <div
              key={i}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <p
                style={{
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "4px",
                  background: i === activeFile ? "#1e1e1e" : "transparent",
                }}
                onClick={() => setActiveFile(i)}
              >
                📄 {file.name}
              </p>
              <div>
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => renameFile(i)}
                >
                  ✏️
                </span>
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => deleteFile(i)}
                >
                  🗑️
                </span>
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              setFiles([
                ...files,
                { name: `file${files.length}.js`, content: "" },
              ])
            }
          >
            + New
          </button>
        </div>

        {/* EDITOR + RIGHT PANEL */}
        <div style={{ flex: 1, display: "flex" }}>
          {/* LEFT */}
          <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                height: "40px",
                background: "#1e1e1e",
                color: "#EAD7A4",
                paddingLeft: "10px",
              }}
            >
              {files[activeFile].name}
            </div>
            <div style={{ flex: 1 }}>
              <Editor
                height="100%"
                language={language}
                value={files[activeFile].content}
                onMount={handleEditorDidMount}
                theme="my-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on"
                }}
                onChange={(value) => {
                  const newCode = value || "";
                  setFiles((prev) => {
                    const updated = [...prev];
                    updated[activeFile].content = newCode;
                    return updated;
                  });
                }}
              />
            </div>
          </div>

          {/* RIGHT */}
          <div
            style={{
              flex: 1,
              background: "#141414",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "10px", color: "#EAD7A4" }}>
              STDIN
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                style={{ width: "100%", height: "80px" }}
              />
            </div>
            <div style={{ padding: "10px", color: "#EAD7A4" }}>
              {/* TERMINAL */}
              <div
                style={{
                  height: "150px",
                  background: "#0c0c0c",
                  color: "#00ff9c",
                  padding: "5px",
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: "13px",
                }}
              >
                {terminalOutput}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS */}
      <div
        style={{
          height: "25px",
          background: "#1a1a1a",
          color: "#EAD7A4",
          display: "flex",
          justifyContent: "space-between",
          padding: "0 10px",
        }}
      >
        <span>{language}</span>
        <span>UTF-8</span>
        <span>Spaces:2</span>
        <span>Live Sync 🟢</span>
      </div>
    </div>
  );
}
