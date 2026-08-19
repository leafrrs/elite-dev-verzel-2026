import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/authRoutes";
import { eventRoutes } from "./routes/eventRoutes";
import { reservationRoutes } from "./routes/reservationRoutes";
import { ticketRoutes } from "./routes/ticketRoutes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);
app.use("/reservations", reservationRoutes);
app.use("/tickets", ticketRoutes);
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Servidor voando na porta ${PORT}`);
});
