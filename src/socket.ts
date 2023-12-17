import { io } from "./server";
import { io_keys } from "./config/config";
import { UserConnectionT } from "./types/socket.io.types";
import OnlineUser from "./models/OnlineUser";

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
  });

  socket.on(
    io_keys.user_disconnection,
    async ({ userId }: { userId: string }) => {
      await OnlineUser.findOneAndDelete({ userId });
    }
  );

  socket.on(io_keys.disconnect, async () => {
    await OnlineUser.findOneAndDelete({ socketId: socket.id });
  });
});
