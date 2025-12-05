import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const { actualTheme } = useTheme();
  
  const baseClasses = `${
    actualTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
  } ${animation === 'pulse' ? 'animate-pulse' : animation === 'wave' ? 'animate-shimmer' : ''}`;
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style: React.CSSProperties = {
    width: width,
    height: height
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Product Card Skeleton
export const ProductCardSkeleton: React.FC = () => {
  const { actualTheme } = useTheme();
  
  return (
    <div className={`rounded-2xl overflow-hidden ${
      actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
    } shadow-sm`}>
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-end justify-between pt-2">
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
};

// Dashboard Stat Card Skeleton
export const StatCardSkeleton: React.FC = () => {
  const { actualTheme } = useTheme();
  
  return (
    <div className={`p-6 rounded-2xl ${
      actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
    } shadow-sm`}>
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => {
  const { actualTheme } = useTheme();
  
  return (
    <div className={`p-4 flex items-center gap-4 ${
      actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-100'
    } border-b`}>
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
};

// Page Loading Skeleton
export const PageLoadingSkeleton: React.FC = () => {
  const { actualTheme } = useTheme();
  
  return (
    <div className={`min-h-screen py-8 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skeleton;

