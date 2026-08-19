import { Router } from "express";
import { ReservationController } from "../controllers/reservationController";
import { ensureAuthenticated, ensureRole } from "../middlewares/authMiddleware";
const reservationRoutes = Router();
const reservationController = new ReservationController();
reservationRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["CLIENT"]),
  reservationController.create,
);
reservationRoutes.post(
  "/:reservationId/pay",
  ensureAuthenticated,
  ensureRole(["CLIENT"]),
  reservationController.pay,
);
export { reservationRoutes };
