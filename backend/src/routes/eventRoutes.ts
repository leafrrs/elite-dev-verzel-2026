import { Router } from "express";
import { EventController } from "../controllers/eventController";
import { ensureAuthenticated, ensureRole } from "../middlewares/authMiddleware";

const eventRoutes = Router();
const eventController = new EventController();

eventRoutes.get("/", eventController.list);

eventRoutes.get(
  "/me",
  ensureAuthenticated,
  ensureRole(["ORGANIZER"]),
  eventController.listMyEvents
);

eventRoutes.get("/:id", eventController.getById);

eventRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ORGANIZER"]),
  eventController.create,
);

eventRoutes.patch(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ORGANIZER"]),
  eventController.update,
);

export { eventRoutes };
