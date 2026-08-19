import { Router } from "express";
import { TicketController } from "../controllers/ticketController";
import { ensureAuthenticated, ensureRole } from "../middlewares/authMiddleware";

const ticketRoutes = Router();
const ticketController = new TicketController();

ticketRoutes.get(
  "/me",
  ensureAuthenticated,
  ensureRole(["CLIENT"]),
  ticketController.listMyTickets,
);

ticketRoutes.post(
  "/validate",
  ensureAuthenticated,
  ensureRole(["GATE_STAFF"]),
  ticketController.Validate,
);

export { ticketRoutes };
