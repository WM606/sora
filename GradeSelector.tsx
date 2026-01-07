
import React from 'react';
import { GradeLevel } from '../types';

interface GradeSelectorProps {
  onSelect: (grade: GradeLevel) => void;
  selectedGrade?: GradeLevel;
}

const GradeSelector: React.FC<GradeSelectorProps> = ({ onSelect, selectedGrade }) => {
  const grades = Object.values(GradeLevel);

  const getStageColor = (grade: string) => {
    if (grade.includes('ابتدائي')) return 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-300';
    if (grade.includes('متوسط') || grade.includes('إعدادي')) return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 hover:border-blue-300';
    return 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100 hover:border-purple-300';
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-2">
      {grades.map((grade) => (
        <button
          key={grade}
          onClick={() => onSelect(grade)}
          className={`p-4 rounded-2xl border-2 transition-all duration-200 text-xs font-black shadow-sm flex items-center justify-center text-center leading-tight ${
            selectedGrade === grade 
              ? 'ring-4 ring-indigo-100 border-indigo-500 bg-indigo-50 text-indigo-700 scale-[1.02]' 
              : getStageColor(grade)
          }`}
        >
          {grade}
        </button>
      ))}
    </div>
  );
};

export default GradeSelector;
