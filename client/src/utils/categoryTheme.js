import React from 'react';
import { 
  Utensils, 
  ShoppingCart, 
  Car, 
  Zap, 
  ShoppingBag, 
  Film, 
  HeartPulse, 
  GraduationCap, 
  Sparkles, 
  Package, 
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  CircleDollarSign,
  Receipt
} from 'lucide-react';

/**
 * Category theme mapping for icons, colors, and background tints
 */
export const CATEGORY_THEMES = {
  'Food & Dining': {
    icon: Utensils,
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#ffedd5',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)'
  },
  'Groceries': {
    icon: ShoppingCart,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#dcfce7',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
  },
  'Transport & Fuel': {
    icon: Car,
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#e0f2fe',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
  },
  'Bills & Utilities': {
    icon: Zap,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fef3c7',
    gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)'
  },
  'Shopping': {
    icon: ShoppingBag,
    color: '#9333ea',
    bg: '#faf5ff',
    border: '#f3e8ff',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #c084fc 100%)'
  },
  'Entertainment': {
    icon: Film,
    color: '#e11d48',
    bg: '#fff1f2',
    border: '#ffe4e6',
    gradient: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)'
  },
  'Health & Medical': {
    icon: HeartPulse,
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fee2e2',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)'
  },
  'Education': {
    icon: GraduationCap,
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#e0e7ff',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)'
  },
  'Personal Care': {
    icon: Sparkles,
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#ccfbf1',
    gradient: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)'
  },
  'Others': {
    icon: Package,
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)'
  }
};

export function getCategoryTheme(categoryName) {
  if (!categoryName) return CATEGORY_THEMES['Others'];
  const matched = CATEGORY_THEMES[categoryName];
  if (matched) return matched;
  
  // Case-insensitive fallback
  const key = Object.keys(CATEGORY_THEMES).find(
    k => k.toLowerCase() === categoryName.toLowerCase()
  );
  return key ? CATEGORY_THEMES[key] : CATEGORY_THEMES['Others'];
}

export function getPaymentMethodTheme(method) {
  switch (method?.toLowerCase()) {
    case 'upi':
      return { label: 'UPI', icon: Smartphone, color: '#7c3aed', bg: '#f5f3ff' };
    case 'cash':
      return { label: 'Cash', icon: Banknote, color: '#16a34a', bg: '#f0fdf4' };
    case 'credit card':
      return { label: 'Card', icon: CreditCard, color: '#2563eb', bg: '#eff6ff' };
    case 'debit card':
      return { label: 'Card', icon: CreditCard, color: '#0284c7', bg: '#f0f9ff' };
    case 'net banking':
      return { label: 'Bank', icon: Building2, color: '#4f46e5', bg: '#eef2ff' };
    default:
      return { label: method || 'Other', icon: CircleDollarSign, color: '#64748b', bg: '#f8fafc' };
  }
}
