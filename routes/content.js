import { Router } from "express";
import {
  createMaterial,
  createUploadUrlHandler,
  createCategory,
  deleteCategory,
  listCategories,
  listMaterials,
} from "../controllers/content.js";

const router = Router();

router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/materials", listMaterials);
router.post("/uploads/sign", createUploadUrlHandler);
router.post("/materials", createMaterial);

export default router;
