import React from 'react';
import type { PriorityLevel, SiteMatchConfidence, ComparisonStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  size?: 'sm' | 'md';
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'sm',
  title,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
  }[variant];

  return (
    <span
      title={title}
      className={`inline-flex items-center font-medium rounded ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  switch (priority) {
    case 'high':
      return <Badge variant="danger">High Priority</Badge>;
    case 'medium':
      return <Badge variant="warning">Medium Priority</Badge>;
    case 'lower':
      return <Badge variant="neutral">Lower Priority</Badge>;
    case 'insufficient_evidence':
      return <Badge variant="info">Review Needed</Badge>;
  }
};

export const ConfidenceBadge: React.FC<{ confidence: SiteMatchConfidence }> = ({
  confidence,
}) => {
  if (confidence === 'medium') {
    return (
      <Badge variant="warning" title="Location name differs across report tables (e.g. Kamla Park vs Lower Lake)">
        Medium Confidence
      </Badge>
    );
  }
  return <Badge variant="neutral">Verified Site</Badge>;
};

export const ComparisonBadge: React.FC<{ status: ComparisonStatus }> = ({ status }) => {
  switch (status) {
    case 'pass':
      return <Badge variant="success">Meets Standard</Badge>;
    case 'exceed':
      return <Badge variant="danger">Exceeds Limit</Badge>;
    case 'non_numeric':
      return <Badge variant="neutral">Non-numeric</Badge>;
    case 'unassessed':
      return <Badge variant="neutral">No Class B Limit</Badge>;
  }
};
