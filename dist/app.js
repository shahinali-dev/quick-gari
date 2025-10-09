"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notFound_middleware_1 = __importDefault(require("./middleware/notFound.middleware"));
const globalErrorHandler_middleware_1 = __importDefault(require("./middleware/globalErrorHandler.middleware"));
const router_1 = __importDefault(require("./router/router"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const corsOptions = {
    origin: ["http://localhost:3000", "http://localhost:3001", "*"],
    credentials: true,
};
app.use(express_1.default.json());
app.use((0, cors_1.default)(corsOptions));
app.use("/api/v1", router_1.default);
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.use(notFound_middleware_1.default);
app.use(globalErrorHandler_middleware_1.default);
exports.default = app;
