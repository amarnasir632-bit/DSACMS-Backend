import { Router } from "express";
import express from "express";
import {
  createMaterial,
  createUploadUrlHandler,
  createCategory,
  deleteCategory,
  listCategories,
  listMaterials,
  uploadFileHandler,
  updateMaterialStatus,
  deleteMaterial,
} from "../controllers/content.js";

const router = Router();

router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/materials", listMaterials);
router.post("/uploads/sign", createUploadUrlHandler);
router.put("/uploads", express.raw({ type: "*/*", limit: "100mb" }), uploadFileHandler);
router.post("/materials", createMaterial);
router.patch("/materials/:id/status", updateMaterialStatus);
router.delete("/materials/:id", deleteMaterial);

export default router;
