// modules/chat/chat.routes.ts
import { Router } from "express";
import httpStatus from "http-status";
import { isAuth } from "../../middleware/is_auth";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { ChatContextType } from "./chat.model";
import { chatService } from "./chat.service";

const router = Router();

const VALID_CONTEXT_TYPES: ChatContextType[] = [
  "ride",
  "return",
  "share_vehicle",
];

function isValidContextType(val: string): val is ChatContextType {
  return VALID_CONTEXT_TYPES.includes(val as ChatContextType);
}

// ─── Send message ──────────────────────────────────────────────────────────
// POST /api/v1/chat/send
// body: { contextType, contextId, receiverId, message }

router.post(
  "/conversation/:contextType/:contextId",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const { contextType, contextId } = req.params;
    const { driverId } = req.body;

    if (!isValidContextType(contextType)) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message: `contextType must be one of: ${VALID_CONTEXT_TYPES.join(", ")}`,
        data: null,
      });
    }

    const result = await chatService.createConversation(
      contextType,
      contextId,
      [userId, driverId],
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Conversation created successfully",
      data: result,
    });
  }),
);

router.post(
  "/send",
  isAuth,
  catchAsync(async (req, res) => {
    const senderId = req.user!._id.toString();
    const { contextType, contextId, receiverId, message } = req.body;

    if (!isValidContextType(contextType)) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message: `contextType must be one of: ${VALID_CONTEXT_TYPES.join(", ")}`,
        data: null,
      });
    }

    const result = await chatService.sendMessage(
      contextType,
      contextId,
      senderId,
      receiverId,
      message,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Message sent successfully",
      data: result,
    });
  }),
);

// ─── Get conversation ──────────────────────────────────────────────────────
// GET /api/v1/chat/conversation/ride/64abc...
// GET /api/v1/chat/conversation/return/64abc...
// GET /api/v1/chat/conversation/share_vehicle/64abc...
// query: ?limit=50
// response: { isActive, closedAt, messages }

router.get(
  "/conversation/:contextType/:contextId",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const { contextType, contextId } = req.params;
    const limit = Number(req.query.limit) || 50;

    if (!isValidContextType(contextType)) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message: `contextType must be one of: ${VALID_CONTEXT_TYPES.join(", ")}`,
        data: null,
      });
    }

    const result = await chatService.getConversation(
      contextType,
      contextId,
      userId,
      limit,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Conversation fetched successfully",
      data: result,
    });
  }),
);

// ─── Mark as read ──────────────────────────────────────────────────────────
// PATCH /api/v1/chat/read/ride/64abc...

router.patch(
  "/read/:contextType/:contextId",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const { contextType, contextId } = req.params;

    if (!isValidContextType(contextType)) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message: `contextType must be one of: ${VALID_CONTEXT_TYPES.join(", ")}`,
        data: null,
      });
    }

    await chatService.markConversationAsRead(contextType, contextId, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Messages marked as read successfully",
      data: null,
    });
  }),
);

// ─── Unread count ──────────────────────────────────────────────────────────
// GET /api/v1/chat/unread-count
// GET /api/v1/chat/unread-count?contextType=ride

router.get(
  "/unread-count",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const contextType = req.query.contextType as string | undefined;

    if (contextType && !isValidContextType(contextType)) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message: `contextType must be one of: ${VALID_CONTEXT_TYPES.join(", ")}`,
        data: null,
      });
    }

    const count = await chatService.getUnreadCount(
      userId,
      contextType as ChatContextType | undefined,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Unread count fetched successfully",
      data: { count },
    });
  }),
);

const chatRouter = router;
export default chatRouter;
