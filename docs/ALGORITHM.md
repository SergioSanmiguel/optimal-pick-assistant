# Recommendation Algorithm Documentation

## Overview

The Optimal Pick Assistant uses a multi-factor weighted scoring algorithm to recommend champions during champion select. The system analyzes real-time game state and comprehensive statistical data to provide intelligent picks.

---

## Core Algorithm

### Mathematical Formula

```
TotalScore(c) = Σ (Factor_i(c) × Weight_i)
```

Where:
- `c` = candidate champion
- `Factor_i` = individual scoring component (normalized to 0-100)
- `Weight_i` = user-defined weight for that factor (0-1, sum to 1.0)

### Default Weights

```typescript
{
  winRate: 0.40,      // 40% - Most important for raw strength
  pickRate: 0.10,     // 10% - Indicates meta presence and reliability
  counterScore: 0.30, // 30% - Critical for laning phase
  synergyScore: 0.20  // 20% - Team composition matters
}
```

---

## Factor Calculations

### 1. Win Rate Score

**Purpose:** Measure champion's raw strength in the role

**Formula:**
```
WinRateScore = clamp((winRate - 0.45) × 200, 0, 100)
```

**Normalization:**
- 45% WR → 0 score (very weak)
- 50% WR → 50 score (balanced)
- 52.5% WR → 75 score (strong)
- 55%+ WR → 100 score (dominant)

**Example:**
```typescript
champion.winRate = 0.523  // 52.3%
WinRateScore = (0.523 - 0.45) × 200 = 14.6 × 200 = 73 → 73/100
```

**Rationale:** 
- Win rates above 50% indicate champion is stronger than average
- 52%+ is considered very strong in competitive play
- Scales linearly but caps at 100 to prevent overvaluation

---

### 2. Pick Rate Score

**Purpose:** Measure champion popularity and perceived safety

**Formula:**
```
PickRateScore = clamp((pickRate / 0.10) × 100, 0, 100)
```

**Normalization:**
- 0% PR → 0 score (unused)
- 5% PR → 50 score (moderate)
- 10%+ PR → 100 score (meta staple)

**Example:**
```typescript
champion.pickRate = 0.089  // 8.9%
PickRateScore = (0.089 / 0.10) × 100 = 89/100
```

**Rationale:**
- Popular champions are usually reliable
- High pick rate indicates:
  - Easy to execute
  - Meta-relevant
  - Versatile in many comps
- Caps at 10% to avoid overweighting "flavor of the month"

---

### 3. Counter Score

**Purpose:** Measure matchup advantage against enemy champions

**Algorithm:**
```typescript
async calculateCounterScore(championId, enemyTeam, role) {
  if (enemyTeam.length === 0) return 50; // Neutral if no enemies
  
  // Fetch matchup data for each enemy
  const matchups = await Promise.all(
    enemyTeam.map(enemy => 
      getMatchupData(championId, enemy.championId, role)
    )
  );
  
  // Filter matchups with sufficient data (≥50 matches)
  const validMatchups = matchups.filter(m => m && m.matches >= 50);
  
  if (validMatchups.length === 0) return 50; // No data → neutral
  
  // Calculate average win rate across all matchups
  const avgWinRate = validMatchups.reduce((sum, m) => 
    sum + m.winRate, 0
  ) / validMatchups.length;
  
  // Normalize: 45% WR = 0, 50% = 50, 55% = 100
  return clamp(((avgWinRate - 0.45) / 0.10) × 100, 0, 100);
}
```

**Normalization:**
- 45% matchup WR → 0 score (hard counter)
- 48% matchup WR → 30 score (unfavorable)
- 50% matchup WR → 50 score (skill matchup)
- 52% matchup WR → 70 score (favorable)
- 55%+ matchup WR → 100 score (counter pick)

**Example:**
```typescript
// Zed (157) vs Yasuo (middle)
matchups = [
  { vsYasuo: 0.478 },    // 47.8% WR
  { vsSyndra: 0.523 },   // 52.3% WR
  { vsAhri: 0.495 }      // 49.5% WR
]

avgWinRate = (0.478 + 0.523 + 0.495) / 3 = 0.499
CounterScore = ((0.499 - 0.45) / 0.10) × 100 = 49/100
```

**Rationale:**
- Lane phase determines early game
- Winning lane provides:
  - Gold/XP advantage
  - Priority for objectives
  - Psychological edge
- Multiple unfavorable matchups → avoid pick

---

### 4. Synergy Score

**Purpose:** Measure team composition compatibility

**Algorithm:**
```typescript
async calculateSynergyScore(championId, allyTeam, role) {
  if (allyTeam.length === 0) return 50; // Neutral if solo
  
  // Fetch synergy data for each ally
  const synergies = await Promise.all(
    allyTeam.map(ally => 
      getSynergyData(championId, ally.championId, role)
    )
  );
  
  // Filter synergies with sufficient data (≥30 matches)
  const validSynergies = synergies.filter(s => s && s.matches >= 30);
  
  if (validSynergies.length === 0) return 50; // No data → neutral
  
  // Calculate average duo win rate
  const avgWinRate = validSynergies.reduce((sum, s) => 
    sum + s.winRate, 0
  ) / validSynergies.length;
  
  // Normalize: 48% WR = 0, 50% = 25, 54% = 75, 56% = 100
  return clamp(((avgWinRate - 0.48) / 0.08) × 100, 0, 100);
}
```

**Normalization:**
- 48% duo WR → 0 score (anti-synergy)
- 50% duo WR → 25 score (neutral)
- 52% duo WR → 50 score (good synergy)
- 54% duo WR → 75 score (strong synergy)
- 56%+ duo WR → 100 score (combo pick)

**Example:**
```typescript
// Orianna with allies
synergies = [
  { withMalphite: 0.535 },  // 53.5% WR
  { withJarvan: 0.518 },    // 51.8% WR
  { withJinx: 0.502 }       // 50.2% WR
]

avgWinRate = (0.535 + 0.518 + 0.502) / 3 = 0.518
SynergyScore = ((0.518 - 0.48) / 0.08) × 100 = 47.5/100
```

**Rationale:**
- Team composition impacts:
  - Teamfight execution (e.g., Malphite + Orianna)
  - Engage patterns
  - Win conditions
- Synergy effects are subtle but measurable
- Lower threshold than counters (48% vs 45%) because duo effects are smaller

---

## Weight Normalization

Before calculation, weights are normalized to sum to 1.0:

```typescript
function normalizeWeights(weights: Partial<RecommendationWeights>) {
  const sum = weights.winRate + weights.pickRate + 
              weights.counterScore + weights.synergyScore;
  
  return {
    winRate: weights.winRate / sum,
    pickRate: weights.pickRate / sum,
    counterScore: weights.counterScore / sum,
    synergyScore: weights.synergyScore / sum
  };
}
```

**Example:**
```typescript
input = { winRate: 4, pickRate: 1, counterScore: 3, synergyScore: 2 }
sum = 10

normalized = {
  winRate: 4/10 = 0.4,
  pickRate: 1/10 = 0.1,
  counterScore: 3/10 = 0.3,
  synergyScore: 2/10 = 0.2
}
```

---

## Complete Calculation Example

### Scenario
- **Role:** Middle
- **Allies:** Lee Sin (jungle), Jinx (ADC)
- **Enemies:** Yasuo (middle), Zed (middle - not locked)
- **Candidate:** Orianna

### Step 1: Fetch Stats
```typescript
stats = {
  winRate: 0.518,    // 51.8%
  pickRate: 0.064,   // 6.4%
  matches: 8420
}
```

### Step 2: Calculate Individual Scores

**Win Rate Score:**
```
(0.518 - 0.45) × 200 = 13.6 → 68/100
```

**Pick Rate Score:**
```
(0.064 / 0.10) × 100 = 64/100
```

**Counter Score (vs Yasuo):**
```
matchup.winRate = 0.523
((0.523 - 0.45) / 0.10) × 100 = 73/100
```

**Synergy Score (with Lee Sin & Jinx):**
```
avgDuoWR = (0.535 + 0.502) / 2 = 0.5185
((0.5185 - 0.48) / 0.08) × 100 = 48/100
```

### Step 3: Apply Weights
```
TotalScore = (68 × 0.4) + (64 × 0.1) + (73 × 0.3) + (48 × 0.2)
           = 27.2 + 6.4 + 21.9 + 9.6
           = 65.1/100
```

### Step 4: Generate Reasoning
```typescript
reasoning = [
  "Strong 51.8% win rate in A tier",
  "Popular meta pick",
  "Favorable matchup vs Yasuo (52.3% WR)",
  "Good synergy with Lee Sin"
]
```

---

## Edge Cases & Handling

### 1. Insufficient Data
**Scenario:** Champion has <100 total matches in role

**Action:** Exclude from recommendations
```typescript
if (stats.matches < 100) return null;
```

**Rationale:** Low sample size = unreliable statistics

---

### 2. No Matchup Data
**Scenario:** No matchup data available for enemy champions

**Action:** Return neutral score (50)
```typescript
if (validMatchups.length === 0) return 50;
```

**Rationale:** Don't penalize pick when data is unavailable

---

### 3. No Synergy Data
**Scenario:** Teammate champion is new or unpopular

**Action:** Return neutral score (50)
```typescript
if (validSynergies.length === 0) return 50;
```

---

### 4. Mirror Matchup
**Scenario:** Opponent picks same champion (ARAM/special modes)

**Action:** Use global win rate as tie-breaker
```typescript
if (championId === opponentId) {
  return stats.winRate > 0.50 ? 55 : 45;
}
```

---

### 5. All Champions Banned/Picked
**Scenario:** No valid recommendations available

**Action:** Return empty array
```typescript
if (availableChampions.length === 0) {
  return [];
}
```

---

## Optimizations

### 1. Parallel Data Fetching
```typescript
const [stats, matchups, synergies] = await Promise.all([
  getChampionStats(championId, role),
  getMatchupData(championId, enemies, role),
  getSynergyData(championId, allies, role)
]);
```

### 2. Caching Strategy
- **Champion stats**: 1 hour TTL (changes slowly)
- **Matchup data**: 2 hours TTL (updated per patch)
- **Patch data**: 24 hours TTL (changes ~biweekly)

### 3. Batch Processing
Calculate all candidates concurrently:
```typescript
const scores = await Promise.all(
  availableChampions.map(id => calculateScore(id))
);
```

---

## Future Improvements

### 1. Machine Learning Integration
Train models on:
- High-ELO match data
- Professional play patterns
- Player-specific champion pools

**Expected Impact:** +5-10% recommendation accuracy

---

### 2. Elo-Adjusted Recommendations
```typescript
if (playerElo === 'iron-gold') {
  weights.pickRate *= 1.5;  // Prioritize easy champions
  weights.counterScore *= 0.8;  // Mechanics matter more
}
```

---

### 3. Ban Phase Prediction
```typescript
predictEnemyBans(ourTeam, enemyTeam) {
  // Analyze:
  // - High ban rate champions
  // - One-trick probability
  // - Meta counters to our comp
  return bannedChampions;
}
```

---

### 4. Dynamic Weight Adjustment
```typescript
// Late-game comp → increase synergy weight
if (teamHasLateGameCarry) {
  weights.synergyScore *= 1.3;
}

// Enemy has many counters → increase counter weight
if (enemyCounterPotential > 0.6) {
  weights.counterScore *= 1.2;
}
```

---

### 5. Champion Mastery Integration
```typescript
// Boost score for player's mains
if (playerMastery[championId] >= 5) {
  totalScore *= 1.15;  // 15% boost
  reasoning.push("High mastery - confident pick");
}
```

---

## Validation & Testing

### Test Cases

**1. Balanced Matchup:**
```
Input: 50% WR, 5% PR, neutral matchups
Expected: ~50 total score
```

**2. S-Tier Pick:**
```
Input: 54% WR, 15% PR, favorable matchups
Expected: 80-90 total score
```

**3. Hard Counter:**
```
Input: 48% WR, 8% PR, 58% counter WR
Expected: 60-70 total score (counter weight compensates)
```

### Metrics
- **Accuracy**: % of recommended picks that win
- **User Satisfaction**: Feedback surveys
- **Adoption Rate**: % of games where recommendation used

---

## References

- [U.GG Statistics Methodology](https://u.gg/about)
- [Riot Games Developer Portal](https://developer.riotgames.com/)
- Research papers on team composition analysis