# 🔌 RAGS AI - API Documentation

## Base URL

```
http://localhost:3000
```

---

## Authentication

Currently no authentication required for local development.

For production, add JWT token:
```
Authorization: Bearer <token>
```

---

## Endpoints

### Health Check

**GET** `/`

Check if backend is running.

**Response:**
```json
{
  "success": true,
  "message": "RAGS AI Backend is running!",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "capabilities": ["voice", "vision", "automation"]
}
```

---

## Real AI Integration

### Initialize

**POST** `/api/real-ai/initialize`

Initialize AI system for a user.

**Request:**
```json
{
  "userId": "user1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI initialized"
}
```

### Chat

**POST** `/api/real-ai/chat`

Send message to AI and get response.

**Request:**
```json
{
  "message": "Hello, how are you?",
  "userId": "user1"
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "text": "I'm doing great! How can I help you?",
    "emotion": "happy",
    "action": null
  }
}
```

**With Action:**
```json
{
  "success": true,
  "response": {
    "text": "Opening browser for you",
    "emotion": "neutral",
    "action": {
      "type": "open_browser"
    }
  }
}
```

---

## Camera Vision

### Ask Question

**POST** `/api/camera-vision/ask`

Capture image and answer question about it.

**Request:**
```json
{
  "question": "What is this?"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "This is a laptop computer on a desk",
  "imagePath": "/temp/camera_123456.jpg"
}
```

---

## Browser Control

### Scroll

**POST** `/api/browser-control/scroll`

Scroll the page.

**Request:**
```json
{
  "direction": "down",
  "amount": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scrolled down"
}
```

### Click

**POST** `/api/browser-control/click`

Click an element.

**Request:**
```json
{
  "target": "first link"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Clicked first link"
}
```

### Select Option

**POST** `/api/browser-control/select-option`

Select an option from dropdown.

**Request:**
```json
{
  "optionNumber": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Selected option 2"
}
```

---

## Notes

### Get All Notes

**GET** `/api/notes`

Get all notes for user.

**Response:**
```json
{
  "success": true,
  "notes": [
    {
      "id": "1",
      "title": "Meeting Notes",
      "content": "Discussed project timeline",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### Create Note

**POST** `/api/notes`

Create a new note.

**Request:**
```json
{
  "title": "Project Ideas",
  "content": "Build AI assistant"
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": "2",
    "title": "Project Ideas",
    "content": "Build AI assistant",
    "createdAt": "2025-01-15T11:00:00.000Z"
  }
}
```

### Delete Note

**DELETE** `/api/notes/:id`

Delete a note.

**Response:**
```json
{
  "success": true,
  "message": "Note deleted"
}
```

---

## Reminders

### Get All Reminders

**GET** `/api/reminders`

Get all reminders.

**Response:**
```json
{
  "success": true,
  "reminders": [
    {
      "id": "1",
      "content": "Call John",
      "time": "2025-01-15T17:00:00.000Z",
      "completed": false
    }
  ]
}
```

### Create Reminder

**POST** `/api/reminders`

Create a new reminder.

**Request:**
```json
{
  "content": "Buy groceries",
  "time": "2025-01-16T10:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "reminder": {
    "id": "2",
    "content": "Buy groceries",
    "time": "2025-01-16T10:00:00.000Z",
    "completed": false
  }
}
```

### Delete Reminder

**DELETE** `/api/reminders/:id`

Delete a reminder.

**Response:**
```json
{
  "success": true,
  "message": "Reminder deleted"
}
```

---

## System Monitor

### Get System Stats

**GET** `/api/system-monitor/stats`

Get system statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "cpu": 45.2,
    "memory": 62.8,
    "disk": 78.5,
    "uptime": 86400
  }
}
```

---

## Face Animation

### Get Emotion

**GET** `/api/face-animation/emotion`

Get current emotion state.

**Response:**
```json
{
  "success": true,
  "emotion": "happy",
  "intensity": 0.8
}
```

### Set Emotion

**POST** `/api/face-animation/emotion`

Set emotion state.

**Request:**
```json
{
  "emotion": "thinking",
  "intensity": 0.6
}
```

**Response:**
```json
{
  "success": true,
  "message": "Emotion updated"
}
```

---

## WebSocket Events

Connect to: `ws://localhost:3000`

### Client → Server

**voice-start**
```json
{
  "type": "voice-start"
}
```

**voice-data**
```json
{
  "type": "voice-data",
  "audio": "<base64-audio>"
}
```

**voice-stop**
```json
{
  "type": "voice-stop"
}
```

### Server → Client

**emotion-change**
```json
{
  "type": "emotion-change",
  "emotion": "happy",
  "intensity": 0.8
}
```

**voice-activity**
```json
{
  "type": "voice-activity",
  "isListening": true,
  "isSpeaking": false,
  "audioData": [0.1, 0.2, 0.3]
}
```

**ai-response**
```json
{
  "type": "ai-response",
  "text": "Hello!",
  "emotion": "happy"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "errorId": "uuid",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Plugin Development

### Plugin Structure

Create file in `~/.rags/plugins/my-plugin.json`:

```json
{
  "name": "weather",
  "description": "Get weather information",
  "triggers": ["weather", "temperature", "forecast"],
  "action": {
    "type": "api",
    "url": "https://api.weather.com/current",
    "method": "GET"
  }
}
```

### Plugin Types

**API Plugin:**
```json
{
  "type": "api",
  "url": "https://api.example.com",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

**Script Plugin:**
```json
{
  "type": "script",
  "command": "python",
  "args": ["/path/to/script.py"]
}
```

**Function Plugin:**
```json
{
  "type": "function",
  "module": "./plugins/my-plugin.js",
  "function": "execute"
}
```

---

## Rate Limiting

Currently no rate limiting for local development.

For production:
- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Examples

### cURL Examples

**Chat:**
```bash
curl -X POST http://localhost:3000/api/real-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

**Camera Vision:**
```bash
curl -X POST http://localhost:3000/api/camera-vision/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this?"}'
```

**Create Reminder:**
```bash
curl -X POST http://localhost:3000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{"content": "Meeting", "time": "2025-01-16T10:00:00.000Z"}'
```

### JavaScript Examples

**Using Fetch:**
```javascript
// Chat
const response = await fetch('http://localhost:3000/api/real-ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
});
const data = await response.json();
console.log(data.response.text);
```

**Using Axios:**
```javascript
// Camera Vision
const { data } = await axios.post('http://localhost:3000/api/camera-vision/ask', {
  question: 'What is this?'
});
console.log(data.answer);
```

### Python Examples

```python
import requests

# Chat
response = requests.post('http://localhost:3000/api/real-ai/chat', json={
    'message': 'Hello'
})
print(response.json()['response']['text'])

# Create Note
response = requests.post('http://localhost:3000/api/notes', json={
    'title': 'My Note',
    'content': 'Note content'
})
print(response.json())
```

---

## SDK (Coming Soon)

Official SDKs for:
- JavaScript/TypeScript
- Python
- Go
- Rust

---

**For more examples, see the [examples/](../examples/) directory**
