import { Router } from "express";
import {
  answerQuestion,
  createQuestion,
  editAnswer,
  listAnsweredQuestions,
  listPendingQuestions,
  listPublicQuestions,
  rejectQuestion,
} from "../controllers/questions.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.get("/", listPublicQuestions);
router.post("/", createQuestion);
router.get("/sheikh/pending", requireAuth, requireRole("SHEIKH"), listPendingQuestions);
router.get("/sheikh/answered", requireAuth, requireRole("SHEIKH"), listAnsweredQuestions);
router.patch("/sheikh/:id/answer", requireAuth, requireRole("SHEIKH"), answerQuestion);
router.patch("/sheikh/:id/edit", requireAuth, requireRole("SHEIKH"), editAnswer);
router.patch("/sheikh/:id/reject", requireAuth, requireRole("SHEIKH"), rejectQuestion);

export default router;
