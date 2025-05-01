import React, { useState } from "react";

const trainingGoals = ["Pure Strength", "Strength + Cardio", "Strength + Power", "General Fitness"];
const experienceLevels = ["Absolute Beginner", "Beginner", "Returning Lifter"];
const liftingDays = ["2", "3", "4", "5", "Choose for me"];
const cardioDays = ["0", "1", "2", "3", "4", "Choose for me"];
const sessionDurations = ["Under 45 minutes", "45–60 minutes", "60+ minutes"];
const bodyweightGoals = ["Gain Muscle", "Lose Fat", "Maintain / Don’t Care"];
const cardioGoals = ["None", "General Health", "Improve Endurance", "Fat Loss Support"];
const cardioPrefs = ["Zone 2 (Steady)", "HIIT", "Rucking", "Running", "Rowing/Bike", "No Preference"];
const lifts = ["Squat", "Deadlift", "Bench Press", "Overhead Press", "Power Clean"];

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ironscope.up.railway.app'
  : 'http://localhost:3001';

export default function WorkoutSuggestion() {
  const [inputs, setInputs] = useState({
    trainingGoal: "",
    experienceLevel: "",
    liftingDays: "",
    cardioDays: "",
    sessionDuration: "",
    bodyweightGoal: "",
    currentWeight: "",
    cardioGoal: "",
    cardioPref: "",
    workingWeights: { squat: "", deadlift: "", bench: "", ohp: "", powerclean: "" },
    restrictions: "",
  });
  const [plan, setPlan] = useState({ overview: { weekly_schedule: {} }, details: {} });
  const [selectedDay, setSelectedDay] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  function handleInput(e) {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
    setErrors({ ...errors, [name]: null });
  }
  function handleWeightChange(lift, value) {
    setInputs({ ...inputs, workingWeights: { ...inputs.workingWeights, [lift]: value } });
  }

  const hideLiftingDays = inputs.liftingDays === "Choose for me";
  const hideCardioDays = inputs.cardioDays === "Choose for me";

  function validate() {
    let e = {};
    if (!inputs.trainingGoal) e.trainingGoal = "Required";
    if (!inputs.experienceLevel) e.experienceLevel = "Required";
    if (!inputs.liftingDays) e.liftingDays = "Required";
    if (!inputs.sessionDuration) e.sessionDuration = "Required";
    if (!inputs.bodyweightGoal) e.bodyweightGoal = "Required";
    if (!inputs.cardioGoal) e.cardioGoal = "Required";
    return e;
  }

  function Spinner() {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-white border-t-black rounded-full animate-spin mb-6"></div>
        <div className="text-lg font-bold text-white tracking-wide">
          IronScope is <span className="text-pink-400">generating your workout</span>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setLoading(true);
    setPlan(null);
    setApiError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/generate-workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (!data || typeof data !== 'object') {
        throw new Error("Unexpected response structure");
      }
      setPlan({
        overview: {
          weekly_schedule: data?.overview?.weekly_schedule || {},
        },
        details: data?.details || {},
      });
    } catch (error) {
      console.error("Workout generation failed:", error);
      setApiError("Something went wrong. Please try again later.");
    }
    setLoading(false);
  }

  const convertToWeekdays = (schedule) => {
    const dayMap = {
      "Day 1": "Mon",
      "Day 2": "Tue",
      "Day 3": "Wed",
      "Day 4": "Thu",
      "Day 5": "Fri",
      "Day 6": "Sat",
      "Day 7": "Sun",
    };
    const fixed = {};
    for (const [week, days] of Object.entries(schedule)) {
      fixed[week] = {};
      for (const [dayKey, value] of Object.entries(days)) {
        fixed[week][dayMap[dayKey] || dayKey] = value;
      }
    }
    return fixed;
  };
  

  function renderTable(overview) {
    const schedule = convertToWeekdays(overview?.weekly_schedule || {});
    const weeks = Object.keys(schedule);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    return (
      <div className="overflow-x-auto mb-8">
        <h2 className="text-3xl font-extrabold mb-4 text-center text-white tracking-wide">YOUR WORKOUT</h2>
        <table className="table-fixed w-full border-collapse text-sm text-white">
          <thead>
            <tr className="bg-[#1A1A1D]">
              <th className="border border-gray-700 px-3 py-2 text-left">Week</th>
              {days.map(day => (
                <th key={day} className="border border-gray-700 px-3 py-2 text-center">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map(week => (
              <tr key={week} className="hover:bg-[#2a2a2d]">
                <td className="border border-gray-700 px-3 py-2 font-semibold text-white">{week}</td>
                {days.map(day => (
                  <td
                    key={day}
                    className="border border-gray-700 px-3 py-2 text-center cursor-pointer hover:bg-pink-900 transition"
                    onClick={() => setSelectedDay(schedule[week]?.[day])}
                  >
                    {schedule[week]?.[day] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderDetails(details) {
    if (!selectedDay) {
      return (
        <div className="text-center text-gray-400 italic mb-6">
          Enter your preferences below to generate workout.
        </div>
      );
    }
    if (!details[selectedDay]) return null;
    const data = details[selectedDay];

    return (
      <div className="bg-[#1C1C1E] p-4 rounded-xl shadow-md border border-pink-600 w-full mb-6">
        <h3 className="text-xl font-bold mb-2 text-blue-300">{selectedDay}</h3>
        {data.error ? (
          <p>{data.error}</p>
        ) : (
          ["warmup", "lifts", "accessory", "cardio", "cooldown"].map(section => (
            data[section] && (
              <div key={section} className="mb-2">
                <h4 className="font-semibold text-pink-400 capitalize">{section}</h4>
                <ul className="list-disc ml-6 text-white">
                  {Array.isArray(data[section]) ? (
                    data[section].map((item, i) => <li key={i}>{typeof item === 'string' ? item : `${item.exercise} – ${item.sets}x${item.reps} @ ${item.weight} lbs`}</li>)
                  ) : (
                    <li>{data[section]}</li>
                  )}
                </ul>
              </div>
            )
          ))
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 text-white flex flex-col items-center justify-center min-h-screen">
      {loading && <Spinner />}
      {apiError && <div className="text-red-500 font-semibold mb-4">{apiError}</div>}
      {!loading && !apiError && plan && plan.overview && renderTable(plan.overview)}
      {!loading && !apiError && plan && plan.details && renderDetails(plan.details)}
      {/* --- Form goes below --- */}
      <form
      className="space-y-8 bg-[#202124] rounded-xl p-4 shadow-lg w-full"
      onSubmit={handleSubmit}
      autoComplete="off"
      style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}
        >
        {/* -- Section: Basics -- */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-pink-400">Basics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Training Goal <span className="text-red-500">*</span></label>
              <select
                name="trainingGoal"
                value={inputs.trainingGoal}
                onChange={handleInput}
                className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
              >
                <option value="">Select...</option>
                {trainingGoals.map(goal => <option key={goal}>{goal}</option>)}
              </select>
              {errors.trainingGoal && <div className="text-red-500 text-xs mt-1">{errors.trainingGoal}</div>}
            </div>
            <div>
              <label className="block mb-1">Experience Level <span className="text-red-500">*</span></label>
              <select
                name="experienceLevel"
                value={inputs.experienceLevel}
                onChange={handleInput}
                className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
              >
                <option value="">Select...</option>
                {experienceLevels.map(level => <option key={level}>{level}</option>)}
              </select>
              {errors.experienceLevel && <div className="text-red-500 text-xs mt-1">{errors.experienceLevel}</div>}
            </div>
          </div>
        </div>

        {/* -- Section: Workout Preferences -- */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-pink-400">Workout Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Lifting Days per Week <span className="text-red-500">*</span></label>
              <select
                name="liftingDays"
                value={inputs.liftingDays}
                onChange={handleInput}
                className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
              >
                <option value="">Select...</option>
                {liftingDays.map(day => <option key={day}>{day}</option>)}
              </select>
              {errors.liftingDays && <div className="text-red-500 text-xs mt-1">{errors.liftingDays}</div>}
            </div>
            {!hideLiftingDays && (
              <div>
                <label className="block mb-1">Session Duration <span className="text-red-500">*</span></label>
                <select
                  name="sessionDuration"
                  value={inputs.sessionDuration}
                  onChange={handleInput}
                  className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
                >
                  <option value="">Select...</option>
                  {sessionDurations.map(dur => <option key={dur}>{dur}</option>)}
                </select>
                {errors.sessionDuration && <div className="text-red-500 text-xs mt-1">{errors.sessionDuration}</div>}
              </div>
            )}
            <div>
              <label className="block mb-1">Bodyweight Goal <span className="text-red-500">*</span></label>
              <select
                name="bodyweightGoal"
                value={inputs.bodyweightGoal}
                onChange={handleInput}
                className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
              >
                <option value="">Select...</option>
                {bodyweightGoals.map(goal => <option key={goal}>{goal}</option>)}
              </select>
              {errors.bodyweightGoal && <div className="text-red-500 text-xs mt-1">{errors.bodyweightGoal}</div>}
            </div>
            <div>
              <label className="block mb-1">Current Weight (Optional)</label>
              <input
                type="number"
                min="0"
                name="currentWeight"
                value={inputs.currentWeight}
                onChange={handleInput}
                className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
                placeholder="lbs or kg"
              />
            </div>
          </div>
        </div>

        {/* -- Section: Cardio Preferences -- */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-pink-400">Cardio Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Cardio Goal <span className="text-red-500">*</span></label>
              <select
                name="cardioGoal"
                value={inputs.cardioGoal}
                onChange={handleInput}
                className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
              >
                <option value="">Select...</option>
                {cardioGoals.map(goal => <option key={goal}>{goal}</option>)}
              </select>
              {errors.cardioGoal && <div className="text-red-500 text-xs mt-1">{errors.cardioGoal}</div>}
            </div>
            <div>
              <label className="block mb-1">Cardio Preference</label>
              <select
                name="cardioPref"
                value={inputs.cardioPref}
                onChange={handleInput}
                className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
              >
                <option value="">Select...</option>
                {cardioPrefs.map(pref => <option key={pref}>{pref}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1">Cardio Days per Week</label>
              <select
                name="cardioDays"
                value={inputs.cardioDays}
                onChange={handleInput}
                className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
              >
                <option value="">Select...</option>
                {cardioDays.map(day => <option key={day}>{day}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* -- Section: Advanced / Optional Inputs -- */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-pink-400">Advanced / Optional</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Current Working Weights (Optional)</label>
              <div className="grid grid-cols-2 gap-2">
                {lifts.map(lift => (
                  <input
                    key={lift}
                    type="number"
                    min="0"
                    placeholder={`${lift} (lbs)`}
                    value={inputs.workingWeights[lift.toLowerCase().replace(/\s/g, '')] || ""}
                    onChange={e => handleWeightChange(lift.toLowerCase().replace(/\s/g, ''), e.target.value)}
                    className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700 mb-1"
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-1">Injury or Movement Restrictions</label>
              <input
                type="text"
                name="restrictions"
                value={inputs.restrictions}
                onChange={handleInput}
                className="w-full p-2 rounded bg-[#1C1C1E] border border-gray-700"
                placeholder="e.g., No overhead work, knee pain"
              />
            </div>
          </div>
        </div>

        {/* -- Submit Button -- */}
        <button
          type="submit"
          className="bg-pink-600 rounded px-6 py-2 font-bold hover:bg-pink-700 w-full mt-4 shadow"
        >
          Generate Workout
        </button>
      </form>

    </div>
  );
}
