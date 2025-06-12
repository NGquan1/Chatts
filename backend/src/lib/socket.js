import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; 

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("sendGroupMessage", ({ groupId, message }) => {
    io.to(groupId).emit("newGroupMessage", message);
  });

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User ${userId} joined group ${groupId}`);
  });


  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`User ${userId} left group ${groupId}`);
  });

  socket.on("initiate-call", ({ to, from, caller, offer }) => {
    const toSocket = getReceiverSocketId(to);
    if (toSocket) {
      io.to(toSocket).emit("incoming-call", {
        from,
        caller,
        offer: {
          type: "offer",
          sdp: offer.sdp,
        },
      });
    }
  });

  socket.on("call-accepted", ({ to, answer }) => {
    const toSocket = getReceiverSocketId(to);
    if (toSocket) {
      io.to(toSocket).emit("call-accepted", {
        answer: {
          type: "answer",
          sdp: answer.sdp,
        },
      });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const toSocket = getReceiverSocketId(to);
    if (toSocket) {
      io.to(toSocket).emit("ice-candidate", { candidate });
    }
  });

  socket.on("call-rejected", ({ to }) => {
    const toSocket = getReceiverSocketId(to);
    if (toSocket) {
      io.to(toSocket).emit("call-rejected");
    }
  });

  socket.on("call-ended", ({ to }) => {
    const toSocket = getReceiverSocketId(to);
    if (toSocket) {
      io.to(toSocket).emit("call-ended");
    }
  });
  
  socket.on("friend_request", ({ to, from, senderInfo }) => {
  const toSocket = getReceiverSocketId(to);
  if (toSocket) {
    io.to(toSocket).emit("friend_request_received", {
      type: "FRIEND_REQUEST",
      data: {
        from: from,
        sender: senderInfo
      }
    });
  }
});

  socket.on("friend_request_accepted", ({ to, from }) => {
    const toSocket = getReceiverSocketId(to);
    if (toSocket) {
      io.to(toSocket).emit("friend_request_accepted", { from });
    }
  });
});

export { io, app, server };
