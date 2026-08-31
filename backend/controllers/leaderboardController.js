import supabaseService from "../services/supabaseService.js";
import marketDataService from "../services/marketDataService.js";

export async function getLeaderboard(req, res, next) {
  try {
    const rawList = await supabaseService.getLeaderboard(20);
    const accounts = await Promise.all(
      rawList.map(async (item) => {
        const userId = item.id;
        const username = item.username;
        const portfolio = await supabaseService.getPortfolio(userId);
        const holdings = await supabaseService.getHoldings(userId);
        const quotes = await marketDataService.getMultipleQuotes(
          holdings.map((holding) => holding.symbol),
        );
        const portfolioValue = holdings.reduce((sum, holding) => {
          const price = quotes[holding.symbol]?.price || 0;
          return sum + Number(price) * Number(holding.quantity);
        }, 0);
        const cashBalance = Number(portfolio.cash_balance);
        const accountValue = cashBalance + portfolioValue;
        const totalPL = accountValue - 100000;
        const returnPercent = ((accountValue - 100000) / 100000) * 100;
        return {
          username,
          account_value: accountValue,
          total_pl: totalPL,
          return_percent: returnPercent,
        };
      }),
    );

    const sorted = accounts.sort((a, b) => b.return_percent - a.return_percent);
    const leaderboard = sorted.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
    res.json({ success: true, data: { leaderboard } });
  } catch (error) {
    next(error);
  }
}
