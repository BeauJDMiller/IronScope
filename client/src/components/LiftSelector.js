import React from 'react';

const lifts = ['Squat', 'Deadlift', 'Overhead Press', 'Bench Press', 'Barbell Row'];

const LiftSelector = ({ selectedLift, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center mb-6">
      {lifts.map((lift) => (
        <button
          key={lift}
          onClick={() => onSelect(lift)}
          className={`w-28 h-28 rounded-xl font-bold text-sm sm:text-base text-center flex items-center justify-center px-3 text-white transition
            ${
              selectedLift === lift
                ? 'bg-pink-600 shadow-lg'
                : 'bg-[#1C1C1E] hover:bg-[#2C2C2E]'
            }`}
        >
          {lift}
        </button>
      ))}
    </div>
  );
};

export default LiftSelector;
