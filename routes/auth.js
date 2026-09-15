import { Router } from "express";
import { createUser, listUsers, login } from "../controllers/auth.js";

const router = Router();
router.get("/users", listUsers);
router.post("/login", login);
router.post("/users", createUser);

export default router;
