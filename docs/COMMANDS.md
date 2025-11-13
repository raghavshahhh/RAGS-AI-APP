# 🎤 RAGS AI - Voice Commands Reference

## Wake Word

Say **"Hey RAGS"** to activate (if Picovoice is configured)

Or click the microphone button / press **⌘+Space**

---

## General Commands

### Conversation
```
"Hello"
"How are you?"
"What can you do?"
"Tell me a joke"
"What's your name?"
```

### Memory
```
"Remember I like coding"
"Remember my birthday is March 15"
"What do you remember about me?"
"What did we talk about yesterday?"
"Forget everything"
```

---

## Web Search

### Search
```
"Search Python on web"
"Search React tutorials"
"Look up machine learning"
"Find information about AI"
```

### Wikipedia
```
"Wikipedia Albert Einstein"
"Tell me about quantum physics"
"What is blockchain?"
```

### YouTube
```
"Search Python tutorial on YouTube"
"Find music videos"
"Open YouTube"
```

### GitHub
```
"Search React on GitHub"
"Find Python projects"
```

---

## Mac Automation

### File Operations
```
"Open folder Desktop"
"Open folder Documents"
"Create folder Projects"
"Open file resume.pdf"
```

### App Control
```
"Open Safari"
"Open Chrome"
"Open VS Code"
"Launch Spotify"
```

### System Control
```
"Volume up"
"Volume down"
"Mute"
"Take a screenshot"
"Show notification Hello World"
```

---

## Browser Control

### Navigation
```
"Open browser"
"Open Google"
"Open YouTube"
"Go to GitHub"
```

### Scrolling
```
"Scroll down"
"Scroll up"
"Scroll to bottom"
"Scroll to top"
```

### Interaction
```
"Click on first link"
"Select option 2"
"Click button"
```

---

## Camera Vision

### Capture & Analyze
```
"What is this?" (takes photo and describes)
"What do you see?"
"Describe what's in front of me"
"Identify this object"
"Read this text"
```

### Specific Questions
```
"What color is this?"
"How many people are there?"
"What's written here?"
"Is this a cat or dog?"
```

---

## Reminders

### Add Reminders
```
"Remind me to call John at 5 PM"
"Remind me to workout tomorrow at 6 AM"
"Set reminder for meeting in 2 hours"
"Remind me to buy groceries"
```

### View Reminders
```
"Show my reminders"
"What are my reminders?"
"List all reminders"
"Do I have any reminders?"
```

### Delete Reminders
```
"Delete reminder 1"
"Remove all reminders"
"Clear reminders"
```

---

## Autopilot

### Control
```
"Start autopilot"
"Stop autopilot"
"Pause autopilot"
"Resume autopilot"
```

### Routines
```
"Run morning routine"
"Run evening routine"
"Start work routine"
"Execute bedtime routine"
```

---

## Notes

### Create Notes
```
"Create note about AI research"
"New note: Meeting notes"
"Take a note"
```

### View Notes
```
"Show my notes"
"List all notes"
"Find note about project"
```

---

## Context Awareness

### Current Activity
```
"What am I doing?"
"What app am I using?"
"What's my current context?"
```

### Suggestions
```
"What should I do?"
"Give me suggestions"
"What can I do here?"
```

---

## Plugins

### Execute Plugins
```
"Run plugin weather"
"Execute custom script"
"Call plugin calculator"
```

---

## System Information

### Status
```
"System status"
"How are you doing?"
"Check health"
"Show stats"
```

### Performance
```
"CPU usage"
"Memory usage"
"Disk space"
```

---

## Personality & Emotions

### Emotional Responses
RAGS responds with appropriate emotions:
- **Happy:** "Great job!", "Awesome!"
- **Curious:** "Interesting...", "Tell me more"
- **Thinking:** "Let me think...", "Hmm..."
- **Calm:** Normal conversation

### Language Support
```
"Speak in Hindi"
"Switch to English"
"Use Hinglish"
```

---

## Advanced Commands

### Multi-step Actions
```
"Search Python on web and open first result"
"Take screenshot and save to Desktop"
"Create folder Projects and open it"
```

### Conditional Commands
```
"If it's after 6 PM, remind me to workout"
"When I open VS Code, show my tasks"
```

---

## Keyboard Shortcuts

### Desktop App
- **⌘+K** - Open command palette
- **⌘+Space** - Toggle voice input
- **Esc** - Close panels
- **⌘+/** - Show help

### Command Palette
- Type to search commands
- Arrow keys to navigate
- Enter to execute

---

## Tips & Tricks

### Natural Language
RAGS understands natural language, so you can say:
- "Hey, can you search Python for me?"
- "I need to remember that I like pizza"
- "Could you please open my Desktop folder?"

### Context Awareness
RAGS knows what you're doing:
- If you're in VS Code, it suggests coding tasks
- If you're in browser, it suggests web actions
- If you're in Finder, it suggests file operations

### Memory
RAGS remembers:
- Previous conversations
- Your preferences
- Important facts you tell it
- Your habits and patterns

---

## Examples

### Morning Routine
```
"Hey RAGS"
"Good morning"
"What's my schedule today?"
"Show my reminders"
"Start autopilot"
```

### Work Session
```
"Hey RAGS"
"Open VS Code"
"Search React hooks on web"
"Remind me to take a break in 1 hour"
"What am I working on?"
```

### Evening Routine
```
"Hey RAGS"
"What did I accomplish today?"
"Set reminder for tomorrow's meeting"
"Run evening routine"
"Good night"
```

---

## Custom Commands

You can add custom commands by:
1. Creating plugins in `~/.rags/plugins/`
2. Editing `backend/src/services/real-ai-integration.ts`
3. Using the plugin framework

**See [API.md](API.md) for plugin development**

---

## Voice Recognition Tips

### For Best Results:
1. Speak clearly and naturally
2. Avoid background noise
3. Use a good microphone
4. Speak at normal pace
5. Pause briefly between commands

### Supported Languages:
- English (US, UK, IN)
- Hindi (Devanagari in Roman script)
- Hinglish (Mixed Hindi-English)

---

## Troubleshooting

### Command Not Recognized
- Speak more clearly
- Try rephrasing
- Check if feature is enabled
- See backend logs for errors

### No Response
- Check if backend is running
- Verify Ollama is active
- Check microphone permissions
- Look at desktop app console

---

**More commands coming soon! 🚀**
