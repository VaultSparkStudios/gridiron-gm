# Online Async Multiplayer — Setup Guide
**Status:** Architecture designed. Backend required. Frontend stub TBD.

## Concept
Async multiplayer league: up to 8 GMs each control one team. The commissioner sims the week, all GMs make moves asynchronously. No real-time requirement — turn-based, like an email chess game. This is the single highest-retention multiplayer format for this genre.

## Architecture

### Option A: Supabase (Recommended — fastest to ship)
```
Supabase Postgres (free tier: 500MB)
├── leagues (id, name, commissioner_id, season, week, phase, config)
├── league_teams (league_id, team_idx, user_id, team_state jsonb)
├── league_actions (id, league_id, user_id, type, payload, created_at)
└── league_chat (id, league_id, user_id, message, created_at)
```

### Option B: Firebase Realtime DB
Good for smaller leagues, easier real-time updates, but more expensive at scale.

### Option C: Cloudflare Durable Objects
Best performance + cost at scale. More complex to implement.

## Implementation Steps

### 1. Supabase Setup
```bash
# In gridiron-gm/
npm install @supabase/supabase-js

# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
```

### 2. Auth (Supabase Auth — email magic link)
```js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Sign in
const { error } = await supabase.auth.signInWithOtp({ email });

// Get session
const { data: { user } } = await supabase.auth.getUser();
```

### 3. League State Sync
```js
// Save your team state to the league
const syncTeam = async (leagueId, teamState) => {
  await supabase.from('league_teams')
    .upsert({ league_id: leagueId, user_id: user.id, team_state: teamState });
};

// Commissioner sims the week — writes to all league_teams
const commissionerSimWeek = async (leagueId) => {
  const { data: teams } = await supabase.from('league_teams')
    .select('*').eq('league_id', leagueId);
  // Run sim across all team states
  // Write results back
};

// Subscribe to league changes (real-time)
const sub = supabase.channel('league:'+leagueId)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'league_teams' },
    payload => updateLocalState(payload.new))
  .subscribe();
```

### 4. UI Flow (App.jsx additions)
```
Hub tab → "🌐 Multiplayer" section
├── Create League (set name, max teams, settings)
├── Join League (enter invite code)
├── My Leagues (list, click to load league state)
└── Commissioner Panel (sim controls, kick player)
```

### 5. Add to App.jsx state
```js
const[multiLeague,setMultiLeague]=useState(null);
const[multiUser,setMultiUser]=useState(null);
const[multiLeagues,setMultiLeagues]=useState([]);
```

## Estimated Dev Time
- Supabase setup + auth: 2-4 hours
- Schema + sync functions: 4-8 hours
- UI integration: 4-8 hours
- Commissioner tools: 2-4 hours
- **Total: 12-24 hours**

## Priority
High ceiling. Ship Pro GM subscription first to fund backend costs.
