import express from 'express';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { OpenAI } from 'openai';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';



const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 

app.post('/create-account', (req, res) => {
    const { username, password } = req.body;
    const csvLine = `${username},${password}\n`;
  
    fs.appendFile('server/login_info.csv', csvLine, (err) => {
      if (err) {
        console.error('Failed to write to CSV:', err); // 👈 Add this
        return res.status(500).send('Error saving user');
      }
      res.status(200).send('User saved');
    });
  });
  


app.post('/create-checkout-session', async (req, res) => {
  const { type } = req.body;
  const priceId =
    type === 'monthly'
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_ONE_TIME_PRICE_ID;

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: priceId, quantity: 1 }],
    mode: type === 'monthly' ? 'subscription' : 'payment',
    success_url: 'http://localhost:3000/form-analysis',
    cancel_url: 'http://localhost:3000/payment',
  });

  res.send({ url: session.url });
});

const normalizeKeypoints = (keypoints) => {
  const leftHip = keypoints.find(k => k.name === 'left_hip');
  const rightHip = keypoints.find(k => k.name === 'right_hip');
  const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
  const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');

  if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) return [];

  const hipX = (leftHip.x + rightHip.x) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const torsoHeight = Math.max(1, Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - hipY));

  return keypoints.map(k => ({
    name: k.name,
    x: +((k.x - hipX) / torsoHeight).toFixed(2),
    y: +((k.y - hipY) / torsoHeight).toFixed(2),
  }));
};
  
  app.post('/api/analyze', async (req, res) => {
    try {
      const { keypointFrames } = req.body;
  
      const summarized = keypointFrames.slice(0, 30).map((frame, i) => {
        const normalized = normalizeKeypoints(frame);
        const coords = normalized
          .filter(k => k.score > 0.3)
          .map(k => `${k.name}: [${k.x}, ${k.y}]`)
          .join(', ');
        return `Frame ${i + 1}: ${coords}`;
      }).join('\n');
  
      const prompt = `You are a certified strength coach analyzing a beginner’s barbell lift.

      You’ll receive normalized 2D joint coordinates (shoulders, hips, knees, ankles, elbows, wrists) over time. Based on the data:

      1. Identify the lift: one of [squat, deadlift, overhead press, bench press, bent-over row].
      2. Evaluate technique across three phases:
        - Top
        - Bottom
        - Ascent
      3. Give concise, specific, supportive feedback:
        - ✅ What’s done well
        - ⚠️ What to fix
        - 🎯 Clear advice to improve form

      Use this format (max 2 sentences per section):
      <h1>Lift Form Feedback</h1>
      <h2>Overall Feedback</h2><p>...</p>
      <h2>Top</h2><p>...</p>
      <h2>Bottom</h2><p>...</p>
      <h2>Ascent</h2><p>...</p>

      White text only. No disclaimers. No frame references. Keep total under 900 characters.

      Pose data:
      ${summarized}`;
  
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 250,
      });
  
      const feedback = completion.choices[0].message.content;
      res.json({ feedback });
    } catch (error) {
      console.error('OpenAI error:', error.response?.data || error.message || error);
      res.status(500).json({ error: 'Failed to generate feedback', details: error.message });
    }
  });


  app.post('/api/generate-workout', async (req, res) => {
    const inputs = req.body;
  
    const systemPrompt = `
    You are a professional strength coach and AI assistant trained in Starting Strength. Generate a personalized 6-week workout program in structured JSON format.

First, create a weekly_schedule object nested inside overview. Each week should contain seven days labeled with one of the following:
-"Workout A"
-"Workout B"
-"Cardio (Zone 2)"
-"Cardio (HIIT)"
-"Rest"
Then, include a details object that contains definitions for every unique workout type used in the schedule. Each workout should have the following keys:
-warmup (array of strings)
-lifts (array of objects with: exercise, sets, reps, weight in terms of lbs)
-accessory (array of strings)
-cardio (string or null)
-cooldown (array of strings)

The final output must be a single valid JSON object with two top-level keys:
overview: containing the 6-week schedule under weekly_schedule
details: containing detailed instructions for each workout label used

Format example:
{ "overview": { "weekly_schedule": { "Week 1": { "Mon": "Workout A", "Tue": "Rest", "Wed": "Workout B", "Thu": "Cardio (Zone 2)", "Fri": "Workout A", "Sat": "Rest", "Sun": "Cardio (HIIT)" }, "Week 2": { "Mon": "Workout B", "Tue": "Cardio (Zone 2)", "Wed": "Workout A", "Thu": "Rest", "Fri": "Workout B", "Sat": "Cardio (Zone 2)", "Sun": "Rest" } } }, "details": { "Workout A": { "warmup": [ "Foam rolling: quads, glutes, T-spine", "Dynamic prep: squats, leg swings, shoulder circles" ], "lifts": [ { "exercise": "Squat", "sets": 3, "reps": 5, "weight": 185 }, { "exercise": "Overhead Press", "sets": 3, "reps": 5, "weight": 95 }, { "exercise": "Deadlift", "sets": 1, "reps": 5, "weight": 225 } ], "accessory": ["Chin-ups – 3 sets to failure"], "cardio": null, "cooldown": ["Squat hold – 1 min", "Diaphragmatic breathing – 2 min"] }, "Cardio (Zone 2)": { "warmup": ["Brisk walking – 5 min"], "lifts": [], "accessory": [], "cardio": "Incline treadmill walking – 25 min at 120–140 bpm", "cooldown": ["Light stretching"] } } }

Do not return any commentary, headers, or markdown formatting — just a pure JSON object. Ensure JSON is valid and does not contain duplicate keys.
Output the weekly_schedule using abbreviated weekday names as keys: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" – not "Day 1", "Day 2", etc.
    `;
    
    const userPrompt = `
      User Profile:
    - Training Goal: ${inputs.trainingGoal}
    - Experience Level: ${inputs.experienceLevel}
    - Lifting Days per Week: ${inputs.liftingDays}
    - Cardio Days per Week: ${inputs.cardioDays}
    - Session Duration: ${inputs.sessionDuration}
    - Bodyweight Goal: ${inputs.bodyweightGoal}
    - Current Weight: ${inputs.currentWeight || "Not Provided"}
    - Cardio Goal: ${inputs.cardioGoal}
    - Cardio Preference: ${inputs.cardioPref || "None"}
    - Working Weights:
        Squat: ${inputs.workingWeights?.squat || 'Not Provided'},
        Deadlift: ${inputs.workingWeights?.deadlift || 'Not Provided'},
        Bench: ${inputs.workingWeights?.bench || 'Not Provided'},
        Overhead Press: ${inputs.workingWeights?.ohp || 'Not Provided'},
        Power Clean: ${inputs.workingWeights?.powerclean || 'Not Provided'}
    - Injury/Movement Restrictions: ${inputs.restrictions || 'None'}

    Generate a 6-week structured JSON workout plan using the system format.
    Include the following details:
    - For each workout, provide a warmup, lifts (with sets, reps, and weights), accessory work, cardio (if applicable), and cooldown.
    - Ensure the plan is balanced and progressive, considering the user's goals and experience level.
    - For the progression, increase weights by 5-10% weekly for compound lifts and 2.5-5% for accessory lifts.
    - Include rest days and cardio sessions as per the user's preferences. If the user has requested no cardio, ensure that the plan reflects this.
`;
  
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      });
      console.log('OpenAI response:', completion.choices[0].message.content); // 👈 Add this
      const plan = JSON.parse(completion.choices[0].message.content);
      res.json(plan);
    } catch (error) {
      console.error('Workout generation error:', error);
      res.status(500).json({ details: { error: 'Failed to generate workout plan.' } });
    }
  });
  
  


  
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });

  // 🔽 Dynamic port for Railway
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });

