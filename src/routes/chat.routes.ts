import { Router as ExpressRouter } from "express";
import { checkAuth } from "../middlewares";
import * as chatController from "../controllers/chat.controller";

const Router = ExpressRouter();

Router.route("/")
  .post(checkAuth, chatController.createConversation)
  .get(checkAuth, chatController.getAllConversations);

Router.route("/unread").get(checkAuth, chatController.getUnreadConversations);

Router.route("/:conversationId")
  .delete(checkAuth, chatController.deleteConversation)
  .get(checkAuth, chatController.getConversation);

Router.route("/:conversationId/assets").get(
  checkAuth,
  chatController.getConversationAssets
);

Router.route("/:conversationId/message")
  .post(checkAuth, chatController.sendMessage)
  .delete(checkAuth, chatController.deleteMessage)
  .get(checkAuth, chatController.getConversationMessages);

Router.route("/:conversationId/read").patch(
  checkAuth,
  chatController.markConversationAsRead
);

export default Router;
