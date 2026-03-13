
import React from 'react';
import { AnalysisResult } from '../types';

interface ImageCardProps {
  item: AnalysisResult;
}

const ImageCard: React.FC<ImageCardProps> = ({ item }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-blue-500/50 transition-all duration-300 shadow-lg">
      <div className="relative aspect-square bg-slate-800 overflow-hidden">
        <img 
          src={item.url} 
          alt={item.fileName} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {item.status === 'processing' && (
          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {item.status === 'error' && (
          <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center p-4 text-center">
            <span className="text-xs text-red-200">Analysis Failed</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <span className="px-2 py-0.5 bg-slate-950/80 text-[10px] font-mono rounded backdrop-blur-sm">
            {item.category || 'Pending'}
          </span>
        </div>
      </div>
      
      <div className="p-3 space-y-2">
        <p className="text-xs font-medium text-slate-300 truncate" title={item.fileName}>
          {item.fileName}
        </p>
        
        {item.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags?.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-[9px] rounded text-slate-500">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
