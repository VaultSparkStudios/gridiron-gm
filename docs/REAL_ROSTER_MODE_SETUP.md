# Real Roster Mode — Setup Guide
**Status:** Not yet implemented. Architecture designed.

## Concept
Allow players to import real NFL rosters (names, positions, estimated OVR) for the current or historical season. One-click "Play with Real 2025 Rosters." Huge SEO driver and community anchor — Football-GM has this for Basketball-GM and it drives significant engagement.

## Data Strategy

### Option A: Community JSON File (Recommended)
Host a `public/rosters/nfl-2025.json` file maintained by the community.
No licensing issues since OVR ratings are editorial estimates, not official data.
Players contribute updates via GitHub PR.

```json
{
  "version": "2025",
  "source": "community",
  "teams": [
    {
      "city": "Kansas City",
      "name": "Chiefs",
      "ab": "KC",
      "clr": "#e31837",
      "ac": "#ffb81c",
      "c": "AFC",
      "d": "West",
      "roster": [
        {
          "name": "Patrick Mahomes",
          "pos": "QB",
          "age": 29,
          "ovr": 97,
          "pot": 97,
          "salary": 45.0,
          "contract": 3
        }
      ]
    }
  ]
}
```

### Option B: Fetch from Open Sports API
APIs like SportsDB (free tier) provide player/team data.
Would need to map position names and estimate OVR from stats.

## Implementation in App.jsx

### 1. Add state
```js
const[realRosterMode,setRealRosterMode]=useState(false);
const[realRosterYear,setRealRosterYear]=useState('2025');
```

### 2. Load function
```js
const loadRealRosters = async (year) => {
  try {
    const url = `${import.meta.env.BASE_URL}rosters/nfl-${year}.json`;
    const res = await fetch(url);
    const data = await res.json();
    // Map community roster format to internal team format
    const newTeams = data.teams.map((t, i) => ({
      ...t,
      id: i,
      isUser: false,
      w: 0, l: 0, t: 0, pf: 0, pa: 0,
      morale: 50, streak: 0, gmRep: 50, chemistry: 75,
      gmStyle: 'balanced',
      coach: { oc: genCoach('OC'), dc: genCoach('DC'), st: genCoach('ST') },
      ps: [], ir: [],
      roster: t.roster.map(p => ({
        ...genPlayer(p.pos, p.age, p.ovr, false),
        name: p.name,
        ovr: p.ovr,
        salary: p.salary,
        contract: p.contract,
      }))
    }));
    setTeams(newTeams);
    setRealRosterMode(true);
    sm(`Loaded ${year} NFL rosters!`);
  } catch(e) {
    sm('Real roster file not found — check public/rosters/');
  }
};
```

### 3. UI in Hub or Splash Screen
```jsx
<button onClick={() => loadRealRosters('2025')}>
  🏈 Play with 2025 NFL Rosters
</button>
```

## Files Needed
```
public/
└── rosters/
    ├── nfl-2025.json    (current season — community maintained)
    ├── nfl-2024.json    (historical)
    └── nfl-2023.json    (historical)
```

## Community Contribution Flow
1. Fork the repo
2. Edit `public/rosters/nfl-YYYY.json`
3. Submit PR with updated OVR ratings
4. Merge after review

## SEO Impact
- Searchable: "Gridiron GM Patrick Mahomes", "Gridiron GM 2025 roster"
- Content marketing: "How does Gridiron GM rate your team?"
- Social: "My team's Gridiron GM roster grade"

## Legal Note
OVR ratings are editorial opinions, not official NFL data.
Player names in sports games have generally been treated as fair use for non-commercial community projects.
Consult counsel before monetizing with real player names.

## Priority
High impact. Needs community effort to build roster files.
Start with `public/rosters/nfl-2025.json` template and open GitHub issue for contributions.
