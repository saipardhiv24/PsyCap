import express from "express";
import {
  getWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
} from "../controllers/watchlistController.js";

const router = express.Router();

router.get("/", getWatchlist);
router.post("/", addWatchlistItem);
router.delete("/:symbol", removeWatchlistItem);

export default router;
