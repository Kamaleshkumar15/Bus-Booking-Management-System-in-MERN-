let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    socket.on('joinTrip', (tripId) => {
      if (tripId) {
        socket.join(`trip:${tripId}`);
      }
    });

    socket.on('leaveTrip', (tripId) => {
      if (tripId) {
        socket.leave(`trip:${tripId}`);
      }
    });
  });
};

const emitSeatUpdate = (tripId, seats) => {
  if (ioInstance && tripId) {
    ioInstance.to(`trip:${tripId}`).emit('seatUpdate', { tripId, seats });
  }
};

const emitTripStatusUpdate = (tripId, status) => {
  if (ioInstance && tripId) {
    ioInstance.to(`trip:${tripId}`).emit('tripStatusUpdate', { tripId, status });
  }
};

module.exports = { initSocket, emitSeatUpdate, emitTripStatusUpdate };
