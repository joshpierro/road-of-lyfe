(() => {
  "use strict";

  const CONFIG = {
    maxLife: 100,
    regularDamage: 25,
    heavyDamage: 50,
    regenerationPerSecond: 5,
    invulnerabilitySeconds: 1,
    warningSeconds: 2,
    eventIntervalStart: 2.65,
    eventIntervalMinimum: 2.35,
    treatPoints: 25,
    megaTreatPoints: 2500,
    deadlyChanceStart: 0.025,
    deadlyChanceMaximum: 0.07,
    highScoreKey: "road-of-life-high-score",
    soundKey: "road-of-life-sound"
  };

  const STAGES = [
    { name: "The Jelly-Blob", color: "#a1f0c7", shade: "#63c59d", shape: "blob", personality: "innocent" },
    { name: "The Wiggly Tad-Puff", color: "#ffd27a", shade: "#efa843", shape: "tadpole", personality: "curious" },
    { name: "The Bouncy Gremlin-Tot", color: "#c5a5ff", shade: "#8b69d1", shape: "gremlin", personality: "mischievous" },
    { name: "The Spunky Teen-Beest", color: "#ff9cae", shade: "#d86783", shape: "teen", personality: "rebellious" }
  ];

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const ui = {
    hud: document.querySelector("#hud"),
    stage: document.querySelector("#stage-name"),
    score: document.querySelector("#score"),
    best: document.querySelector("#best-score"),
    health: document.querySelector("#health-fill"),
    evolution: document.querySelector("#evolution-fill"),
    evolutionLabel: document.querySelector("#evolution-label"),
    evolutionValue: document.querySelector("#evolution-value"),
    treats: document.querySelector("#treat-count"),
    distance: document.querySelector("#distance"),
    startScreen: document.querySelector("#start-screen"),
    gameOverScreen: document.querySelector("#game-over-screen"),
    finalScore: document.querySelector("#final-score"),
    finalDistance: document.querySelector("#final-distance"),
    finalStage: document.querySelector("#final-stage"),
    finalTreats: document.querySelector("#final-treats"),
    finalBest: document.querySelector("#final-best"),
    toast: document.querySelector("#toast"),
    soundButton: document.querySelector("#sound-toggle")
  };

  const game = {
    state: "START",
    width: 0,
    height: 0,
    pixelRatio: 1,
    lastFrame: 0,
    elapsed: 0,
    distance: 0,
    score: 0,
    highScore: readNumber(CONFIG.highScoreKey, 0),
    lane: 1,
    renderedLane: 1,
    life: CONFIG.maxLife,
    invulnerable: 0,
    stageIndex: 0,
    evolutionPoints: 0,
    treats: 0,
    spawnTimer: 0.8,
    entities: [],
    particles: [],
    damageFlash: 0,
    toastTimer: 0,
    muted: readBoolean(CONFIG.soundKey, false),
    audio: null
  };

  function readNumber(key, fallback) {
    try {
      const value = Number(localStorage.getItem(key));
      return Number.isFinite(value) && value >= 0 ? value : fallback;
    } catch (error) {
      console.warn(`Could not read saved value "${key}".`, error);
      return fallback;
    }
  }

  function readBoolean(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value === "true";
    } catch (error) {
      console.warn(`Could not read saved setting "${key}".`, error);
      return fallback;
    }
  }

  function saveValue(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      console.warn(`Could not save "${key}".`, error);
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    game.width = bounds.width;
    game.height = bounds.height;
    game.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(game.width * game.pixelRatio);
    canvas.height = Math.round(game.height * game.pixelRatio);
    ctx.setTransform(game.pixelRatio, 0, 0, game.pixelRatio, 0, 0);
    draw();
  }

  function startRun() {
    game.state = "PLAYING";
    game.lastFrame = 0;
    game.elapsed = 0;
    game.distance = 0;
    game.score = 0;
    game.lane = 1;
    game.renderedLane = 1;
    game.life = CONFIG.maxLife;
    game.invulnerable = 0;
    game.stageIndex = 0;
    game.evolutionPoints = 0;
    game.treats = 0;
    game.spawnTimer = 0.75;
    game.entities = [];
    game.particles = [];
    game.damageFlash = 0;
    ui.startScreen.classList.add("hidden");
    ui.gameOverScreen.classList.add("hidden");
    document.body.classList.add("playing");
    syncHud();
    ensureAudio();
  }

  function endRun() {
    if (game.state !== "PLAYING") return;
    game.state = "GAME_OVER";
    game.score = calculateScore();
    if (game.score > game.highScore) {
      game.highScore = game.score;
      saveValue(CONFIG.highScoreKey, game.highScore);
    }
    ui.finalScore.textContent = game.score.toLocaleString();
    ui.finalDistance.textContent = `${Math.floor(game.distance)} m`;
    ui.finalStage.textContent = STAGES[game.stageIndex].name;
    ui.finalTreats.textContent = String(game.treats);
    ui.finalBest.textContent = game.highScore.toLocaleString();
    ui.gameOverScreen.classList.remove("hidden");
    document.body.classList.remove("playing");
    syncHud();
    playTone(105, 0.32, "sawtooth", 0.07);
  }

  function calculateScore() {
    return Math.floor(game.distance) + game.treats * 100 + game.stageIndex * 500;
  }

  function moveLane(direction) {
    if (game.state !== "PLAYING") return;
    const next = Math.max(0, Math.min(2, game.lane + direction));
    if (next !== game.lane) {
      game.lane = next;
      playTone(390 + next * 45, 0.055, "sine", 0.025);
    }
  }

  function nextEvolutionCost() {
    return 100 * (2 ** game.stageIndex);
  }

  function addEvolutionPoints(points) {
    game.evolutionPoints += points;
    if (game.stageIndex < STAGES.length - 1 && game.evolutionPoints >= nextEvolutionCost()) {
      game.stageIndex += 1;
      game.evolutionPoints = 0;
      burstAt(playerX(), game.height * 0.73, "#fff09d", 24);
      showToast(`EVOLVED — ${STAGES[game.stageIndex].name.toUpperCase()}`);
      playTone(540, 0.13, "sine", 0.07);
      window.setTimeout(() => playTone(810, 0.2, "sine", 0.055), 110);
    }
    updateScore();
    syncHud();
  }

  function collect(entity) {
    if (entity.kind === "treat") {
      game.treats += 1;
      addEvolutionPoints(CONFIG.treatPoints);
      burstAt(entity.x, entity.y, "#ffd071", 9);
      playTone(690, 0.085, "triangle", 0.045);
    } else if (entity.kind === "life") {
      game.life = Math.min(CONFIG.maxLife, game.life + entity.value);
      burstAt(entity.x, entity.y, "#8af0c8", 15);
      showToast(game.life === CONFIG.maxLife ? "LIFE FORCE RESTORED!" : "LIFE FORCE UP!");
      playTone(580, 0.13, "sine", 0.05);
    } else if (entity.kind === "mega") {
      game.treats += 100;
      addEvolutionPoints(CONFIG.megaTreatPoints);
      burstAt(entity.x, entity.y, "#fff09d", 26);
      showToast("+100 TREATS!");
      playTone(520, 0.18, "triangle", 0.07);
    } else if (entity.kind === "mystery") {
      if (Math.random() < 0.5) {
        game.life = Math.min(CONFIG.maxLife, game.life + 45);
        showToast("MYSTERY TREAT — LIFE UP!");
        playTone(590, 0.14, "sine", 0.055);
      } else {
        addEvolutionPoints(500);
        showToast("MYSTERY TREAT — +500 POINTS!");
        playTone(720, 0.14, "triangle", 0.055);
      }
      burstAt(entity.x, entity.y, "#d5a5ff", 18);
    }
    syncHud();
  }

  function damage(entity) {
    if (entity.kind === "deadly") {
      burstAt(entity.x, entity.y, "#ff6d86", 22);
      endRun();
      return;
    }
    if (game.invulnerable > 0) return;
    game.life = Math.max(0, game.life - (entity.kind === "heavy" ? CONFIG.heavyDamage : CONFIG.regularDamage));
    game.invulnerable = CONFIG.invulnerabilitySeconds;
    game.damageFlash = 0.28;
    burstAt(playerX(), game.height * 0.76, "#ff8296", 12);
    playTone(155, 0.18, "square", 0.05);
    if (game.life <= 0) endRun();
    syncHud();
  }

  function updateScore() {
    game.score = calculateScore();
  }

  function spawnWave() {
    const difficulty = Math.min(1, game.elapsed / 150);
    const hazardLane = Math.floor(Math.random() * 3);
    const deadlyChance = CONFIG.deadlyChanceStart
      + (CONFIG.deadlyChanceMaximum - CONFIG.deadlyChanceStart) * difficulty;
    const roll = Math.random();
    let hazardKind = "obstacle";
    if (roll < deadlyChance) hazardKind = "deadly";
    else if (roll < deadlyChance + 0.18) hazardKind = "heavy";
    game.entities.push(makeEntity(hazardKind, hazardLane));

    const safeLanes = [0, 1, 2].filter((lane) => lane !== hazardLane);
    const treatLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
    game.entities.push(makeEntity("treat", treatLane));

    if (Math.random() < 0.075) {
      const rewardLane = safeLanes.find((lane) => lane !== treatLane) ?? safeLanes[0];
      const rewardRoll = Math.random();
      const rewardKind = rewardRoll < 0.45 ? "life" : rewardRoll < 0.75 ? "mega" : "mystery";
      game.entities.push(makeEntity(rewardKind, rewardLane));
    }
  }

  function makeEntity(kind, lane) {
    const values = { life: 45 };
    return {
      kind,
      lane,
      remaining: CONFIG.warningSeconds,
      duration: CONFIG.warningSeconds,
      value: values[kind] || 0,
      resolved: false,
      x: 0,
      y: 0
    };
  }

  function update(dt) {
    if (game.state !== "PLAYING") return;
    game.elapsed += dt;
    game.distance += dt * (7.5 + Math.min(game.elapsed / 70, 1) * 5);
    game.invulnerable = Math.max(0, game.invulnerable - dt);
    game.damageFlash = Math.max(0, game.damageFlash - dt);
    game.toastTimer = Math.max(0, game.toastTimer - dt);
    if (game.toastTimer === 0) ui.toast.classList.remove("visible");
    game.life = Math.min(CONFIG.maxLife, game.life + CONFIG.regenerationPerSecond * dt);

    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawnWave();
      const difficulty = Math.min(1, game.elapsed / 150);
      const interval = CONFIG.eventIntervalStart
        - (CONFIG.eventIntervalStart - CONFIG.eventIntervalMinimum) * difficulty;
      game.spawnTimer += interval;
    }

    for (const entity of game.entities) {
      entity.remaining -= dt;
      const progress = Math.max(0, Math.min(1, 1 - entity.remaining / entity.duration));
      const road = roadGeometry();
      const perspective = progress ** 1.55;
      entity.x = laneX(entity.lane, perspective, road);
      entity.y = road.horizon + perspective * (road.playerY - road.horizon);
      if (!entity.resolved && entity.remaining <= 0) {
        entity.resolved = true;
        if (entity.lane === game.lane) {
          if (entity.kind === "obstacle" || entity.kind === "heavy" || entity.kind === "deadly") {
            damage(entity);
          } else {
            collect(entity);
          }
        }
      }
    }
    game.entities = game.entities.filter((entity) => entity.remaining > -0.18);

    for (const particle of game.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 90 * dt;
      particle.life -= dt;
    }
    game.particles = game.particles.filter((particle) => particle.life > 0);
    game.renderedLane += (game.lane - game.renderedLane) * Math.min(1, dt * 12);
    updateScore();
    syncHud();
  }

  function roadGeometry() {
    const w = game.width;
    const h = game.height;
    const horizon = h * 0.34;
    const playerY = h * 0.78;
    const topHalf = Math.min(w * 0.15, 125);
    const bottomHalf = Math.min(w * 0.48, 350);
    return { horizon, playerY, topHalf, bottomHalf, center: w * 0.5 };
  }

  function laneX(lane, progress, road) {
    const half = road.topHalf + (road.bottomHalf - road.topHalf) * progress;
    return road.center + (lane - 1) * half * 0.62;
  }

  function playerX() {
    const road = roadGeometry();
    return laneX(game.renderedLane, 1, road);
  }

  function draw() {
    const w = game.width;
    const h = game.height;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    drawWorld(w, h);
    if (game.state === "PLAYING" || game.state === "GAME_OVER") {
      drawEntities();
      drawPlayer();
      drawParticles();
      if (game.damageFlash > 0) {
        ctx.fillStyle = `rgba(255, 75, 110, ${game.damageFlash * 0.32})`;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      drawPreviewCreature();
    }
  }

  function drawWorld(w, h) {
    const road = roadGeometry();
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#6686ad");
    sky.addColorStop(0.43, "#d4a9a0");
    sky.addColorStop(0.68, "#f2c99b");
    sky.addColorStop(1, "#314760");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const sunX = w * 0.78;
    const sunY = h * 0.22;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, Math.min(w, h) * 0.23);
    sunGlow.addColorStop(0, "rgba(255, 231, 173, .9)");
    sunGlow.addColorStop(0.22, "rgba(255, 218, 164, .32)");
    sunGlow.addColorStop(1, "rgba(255, 218, 164, 0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(sunX - 160, sunY - 160, 320, 320);
    ctx.fillStyle = "#ffe6b1";
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.min(w, h) * 0.047, 0, Math.PI * 2);
    ctx.fill();

    drawCloud(w * 0.18, h * 0.17, 0.8);
    drawCloud(w * 0.52, h * 0.25, 0.57);
    drawHill(0, road.horizon + 5, w * 0.5, 65, "#788998");
    drawHill(w * 0.42, road.horizon + 10, w * 0.72, 83, "#617c83");
    drawHill(-w * 0.1, road.horizon + 21, w * 1.1, 70, "#415f68");

    ctx.fillStyle = "#405c63";
    ctx.fillRect(0, road.horizon + 17, w, h - road.horizon);
    drawRoad(road, h);
    drawScenery(road, h);
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255, 237, 220, .27)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(-20, -5, 17, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(2, -11, 22, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(23, -4, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHill(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + width * 0.17, y - height, x + width * 0.35, y);
    ctx.quadraticCurveTo(x + width * 0.59, y - height * 1.2, x + width * 0.78, y + 3);
    ctx.lineTo(x + width, y + 7);
    ctx.lineTo(x + width, game.height);
    ctx.lineTo(x, game.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawRoad(road, h) {
    ctx.fillStyle = "#293b55";
    ctx.beginPath();
    ctx.moveTo(road.center - road.topHalf, road.horizon);
    ctx.lineTo(road.center + road.topHalf, road.horizon);
    ctx.lineTo(road.center + road.bottomHalf, h);
    ctx.lineTo(road.center - road.bottomHalf, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(218, 218, 198, .35)";
    ctx.beginPath();
    ctx.moveTo(road.center - road.topHalf, road.horizon);
    ctx.lineTo(road.center - road.topHalf + 4, road.horizon);
    ctx.lineTo(road.center - road.bottomHalf + 6, h);
    ctx.lineTo(road.center - road.bottomHalf, h);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(road.center + road.topHalf - 4, road.horizon);
    ctx.lineTo(road.center + road.topHalf, road.horizon);
    ctx.lineTo(road.center + road.bottomHalf, h);
    ctx.lineTo(road.center + road.bottomHalf - 6, h);
    ctx.closePath();
    ctx.fill();

    for (let divider = 0; divider < 2; divider += 1) {
      const xTop = road.center + (divider - 0.5) * road.topHalf * 0.62;
      const xBottom = road.center + (divider - 0.5) * road.bottomHalf * 0.62;
      ctx.strokeStyle = "rgba(222, 230, 219, .38)";
      ctx.lineWidth = Math.max(1, game.width * 0.003);
      ctx.setLineDash([12, 14]);
      ctx.lineDashOffset = -(game.elapsed * (25 + Math.min(game.elapsed, 80)));
      ctx.beginPath();
      ctx.moveTo(xTop, road.horizon);
      ctx.lineTo(xBottom, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawScenery(road, h) {
    const cycle = (game.elapsed * 24) % 150;
    for (let i = 0; i < 8; i += 1) {
      const y = road.horizon + ((i * 83 + cycle) % Math.max(1, h - road.horizon));
      const progress = (y - road.horizon) / (h - road.horizon);
      const side = i % 2 === 0 ? -1 : 1;
      const spread = road.topHalf + progress * (road.bottomHalf + 32);
      const x = road.center + side * spread;
      const size = 5 + progress * 18;
      ctx.fillStyle = i % 3 === 0 ? "#a3ad89" : "#c2a77e";
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.7, size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(245, 220, 159, .68)";
        ctx.beginPath();
        ctx.arc(x + side * size * 0.42, y - size * 0.15, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawEntities() {
    for (const entity of game.entities) {
      if (entity.remaining <= -0.05) continue;
      const progress = Math.max(0, Math.min(1, 1 - entity.remaining / entity.duration));
      const scale = 0.24 + progress * 0.92;
      ctx.save();
      ctx.translate(entity.x, entity.y);
      ctx.scale(scale, scale);
      const bob = Math.sin(game.elapsed * 5 + entity.lane) * 3;
      ctx.translate(0, bob);
      if (entity.kind === "treat") drawBone("#ffc568", "#bd7845");
      else if (entity.kind === "life") drawReward("#8af0c8", "+");
      else if (entity.kind === "mega") {
        ctx.shadowColor = "#ffe37d";
        ctx.shadowBlur = 24;
        drawBone("#ffe47d", "#d18c39", 1.5);
      } else if (entity.kind === "mystery") drawReward("#d6a5ff", "?");
      else drawHazard(entity.kind);
      ctx.restore();
    }
  }

  function drawBone(fill, shadow, size = 1) {
    ctx.save();
    ctx.rotate(-0.2);
    ctx.scale(size, size);
    ctx.shadowColor = "rgba(26, 19, 28, .36)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = fill;
    ctx.strokeStyle = shadow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-22, -9);
    ctx.bezierCurveTo(-31, -22, -43, -13, -35, -2);
    ctx.bezierCurveTo(-43, 9, -31, 20, -21, 8);
    ctx.lineTo(20, 8);
    ctx.bezierCurveTo(31, 21, 43, 10, 35, 0);
    ctx.bezierCurveTo(43, -12, 31, -22, 21, -8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.stroke();
    ctx.restore();
  }

  function drawReward(color, symbol) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#26314b";
    ctx.font = "900 29px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol, 0, 1);
  }

  function drawHazard(kind) {
    ctx.shadowColor = kind === "deadly" ? "#ff4968" : kind === "heavy" ? "#ff985e" : "#283149";
    ctx.shadowBlur = kind === "deadly" ? 22 : 8;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = kind === "deadly" ? "#f4516d" : kind === "heavy" ? "#a85d4d" : "#596474";
    ctx.strokeStyle = kind === "deadly" ? "#ffd0cf" : "#d7b8a1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (kind === "deadly") {
      ctx.moveTo(0, -31); ctx.lineTo(31, 25); ctx.lineTo(-31, 25); ctx.closePath();
    } else {
      ctx.roundRect(-29, -25, 58, 50, kind === "heavy" ? 8 : 13);
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#fff1df";
    ctx.font = "900 23px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(kind === "deadly" ? "!" : kind === "heavy" ? "×2" : "•", 0, kind === "deadly" ? 4 : 0);
  }

  function drawPlayer() {
    const road = roadGeometry();
    const x = playerX();
    const y = road.playerY - 5 + Math.sin(game.elapsed * 10) * 3;
    const blink = game.invulnerable > 0 && Math.floor(game.elapsed * 14) % 2 === 0;
    if (blink) return;
    drawCreature(x, y, STAGES[game.stageIndex], 1);
  }

  function drawPreviewCreature() {
    const x = game.width * 0.5;
    const y = game.height * 0.72 + Math.sin(performance.now() * 0.002) * 5;
    drawCreature(x, y, STAGES[0], 1.1);
  }

  function drawCreature(x, y, stage, scale = 1) {
    const bounce = Math.sin(game.elapsed * 11) * 2.5;
    ctx.save();
    ctx.translate(x, y + bounce);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(17, 25, 40, .34)";
    ctx.beginPath();
    ctx.ellipse(0, 30, 27, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = stage.shade;
    ctx.beginPath();
    if (stage.shape === "teen") {
      ctx.ellipse(0, 2, 20, 31, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = stage.color;
      ctx.beginPath();
      ctx.arc(0, -11, 23, Math.PI, 0);
      ctx.lineTo(23, 8);
      ctx.quadraticCurveTo(0, 25, -23, 8);
      ctx.closePath();
      ctx.fill();
    } else if (stage.shape === "tadpole") {
      ctx.moveTo(-17, 18);
      ctx.quadraticCurveTo(-23, -7, -3, -27);
      ctx.quadraticCurveTo(18, -22, 20, 4);
      ctx.quadraticCurveTo(13, 23, -17, 18);
      ctx.fill();
      ctx.strokeStyle = stage.color;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(14, 12);
      ctx.quadraticCurveTo(30, 20 + Math.sin(game.elapsed * 12) * 4, 28, 2);
      ctx.stroke();
    } else {
      ctx.ellipse(0, 0, stage.shape === "gremlin" ? 24 : 25, stage.shape === "gremlin" ? 25 : 23, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (stage.shape === "gremlin") {
      ctx.fillStyle = stage.color;
      ctx.beginPath();
      ctx.moveTo(-18, -15); ctx.lineTo(-28, -32); ctx.lineTo(-7, -23); ctx.closePath();
      ctx.moveTo(18, -15); ctx.lineTo(28, -32); ctx.lineTo(7, -23); ctx.closePath();
      ctx.fill();
    }
    if (stage.shape === "teen") {
      ctx.fillStyle = "#41435f";
      ctx.beginPath();
      ctx.roundRect(-23, -30, 46, 12, 7);
      ctx.roundRect(-17, -41, 34, 15, 8);
      ctx.fill();
      ctx.fillStyle = "#ffc868";
      ctx.fillRect(-18, -30, 36, 3);
    }
    ctx.fillStyle = "#26314b";
    ctx.beginPath();
    ctx.ellipse(-8, -3, 3.2, stage.shape === "teen" ? 2 : 4, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -3, 3.2, stage.shape === "teen" ? 2 : 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff4df";
    ctx.beginPath();
    ctx.ellipse(0, 6, 3, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#71485b";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(0, 7, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function burstAt(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 125;
      game.particles.push({
        x, y, color,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8,
        size: 2 + Math.random() * 4
      });
    }
  }

  function drawParticles() {
    for (const particle of game.particles) {
      ctx.globalAlpha = Math.min(1, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("visible");
    game.toastTimer = 1.8;
  }

  function syncHud() {
    const stage = STAGES[game.stageIndex];
    ui.stage.textContent = stage.name;
    ui.score.textContent = game.score.toLocaleString();
    ui.best.textContent = game.highScore.toLocaleString();
    ui.health.style.width = `${Math.max(0, (game.life / CONFIG.maxLife) * 100)}%`;
    ui.treats.textContent = String(game.treats);
    ui.distance.textContent = `${Math.floor(game.distance)} m`;
    if (game.stageIndex === STAGES.length - 1) {
      ui.evolutionLabel.textContent = "EVOLUTION POINTS";
      ui.evolutionValue.textContent = game.evolutionPoints.toLocaleString();
      ui.evolution.style.width = `${Math.min(100, game.evolutionPoints / 20)}%`;
    } else {
      const requirement = nextEvolutionCost();
      ui.evolutionLabel.textContent = "EVOLUTION";
      ui.evolutionValue.textContent = `${game.evolutionPoints} / ${requirement}`;
      ui.evolution.style.width = `${Math.min(100, (game.evolutionPoints / requirement) * 100)}%`;
    }
    ui.soundButton.textContent = game.muted ? "♫̸" : "♫";
    ui.soundButton.setAttribute("aria-label", game.muted ? "Turn sound on" : "Turn sound off");
  }

  function ensureAudio() {
    if (game.muted || game.audio) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      game.audio = new AudioContext();
      if (game.audio.state === "suspended") game.audio.resume();
    }
  }

  function playTone(frequency, duration, type = "sine", volume = 0.04) {
    if (game.muted) return;
    ensureAudio();
    if (!game.audio) return;
    const oscillator = game.audio.createOscillator();
    const gain = game.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, game.audio.currentTime);
    gain.gain.setValueAtTime(volume, game.audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, game.audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(game.audio.destination);
    oscillator.start();
    oscillator.stop(game.audio.currentTime + duration);
  }

  function frame(timestamp) {
    if (document.hidden) {
      game.lastFrame = timestamp;
      window.requestAnimationFrame(frame);
      return;
    }
    const dt = game.lastFrame ? Math.min((timestamp - game.lastFrame) / 1000, 0.05) : 0;
    game.lastFrame = timestamp;
    update(dt);
    draw();
    window.requestAnimationFrame(frame);
  }

  document.querySelector("#start-button").addEventListener("click", startRun);
  document.querySelector("#restart-button").addEventListener("click", startRun);
  document.querySelector("#left-button").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    moveLane(-1);
  });
  document.querySelector("#right-button").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    moveLane(1);
  });
  ui.soundButton.addEventListener("click", () => {
    game.muted = !game.muted;
    saveValue(CONFIG.soundKey, game.muted);
    if (!game.muted) ensureAudio();
    syncHud();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && game.state !== "PLAYING") {
      event.preventDefault();
      startRun();
      return;
    }
    if (game.state !== "PLAYING") return;
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      event.preventDefault();
      moveLane(-1);
    } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      event.preventDefault();
      moveLane(1);
    }
  });

  let pointerStart = null;
  document.querySelector(".game-shell").addEventListener("pointerdown", (event) => {
    if (game.state !== "PLAYING" || event.target.closest("button")) return;
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  document.querySelector(".game-shell").addEventListener("pointerup", (event) => {
    if (!pointerStart) return;
    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
      moveLane(deltaX < 0 ? -1 : 1);
    }
    pointerStart = null;
  });
  document.querySelector(".game-shell").addEventListener("pointercancel", () => { pointerStart = null; });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => { game.lastFrame = 0; });

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js")
        .catch((error) => console.error("Offline support could not be enabled.", error));
    });
  }

  syncHud();
  resize();
  window.requestAnimationFrame(frame);
})();
