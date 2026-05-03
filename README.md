## How to Start the project

1. Open a terminal in this folder (`MotionFlappyBird`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open the URL shown in the terminal (usually `http://localhost:5173`).

# FullMotion Flappy Bird

FullMotion Flappy Bird is a computer vision powered version of Flappy Bird that replaces traditional keyboard controls with real time body movement and hand gestures. Built using MediaPipe and MoveNet, it turns natural human motion into gameplay input.

## What it does

- Arm flapping controls the bird’s flight  
- Hand tracking acts as an on screen cursor  
- Pinch gesture enables selection and interaction  
- Squatting triggers an “egg drop” mechanic into pipes  

The goal is to create a more immersive, full body gaming experience using natural user interaction.

## Built With

- Python  
- MediaPipe  
- MoveNet  
- TensorFlow Lite  


## How it works

The system uses real time pose and hand landmark detection to map body movement into game controls. Gesture signals are processed and smoothed to reduce noise, then translated directly into in game actions such as jumping, aiming, and triggering events.

## Key Challenges

- Reducing jitter in hand and pose tracking  
- Preventing false gesture detection  
- Minimizing latency between motion and gameplay response  
- Improving squat detection consistency across different body positions  

## What I learned

This project explores human centered interaction design by replacing traditional inputs with natural movement. It demonstrates how computer vision can be used to build more intuitive and expressive gameplay systems.
