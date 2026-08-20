import { Router } from "express";
import { TmdbController } from "../controllers/tmdbController";
import { ensureAuthenticated, ensureRole } from "../middlewares/authMiddleware";

const tmdbRoutes = Router();
const tmdbController = new TmdbController();

// Todas as rotas do TMDb são exclusivas para ORGANIZER
tmdbRoutes.use(ensureAuthenticated, ensureRole(["ORGANIZER"]));

tmdbRoutes.get("/search", tmdbController.search);
tmdbRoutes.get("/:id", tmdbController.getDetails);

export { tmdbRoutes };
