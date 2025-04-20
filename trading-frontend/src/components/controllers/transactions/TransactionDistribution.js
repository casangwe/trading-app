import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fetchTransactions } from "../api/TransactionsAPI";
import { fetchTrades } from "../api/TradesAPI";
import { getCash } from "../api/CashApi";
import { formatCash } from "../func/functions";

const TransactionDistribution = () => {
  const [transactionData, setTransactionData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        const transactions = await fetchTransactions();
        const trades = await fetchTrades();
        const cash = await getCash();

        const initialCashEntry = {
          name: "Initial Cash",
          value: Math.abs(parseFloat(cash.initial_cash)) || 0,
          color: "#4a90e2",
        };

        const totalTradeProfitLoss = trades.reduce(
          (sum, trade) => sum + (parseFloat(trade.profit_loss) || 0) * 100,
          0
        );

        const tradeEntry = {
          name: "Trades",
          value: Math.abs(totalTradeProfitLoss) || 0,
          color: totalTradeProfitLoss >= 0 ? "#FFDAB9" : "#f44336",
        };

        const transactionTotals = transactions.reduce(
          (acc, txn) => {
            const transactionType = txn.transaction_type.toLowerCase();
            const amount = Math.abs(parseFloat(txn.amount)) || 0;

            if (transactionType === "deposit") {
              acc.Deposit += amount;
            } else if (transactionType === "withdrawal") {
              acc.Withdrawal += amount;
            }
            return acc;
          },
          { Deposit: 0, Withdrawal: 0 }
        );

        const depositEntry = {
          name: "Deposits",
          value: transactionTotals.Deposit || 0,
          color: "#B0C4DE",
        };

        const withdrawalEntry = {
          name: "Withdrawals",
          value:
            transactionTotals.Withdrawal > 0
              ? transactionTotals.Withdrawal
              : 100,
          color: "#89CFF0",
        };

        const updatedData = [
          initialCashEntry,
          tradeEntry,
          withdrawalEntry,
          depositEntry,
        ].filter((entry) => entry.value > 0);

        setTransactionData(updatedData);
      } catch (err) {
        setError("Error fetching transaction data");
        console.error("Error fetching transaction data:", err);
      }
    };

    fetchTransactionData();
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <div className="transaction-distribution">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={transactionData}
            innerRadius={50}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            paddingAngle={5}
          >
            {transactionData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{
                  transition: "filter 0.3s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = `drop-shadow(0 0 5px ${entry.color})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "none";
                }}
              />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            content={({ payload }) => {
              if (payload && payload.length) {
                const { name, value } = payload[0].payload;
                return (
                  <div className="tooltip-content">
                    <p>{name}</p>
                    <p className="amount">{formatCash(value)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionDistribution;
