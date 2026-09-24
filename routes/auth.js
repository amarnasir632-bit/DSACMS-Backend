import { Router } from "express";
import { changeOwnPassword, createUser, deleteUser, listUsers, login, updateUser } from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/users", listUsers);
router.post("/login", login);
router.post("/change-password", requireAuth, changeOwnPassword);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
