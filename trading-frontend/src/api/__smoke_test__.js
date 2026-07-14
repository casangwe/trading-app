import { getDashboard } from "./dashboard.api";
import { getPortfolio } from "./portfolio.api";
import { getTrades } from "./trades.api";

export const runApiSmokeTests = async () => {
  try {
    console.log("Testing dashboard...");
    const dashboard = await getDashboard();
    console.log("Dashboard OK:", dashboard);

    console.log("Testing portfolio...");
    const portfolio = await getPortfolio();
    console.log("Portfolio OK:", portfolio);

    console.log("Testing trades...");
    const trades = await getTrades();
    console.log("Trades OK:", trades);

    console.log("API SMOKE TESTS PASSED ✅");
  } catch (err) {
    console.error("API SMOKE TEST FAILED ❌", err);
  }
};
