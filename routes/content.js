import { Router } from "express";
import {
  createMaterial,
  createUploadUrlHandler,
  listCategories,
  listMaterials,
} from "../controllers/content.js";

const router = Router();

router.get("/categories", listCategories);
router.get("/materials", listMaterials);
router.post("/uploads/sign", createUploadUrlHandler);
router.post("/materials", createMaterial);

export default router;
