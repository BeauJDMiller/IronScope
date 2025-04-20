import React from 'react';

const lifts = ['Squat', 'Deadlift', 'Overhead Press', 'Bench Press', 'Barbell Row'];

const LiftSelector = ({ selectedLift, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center mb-6">
      {lifts.map((lift) => (
        <button
          key={lift}
          onClick={() => onSelect(lift)}
          className={`w-24 h-24 border-2 rounded-lg font-semibold text-sm sm:text-base text-center flex items-center justify-center text-wrap px-2
            ${selectedLift === lift
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-800 border-gray-300'}
            hover:shadow-lg transition-all`}
        >
          {lift}
        </button>
      ))}
    </div>
  );
};

export default LiftSelector;
