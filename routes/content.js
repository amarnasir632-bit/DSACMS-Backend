import { Router } from "express";
import {
  createMaterial,
  createCategory,
  deleteCategory,
  listCategories,
  listMaterials,
  archiveStatusHandler,
  updateMaterialStatus,
  deleteMaterial,
  downloadMediaHandler,
} from "../controllers/content.js";

const router = Router();

router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/materials", listMaterials);
router.get("/download", downloadMediaHandler);
router.post("/internal/archive-status", archiveStatusHandler);
router.post("/materials", createMaterial);
router.patch("/materials/:id/status", updateMaterialStatus);
router.delete("/materials/:id", deleteMaterial);

export default router;
