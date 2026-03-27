# Claude AI Dynamic Storyline Engine — Setup Guide
**Status:** Offline mode live in v31 (Hub > AI Storylines). Claude API mode pending VITE_CLAUDE_API_KEY.

## Overview
The storyline engine uses Claude to generate franchise-specific narrative based on current game state: win/loss record, key players, GM rep tier, injuries, rivalries, and season context. Each press of "Generate" produces 4 unique storylines tailored to the franchise.

## Current State (v31 Offline Mode)
The existing `genAIStoryline()` function in App.jsx generates template-based storylines from game state when no API key is set. These are functional but not as rich as Claude-powered narrative.

## Enabling Claude API Mode

### 1. Get API Key
Visit console.anthropic.com → Create API Key.

### 2. Add to .env.local
```bash
VITE_CLAUDE_API_KEY=sk-ant-xxx
```

**Security note:** Never commit this key. For production, proxy Claude API calls through a Cloudflare Worker or Vercel Edge Function to keep the key server-side.

### 3. Cloudflare Worker Proxy (recommended)
```js
// workers/claude-proxy.js
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method not allowed', {status: 405});
    const body = await request.json();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // fast + cheap for storylines
        max_tokens: 800,
        messages: [{ role: 'user', content: body.prompt }]
      })
    });
    return new Response(await response.text(), {
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
    });
  }
};
```

```bash
# .env.local (app points to worker, not directly to Anthropic)
VITE_CLAUDE_PROXY_URL=https://claude-proxy.your-worker.workers.dev
```

### 4. Update genAIStoryline() in App.jsx
Replace the stub with:
```js
const genAIStoryline = async () => {
  const proxyUrl = import.meta.env.VITE_CLAUDE_PROXY_URL || '';
  if (!proxyUrl) { /* fall through to offline mode */ return; }

  sm('Generating Claude AI storylines...');
  const prompt = `You are a sports journalist covering the ${ut?.city} ${ut?.name} NFL franchise in a simulation game.
Season: ${yr}, Week: ${wk}, Record: ${ut?.w}-${ut?.l}
GM Reputation: ${gmRepTier(ut?.gmRep||50).lbl}
Morale: ${ut?.morale||50}/100
Recent log: ${log.slice(0,5).join('; ')}
Top players: ${(ut?.roster||[]).sort((a,b)=>b.ovr-a.ovr).slice(0,3).map(p=>`${p.name} (${p.pos} OVR${p.ovr})`).join(', ')}

Write exactly 4 short franchise storylines (1-2 sentences each). Each should feel like a real beat reporter item. Be specific to the franchise data above. No bullet points — just the 4 storylines separated by newlines.`;

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({prompt})
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const lines = text.split('\n').filter(l=>l.trim().length>20).slice(0,4);
    setAiStorylines(lines.map(t=>({id:uid(),text:t.trim(),wk})));
    setAiStorylineOpen(true);
    sm('Claude AI storylines generated!');
  } catch(e) {
    sm('Claude API error — using offline mode');
    // fall through to offline mode
  }
};
```

## Cost Estimate
- Claude Haiku: $0.25 per 1M input tokens, $1.25 per 1M output tokens
- Each storyline call: ~800 input + ~200 output tokens
- At 100 daily calls: ~$0.025/day = ~$0.75/month
- Essentially free at current scale

## Prompt Ideas (future)
- Pre-game prediction: "Predict the outcome of this matchup with analysis"
- Trade analysis: "Evaluate this trade from both GMs' perspectives"
- Player bio: "Write a 2-paragraph feature on this player's career arc"
- Season retrospective: "Write the franchise's end-of-season report"

## Priority
Medium. Offline mode (v31) ships now. Claude mode ships when VITE_CLAUDE_PROXY_URL is set.
