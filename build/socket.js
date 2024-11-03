"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const config_1 = require("./config/config");
const models_1 = require("./models");
const uuid_1 = require("uuid");
let eventQueue = [];
let isProcessingQueue = false;
server_1.io.on(config_1.io_keys.connection, (socket) => {
    socket.on(config_1.io_keys.user_connection, async (data) => {
        await models_1.OnlineUser.updateOne({ userId: data.userId }, {
            $set: {
                socketId: socket.id,
                userId: data.userId,
                email: data.email,
                username: data.username,
                avatar: data.avatar,
            },
        }, { upsert: true });
        await models_1.User.findByIdAndUpdate(data.userId, { isOnline: true });
        if (data.userId)
            eventQueue.push({
                id: (0, uuid_1.v4)(),
                type: config_1.io_keys.user_connection,
                data: { userId: data.userId },
            });
        processEventQueueWithDelay(socket);
    });
    socket.on(config_1.io_keys.user_disconnection, async ({ userId }) => {
        await models_1.OnlineUser.findOneAndDelete({ userId });
        await models_1.User.findByIdAndUpdate(userId, { isOnline: false });
        if (userId)
            eventQueue.push({
                id: (0, uuid_1.v4)(),
                type: config_1.io_keys.user_disconnection,
                data: { userId },
            });
        processEventQueueWithDelay(socket);
    });
    socket.on(config_1.io_keys.disconnect, async () => {
        const user = await models_1.OnlineUser.findOne({ socketId: socket.id });
        await models_1.User.findByIdAndUpdate(user?.userId, { isOnline: false });
        await user?.deleteOne();
        if (user?.userId)
            eventQueue.push({
                id: (0, uuid_1.v4)(),
                type: config_1.io_keys.user_disconnection,
                data: { userId: user.userId },
            });
        processEventQueueWithDelay(socket);
    });
});
async function processEventQueueWithDelay(socket) {
    if (eventQueue.length > 0 && !isProcessingQueue) {
        isProcessingQueue = true;
        setTimeout(async () => {
            await Promise.all(eventQueue.map(async (event) => {
                eventQueue = eventQueue.filter((e) => e.id !== event.id);
                if (event.type && event.data)
                    await processEventQueueItem(socket, event);
            }));
            isProcessingQueue = false;
        }, 5000);
    }
    else
        isProcessingQueue = false;
}
async function processEventQueueItem(socket, event) {
    socket.broadcast.emit(event.type, event.data);
}
