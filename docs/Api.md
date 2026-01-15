# API Documentation

## Base URL
```
http://localhost:3001/api
```

---

## Endpoints

### 1. Get Recommendations

Generate champion recommendations based on current game state.

**Endpoint:** `POST /api/recommendations`

**Request Body:**
```json
{
  "currentState": {
    "myTeam": [
      {
        "championId": 64,
        "role": "jungle"
      }
    ],
    "enemyTeam": [
      {
        "championId": 157,
        "role": "middle"
      }
    ],
    "bannedChampions": [238, 555],
    "myRole": "middle",
    "phase": "pick",
    "timer": 30
  },
  "weights": {
    "winRate": 0.40,
    "pickRate": 0.10,
    "counterScore": 0.30,
    "synergyScore": 0.20
  },
  "topN": 5
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "championId": 7,
      "championName": "LeBlanc",
      "role": "middle",
      "totalScore": 78.5,
      "breakdown": {
        "winRateScore": 85.0,
        "pickRateScore": 65.0,
        "counterScore": 82.0,
        "synergyScore": 71.0
      },
      "stats": {
        "championId": 7,
        "role": "middle",
        "winRate": 0.523,
        "pickRate": 0.089,
        "banRate": 0.045,
        "matches": 15420,
        "tier": "A",
        "rank": 5
      },
      "reasoning": [
        "Strong 52.3% win rate in A tier",
        "Popular meta pick",
        "Excellent matchup into enemy composition",
        "Strong synergy with team composition"
      ]
    }
  ],
  "timestamp": 1705334400000,
  "patch": "14.1"
}
```

---

### 2. Get Champion Select Session

Fetch current champion select session from League Client.

**Endpoint:** `GET /api/champion-select`

**Response:**
```json
{
  "myTeam": [...],
  "theirTeam": [...],
  "bans": {
    "myTeamBans": [...],
    "theirTeamBans": [...]
  },
  "localPlayerCellId": 0,
  "timer": {
    "phase": "PLANNING",
    "adjustedTimeLeftInPhase": 45000
  }
}
```

**Error Response (404):**
```json
{
  "error": "No active champion select session"
}
```

---

### 3. Get Application Status

Check service health and connection status.

**Endpoint:** `GET /api/status`

**Response:**
```json
{
  "status": "ok",
  "lcuConnected": true,
  "patch": "14.1",
  "cache": {
    "size": 147,
    "keys": ["stats:157:middle:14.1", ...]
  },
  "timestamp": 1705334400000
}
```

---

### 4. Get All Champions

Retrieve list of all champions.

**Endpoint:** `GET /api/champions`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Annie"
  },
  {
    "id": 2,
    "name": "Olaf"
  }
  // ... more champions
]
```

---

### 5. Get Champion Stats

Get statistics for a specific champion and role.

**Endpoint:** `GET /api/champion/:id/stats/:role`

**Parameters:**
- `id` (number): Champion ID
- `role` (string): One of: `top`, `jungle`, `middle`, `bottom`, `utility`

**Example:** `GET /api/champion/157/stats/middle`

**Response:**
```json
{
  "championId": 157,
  "role": "middle",
  "winRate": 0.493,
  "pickRate": 0.124,
  "banRate": 0.187,
  "matches": 42350,
  "tier": "A",
  "rank": 8
}
```

**Error Response (404):**
```json
{
  "error": "Champion stats not found"
}
```

---

### 6. Clear Cache

Clear all cached data.

**Endpoint:** `POST /api/cache/clear`

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

---

### 7. Warmup Cache

Preload cache with popular champions data.

**Endpoint:** `POST /api/cache/warmup`

**Response:**
```json
{
  "message": "Cache warmup completed"
}
```

**Note:** This operation may take 10-30 seconds depending on network speed.

---

## Error Handling

All endpoints follow consistent error response format:

**Error Response:**
```json
{
  "error": "Error type description",
  "message": "Detailed error message (development only)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider:
- API rate limiting (e.g., 100 requests/minute per IP)
- U.GG endpoint rate limiting (handled internally with caching)
- LCU request throttling

---

## Data Freshness

### Cache Expiration Times
- **Champion Stats**: 1 hour
- **Matchup Data**: 2 hours
- **Patch Data**: 24 hours

### Manual Cache Control
Use `/api/cache/clear` to force fresh data fetch, or `/api/cache/warmup` to preload data before champion select.

---

## Authentication

Currently no authentication is required. For multi-user deployments, consider:
- API key authentication
- JWT tokens for session management
- OAuth for user-specific data

---

## WebSocket Support (Future)

Planned WebSocket endpoint for real-time updates:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001');

// Subscribe to champion select updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'champion-select'
}));

// Receive updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

---

## Best Practices

### 1. Caching Strategy
- Always check `/api/status` before making requests
- Use cache warmup before entering queue
- Avoid clearing cache unnecessarily

### 2. Error Handling
```typescript
try {
  const response = await fetch('/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  // Handle success
} catch (error) {
  // Handle error gracefully
  console.error('API Error:', error);
}
```

### 3. Polling Intervals
- Champion select: Poll every 2 seconds
- Status check: Poll every 5 seconds
- Avoid polling when not needed (outside champion select)

---

## Examples

### Complete Recommendation Flow

```typescript
// 1. Check if client is connected
const status = await fetch('/api/status').then(r => r.json());
if (!status.lcuConnected) {
  console.log('League Client not running');
  return;
}

// 2. Get current champion select
const championSelect = await fetch('/api/champion-select')
  .then(r => r.json())
  .catch(() => null);

if (!championSelect) {
  console.log('Not in champion select');
  return;
}

// 3. Get recommendations
const recommendations = await fetch('/api/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentState: transformChampionSelect(championSelect),
    weights: { winRate: 0.4, pickRate: 0.1, counterScore: 0.3, synergyScore: 0.2 }
  })
}).then(r => r.json());

console.log('Top pick:', recommendations.recommendations[0]);
```