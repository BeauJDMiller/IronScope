import React, { useState } from 'react';
import PoseCanvas from './PoseCanvas';

const demoVideos = [
  { name: 'Squat Demo', url: '/demo-videos/squat.mp4', lift: 'squat' },
  { name: 'Deadlift Demo', url: '/demo-videos/deadlift.mp4', lift: 'deadlift' },
  { name: 'Overhead Press Demo', url: '/demo-videos/ohpress.mp4', lift: 'overhead press' },
  { name: 'Bench Press Demo', url: '/demo-videos/benchpress.mp4', lift: 'beanch press' },
  { name: 'Barbell Row Demo', url: '/demo-videos/barbellrow.mp4', lift: 'barbell row' },
];

const DemoMode = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="text-white p-4">
      {!selected ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">🏋️ Try Demo Mode</h2>
          {demoVideos.map((vid, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(vid)}
              className="block bg-blue-600 hover:bg-blue-700 rounded px-4 py-2"
            >
              ▶ {vid.name}
            </button>
          ))}
        </div>
      ) : (
        <PoseCanvas liftType={selected.lift} demoVideo={selected.url} />
      )}
    </div>
  );
};

export default DemoMode;