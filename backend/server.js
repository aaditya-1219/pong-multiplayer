import { createServer } from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
const port = 3000;

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://admin.socket.io"],
    credentials: true
  },
});

instrument(io, {
  auth: false,
  mode: "development",
});

const getRandomName = () => {
  return uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }); // big_red_donkey
}

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`);

  socket.on("create-lobby", async () => {
    const lobbyName = getRandomName()
    const sockets = await io.in(lobbyName).fetchSockets();
    while(sockets.length != 0) {  // must not be in use already
      lobbyName = getRandomName()
      sockets = await io.in(lobbyName).fetchSockets();
    }
    socket.join(lobbyName)
    socket.emit("lobby-created", lobbyName)
  })

  socket.emit("get-id", socket.id);

  socket.on("join-lobby", (lobby, callback) => {
    // Check whether lobby exists
    let room = io.sockets.adapter.rooms.get(lobby)
    if (room === undefined) {
      callback(null);
    } else {
      // Lobby exists
      socket.join(lobby); // Join another's lobby
      socket.to(lobby).emit("get-opponent", socket.id); // Notify other players in the lobby
      io.in(lobby).emit("players-joined")
      callback({ lobby });
    }
  });

  socket.on("request-leave", (lobby) => {
    socket.to(lobby).emit("leave-notify")
    io.in(lobby).socketsLeave(lobby)
  })

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
  });

  socket.on("disconnecting", () => {
    console.log(socket.rooms)
    for(var room of socket.rooms){
      if(room != socket.id) socket.to(room).emit("leave-notify")
    }
  })
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
