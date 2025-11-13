# 🧪 RAGS AI - MANUAL TESTING GUIDE

**सब features को end-to-end test करने के लिए step-by-step guide** 🎯

---

## 🚀 Prerequisites

```bash
# 1. Make sure backend is running
cd backend
npm run dev

# 2. Make sure Ollama is running
# Check: http://localhost:11434
```

---

## ✅ TEST 1: Initialize Evolution System

### API Call:
```bash
curl -X POST http://localhost:3000/api/evolution/initialize \
  -H "Content-Type: application/json" \
  -d '{"userId":"raghav"}'
```

### Expected Output:
```json
{
  "success": true,
  "message": "Evolution Orchestrator initialized",
  "systems_initialized": 9
}
```

### ✅ Verify:
- Should say "Evolution Orchestrator initialized"
- All 9 systems should initialize
- No errors in console

---

## ✅ TEST 2: Check Evolution Status

### API Call:
```bash
curl http://localhost:3000/api/evolution/status
```

### Expected Output:
```json
{
  "initialized": true,
  "evolution_enabled": true,
  "systems": {
    "meta_learning": {...},
    "agent_dna": {...},
    "internet_brain": {...},
    "self_healing": {...},
    "goal_autopilot": {...},
    "creative": {...},
    "experimental": {...},
    "social": {...}
  }
}
```

### ✅ Verify:
- `initialized` should be `true`
- Should show 8 systems (meta_learning, agent_dna, internet_brain, self_healing, goal_autopilot, creative, experimental, social)
- Each system should have statistics

---

## ✅ TEST 3: Get Evolution Report

### API Call:
```bash
curl http://localhost:3000/api/evolution/report
```

### Expected Output:
```
🌟 RAGS AI - EVOLUTION REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 META-LEARNING SYSTEM
- Total Feedback: X
- Average Rating: X.XX/10
...

Status: 🟢 FULLY OPERATIONAL (9 SYSTEMS)
```

### ✅ Verify:
- Report shows all 9 systems
- Statistics for each system
- Status shows "FULLY OPERATIONAL"

---

## ✅ TEST 4: Meta-Learning - Process Message

### API Call:
```bash
curl -X POST http://localhost:3000/api/evolution/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is artificial intelligence?"
  }'
```

### Expected Output:
```json
{
  "response": "AI is...",
  "meta_learning": {
    "self_rating": 8,
    "reasoning": "Good explanation but could be more concise",
    "improvements_suggested": [...]
  }
}
```

### ✅ Verify:
- Gets AI response
- Meta-learning includes self-rating (1-10)
- Includes reasoning and improvements

---

## ✅ TEST 5: Meta-Learning - Record Feedback

### API Call:
```bash
curl -X POST http://localhost:3000/api/evolution/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "responseId": "resp_123",
    "userMessage": "What is AI?",
    "aiResponse": "AI is artificial intelligence...",
    "rating": 9
  }'
```

### Expected Output:
```json
{
  "success": true,
  "message": "Feedback recorded"
}
```

### ✅ Verify:
- Feedback recorded successfully
- System learns from the rating

---

## ✅ TEST 6: Agent DNA - Check Agents

### Check via Status:
```bash
curl http://localhost:3000/api/evolution/status | grep -A 10 "agent_dna"
```

### Expected Output:
```json
"agent_dna": {
  "total_agents": 8,
  "active_agents": 8,
  "by_species": {
    "researcher": 1,
    "coder": 1,
    "designer": 1,
    ...
  }
}
```

### ✅ Verify:
- At least 8 default agents created
- Different species (researcher, coder, designer, etc.)

---

## ✅ TEST 7: Internet Brain - Learn Trending

### API Call:
```bash
curl -X POST http://localhost:3000/api/evolution/learn-trending \
  -H "Content-Type: application/json"
```

### Expected Output:
```json
{
  "success": true,
  "topics_learned": 3,
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ]
}
```

### ✅ Verify:
- Fetches trending topics (Hacker News, GitHub, Reddit)
- Learns from at least 1 topic
- Updates knowledge base

---

## ✅ TEST 8: Self-Healing - Health Check

### Check via Report:
```bash
curl http://localhost:3000/api/evolution/report | grep -A 5 "SELF-HEALING"
```

### Expected Output:
```
🛡️  SELF-HEALING SYSTEM
- Snapshots: X
- Errors Resolved: X/X
- Security Threats: X
- Healthy Components: X
```

### ✅ Verify:
- Shows snapshot count
- Tracks errors
- Monitors system health

---

## ✅ TEST 9: Goal Autopilot - Create Goal

### API Call:
```bash
curl -X POST http://localhost:3000/api/evolution/goals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Python",
    "description": "Master Python programming in 3 months",
    "targetDate": "2025-02-11"
  }'
```

### Expected Output:
```json
{
  "success": true,
  "goal": {
    "id": "goal_xxx",
    "title": "Learn Python",
    "milestones": [...],
    "roadmap": "Week 1: ..."
  }
}
```

### ✅ Verify:
- Goal created with roadmap
- Milestones generated
- Has weekly breakdown

---

## ✅ TEST 10: Goal Autopilot - Get Today's Tasks

### API Call:
```bash
curl http://localhost:3000/api/evolution/tasks/today
```

### Expected Output:
```json
{
  "date": "2025-11-11",
  "tasks": [
    {
      "title": "Complete Python basics",
      "priority": "high",
      "goal_id": "goal_xxx"
    }
  ]
}
```

### ✅ Verify:
- Shows tasks for today
- Tasks linked to goals
- Has priority levels

---

## ✅ TEST 11: Goal Autopilot - Morning Briefing

### API Call:
```bash
curl http://localhost:3000/api/evolution/briefing/morning
```

### Expected Output:
```
🌅 MORNING BRIEFING - November 11, 2025

📋 TODAY'S PRIORITIES
1. Complete Python basics (Learn Python)
2. ...

🎯 ACTIVE GOALS
- Learn Python (30% complete)

📊 HABIT STREAKS
...
```

### ✅ Verify:
- Personalized morning briefing
- Shows today's priorities
- Includes habit tracking

---

## ✅ TEST 12: Creative Powerhouse - Generate Content

### Test via Process:
```bash
curl -X POST http://localhost:3000/api/evolution/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Generate a blog post about AI trends in 2025",
    "context": {"type": "creative"}
  }'
```

### ✅ Verify:
- Generates blog post content
- Well-structured
- Professional tone

---

## ✅ TEST 13: Creative Powerhouse - Generate Ideas

### Test via Process:
```bash
curl -X POST http://localhost:3000/api/evolution/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Give me 5 app ideas for productivity",
    "context": {"type": "ideas"}
  }'
```

### ✅ Verify:
- Generates multiple ideas
- Includes validation/analysis
- Market insights

---

## ✅ TEST 14: Experimental Lab - Test Features

### Via Status Check:
```bash
curl http://localhost:3000/api/evolution/status | grep -A 5 "experimental"
```

### Expected Output:
```json
"experimental": {
  "total_experiments": 0,
  "active_experiments": 0,
  "success_rate": 0
}
```

### ✅ Verify:
- Experimental lab initialized
- Tracking experiments
- Can run A/B tests

---

## ✅ TEST 15: Social - Multi-User System

### Via Status Check:
```bash
curl http://localhost:3000/api/evolution/status | grep -A 5 "social"
```

### Expected Output:
```json
"social": {
  "users": 1,
  "shared_knowledge": 0,
  "ai_network": 0,
  "collaboration_count": 0
}
```

### ✅ Verify:
- Social system initialized
- Can track users
- Can share knowledge

---

## ✅ TEST 16: Toggle Evolution On/Off

### API Call:
```bash
# Disable
curl -X PUT http://localhost:3000/api/evolution/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Enable
curl -X PUT http://localhost:3000/api/evolution/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### ✅ Verify:
- Can disable evolution
- Can re-enable evolution
- Status reflects changes

---

## ✅ TEST 17: End-to-End Integration

### Full Flow Test:

```bash
# 1. Initialize
curl -X POST http://localhost:3000/api/evolution/initialize \
  -d '{"userId":"test_user"}'

# 2. Create a goal
curl -X POST http://localhost:3000/api/evolution/goals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Goal",
    "description": "Testing end-to-end",
    "targetDate": "2025-12-31"
  }'

# 3. Process a message
curl -X POST http://localhost:3000/api/evolution/process \
  -H "Content-Type: application/json" \
  -d '{"message": "Help me with my test goal"}'

# 4. Give feedback
curl -X POST http://localhost:3000/api/evolution/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "responseId": "test_resp",
    "userMessage": "Help me",
    "aiResponse": "Here is help...",
    "rating": 9
  }'

# 5. Check status
curl http://localhost:3000/api/evolution/status

# 6. Get report
curl http://localhost:3000/api/evolution/report
```

### ✅ Verify:
- All steps work without errors
- Systems communicate properly
- Data persists between requests

---

## 📊 VERIFICATION CHECKLIST

After running all tests, verify:

### ✅ Core Systems
- [ ] Meta-Learning: Self-critique and feedback working
- [ ] Agent DNA: 8+ agents created and active
- [ ] Internet Brain: Can fetch and learn from trending topics
- [ ] Self-Healing: Health monitoring active
- [ ] Goal Autopilot: Goals, tasks, and briefings working

### ✅ New Systems
- [ ] Creative Powerhouse: Content generation working
- [ ] Experimental Lab: A/B testing and simulations ready
- [ ] Social Collaborative: Multi-user support active

### ✅ Integration
- [ ] Evolution Orchestrator: Coordinates all systems
- [ ] Cross-system events: Systems communicate
- [ ] Data persistence: ~/.rags/ directories created
- [ ] API endpoints: All 10+ endpoints functional

### ✅ Performance
- [ ] No memory leaks
- [ ] Reasonable response times (<5s for most operations)
- [ ] No crashes or errors
- [ ] Graceful error handling

---

## 🐛 Troubleshooting

### Issue: "Evolution not initialized"
**Fix:**
```bash
curl -X POST http://localhost:3000/api/evolution/initialize \
  -d '{"userId":"raghav"}'
```

### Issue: "Ollama not responding"
**Fix:**
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# If not, start Ollama
ollama serve
```

### Issue: "Cannot create directories"
**Fix:**
```bash
# Check permissions
ls -la ~/.rags/

# Create manually if needed
mkdir -p ~/.rags/{meta-learning,agent-dna,internet-brain,self-healing,goal-autopilot,creative,experimental-lab,social}
```

---

## 🎉 SUCCESS CRITERIA

**All tests pass if:**

1. ✅ All 9 systems initialize without errors
2. ✅ Status endpoint shows all 8 systems (in status object)
3. ✅ Evolution report generates successfully
4. ✅ Can process messages with evolution
5. ✅ Can create goals and get tasks
6. ✅ Can record and learn from feedback
7. ✅ Agents are created and active
8. ✅ Creative features generate content
9. ✅ Data persists in ~/.rags/
10. ✅ No crashes or memory leaks

---

## 🚀 AUTOMATED TEST SCRIPT

Run all tests automatically:

```bash
# Run the test script
cd backend
npx ts-node src/test-evolution-systems.ts
```

Expected output:
```
✅ ALL TESTS PASSED! RAGS AI IS FULLY FUNCTIONAL! 🚀
```

---

## 📝 Test Log Template

```
RAGS AI TEST LOG
Date: _______________
Tester: ______________

[ ] Test 1: Initialize Evolution - PASS/FAIL
[ ] Test 2: Check Status - PASS/FAIL
[ ] Test 3: Evolution Report - PASS/FAIL
[ ] Test 4: Process Message - PASS/FAIL
[ ] Test 5: Record Feedback - PASS/FAIL
[ ] Test 6: Check Agents - PASS/FAIL
[ ] Test 7: Learn Trending - PASS/FAIL
[ ] Test 8: Health Check - PASS/FAIL
[ ] Test 9: Create Goal - PASS/FAIL
[ ] Test 10: Today's Tasks - PASS/FAIL
[ ] Test 11: Morning Briefing - PASS/FAIL
[ ] Test 12: Generate Content - PASS/FAIL
[ ] Test 13: Generate Ideas - PASS/FAIL
[ ] Test 14: Experimental Lab - PASS/FAIL
[ ] Test 15: Social System - PASS/FAIL
[ ] Test 16: Toggle Evolution - PASS/FAIL
[ ] Test 17: End-to-End - PASS/FAIL

Overall: ____/17 PASSED

Notes:
_________________________________
_________________________________
```

---

**Happy Testing! 🧪🚀**

**सब features properly test करो और verify करो कि RAGS fully autonomous है!** ✅
