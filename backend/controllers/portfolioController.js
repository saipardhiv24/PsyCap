import marketDataService from "../services/marketDataService.js";
import supabaseService from "../services/supabaseService.js";

function formatMoney(value) {
  return Number(value ?? 0);
}

export async function getPortfolio(req, res, next) {
  try {
    const userId = req.user.id;
    const portfolio = await supabaseService.getPortfolio(userId);
    const holdings = await supabaseService.getHoldings(userId);
    const transactions = await supabaseService.getTransactions(userId);
    const symbols = holdings.map((item) => item.symbol);
    const quotes = await marketDataService.getMultipleQuotes(symbols);

    const holdingsWithMarket = holdings.map((holding) => {
      const quote = quotes[holding.symbol];
      const currentPrice = quote?.price || 0;
      const currentValue = Number(currentPrice) * Number(holding.quantity);
      const costBasis =
        Number(holding.average_buy_price) * Number(holding.quantity);
      const unrealizedPL = currentValue - costBasis;
      const unrealizedPLPercent = costBasis
        ? (unrealizedPL / costBasis) * 100
        : 0;

      return {
        ...holding,
        current_price: currentPrice,
        current_value: currentValue,
        cost_basis: costBasis,
        unrealized_pl: unrealizedPL,
        unrealized_pl_percent: unrealizedPLPercent,
      };
    });

    const portfolioValue = holdingsWithMarket.reduce(
      (sum, item) => sum + item.current_value,
      0,
    );
    const cashBalance = Number(portfolio.cash_balance);
    const accountValue = cashBalance + portfolioValue;
    const totalCostBasis = holdingsWithMarket.reduce(
      (sum, item) => sum + item.cost_basis,
      0,
    );
    const unrealizedPL = holdingsWithMarket.reduce(
      (sum, item) => sum + item.unrealized_pl,
      0,
    );
    const realizedPL = transactions.reduce(
      (sum, tx) => sum + Number(tx.realized_profit_loss || 0),
      0,
    );
    const totalPL = unrealizedPL + realizedPL;
    const returnPercent = ((accountValue - 100000) / 100000) * 100;

    res.json({
      success: true,
      data: {
        portfolio: {
          cash_balance: cashBalance,
          portfolio_value: portfolioValue,
          account_value: accountValue,
          unrealized_pl: unrealizedPL,
          realized_pl: realizedPL,
          total_pl: totalPL,
          return_percent: returnPercent,
          holdings: holdingsWithMarket,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
