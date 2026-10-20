import React from 'react';
import { formatINR } from '../utils/formatters';
import { Calendar, Clock, Sun, Receipt, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function SummaryCards({ summary, loading }) {
  const thisMonthAmount = summary?.this_month || 0;
  const thisMonthCount = summary?.month_count || 0;
  const thisWeekAmount = summary?.this_week || 0;
  const todayAmount = summary?.today || 0;
  const totalTxnCount = summary?.total_transactions || 0;
  const totalSpent = summary?.total_spent || 0;

  const desktopCards = [
    {
      title: 'Spent This Month',
      amount: thisMonthAmount,
      subtext: `${thisMonthCount} transactions`,
      icon: Calendar,
      color: '#2563eb',
      bg: '#eff6ff'
    },
    {
      title: 'Spent This Week',
      amount: thisWeekAmount,
      subtext: `${summary?.week_count || 0} transactions (Mon-Sun)`,
      icon: Clock,
      color: '#0284c7',
      bg: '#f0f9ff'
    },
    {
      title: 'Spent Today',
      amount: todayAmount,
      subtext: `${summary?.today_count || 0} transactions today`,
      icon: Sun,
      color: '#d97706',
      bg: '#fffbeb'
    },
    {
      title: 'Total Transactions',
      amount: totalTxnCount,
      isCount: true,
      subtext: `Total spent: ${formatINR(totalSpent)}`,
      icon: Receipt,
      color: '#16a34a',
      bg: '#f0fdf4'
    }
  ];

  return (
    <>
      {/* ========================================================
          MOBILE VIEW: Hero Wallet Card + 3 Micro Metric Cards
          ======================================================== */}
      <div className="mobile-hero-container">
        {/* Large Gradient Wallet Card */}
        <div className="hero-wallet-card">
          <div className="hero-wallet-header">
            <span className="hero-wallet-label">
              <TrendingUp size={15} />
              <span>Spent This Month</span>
            </span>
            <span className="hero-wallet-badge">
              {loading ? '...' : `${thisMonthCount} txns`}
            </span>
          </div>

          <div className="hero-wallet-amount">
            {loading ? '₹...' : formatINR(thisMonthAmount)}
          </div>

          <div className="hero-wallet-subrow">
            <div className="hero-wallet-subpill">
              <span className="hero-wallet-subpill-label">
                <Sun size={11} />
                <span>Today</span>
              </span>
              <span className="hero-wallet-subpill-val">
                {loading ? '...' : formatINR(todayAmount)}
              </span>
              <span className="hero-wallet-subpill-sub">
                {summary?.today_count || 0} txns
              </span>
            </div>

            <div className="hero-wallet-subpill">
              <span className="hero-wallet-subpill-label">
                <Clock size={11} />
                <span>This Week</span>
              </span>
              <span className="hero-wallet-subpill-val">
                {loading ? '...' : formatINR(thisWeekAmount)}
              </span>
              <span className="hero-wallet-subpill-sub">
                {summary?.week_count || 0} txns
              </span>
            </div>

            <div className="hero-wallet-subpill">
              <span className="hero-wallet-subpill-label">
                <Receipt size={11} />
                <span>All-Time</span>
              </span>
              <span className="hero-wallet-subpill-val">
                {loading ? '...' : formatINR(totalSpent)}
              </span>
              <span className="hero-wallet-subpill-sub">
                {totalTxnCount} total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          DESKTOP VIEW: Standard 4 Card Grid
          ======================================================== */}
      <div className="desktop-summary-grid">
        {desktopCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-label">{card.title}</span>
                <div className="summary-card-icon-wrap" style={{ backgroundColor: card.bg, color: card.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="summary-card-value">
                {loading ? '...' : (card.isCount ? card.amount : formatINR(card.amount))}
              </div>
              <div className="summary-card-subtext">
                {loading ? 'Loading...' : card.subtext}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
