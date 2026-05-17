"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ user: string; text: string; time: string }[]>([]);
  const [username, setUsername] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on("typing", (data) => {
      setTypingUser(data.user);
      setTimeout(() => setTypingUser(""), 1000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = () => {
    if (room && username && socket) {
      socket.emit("join-room", room);
      setJoined(true);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit("chat-message", { user: username, text: message });
      setMessages((prev) => [
        ...prev,
        { user: username, text: message, time: new Date().toLocaleTimeString() },
      ]);
      setMessage("");
      socket.emit("typing", { user: username, typing: false });
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (socket) {
      socket.emit("typing", { user: username, typing: true });
    }
  };

  if (!joined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Join Chat Room</h1>
          <input
            type="text"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          />
          <input
            type="text"
            placeholder="Room Name"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          />
          <button
            onClick={joinRoom}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 text-center font-bold">
        Room: {room} | User: {username}
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.user === username ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs p-3 rounded-lg shadow ${
                msg.user === "System"
                  ? "bg-gray-300 text-center w-full text-sm italic"
                  : msg.user === username
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              {msg.user !== "System" && <p className="font-semibold text-xs">{msg.user}</p>}
              <p>{msg.text}</p>
              <p className="text-xs opacity-75 text-right">{msg.time}</p>
            </div>
          </div>
        ))}
        {typingUser && (
          <p className="text-sm text-gray-500 italic">{typingUser} is typing...</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={message}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Send
        </button>
      </form>
    </div>
  );
}
