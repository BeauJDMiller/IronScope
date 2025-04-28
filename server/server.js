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
    try {
      const inputs = req.body;
  
      // Construct a detailed system prompt
      const systemPrompt = `
  You are a certified barbell strength coach and AI workout generator.
  You create Starting Strength-style barbell-based workout programs, adapting for user training goals, experience, and preferences. Output all workout days in a clear, repeatable format, as in the example below.
  
  --- Output format example ---
  **Week 1 – Day 1: Workout A (Strength Focus)**
  Training Goal: Strength + Cardio
  Bodyweight Goal: Gain Muscle
  Session Duration: 60 min
  Experience: Beginner
  
  ---
  
  ### 🔥 Warm-Up Routine
  - Foam Rolling: Quads, Glutes, T-Spine (30 sec each)
  - Dynamic Prep: Leg Swings, Arm Circles, Bodyweight Squats, Shoulder Dislocates
  - Barbell Warm-Up: Progress to working weight in 2–3 sets
  
  ---
  
  ### 🏋️‍♂️ Main Lifts
  1. **Squat** – 3x5 @ [weight] lbs  
  2. **Overhead Press** – 3x5 @ [weight] lbs  
  3. **Deadlift** – 1x5 @ [weight] lbs  
  
  ---
  
  ### 💪 Accessory or Auxiliary Work (Optional)
  - Chin-Ups – 3 sets to failure (or band assist)
  
  ---
  
  ### 🦀 Cardio Add-On
  - Zone 2: 25 min incline walk @ 8% incline  
  - HR: 120–140 bpm
  
  ---
  
  ### 🧊 Cooldown
  - Deep squat hold – 1 min
  - Child’s pose – 1 min
  - Diaphragmatic breathing – 2 min
  
  ---
  
  ### 📝 Notes
  - Add 5 lbs next session if completed with good form
  - Rest tomorrow (or light cardio if selected)
  ---
  
  Always use this style, adapt programming to user preferences and restrictions, and give realistic weights if user working weights are provided. Avoid disclaimers and stick to the format.
      `;
  
      // User prompt based on user inputs
      const userPrompt = `
  User Profile:
  - Training Goal: ${inputs.trainingGoal}
  - Experience Level: ${inputs.experienceLevel}
  - Lifting Days per Week: ${inputs.liftingDays}
  - Cardio Days per Week: ${inputs.cardioDays}
  - Session Duration: ${inputs.sessionDuration}
  - Bodyweight Goal: ${inputs.bodyweightGoal}
  - Current Weight: ${inputs.currentWeight}
  - Cardio Goal: ${inputs.cardioGoal}
  - Cardio Preference: ${inputs.cardioPref}
  - Working Weights: 
      Squat: ${inputs.workingWeights?.squat || 'Not Provided'}, 
      Deadlift: ${inputs.workingWeights?.deadlift || 'Not Provided'}, 
      Bench: ${inputs.workingWeights?.bench || 'Not Provided'}, 
      Overhead Press: ${inputs.workingWeights?.ohp || 'Not Provided'}, 
      Power Clean: ${inputs.workingWeights?.powerclean || 'Not Provided'}
  - Injury/Movement Restrictions: ${inputs.restrictions || 'None'}
  
  Generate a single day workout for the user using the template above.
      `;
  
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // or 'gpt-3.5-turbo' if needed
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
      });
  
      const workout = completion.choices[0].message.content;
      res.json({ workout });
    } catch (error) {
      console.error('OpenAI error:', error.response?.data || error.message || error);
      res.status(500).json({ error: 'Failed to generate workout', details: error.message });
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

