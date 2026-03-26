/**
 * WatchParty Backend Server (JSON Server)
 * 
 * A JSON Server that stores conversation data in convo.json
 * This backend can be deployed on Render.
 * 
 * Endpoints (from convo.json):
 * - GET /convo - Returns all conversations
 * - POST /convo - Adds a new conversation entry
 */

import jsonServer from "json-server";

const server = jsonServer.create();
const router = jsonServer.router("convo.json");
const middlewares = jsonServer.defaults();

const PORT = process.env.PORT || 2020;

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    req.headers["content-type"] = "application/json";
  }
  next();
});

server.use(router);

server.listen(PORT, () => {
});
