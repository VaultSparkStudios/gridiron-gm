# Full 60-Minute Live Game (Phaser) — Setup Guide
**Status:** Current live sim plays key moments only. Full game architecture designed.

## Current State (gridiron-gm-play v30)
The Phaser engine handles individual plays with:
- 95+ play types (runs, passes, specials, tricks)
- Play-calling interface (PlayCallScene)
- Field visualization (FieldScene)
- Game over (GameOverScene)
- Web Speech API commentary

But it simulates single plays, not a full game with clock, drives, and possession changes.

## Full Game Architecture

### Clock System
```js
// GameScene.js additions
this.clock = {
  quarter: 1,
  seconds: 900, // 15 min quarters
  running: false,
  playClockSeconds: 40,
};

this.clockText = this.add.text(400, 30, 'Q1 15:00', {
  fontSize: '18px', fill: '#ffffff', fontFamily: 'monospace'
});

this.time.addEvent({
  delay: 1000,
  callback: this.tickClock,
  callbackScope: this,
  loop: true
});

tickClock() {
  if (!this.clock.running || this.clock.seconds <= 0) return;
  this.clock.seconds--;
  this.updateClockDisplay();
  if (this.clock.seconds <= 0) this.endQuarter();
}
```

### Drive System
```js
this.drive = {
  startYard: 25,
  currentYard: 25,
  down: 1,
  toGo: 10,
  possession: 'home', // 'home' | 'away'
  plays: 0,
  driveLog: []
};

advanceDrive(yards) {
  this.drive.currentYard += yards;
  this.drive.toGo -= yards;
  this.drive.plays++;

  if (this.drive.currentYard >= 100) {
    this.scoreTouchdown();
    return;
  }
  if (this.drive.toGo <= 0) {
    // First down
    this.drive.down = 1;
    this.drive.toGo = 10;
  } else {
    this.drive.down++;
    if (this.drive.down > 4) this.turnover('punt');
  }
}
```

### Score & Possession
```js
this.score = { home: 0, away: 0 };

scoreTouchdown() {
  this.score[this.drive.possession] += 6;
  this.attemptPAT(); // or 2-point
  this.kickoff();
}

kickoff() {
  this.drive.possession = this.drive.possession === 'home' ? 'away' : 'home';
  this.drive.currentYard = 25;
  this.drive.down = 1;
  this.drive.toGo = 10;
}
```

### Play Selection UI (expanded)
```js
// PlayCallScene.js — full 4-down play calling
showPlayCallMenu() {
  const isRedZone = this.drive.currentYard >= 80;
  const is4thDown = this.drive.down === 4;
  const isShortYardage = this.drive.toGo <= 2;

  const plays = isRedZone ? RED_ZONE_PLAYS :
                is4thDown ? FOURTH_DOWN_PLAYS :
                isShortYardage ? SHORT_YARDAGE_PLAYS :
                STANDARD_PLAYS;

  // Render play cards with risk/reward display
}
```

### Half-Time Show
```js
endHalf() {
  this.clock.quarter = 3;
  this.clock.seconds = 900;
  this.showHalfTimeStats();
  // 5-second halftime animation
  this.time.delayedCall(5000, () => this.startSecondHalf());
}
```

### Final Score → GM State Bridge
```js
// GameOverScene.js
sendResultToGM() {
  if (window.opener) {
    window.opener.postMessage({
      type: 'GAME_RESULT',
      homeScore: this.finalScore.home,
      awayScore: this.finalScore.away,
      playerStats: this.playerStats,
      mvp: this.mvp
    }, '*');
  }
}
```

## Implementation Plan

### Phase 1 (4-6 hours): Clock & Drive
- Add game clock to FieldScene
- Add down/distance/yard line display
- Add possession tracking
- Connect advanceDrive() to existing play outcomes

### Phase 2 (4-6 hours): Full Game Loop
- 4 quarters with half-time
- Score tracking with TD/FG/safety animations
- Kickoff plays
- Punt/turnover possession changes

### Phase 3 (2-4 hours): Play Depth
- Expand PlayCallScene to show formation and play type
- Add pre-snap adjustments (hot routes, audibles)
- Add 2-minute drill mode (auto no-huddle)

### Phase 4 (2 hours): Polish
- Full-game box score
- Player of the Game
- Shareable final score card
- Bridge to GM state (win/loss record)

## Estimated Dev Time
- **Total: 12-16 hours** across gridiron-gm-play repo

## Priority
Highest ceiling. This is the feature that makes Gridiron GM categorically different from Football-GM.
