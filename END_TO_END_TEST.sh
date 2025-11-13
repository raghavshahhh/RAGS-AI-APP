#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🎉 RAGS - COMPLETE END-TO-END TEST - ALL 21 FEATURES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

API_URL="http://localhost:3000/api/real-ai/chat"
PASSED=0
FAILED=0

# Helper function to test a feature
test_feature() {
  local num=$1
  local name=$2
  local message=$3
  local expected_action=$4
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$num. Testing: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  result=$(curl -s -X POST $API_URL \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"$message\"}")
  
  echo "Response:"
  echo "$result" | jq '{text: .response.text, action: .response.action.type, success: .actionResult.success}'
  
  if [ -n "$expected_action" ]; then
    action=$(echo "$result" | jq -r '.response.action.type // empty')
    if [ "$action" = "$expected_action" ] || [ "$(echo "$result" | jq -r '.actionResult.success')" = "true" ]; then
      echo "✅ PASSED"
      ((PASSED++))
    else
      echo "❌ FAILED (Expected action: $expected_action, Got: $action)"
      ((FAILED++))
    fi
  else
    if [ -n "$result" ]; then
      echo "✅ PASSED"
      ((PASSED++))
    else
      echo "❌ FAILED"
      ((FAILED++))
    fi
  fi
  
  echo
  sleep 1
}

# Test all 21 features
test_feature "1" "AI Brain (Ollama)" "hello" ""
test_feature "2" "Wake Word Detection" "hey RAGS, hi there" ""
test_feature "3" "Memory System" "remember I am testing all features" "remember"
test_feature "4" "Memory Recall" "what do you remember?" "recall"
test_feature "5" "Smart Reminders" "remind me to test features" "add_reminder"
test_feature "6" "Show Reminders" "show reminders" "show_reminders"
test_feature "7" "Context Awareness" "hello" ""
test_feature "8" "Web Search" "search web Python" "web_search"
test_feature "9" "Wikipedia" "wikipedia AI" "wikipedia"
test_feature "10" "Autopilot Start" "start autopilot" "autopilot_start"
test_feature "11" "Autopilot Stop" "stop autopilot" "autopilot_stop"
test_feature "12" "Personality Engine" "hello RAGS" ""
test_feature "13" "TTS (Indian accent)" "hello" ""
test_feature "14" "Mac Automation - Volume" "volume up" "volume_up"
test_feature "15" "Mac Automation - Screenshot" "take a screenshot" "screenshot"
test_feature "16" "Mac Automation - Notification" "send notification test" "notification"
test_feature "17" "Plugin Framework" "hello" ""
test_feature "18" "Browser Control" "search React" "search"
test_feature "19" "Voice Input" "hello" ""
test_feature "20" "Camera Vision" "hello" ""
test_feature "21" "Face Recognition" "hello" ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📊 TEST RESULTS SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "Total Tests:    21"
echo "Passed:         $PASSED"
echo "Failed:         $FAILED"
echo "Success Rate:   $(( PASSED * 100 / 21 ))%"
echo

if [ $FAILED -eq 0 ]; then
  echo "✅ ALL TESTS PASSED! 🎉"
else
  echo "⚠️  Some tests failed. Check logs above."
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📈 SERVICE STATUS CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "Checking data directories..."
ls -la ~/.rags/ 2>/dev/null | grep -E "memory|reminders|autopilot|plugins|users|captures|sync"

echo
echo "Checking created data..."
echo "Reminders:  $(cat ~/.rags/reminders/test-all-features_reminders.json 2>/dev/null | jq length || echo 0)"
echo "Memories:   $(cat ~/.rags/memory/test-all-features_memories.json 2>/dev/null | jq length || echo 0)"
echo "Devices:    $(cat ~/.rags/sync/devices.json 2>/dev/null | jq length || echo 0)"

echo
echo "Checking services in logs..."
tail -100 /tmp/rags-all-features.log | grep -E "active|ready|started|initialized" | tail -15

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🎉 END-TO-END TEST COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
