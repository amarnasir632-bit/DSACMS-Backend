import { Router } from "express";
import { createUser, login } from "../controllers/auth.js";

const router = Router();
router.post("/login", login);
router.post("/users", createUser);

export default router;
