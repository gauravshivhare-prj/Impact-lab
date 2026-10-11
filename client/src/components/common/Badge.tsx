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
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0"></span>
          High
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
          Medium
        </span>
      );
    case 'lower':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
          Lower
        </span>
      );
    case 'insufficient_evidence':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
          Review Needed
        </span>
      );
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

export const LegalStatusBadge: React.FC<{ status: 'authorised' | 'prohibited' | 'conditional' | 'not_verified' }> = ({
  status,
}) => {
  switch (status) {
    case 'prohibited':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          Prohibited in Lake (NGT)
        </span>
      );
    case 'conditional':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          Conditional in Kund
        </span>
      );
    case 'authorised':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Authorised Artificial Kund
        </span>
      );
    case 'not_verified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Status Unverified
        </span>
      );
  }
};

export const CoordinateStatusBadge: React.FC<{ status: 'verified' | 'approximate' | 'not_verified' }> = ({
  status,
}) => {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
          GPS Verified
        </span>
      );
    case 'approximate':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          Approximate Location
        </span>
      );
    case 'not_verified':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Unverified Coord
        </span>
      );
  }
};
