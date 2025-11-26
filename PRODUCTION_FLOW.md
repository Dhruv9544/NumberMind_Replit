# NumberMind - Production Challenge Flow

## User Story: Challenge a Friend

### Step 1: Click "Challenge Friend"
User clicks the "Challenge Friend" button on the Dashboard
```
GET / → Dashboard → Button "Challenge Friend"
```

### Step 2: Enter Username to Search
The app opens a search modal where user can type a username
```
Click "Challenge Friend" → Search Modal Opens
User types: "alice" → Real-time search via API
```

**Backend API:** `GET /api/search/users?q=alice`
- Returns matching users with their stats
- Min 2 characters to search
- Max 20 results
- Shows: Name, Wins, Win Rate

### Step 3: Select Player & Set Secret Number
User:
1. Selects a player from search results
2. Enters their 4-digit secret number
3. Clicks "Send Challenge"

**Backend Flow:**
```
POST /api/games
{
  gameMode: "friend",
  friendId: "selected-user-id",
  friendName: "Alice Johnson"
}
```

Creates game & challenge:
- Game Code generated (e.g., ABC12345)
- Challenge marked as "pending"
- Expiry set to NOW + 5 minutes

### Step 4: Challenged Player Receives Notification

**Real-time via WebSocket:**
- Type: "challenge_received"
- Contains: Game code, challenger name, challenge ID
- Expires in: 5 minutes

**Notification stored in database:**
- Appears in Notifications page
- Shows "Alice challenged you" with timer

### Step 5a: Player ACCEPTS (within 5 minutes)

User clicks "Accept" button:
```
POST /api/challenges/{challengeId}/accept
```

**What happens:**
1. Challenge marked as "accepted"
2. Game status → "active"
3. Both players join game at: `/game/play/{gameId}`
4. Challenger sees: "Alice accepted! Starting game..."
5. Acceptor sets their secret number & plays

**Timeline:**
- Player must accept within 5 minutes
- Real-time updates via polling (2s interval)
- Game starts immediately after both set secrets

### Step 5b: Player REJECTS or TIMEOUT

**If Rejects:**
```
POST /api/challenges/{challengeId}/reject
```
- Challenge marked "rejected"
- Game deleted or marked as "cancelled"
- Challenger sees: "Challenge rejected"

**If Times Out (5 minutes):**
- Backend auto-expires via cleanup job
- Challenge status → "expired"
- Game becomes unplayable
- Challenger gets notification: "Challenge expired"

---

## Technical Implementation

### Database Schema (In-Memory Storage)

**Games Table:**
```javascript
{
  id: "game-xxx",
  code: "ABC12345",
  player1Id: "user-1",
  player2Id: "user-2",
  gameMode: "friend",
  status: "waiting" | "active" | "finished",
  createdAt: Date,
  expiresAt: Date
}
```

**Challenges Table:**
```javascript
{
  id: "challenge-xxx",
  gameId: "game-xxx",
  fromPlayerId: "user-1",
  toPlayerId: "user-2",
  status: "pending" | "accepted" | "rejected" | "expired",
  createdAt: Date,
  expiresAt: Date (NOW + 5 minutes)
}
```

**Notifications Table:**
```javascript
{
  id: "notif-xxx",
  userId: "user-2",
  type: "challenge",
  fromUserId: "user-1",
  message: "Alice challenged you to a game!",
  read: false,
  createdAt: Date
}
```

### APIs Needed

1. **Search Users**
   ```
   GET /api/search/users?q=alice
   Response: [{ id, name, stats }]
   ```

2. **Create Challenge**
   ```
   POST /api/games
   Body: { gameMode, friendId, friendName }
   Response: { gameId, code }
   ```

3. **Get Pending Challenges**
   ```
   GET /api/challenges
   Response: [{ id, fromPlayerName, expiresAt }]
   ```

4. **Accept Challenge**
   ```
   POST /api/challenges/{id}/accept
   Response: { gameId }
   ```

5. **Reject Challenge**
   ```
   POST /api/challenges/{id}/reject
   Response: { success }
   ```

6. **Real-time WebSocket**
   ```
   Message: {
     type: "challenge_received",
     challenge: { id, fromPlayerName },
     gameCode: "ABC12345"
   }
   ```

### Frontend Flow

```
Dashboard
  ↓
Click "Challenge Friend"
  ↓
Search Modal Opens
  ↓
Type Username → API Search
  ↓
Select Player
  ↓
Enter Secret Number
  ↓
Click "Send Challenge"
  ↓
Wait for Acceptance (Game Setup Page)
  ↓
[Option A] Player Accepts → Start Game
[Option B] Player Rejects → Back to Dashboard
[Option C] 5 Min Timeout → Challenge Expired
```

### Automatic Expiration

**Backend Cleanup Job (runs every 60 seconds):**
```javascript
expireOldChallenges() {
  const now = new Date();
  challenges.forEach(challenge => {
    if (challenge.expiresAt < now && challenge.status === 'pending') {
      challenge.status = 'expired';
      notify(challenger: "Challenge expired");
    }
  });
}
```

---

## Currently Implemented

✅ User search API endpoint  
✅ Challenge creation with game code  
✅ 5-minute auto-expiration  
✅ WebSocket notifications  
✅ Acceptance/rejection flow  
✅ Real-time status updates  
✅ Notifications page  
✅ Challenge alerts page  

## To Deploy to Production

1. **Database:** Replace in-memory with PostgreSQL
2. **Real-time:** Upgrade WebSocket to production-grade (Socket.io)
3. **Authentication:** Integrate with production auth provider
4. **Notifications:** Add push notifications (Firebase, Twilio)
5. **Scaling:** Add Redis for session management
6. **Monitoring:** Add logging & analytics

---

## Example User Flow (Complete)

```
1. User A opens app → Dashboard
2. Click "Challenge Friend"
3. Modal opens, types "alice_123"
4. Search returns Alice's profile (450 wins, 92% win rate)
5. Click on Alice's profile
6. Returns to setup, enters secret: "1234"
7. Click "Send Challenge"
8. Backend creates game with code "XYZ98765"
9. WebSocket sends notification to Alice: "User A challenged you!"
10. Alice gets notification on her phone/app
11. Click "View Challenge"
12. Alice accepts challenge
13. Alice enters her secret: "5678"
14. Both see each other's setup page
15. Click "Let's Play"
16. Game starts - User A guesses first
17. First to guess wins
```
