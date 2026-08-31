import express from "express";
import { getHoldings } from "../controllers/holdingsController.js";

const router = express.Router();

router.get("/", getHoldings);

export default router;
