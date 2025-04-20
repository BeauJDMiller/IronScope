import express from 'express';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { OpenAI } from 'openai';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
  
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const height = Math.max(1, Math.abs(shoulderCenterY - hipCenterY));
  
    return keypoints.map(k => ({
      name: k.name,
      x: ((k.x - hipCenterX) / height).toFixed(3),
      y: ((k.y - hipCenterY) / height).toFixed(3),
      score: k.score.toFixed(2)
    }));
  };
  
  app.post('/api/analyze', async (req, res) => {
    try {
      const { keypointFrames } = req.body;
  
      const summarized = keypointFrames.map((frame, i) => {
        const normalized = normalizeKeypoints(frame);
        const coords = normalized
          .filter(k => k.score > 0.3)
          .map(k => `${k.name}: [${k.x}, ${k.y}]`)
          .join(', ');
        return `Frame ${i + 1}: ${coords}`;
      }).join('\n');
  
      const prompt = `You are a certified strength and conditioning coach analyzing a barbell lift performed by a beginner athlete. You are provided a sequence of 2D joint keypoints (shoulders, hips, knees, ankles, elbows, wrists) across multiple frames of video. Each frame shows the person's posture at a specific point in time.
  
  The coordinates have been normalized relative to the athlete's hip center and scaled by their torso height.
  
  Your job is to:
  
  1. Identify the lift: choose one from [squat, deadlift, overhead press, bench press, bent-over row].
  2. Assume ideal form standards for that lift as used in strength training and powerlifting.
  3. Analyze the movement across three key phases:
     - The **top of the movement** (starting position or lockout)
     - The **bottom of the movement** (deepest part of the lift)
     - The **ascent** or return from bottom to top
  
  4. Provide supportive, detailed feedback for a **beginner athlete**. Mention both:
     - ✅ What the athlete is doing well (good alignment, bar path, symmetry, etc.)
     - ⚠️ What needs improvement, including joint positioning errors, lack of depth, leaning, or imbalances
  
  5. Offer **specific and practical advice** to help the athlete move closer to ideal form, using encouraging and clear coaching language. Avoid vague comments like “the form is bad.” Be specific and constructive.
  
  Use this structure:
  • **Overall Feedback**: [1–2 tips for improvement + 1 strength to encourage them]
  • **Beginning of the movement**: [analysis]  
  • **Bottom Position**: [analysis]  
  • **Ascent**: [analysis]  

  Only use at most two sentences for each section. Be concise and clear.
  Use bullet points for the feedback. Do not use any other formatting or sections.

  Return your feedback in a nice looking HTML format with white text. Use <h1> for the title and <h2> for the sections. Use <p> for the text. Do not use any other HTML tags.
  Do not include any other text or explanations. Just the HTML. Keep your response concise and focused on the analysis, avoiding unnecessary details or filler content.
  Do not include any disclaimers or additional information. Keep your response to fewer than 900 characters.
  Do not include any references to the frames or video. Just focus on the analysis and feedback.
  
  Here are the pose frames with joint coordinates:
  ${summarized}`;
  
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
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
      console.error('OpenAI error:', error);
      res.status(500).json({ error: 'Failed to generate feedback' });
    }
  });
  
  
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client', 'build')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
    });
  }
  

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });