# lyfecycle-Fork
## Game Design & Technical Specification – Version 5.0

### 1. PROJECT OVERVIEW

Create a mobile-first, three-lane, pseudo-3D endless arcade runner called **lyfecycle-Fork**.

The player controls an evolving creature that automatically runs forward through an endless environment. The player moves between three lanes to avoid obstacles and collect Scooby Snacks, special rewards, and other surprises.

The primary gameplay loop is:

**Run → Collect → Evolve → Avoid Obstacles → Survive → Repeat**

The game should be fun, colorful, accessible, increasingly challenging, and designed to encourage repeated play.

This should feel like a polished mobile arcade game, not a conventional website.

---

# 2. PLATFORM AND TECHNOLOGY

### Primary Platform
Mobile-first Progressive Web App (PWA).

Mobile is the primary design target. Desktop support is secondary.

### Technology Requirements
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- HTML5 Canvas 2D rendering (`ctx`)
- No unnecessary frameworks or dependencies.

### Project Structure

Organize the project into separate files:

- `index.html`
- `style.css`
- `game.js`
- `manifest.json`
- `service-worker.js`
- `assets/`

Keep the code modular, organized, maintainable, and easy to expand.

### PWA Requirements
- Installable on mobile devices.
- Standalone launch without browser UI.
- Offline gameplay after initial loading.
- Local persistence for high scores and settings.
- Fast startup.
- Smooth animation and responsive performance.

### Screen Design
- Portrait orientation is the primary orientation.
- Responsive layout for different mobile screen sizes.
- Support device safe areas and rounded corners.
- Prevent unwanted scrolling.
- Desktop support should preserve the game's app-like appearance.

---

# 3. GAMEPLAY

The game uses a three-lane endless runner design.

The player creature automatically runs forward.

The environment and obstacles move toward the player, creating the illusion of forward movement.

The player can:
- Move one lane to the left.
- Move one lane to the right.

The player cannot:
- Move backward.
- Move forward manually.
- Jump.
- Move vertically.

The game should feel responsive and fluid.

---

# 4. PLAYER CONTROLS

### Mobile Controls
Support two control methods:

1. Swipe left or right to move one lane.
2. Large on-screen left/right touch controls near the bottom of the screen.

Controls should be comfortable for one-handed play.

### Desktop Controls

| Key | Action |
|---|---|
| A | Move left |
| D | Move right |
| Left Arrow | Move left |
| Right Arrow | Move right |
| Enter | Start or restart |
| P or Escape | Pause or resume |

Both keyboard control styles must work identically.

---

# 5. EVOLUTION SYSTEM

Evolution is the primary progression mechanic.

The creature evolves by collecting Scooby Snacks and accumulating evolution points.

### Scooby Snack Value

Each ordinary Scooby Snack awards:

**25 Evolution Points**

### Increasing Evolution Requirements

Each evolution requires twice as many points as the previous evolution.

| Advancement from stage | Points required to reach next stage | Regular Scooby Snacks |
|---|---:|---:|
| Stage 1 → Stage 2 | 100 | 4 |
| Stage 2 → Stage 3 | 200 | 8 |
| Stage 3 → Stage 4 | 400 | 16 |
| Stage 4 → Stage 5 | 800 | 32 |
| Stage 5 → Stage 6 | 1,600 | 64 |
| Stage 6 → Stage 7 | 3,200 | 128 |
| Stage 7 → Stage 8 | 6,400 | 256 |

Continue this doubling pattern indefinitely.

### Evolution Rules
- The player starts at the first evolution stage.
- Evolution points accumulate through collecting Scooby Snacks and applicable bonus rewards.
- The Stage 1 → Stage 2 advancement costs 100 points; each later advancement costs twice as many points as the previous one.
- Points toward an advancement are discarded when the player evolves; any amount beyond that advancement's requirement does not carry over.
- The next evolution requires twice as many points as the previous one.
- Evolution is permanent for the current run.
- Collisions never remove evolution stages or accumulated evolution progress.
- Starting or restarting a run returns the player to Stage 1 with zero points toward the next evolution. High score and settings persist separately.

### Important Technical Requirement

Evolution stages must be data-driven and configurable.

Do not hard-code a maximum of four stages.

The initial release should support the four creatures listed below, but additional creatures must be addable later through configuration and assets without rewriting the game engine.

Each evolution stage should support:
- Stage name.
- A configurable list of creature forms and their appearances.
- Personality.
- Animation characteristics.
- Optional gameplay characteristics.

### Initial Evolution Stages

Each major stage has four mini-evolution forms. They unlock at 0%, 25%, 50%, and 75% of that stage's point requirement. Mini evolutions do not reset points or change the major stage. A reward that crosses several thresholds displays the latest unlocked form; reaching a major evolution instead advances one stage and discards excess points, as above.

| Major stage | Mini-evolution forms, in order |
|---|---|
| Stage 1 – The Awakening | Little Egg → Tadpole → Froglet → Frog |
| Stage 2 – The Wanderer | Little Lizard → Spotted Lizard → Crested Lizard → Fire-Crest Lizard |
| Stage 3 – The Guardian | Baby Monkey → Curious Monkey → Clever Monkey → Guardian Monkey |
| Stage 4 – The Cosmic Elder | Wildcat Cub → Spotted Wildcat → Elder Wildcat → Cosmic Wildcat |

These are stylized, original canvas illustrations inspired by the supplied creature reference. The HUD displays the major stage and current form; the game-over summary displays the major stage.

### Evolution Effects
When the player evolves:
- Change the creature's appearance.
- Play an evolution sound.
- Display a brief evolution animation.
- Update the stage name.
- Reset the evolution meter.
- Update the next evolution requirement.

Mini evolutions also change the creature's appearance and provide visual and audio feedback without resetting the meter, unless a pigeon or random-animal transformation is active. While transformed, evolution continues in the background without replacing the current animal.

The initial release defines four creature stages. At Stage 4, the player remains Stage 4 and may continue collecting and accumulating evolution points, but does not evolve again until another stage is added through configuration. Use the theoretical 800-point Stage 4 requirement as the reference for its mini forms, unlocking them at 200, 400, and 600 points. Do not cap the point total or impose a hard-coded maximum stage; the evolution system must allow additional configured stages later. At Stage 4, show the current run's accumulated evolution points instead of progress toward a nonexistent next stage.

---

# 6. SIZE, SHADE, AND TRANSFORMATIONS

- Each ordinary or mega treat grows and lightens the creature by one step. Each regular or red-sign hazard shrinks and darkens it by one step; a heavy hazard does so by two steps.
- Size and brightness have configurable bounds to keep the creature visible and the game playable.
- A red warning sign transforms the creature into a pigeon. A green plus transforms it into a randomly selected animal, excluding its current animal when possible.
- Transformations persist through evolution until another red sign or green plus is collected. Evolution points and stages continue advancing independently.
- There is no life force and no automatic game over. The player can finish a run from the pause screen.

---

# 7. COLLECTIBLES: TREATS

Ordinary treats are the primary collectible. Each one is worth the same 25 evolution points as an ordinary Scooby Snack.

Randomly choose from a colorful assortment of dog biscuits, candy canes, ice cream cones, hot dogs, chicken sandwiches, pancakes, fried chicken, boba tea, doughnuts, fries, milkshakes, burgers, pizza, cupcakes, tacos, and watermelon. Chicken sandwiches are unbranded. Each treat should be recognizable and visually distinct from hazards and special rewards.

### Behavior
- Spawn randomly across the three lanes.
- Move toward the player.
- Disappear when collected.
- Award 25 evolution points each.
- Trigger a collection sound.
- Trigger a brief visual collection effect.
- Update the evolution meter.

Ordinary treats should remain valuable throughout the entire game, including after the player reaches the latest available evolution stage.

---

# 8. SURPRISE REWARDS

Introduce occasional special treats that appear randomly during gameplay.

These rewards should be rarer than ordinary Scooby Snacks and provide meaningful bonuses.

### Reward Types

**A. Transformation Treat**
- A green plus transforms the creature into a random animal.

**B. Mega Scooby Snack**
- Awards the equivalent of 100 ordinary Scooby Snacks.
- Value: 2,500 evolution points.
- Should have a distinctive appearance, such as an oversized glowing golden dog biscuit.

**C. Mystery Treat**
- Provides a randomly selected bonus.
- Possible outcomes include a random animal transformation or a large evolution-point reward.

### Reward Rules
- Spawn randomly and relatively infrequently.
- Make rewards visually distinct from ordinary Scooby Snacks.
- Provide noticeable collection animations and sounds.
- Clearly communicate the reward received.
- Reward values and spawn probabilities should be configurable.

The system should support adding additional reward types in future updates.

---

# 9. OBSTACLES AND HAZARDS

Obstacles spawn randomly in the three lanes.

The player must move between lanes to avoid them.

Introduce three categories of hazards.

### A. Regular Obstacle
- Shrinks and darkens the creature by one step.
- Should be the most common obstacle type.

### B. Heavy Obstacle
- Shrinks and darkens the creature by two steps.
- Should look noticeably more dangerous than an ordinary obstacle.

### C. Red Warning Sign
- Shrinks and darkens the creature by one step and turns it into a pigeon.
- Should have a highly distinctive visual appearance.
- Should be relatively rare.

### Hazard Rules
- Spawn obstacles randomly across the three lanes.
- Randomly select creepy, cartoon-style appearances within each category. Regular hazards include poop, garbage, a non-graphic dead animal, a hornet, a spider, and a ghost. Heavy hazards include a scary teacher, shark, werewolf, zombie, and monster eye. Red signs include poison, a skull, and a haunted tombstone.
- Use a pale rounded frame for regular hazards, an orange frame and ×2 badge for heavy hazards, and a glowing red triangle and ! badge for red signs. These indicators remain consistent regardless of the appearance chosen.
- Clearly communicate the danger level of each obstacle.
- Collision detection must be accurate and consistent.
- Hazards should become more challenging as the game progresses.
- Red signs must be rare and avoidable.

**Fairness is essential:** Never generate obstacle patterns that make collision unavoidable. Use a minimum warning time of 1.5 seconds from an obstacle becoming visible to reaching the player. Before committing a pattern to the world, validate it against the player's current lane, lane-change rules, and the upcoming obstacle sequence; at least one safe, reachable lane must remain at every obstacle encounter. Do not create simultaneous hazards that block all reachable lanes, including red signs. Preserve these guarantees as speed and difficulty increase; if necessary, limit speed or spawn frequency rather than reducing the warning time or removing every safe route. Treat these values as configurable playtesting defaults.

---

# 10. ENDLESS GAMEPLAY AND DIFFICULTY

The game has no final level.

The world continues generating obstacles and collectibles until the player ends the run from the pause screen.

### Difficulty Progression
Gradually increase difficulty based on survival time or distance.

Possible changes:
- Increase forward movement speed.
- Increase obstacle frequency.
- Introduce more complex obstacle arrangements.
- Increase the challenge of collecting Scooby Snacks.
- Introduce more difficult combinations of hazards.

Difficulty should begin relatively forgiving and gradually become more demanding.

Avoid sudden, unfair difficulty spikes.

All difficulty parameters should be configurable.

---

# 11. SCORING SYSTEM

Track the following:

- Current score.
- High score.
- Distance traveled.
- Scooby Snacks collected.
- Highest evolution stage reached.
- Survival time.

Score should reward:
- Distance traveled.
- Scooby Snacks collected.
- Evolution progression.
- Time survived.

The exact scoring weights should be configurable.

Persist the high score locally between sessions.

---

# 12. USER INTERFACE

The HUD should be designed for mobile first.

It must be readable without obstructing the gameplay area.

### In-Game HUD

Display:
- Current evolution stage name.
- Current score.
- Distance traveled.
- Evolution progress meter.
- Scooby Snack count.

The evolution meter should communicate progress toward the next evolution.

### Start Screen

Display:

lyfecycle-Fork

Subtitle:

"every decision is a fork in the road"

Include:
- Brief gameplay instructions.
- Start button.
- Enter key support on desktop.

### Game Over Screen

Display:
- Run Complete.
- Final score.
- Distance traveled.
- Highest evolution stage.
- Total Scooby Snacks collected.
- Restart button.

Enter should restart the game on desktop.

### Game States

Implement four primary game states:

1. START
2. PLAYING
3. PAUSED
4. GAME_OVER

Provide pause, resume, and end-run buttons. Pause freezes gameplay, including movement, spawning, and progression; resuming continues the same run without advancing the simulation by the paused time. Ensure transitions between states are reliable.

---

# 13. VISUAL AND AUDIO STYLE

The game should have a colorful, energetic arcade aesthetic.

### Visual Direction
- Exaggerated creature designs.
- Recognizable, expressive characters.
- Fun animations.
- Clear visual distinction between collectibles, rewards, and hazards.
- Engaging forward movement.
- Responsive visual effects.
- Readable mobile HUD.

The creatures should have personality.

The game should feel approachable, funny, and entertaining.

### Audio
Include sound effects for:
- Collecting ordinary Scooby Snacks.
- Collecting special rewards.
- Hitting a hazard.
- Evolving.
- Game over.

Audio should be configurable and should not prevent gameplay if sound is disabled.

---

# 14. FUTURE EXPANSION

Build the game so it can be expanded without major architectural changes.

Potential future additions:
- More evolution stages.
- Additional creatures.
- Random achievements.
- New collectible types.
- Additional surprise rewards.
- New obstacle types.
- Additional environments.

These are future possibilities, not requirements for the initial release.

Keep the first version focused on delivering a polished, enjoyable core gameplay experience.

---

# 15. DEVELOPMENT PRIORITIES

Prioritize development in this order:

1. Functional three-lane endless runner.
2. Responsive mobile controls.
3. Creature movement and animation.
4. Scooby Snack collection.
5. Evolution and doubling point requirements.
6. Creature size, shade, and transformation system.
7. Ordinary and special hazards.
8. Surprise rewards.
9. Difficulty progression.
10. Scoring and high-score persistence.
11. Start and game-over screens.
12. PWA installation and offline support.
13. Visual and audio polish.

Build incrementally and test each major system before moving on.

Avoid implementing future features prematurely.

---

# 16. IMPORTANT IMPLEMENTATION GUIDELINES

- Prioritize mobile gameplay and portrait orientation.
- Keep the game responsive and smooth.
- Use modular, readable JavaScript.
- Keep game balancing values configurable.
- Use data-driven evolution stages.
- Do not hard-code a final evolution stage.
- Do not remove evolution progress after collisions.
- Ensure special hazards and rewards are distinguishable.
- Ensure red signs are rare and avoidable.
- Test on mobile screen dimensions throughout development.
- Avoid unnecessary dependencies.
- Do not sacrifice performance for visual effects.

The result should be a complete, playable, polished first version rather than a static prototype or a collection of disconnected features.

---

## CORE GAME PHILOSOPHY

**Keep running. Collect Scooby Snacks. Evolve. Survive. Keep going.**