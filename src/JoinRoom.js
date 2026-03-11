import React, { useState } from "react";

function JoinRoom({ onJoin }) {

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const join = () => {
    if (!roomId || !username) {
      alert("Enter Room ID & Username");
      return;
    }
    onJoin(roomId, username);
  };

  return (
    <div className="join-container">

      <div className="join-box">
        <h2>Realtime Code Editor</h2>

        <input
          placeholder="Enter Room ID"
          onChange={(e) => setRoomId(e.target.value)}
        />

        <input
          placeholder="Enter Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <button onClick={join}>
          Join Room
        </button>
      </div>

    </div>
  );
}

export default JoinRoom;