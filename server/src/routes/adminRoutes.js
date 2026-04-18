import { Router } from "express";
import { listUsers, listAllTasks } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/users", listUsers);
router.get("/tasks", listAllTasks);

export default router;
