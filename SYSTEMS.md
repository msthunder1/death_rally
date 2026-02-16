# Death Rally - Game Systems Reference

How every stat and system interacts with everything else.

---

## CAR STATS (CarStats.js)

### acceleration0to100 (seconds)
- Base time to reach 100 km/h
- Modified by **tyre level** (see TyreConfig)
- Gear acceleration is calibrated so the actual 0-100 time matches exactly

### maxSpeed (km/h)
- Absolute top speed
- All physics curves (drift, steering, braking) scale with **% of max speed**
- Cornering speed loss scales as a ratio of max speed
- Burnout window is a fraction of max speed

### gears (count)
- Each gear covers an equal speed range (maxSpeed / gears)
- More gears = smoother acceleration curve, but more gear shift lag pauses
- Within each gear: acceleration starts strong (130%) and fades to 70% as RPM climbs
- Gear shifts cause a brief power cut (0.5s at 10% power by default)

### powerCurve (1-3)
- Ratio between gear 1 and top gear acceleration
- 1 = 3:1 (mild), 2 = 9:1 (realistic), 3 = 27:1 (aggressive)
- Higher = punchier launch, slower top-end acceleration

### weight (kg)
- Base mass of the car (does NOT penalize acceleration on its own)
- Used as denominator for extra weight penalty: `weight / (weight + extraWeight)`
- Heavier base car is less affected by extra weight (e.g. 100kg guns on a 2500kg truck barely matters, but on a 1000kg car it's noticeable)
- Future: collisions, knockback

### extraWeight (kg, runtime)
- Added at runtime from guns/upgrades (starts at 0)
- Reduces acceleration: `accel * baseWeight / (baseWeight + extraWeight)`
- Example: 1200kg car + 100kg guns = 92% acceleration

### grip (0-1)
- Base tyre grip before tyre bonus
- Reduces lateral slip force (less drift)
- Increases cornering speed loss (grippy tyres scrub speed instead of sliding)

### brakeForce (0-1)
- Multiplier on base braking deceleration
- 1.0 = full braking power from PhysicsConfig

---

## TYRE LEVELS (TyreConfig.js)

12 explicit tyre levels, each with per-level stats. No formulas — edit the array directly.

| Level | Grip Bonus | Drift Mult | Burnout Mult | Accel Penalty |
|---|---|---|---|---|
| 1 (Stock) | +0.00 | 1.00 | 1.00 | +1.1s |
| 2 | +0.01 | 0.95 | 0.94 | +1.0s |
| 3 | +0.02 | 0.91 | 0.87 | +0.9s |
| 4 | +0.04 | 0.86 | 0.81 | +0.8s |
| 5 | +0.05 | 0.82 | 0.74 | +0.7s |
| 6 | +0.06 | 0.77 | 0.68 | +0.6s |
| 7 | +0.08 | 0.73 | 0.62 | +0.5s |
| 8 | +0.09 | 0.68 | 0.55 | +0.4s |
| 9 | +0.10 | 0.64 | 0.49 | +0.3s |
| 10 | +0.11 | 0.59 | 0.42 | +0.2s |
| 11 | +0.13 | 0.55 | 0.36 | +0.1s |
| 12 (Premium) | +0.15 | 0.50 | 0.30 | +0.0s |

**How each column is used:**
- **gripBonus** — added to car's base grip (StatsConverter)
- **driftMultiplier** — multiplies drift force in Car.js (1.0 = full, 0.5 = half)
- **burnoutMultiplier** — multiplies burnout intensity and threshold in Car.js
- **accelPenalty** — seconds added to 0-100 time (StatsConverter)

Tyre level is a static value per car (`CarStats.tyreLevel`).

---

## DRIFT / LATERAL SLIP

How the car slides sideways when turning at speed.

**Flow:**
1. Speed determines base slip force (slipCurve, onset at 20% speed)
2. Grip reduces slip force (gripSlipReduction)
3. Tyre level reduces slip force (TyreConfig driftMultiplier)
4. Slip builds up gradually (slipBuildupRate) - quick taps stay clean
5. Slip decays when not turning (slipDecayRate)
6. Higher slip reduces steering effectiveness (slipSteeringReduction)

**Key configs (PhysicsConfig):**
- `slipCurve.onset` - speed % where drift starts (0.2 = 20%)
- `slipCurve.power` - ramp shape (1.0 = linear)
- `slipBaseRatio` - max lateral velocity as ratio of max speed (scales with pixelsPerMeter)
- `slipBuildupRate` - how fast tyres break loose (lower = more grip time)
- `slipDecayRate` - how fast car straightens out
- `gripSlipReduction` - how much grip stat reduces drift

---

## CORNERING SPEED LOSS

Speed lost when turning at speed. Scales with slip buildup (same timing as skidmarks).

- `speedLossCurve.max` — ratio of car's top speed lost per second at peak (0.48 = 48%)
- `speedLossCurve.onset` — speed % where loss starts (0.2 = 20%)
- `speedLossCurve.power` — curve shape (1.6 = sub-quadratic, spread across speeds)
- Multiplied by `grip` (grippier tyres scrub more speed)
- Multiplied by `currentSlipAmount` (builds up with slip, not instant)

---

## HANDBRAKE

Drift initiation tool. Only works above 20 km/h.

| Effect | Value | Config |
|---|---|---|
| Slip multiplier | 3x | HandbrakeConfig.slipMultiplier |
| Turn rate boost | 1.5x | HandbrakeConfig.turnMultiplier |
| Steering bypass | 70% of slip reduction ignored | HandbrakeConfig.steeringBypass |
| Speed loss | 40 km/h/s | HandbrakeConfig.speedLoss |
| Min speed | 20 km/h | HandbrakeConfig.minSpeed |

Handbrake also forces skidmark strength to at least 0.6.

---

## BURNOUT (launch skidmarks)

Wheel spin marks when accelerating from low speed.

**Active when:** gas pressed AND speed < maxSpeed * burnoutMaxSpeedFraction
**Intensity:** fades as speed increases, reduced by tyre level (TyreConfig burnoutMultiplier)

| Config | Value | Location |
|---|---|---|
| Speed window | 20% of max speed | SkidmarkConfig.burnoutMaxSpeedFraction |
| Base intensity | 0.7 | SkidmarkConfig.burnoutIntensity |
| Tyre reduction | Per-level in TyreConfig | TyreConfig[level].burnoutMultiplier |

---

## SKIDMARKS (visual)

Three sources, strongest wins:
1. **Drift** - from lateral slip amount (above minDrift threshold)
2. **Handbrake** - forced to at least 0.6 strength when active
3. **Burnout** - from launch wheel spin

Strength controls both opacity (minAlpha to maxAlpha) and size (minSize to maxSize).

---

## STEERING

Bell curve - best at medium speed, weaker at low and high speed.

- `steeringCurve.peakSpeed` - speed % for best steering (0.5 = 50%)
- `steeringCurve.lowSpeedMin` - effectiveness near standstill
- `steeringCurve.highSpeedMin` - effectiveness at top speed
- `baseTurnSpeed` - degrees per second at peak

---

## BRAKING

Inverse curve - stronger at low speed, weaker at high speed.

- `brakingForce` - base km/h lost per second
- `brakingCurve.min` - effectiveness at top speed (0.3 = 30%)
- Car's `brakeForce` stat multiplies this

---

## ENGINE BRAKING / SURFACE DRAG

Deceleration when not pressing gas or brake.

- Range curve from `min` (low speed) to `max` (high speed)
- Uses **base acceleration** (without terrain accel multiplier) times **terrain dragMultiplier**
- On road: drag = 1.0x (normal engine braking)
- Off-road: drag is higher (grass 2.5x, sand 3.0x, snow 2.0x, asphalt 1.2x)
- This means the car decelerates **faster** off-road when releasing gas (surface resistance)

---

## SURFACE / TERRAIN (SurfaceConfig.js)

Physics and visual properties change based on whether the car is on-road or off-road.

### Detection
- `SplineTrack.getTerrainAt(x, y)` returns `'road'` if on-track, or the track's default terrain type
- Each track defines its terrain (e.g. `terrain: 'grass'` in track definition)
- Terrain type selectable in track editor via dropdown

### Physics multipliers
Applied when off-road. On-road all multipliers are 1.0 (no effect).

| Multiplier | Road | Asphalt | Grass | Sand | Snow |
|---|---|---|---|---|---|
| **speedMultiplier** | 1.0 | 0.7 | 0.35 | 0.25 | 0.3 |
| **accelerationMultiplier** | 1.0 | 0.5 | 0.25 | 0.2 | 0.2 |
| **gripMultiplier** | 1.0 | 0.8 | 0.4 | 0.3 | 0.25 |
| **slipMultiplier** | 1.0 | 1.0 | 1.8 | 2.5 | 3.0 |
| **brakeMultiplier** | 1.0 | 0.9 | 0.5 | 0.4 | 0.3 |
| **dragMultiplier** | 1.0 | 1.2 | 2.5 | 3.0 | 2.0 |

### Transition
Two-part system:
- **Speed**: `speedMultiplier` applies instantly; actual speed decreases linearly over `speedTransitionTime` (3.0s) toward the terrain cap
- **Handling**: grip, slip, drag, accel, brake multipliers transition linearly at `transitionRate` (1.0 units/second, ~0.5-1s to full effect)

### Where multipliers are applied (Car.js)
1. **Acceleration** - `baseAccel * accelerationMultiplier`
2. **Braking** - `brakeForce * brakeMultiplier`
3. **Speed cap** - gradual linear pull-down to `maxSpeedPx * speedMultiplier`
4. **Grip** - `grip * gripMultiplier` (affects drift reduction)
5. **Slip** - `targetSlip * slipMultiplier` (increases drift)
6. **Surface drag** - `baseAccel * dragMultiplier` (engine braking / coast decel)

### Trail visuals (Skidmarks.js)
Each surface defines trail appearance in `SurfaceConfig.surfaces[name].trail`:
- `type: 'skidmark'` - default dark rubber marks (asphalt)
- `type: 'print'` - slightly larger tyre prints (sand, snow)
- `type: 'displacement'` - wider offset marks, grass pushed aside (grass)
- Each type has its own `color`, `minAlpha`, `maxAlpha`

### Ground color
Each surface has a `groundColor` used by SplineTrack to fill the off-road area.

---

## TRACK EDITOR (EditorScene.js)

Access via `/?editor` URL parameter.

### Modes
1. **DRAW** - Click to place control points (min 4 to form track). Right-click to undo.
2. **EDIT** - Drag points, adjust width, refine track. Press T to test drive.

### Controls
| Input | DRAW mode | EDIT mode |
|---|---|---|
| Left-click | Place point | Select/drag point |
| Right-click | Undo last point | Delete point |
| Double-click | — | Insert point on segment |
| Scroll wheel | Zoom | Zoom (or width adjust on point) |
| Middle-drag | Pan camera | Pan camera |
| T key | — | Test drive |
| DELETE key | — | Delete hovered point |

### Track width
- Default: 90px per side (180px total road width)
- Adjust: scroll wheel while hovering a point (range 20-200px per side)
- Each point has independent `widthL` and `widthR`

### UI panel
- Track name input
- Terrain dropdown (Grass, Sand, Snow, Asphalt)
- New / Save / Export / Import buttons
- Track list with built-in (read-only) and user tracks
- Status bar showing mode and point count

### Storage
- Built-in tracks: loaded from JS files (read-only)
- User tracks: `localStorage` key `deathRally_userTracks`
- Export: copies track JSON to clipboard
- Import: paste track JSON to load

### Track definition format
```js
{
    name, theme, terrain,
    worldWidth, worldHeight,
    resolution, closed,
    path: [{ x, y, widthL, widthR }, ...],
    markings: [{ type, dashLength, gapLength, width, color }],
    objects: [],
    checkpoints: []
}
```

### Intersection detection
- Prevents self-crossing tracks when dragging points
- Red glow indicates collision, snaps point back to original position

---

## I18N (js/i18n/)

Internationalization system for UI text.

- `t('section.key', {params})` - returns translated string with optional parameter substitution
- `setLanguage(lang)` / `registerLanguage(section, lang, data)` - configure languages
- Sectioned language files: `menu/en.js`, `editor/en.js`, `game/en.js`
- All UI strings in EditorScene, GameScene, and TrackSelectScene use `t()` calls

---

## WORLD SCALE

- `PhysicsConfig.pixelsPerMeter` controls the conversion between km/h and px/s
- Currently set to **12** (1 km/h = 3.333 px/s, 150 km/h = 500 px/s)
- Changing this affects visual speed of everything on screen
- Braking, acceleration, cornering speed loss all scale automatically (defined in km/h)
- Drift scales automatically via `slipBaseRatio` (ratio of max speed, not fixed px/s)
