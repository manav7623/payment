import React from 'react';
import { formatINR } from '../utils/formatters';
import { Calendar, Clock, Sun, Receipt } from 'lucide-react';

export default function SummaryCards({ summary, loading }) {
  const cards = [
    {
      title: 'Spent This Month',
      amount: summary?.this_month || 0,
      subtext: `${summary?.month_count || 0} transactions`,
      icon: Calendar,
      color: 'var(--primary)'
    },
    {
      title: 'Spent This Week',
      amount: summary?.this_week || 0,
      subtext: `${summary?.week_count || 0} transactions (Mon-Sun)`,
      icon: Clock,
      color: 'var(--info)'
    },
    {
      title: 'Spent Today',
      amount: summary?.today || 0,
      subtext: `${summary?.today_count || 0} transactions today`,
      icon: Sun,
      color: 'var(--warning)'
    },
    {
      title: 'Total Transactions',
      amount: summary?.total_transactions || 0,
      isCount: true,
      subtext: `Total spent: ${formatINR(summary?.total_spent || 0)}`,
      icon: Receipt,
      color: 'var(--success)'
    }
  ];

  return (
    <div className="summary-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="summary-card">
            <div className="summary-card-header">
              <span className="summary-card-label">{card.title}</span>
              <Icon size={18} style={{ color: card.color }} />
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
  );
}
