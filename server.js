const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const onlineUsers = new Set();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (room) => {
      socket.join(room);
      socket.room = room;
      socket.emit("message", {
        user: "System",
        text: `You joined room: ${room}`,
        time: new Date().toLocaleTimeString(),
      });
      socket.to(room).emit("message", {
        user: "System",
        text: `A new user joined the room`,
        time: new Date().toLocaleTimeString(),
      });
    });

    socket.on("chat-message", (data) => {
      const room = socket.room;
      if (room) {
        io.to(room).emit("message", {
          user: data.user,
          text: data.text,
          time: new Date().toLocaleTimeString(),
        });
      }
    });

    socket.on("typing", (data) => {
      const room = socket.room;
      if (room) {
        socket.to(room).emit("typing", data);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const room = socket.room;
      if (room) {
        socket.to(room).emit("message", {
          user: "System",
          text: "A user left the room",
          time: new Date().toLocaleTimeString(),
        });
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
