import { Router } from "express";
import { createMaterial, listCategories, listMaterials } from "../controllers/content.js";

const router = Router();

router.get("/categories", listCategories);
router.get("/materials", listMaterials);
router.post("/materials", createMaterial);

export default router;
