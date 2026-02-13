# Death Rally - Game Systems Reference

How every stat and system interacts with everything else.

---

## CAR STATS (CarStats.js)

### acceleration0to100 (seconds)
- Base time to reach 100 km/h
- Modified by **tyre level** (level 1 adds +1.1s, level 12 adds +0.0s)
- Gear acceleration is calibrated so the actual 0-100 time matches exactly

### maxSpeed (km/h)
- Absolute top speed
- All physics curves (drift, steering, braking) scale with **% of max speed**
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

## TYRE LEVEL (1-12)

Tyres are the most cross-cutting upgrade. They affect four systems:

| System | Level 1 | Level 12 | Config |
|---|---|---|---|
| **Grip bonus** | +0.00 | +0.30 | StatsConverter.tyreBonus() |
| **Acceleration penalty** | +1.1s to 0-100 | +0.0s | StatsConverter.tyreAccelPenalty() |
| **Drift reduction** | 0% (full drift) | 90% less drift | PhysicsConfig.tyreDriftReduction |
| **Burnout reduction** | 0% (full burnout) | 90% less burnout | SkidmarkConfig.burnoutTyreReduction |

Formula for all tyre effects: `1 - ((tyreLevel - 1) / 11) * reduction`

---

## DRIFT / LATERAL SLIP

How the car slides sideways when turning at speed.

**Flow:**
1. Speed determines base slip force (slipCurve, onset at 20% speed)
2. Grip reduces slip force (gripSlipReduction)
3. Tyre level reduces slip force (tyreDriftReduction)
4. Slip builds up gradually (slipBuildupRate) - quick taps stay clean
5. Slip decays when not turning (slipDecayRate)
6. Higher slip reduces steering effectiveness (slipSteeringReduction)

**Key configs (PhysicsConfig):**
- `slipCurve.onset` - speed % where drift starts (0.2 = 20%)
- `slipCurve.power` - ramp shape (1.0 = linear)
- `slipBaseForce` - max lateral movement in px/s
- `slipBuildupRate` - how fast tyres break loose (lower = more grip time)
- `slipDecayRate` - how fast car straightens out
- `gripSlipReduction` - how much grip stat reduces drift
- `tyreDriftReduction` - how much tyre level reduces drift

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
**Intensity:** fades as speed increases, reduced by tyre level

| Config | Value | Location |
|---|---|---|
| Speed window | 20% of max speed | SkidmarkConfig.burnoutMaxSpeedFraction |
| Base intensity | 0.7 | SkidmarkConfig.burnoutIntensity |
| Tyre reduction | 90% at level 12 | SkidmarkConfig.burnoutTyreReduction |

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

## ENGINE BRAKING

Deceleration when not pressing gas or brake.

- Range curve from `min` (low speed) to `max` (high speed)
- Multiplies current gear's acceleration value
