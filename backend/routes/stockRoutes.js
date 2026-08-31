import express from "express";
import {
  getPopularStocks,
  searchStocks,
  getStockDetail,
  getStockHistory,
} from "../controllers/stockController.js";

const router = express.Router();

router.get("/", getPopularStocks);
router.get("/search", searchStocks);
router.get("/:symbol/history", getStockHistory);
router.get("/:symbol", getStockDetail);

export default router;
