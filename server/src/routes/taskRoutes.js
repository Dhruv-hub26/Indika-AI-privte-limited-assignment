import { Router } from "express";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addAttachments,
  deleteAttachment,
  downloadAttachment,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadCreateTaskPdfs, uploadTaskPdfs } from "../middleware/taskUpload.js";

const router = Router();

router.use(protect);

router.get("/", listTasks);
router.post("/", uploadCreateTaskPdfs.array("pdfs", 3), createTask);
router.get("/:id", getTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.post("/:id/attachments", uploadTaskPdfs.array("pdfs", 3), addAttachments);
router.delete("/:id/attachments/:filename", deleteAttachment);
router.get("/:id/attachments/:filename", downloadAttachment);

export default router;
