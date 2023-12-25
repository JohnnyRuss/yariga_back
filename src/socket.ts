import { io } from "./server";
import { io_keys } from "./config/config";
import { UserConnectionT } from "./types/socket.io.types";
import { OnlineUser, User } from "./models";
import { Socket } from "socket.io";
import { v4 as uuid } from "uuid";

let eventQueue: Array<{ id: string; type: string; data: any }> = [];
let isProcessingQueue = false;

io.on(io_keys.connection, (socket) => {
  socket.on(io_keys.user_connection, async (data: UserConnectionT) => {
    await OnlineUser.updateOne(
      { userId: data.userId },
      {
        $set: {
          socketId: socket.id,
          userId: data.userId,
          email: data.email,
          username: data.username,
          avatar: data.avatar,
        },
      },
      { upsert: true }
    );

    await User.findByIdAndUpdate(data.userId, { isOnline: true });

    if (data.userId)
      eventQueue.push({
        id: uuid(),
        type: io_keys.user_connection,
        data: { userId: data.userId },
      });

    processEventQueueWithDelay(socket);
  });

  socket.on(
    io_keys.user_disconnection,
    async ({ userId }: { userId: string }) => {
      await OnlineUser.findOneAndDelete({ userId });
      await User.findByIdAndUpdate(userId, { isOnline: false });

      if (userId)
        eventQueue.push({
          id: uuid(),
          type: io_keys.user_disconnection,
          data: { userId },
        });

      processEventQueueWithDelay(socket);
    }
  );

  socket.on(io_keys.disconnect, async () => {
    const user = await OnlineUser.findOneAndDelete({ socketId: socket.id });
    await User.findByIdAndUpdate(user?.userId, { isOnline: false });

    if (user?.userId)
      eventQueue.push({
        id: uuid(),
        type: io_keys.user_disconnection,
        data: { userId: user.userId },
      });

    processEventQueueWithDelay(socket);
  });
});

async function processEventQueueWithDelay(socket: Socket) {
  if (eventQueue.length > 0 && !isProcessingQueue) {
    isProcessingQueue = true;

    setTimeout(async () => {
      await Promise.all(
        eventQueue.map(async (event) => {
          eventQueue = eventQueue.filter((e) => e.id !== event.id);
          if (event.type && event.data)
            await processEventQueueItem(socket, event);
        })
      );

      isProcessingQueue = false;
    }, 5000);
  } else isProcessingQueue = false;
}

async function processEventQueueItem(
  socket: Socket,
  event: { type: string; data: any }
): Promise<void> {
  socket.broadcast.emit(event.type, event.data);
}
