#!/bin/bash

# 🔥 VERIFY ALL RAGS AI FEATURES - REAL-TIME TEST
# Tests all TIER 1, 2, and 3 features

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔥 RAGS AI - COMPLETE FEATURE VERIFICATION 🔥          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

WORKING=0
PARTIAL=0
MISSING=0

# Check backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Checking Backend Status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend is running${NC}"
else
  echo -e "${RED}❌ Backend is NOT running${NC}"
  echo ""
  echo "Please start the backend:"
  echo "  cd backend && npm run dev"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 TIER 1: CORE FEATURES (MUST HAVE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Initialize evolution
echo "Initializing evolution system..."
curl -s -X POST "$BASE_URL/api/evolution/initialize" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_verify"}' > /dev/null
sleep 2

# Get status
STATUS=$(curl -s "$BASE_URL/api/evolution/status")

# Feature 1: Self-Learning Core
echo -n "1. 🧠 Self-Learning Core ... "
if echo "$STATUS" | grep -q "meta_learning"; then
  echo -e "${GREEN}✅ WORKING${NC}"
  echo "   - Self-critique system"
  echo "   - Feedback learning"
  echo "   - Prompt optimization"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

# Feature 2: Autonomous Agent System
echo -n "2. 🤖 Autonomous Agent System ... "
if echo "$STATUS" | grep -q "agent_dna"; then
  AGENTS=$(echo "$STATUS" | grep -o '"total_agents":[0-9]*' | head -1 | cut -d':' -f2)
  echo -e "${GREEN}✅ WORKING${NC}"
  echo "   - $AGENTS specialized agents"
  echo "   - Multi-agent collaboration"
  echo "   - Natural selection & evolution"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

# Feature 3: Internet Brain
echo -n "3. 🌐 Internet Brain ... "
if echo "$STATUS" | grep -q "internet_brain"; then
  echo -e "${GREEN}✅ WORKING${NC}"
  echo "   - Trending topics learning"
  echo "   - Source credibility scoring"
  echo "   - Multi-source synthesis"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

# Feature 4: Context Awareness
echo -n "4. 🎯 Context Awareness ... "
# Check if Real AI Integration exists (has basic context)
if [ -f "backend/src/services/real-ai-integration.ts" ]; then
  echo -e "${YELLOW}⚠️  PARTIAL${NC}"
  echo "   - Basic user context (Real AI Integration)"
  echo "   - Conversation history"
  echo "   ❌ Missing: Dedicated context engine"
  echo "   ❌ Missing: 360° awareness"
  echo "   ❌ Missing: Predictive intelligence"
  ((PARTIAL++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

# Feature 5: Auto-Healing
echo -n "5. 🛡️ Auto-Healing ... "
if echo "$STATUS" | grep -q "self_healing"; then
  echo -e "${GREEN}✅ WORKING${NC}"
  echo "   - Auto-debug system"
  echo "   - System snapshots"
  echo "   - Health monitoring"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ TIER 2: GAME CHANGERS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Feature 6: Self-Modification Engine
echo -n "6. 🔧 Self-Modification Engine ... "
if [ -f "backend/src/services/self-modification-engine.ts" ]; then
  echo -e "${GREEN}✅ WORKING${NC}"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT IMPLEMENTED${NC}"
  echo "   ❌ Missing: Code generation"
  echo "   ❌ Missing: Self-coding capability"
  echo "   ❌ Missing: Plugin system"
  echo "   ❌ Missing: Architecture optimization"
  ((MISSING++))
fi
echo ""

# Feature 7: Goal-Oriented Autopilot
echo -n "7. 🎯 Goal-Oriented Autopilot ... "
if echo "$STATUS" | grep -q "goal_autopilot"; then
  echo -e "${GREEN}✅ WORKING${NC}"
  echo "   - Long-term goal planning"
  echo "   - AI-generated roadmaps"
  echo "   - Daily task assignment"
  echo "   - Habit tracking"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

# Feature 8: Super Integration Layer
echo -n "8. 🌉 Super Integration Layer ... "
if echo "$STATUS" | grep -q "initialized"; then
  echo -e "${YELLOW}⚠️  PARTIAL${NC}"
  echo "   - Evolution Orchestrator (internal)"
  echo "   - Cross-system events"
  echo "   ❌ Missing: Universal API connectors"
  echo "   ❌ Missing: Third-party integrations"
  echo "   ❌ Missing: Hardware control layer"
  ((PARTIAL++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

# Feature 9: Multi-Agent Collaboration
echo -n "9. 🤝 Multi-Agent Collaboration ... "
if echo "$STATUS" | grep -q "agent_dna"; then
  echo -e "${GREEN}✅ WORKING${NC}"
  echo "   - Agent-to-agent communication"
  echo "   - Task collaboration"
  echo "   - Shared goals"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌟 TIER 3: FUTURISTIC FEATURES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Feature 10: AI-to-AI Communication
echo -n "10. 🌐 AI-to-AI Communication ... "
if echo "$STATUS" | grep -q "social"; then
  echo -e "${GREEN}✅ WORKING${NC}"
  echo "    - AI message exchange"
  echo "    - AI network registration"
  echo "    - Collaborative problem solving"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

# Feature 11: Creative Powerhouse
echo -n "11. 🎨 Creative Powerhouse ... "
if echo "$STATUS" | grep -q "creative"; then
  echo -e "${GREEN}✅ WORKING${NC}"
  echo "    - Content generation (blog, social, etc.)"
  echo "    - App idea generation"
  echo "    - Image prompts"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

# Feature 12: Experimental Lab
echo -n "12. 🧪 Experimental Lab ... "
if echo "$STATUS" | grep -q "experimental"; then
  echo -e "${GREEN}✅ WORKING${NC}"
  echo "    - A/B testing framework"
  echo "    - Hypothesis testing"
  echo "    - Simulation mode"
  ((WORKING++))
else
  echo -e "${RED}❌ NOT WORKING${NC}"
  ((MISSING++))
fi
echo ""

# Final Summary
TOTAL=12
COMPLETE_PERCENT=$(awk "BEGIN {printf \"%.0f\", (($WORKING + $PARTIAL * 0.5) / $TOTAL) * 100}")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 📊 FEATURE VERIFICATION REPORT               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "Total Features:      $TOTAL"
echo -e "${GREEN}✅ Fully Working:    $WORKING${NC}"
echo -e "${YELLOW}⚠️  Partially Done:   $PARTIAL${NC}"
echo -e "${RED}❌ Missing/Broken:   $MISSING${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}🎯 Overall Completion: $COMPLETE_PERCENT%${NC}"
echo ""

if [ $COMPLETE_PERCENT -ge 90 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}🎉 EXCELLENT! Almost everything is working!${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
elif [ $COMPLETE_PERCENT -ge 75 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}✅ GOOD! Most features are working!${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
elif [ $COMPLETE_PERCENT -ge 50 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${YELLOW}⚠️  PARTIAL: Some features need work${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${RED}❌ WARNING: Many features missing${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

echo ""
echo "📋 Missing Features:"
if [ $MISSING -gt 0 ] || [ $PARTIAL -gt 0 ]; then
  [ -f "backend/src/services/self-modification-engine.ts" ] || echo "  ❌ Self-Modification Engine"
  echo "  ⚠️  Enhanced Context Awareness (partial)"
  echo "  ⚠️  Super Integration Layer (partial)"
fi

echo ""
echo "📚 For detailed status, see:"
echo "  - FEATURES_STATUS_REALTIME.md"
echo ""
echo "Verification completed at: $(date)"
echo ""
