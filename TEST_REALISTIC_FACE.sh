#!/bin/bash

# ============================================================================
# RAGS AI - Realistic Face Test Script
# ============================================================================

echo "🎭 Testing RAGS Realistic 3D Human Face"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $2"
    ((FAILED++))
  fi
}

echo "📦 1. Checking Files..."
echo "------------------------"

# Check frontend files
if [ -f "desktop/src/components/RealisticHumanFace.tsx" ]; then
  test_result 0 "RealisticHumanFace.tsx exists"
else
  test_result 1 "RealisticHumanFace.tsx missing"
fi

if [ -f "desktop/src/services/faceAnimationService.ts" ]; then
  test_result 0 "faceAnimationService.ts exists"
else
  test_result 1 "faceAnimationService.ts missing"
fi

# Check backend files
if [ -f "backend/src/routes/face-animation.ts" ]; then
  test_result 0 "face-animation.ts route exists"
else
  test_result 1 "face-animation.ts route missing"
fi

echo ""
echo "🔍 2. Checking Dependencies..."
echo "-------------------------------"

# Check if Three.js is in package.json
if grep -q "\"three\"" desktop/package.json; then
  test_result 0 "Three.js dependency found"
else
  test_result 1 "Three.js dependency missing"
fi

# Check if MediaPipe is in package.json
if grep -q "@mediapipe/face_mesh" desktop/package.json; then
  test_result 0 "MediaPipe Face Mesh found"
else
  test_result 1 "MediaPipe Face Mesh missing"
fi

# Check if React Three Fiber is in package.json
if grep -q "@react-three/fiber" desktop/package.json; then
  test_result 0 "React Three Fiber found"
else
  test_result 1 "React Three Fiber missing"
fi

echo ""
echo "🎨 3. Checking Component Structure..."
echo "--------------------------------------"

# Check for key components in RealisticHumanFace.tsx
if grep -q "RealisticEye" desktop/src/components/RealisticHumanFace.tsx; then
  test_result 0 "RealisticEye component found"
else
  test_result 1 "RealisticEye component missing"
fi

if grep -q "RealisticMouth" desktop/src/components/RealisticHumanFace.tsx; then
  test_result 0 "RealisticMouth component found"
else
  test_result 1 "RealisticMouth component missing"
fi

if grep -q "Eyebrows" desktop/src/components/RealisticHumanFace.tsx; then
  test_result 0 "Eyebrows component found"
else
  test_result 1 "Eyebrows component missing"
fi

if grep -q "RealisticHead" desktop/src/components/RealisticHumanFace.tsx; then
  test_result 0 "RealisticHead component found"
else
  test_result 1 "RealisticHead component missing"
fi

echo ""
echo "🔧 4. Checking Features..."
echo "--------------------------"

# Check for emotion support
if grep -q "happy.*sad.*surprised.*thinking.*excited.*curious.*neutral.*angry" desktop/src/components/RealisticHumanFace.tsx; then
  test_result 0 "All 8 emotions supported"
else
  test_result 1 "Missing emotion support"
fi

# Check for lip-sync
if grep -q "PHONEME_SHAPES" desktop/src/components/RealisticHumanFace.tsx; then
  test_result 0 "Lip-sync phoneme system found"
else
  test_result 1 "Lip-sync system missing"
fi

# Check for blinking
if grep -q "blinkProgress" desktop/src/components/RealisticHumanFace.tsx; then
  test_result 0 "Blinking animation found"
else
  test_result 1 "Blinking animation missing"
fi

# Check for eye tracking
if grep -q "eyeRotation" desktop/src/components/RealisticHumanFace.tsx; then
  test_result 0 "Eye tracking found"
else
  test_result 1 "Eye tracking missing"
fi

# Check for breathing animation
if grep -q "breathing" desktop/src/components/RealisticHumanFace.tsx; then
  test_result 0 "Breathing animation found"
else
  test_result 1 "Breathing animation missing"
fi

echo ""
echo "🔌 5. Checking Backend Integration..."
echo "--------------------------------------"

# Check for emotion analysis endpoint
if grep -q "analyze-emotion" backend/src/routes/face-animation.ts; then
  test_result 0 "Emotion analysis endpoint found"
else
  test_result 1 "Emotion analysis endpoint missing"
fi

# Check for phoneme generation
if grep -q "text-to-phonemes" backend/src/routes/face-animation.ts; then
  test_result 0 "Phoneme generation endpoint found"
else
  test_result 1 "Phoneme generation endpoint missing"
fi

# Check if routes are registered in index.ts
if grep -q "face-animation" backend/src/index.ts; then
  test_result 0 "Face animation routes registered"
else
  test_result 1 "Face animation routes not registered"
fi

echo ""
echo "📱 6. Checking App Integration..."
echo "----------------------------------"

# Check if RealisticHumanFace is imported in App.tsx
if grep -q "RealisticHumanFace" desktop/src/App.tsx; then
  test_result 0 "RealisticHumanFace imported in App.tsx"
else
  test_result 1 "RealisticHumanFace not imported in App.tsx"
fi

# Check if faceAnimationService is imported
if grep -q "faceAnimationService" desktop/src/App.tsx; then
  test_result 0 "faceAnimationService imported"
else
  test_result 1 "faceAnimationService not imported"
fi

echo ""
echo "🎯 7. Feature Checklist..."
echo "--------------------------"

# Feature checklist
features=(
  "Realistic 3D face model:RealisticHead"
  "Eye tracking:eyeRotation"
  "Blinking animation:blinkProgress"
  "Lip-sync:PHONEME_SHAPES"
  "Facial expressions:emotion"
  "Micro-expressions:breathing"
  "User tracking:MediaPipe"
  "Audio analysis:audioData"
)

for feature in "${features[@]}"; do
  name="${feature%%:*}"
  keyword="${feature##*:}"
  
  if grep -q "$keyword" desktop/src/components/RealisticHumanFace.tsx; then
    test_result 0 "$name"
  else
    test_result 1 "$name"
  fi
done

echo ""
echo "========================================"
echo "📊 Test Results"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed! Realistic face is ready!${NC}"
  echo ""
  echo "🚀 Next Steps:"
  echo "1. Start backend: cd backend && npm run dev"
  echo "2. Start desktop: cd desktop && npm run dev"
  echo "3. Open browser and test the realistic face"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please fix the issues.${NC}"
  echo ""
  exit 1
fi

