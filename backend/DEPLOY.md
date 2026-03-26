# WatchParty Backend (Render) Configuration

## Backend Files

### backend/package.json
```json
{
  "name": "watchparty-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.6",
    "express": "^5.2.1"
  }
}
```

### backend/server.js
```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const dataFilePath = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

app.get('/data', (req, res) => {
  try {
    if (!fs.existsSync(dataFilePath)) {
      const defaultData = { message: "Welcome to WatchParty", movies: [], currentTime: 0, isPlaying: false };
      fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2));
      return res.json(defaultData);
    }
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
    res.json(JSON.parse(fileContent));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/data', (req, res) => {
  try {
    const newData = req.body;
    if (!newData || typeof newData !== 'object') {
      return res.status(400).json({ error: 'Invalid data' });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(newData, null, 2));
    res.json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to write data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### backend/data.json
```json
{
  "message": "Welcome to WatchParty",
  "movies": [],
  "currentTime": 0,
  "isPlaying": false
}
```

---

## Frontend Configuration

The Next.js app is ready in the current directory. To connect to the Render backend:

### Environment Variables

Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

When deploying to Vercel, add the environment variable:
```
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

---

## Deployment Steps

### Deploy Backend to Render:
1. Push your backend code to GitHub
2. Go to render.com and create a new Web Service
3. Connect your GitHub repository
4. Set:
   - Build Command: (leave empty)
   - Start Command: `node server.js`
5. Click Deploy

### Deploy Frontend to Vercel:
1. Push your frontend code to GitHub
2. Go to vercel.com and import the project
3. Add the environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render URL (e.g., https://watchparty-backend.onrender.com)
4. Click Deploy

---

## Testing the API

```bash
# Test GET
curl http://localhost:3000/data

# Test POST
curl -X POST http://localhost:3000/data \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World", "movies": [], "currentTime": 10}'
```
