import { Router } from "express";
import { createUser, deleteUser, listUsers, login } from "../controllers/auth.js";

const router = Router();
router.get("/users", listUsers);
router.post("/login", login);
router.post("/users", createUser);
router.delete("/users/:id", deleteUser);

export default router;
