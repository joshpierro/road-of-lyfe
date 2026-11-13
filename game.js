(() => {
  "use strict";

  const CONFIG = {
    minSize: 0.6,
    maxSize: 1.6,
    sizeStep: 0.08,
    minBrightness: 0.55,
    maxBrightness: 1.5,
    brightnessStep: 0.06,
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

  const TREATS = [
    { name: "Dog biscuit", draw: drawBiscuit },
    { name: "Candy cane", draw: drawCandyCane },
    { name: "Ice cream cone", draw: drawIceCream },
    { name: "Hot dog", draw: drawHotDog },
    { name: "Chicken sandwich", draw: drawChickenSandwich },
    { name: "Pancakes", draw: drawPancakes },
    { name: "Fried chicken", draw: drawFriedChicken },
    { name: "Boba tea", draw: drawBoba },
    { name: "Doughnut", draw: drawDoughnut },
    { name: "Fries", draw: drawFries },
    { name: "Milkshake", draw: drawMilkshake },
    { name: "Burger", draw: drawBurger },
    { name: "Pizza", draw: drawPizza },
    { name: "Cupcake", draw: drawCupcake },
    { name: "Taco", draw: drawTaco },
    { name: "Watermelon", draw: drawWatermelon }
  ];

  const HAZARDS = {
    obstacle: [
      { name: "Poop", draw: drawPoop },
      { name: "Garbage", draw: drawGarbage },
      { name: "Dead animal", draw: drawDeadAnimal },
      { name: "Hornet", draw: drawHornet },
      { name: "Spider", draw: drawSpider },
      { name: "Ghost", draw: drawGhost }
    ],
    heavy: [
      { name: "Scary teacher", draw: drawTeacher },
      { name: "Shark", draw: drawShark },
      { name: "Werewolf", draw: drawWerewolf },
      { name: "Zombie", draw: drawZombie },
      { name: "Monster eye", draw: drawMonsterEye }
    ],
    deadly: [
      { name: "Poison", draw: drawPoison },
      { name: "Skull", draw: drawSkull },
      { name: "Haunted tombstone", draw: drawTombstone }
    ]
  };

  const STAGES = [
    {
      name: "The Awakening", personality: "curious",
      forms: [
        { name: "Little Egg", shape: "egg", color: "#b8ebff" },
        { name: "Tadpole", shape: "tadpole", color: "#65cfc2" },
        { name: "Froglet", shape: "froglet", color: "#98d967" },
        { name: "Frog", shape: "frog", color: "#81ca50" }
      ]
    },
    {
      name: "The Wanderer", personality: "adventurous",
      forms: [
        { name: "Little Lizard", shape: "lizard", color: "#9bdc6c", detail: 0 },
        { name: "Spotted Lizard", shape: "lizard", color: "#8ccf5d", detail: 1 },
        { name: "Crested Lizard", shape: "lizard", color: "#8acb4f", detail: 2 },
        { name: "Fire-Crest Lizard", shape: "lizard", color: "#87c64b", detail: 3 }
      ]
    },
    {
      name: "The Guardian", personality: "playful",
      forms: [
        { name: "Baby Monkey", shape: "monkey", color: "#a86637", detail: 0 },
        { name: "Curious Monkey", shape: "monkey", color: "#ac6937", detail: 1 },
        { name: "Clever Monkey", shape: "monkey", color: "#ae713d", detail: 2 },
        { name: "Guardian Monkey", shape: "monkey", color: "#b77842", detail: 3 }
      ]
    },
    {
      name: "The Cosmic Elder", personality: "wise",
      forms: [
        { name: "Wildcat Cub", shape: "wildcat", color: "#daa15c", detail: 0 },
        { name: "Spotted Wildcat", shape: "wildcat", color: "#d9954e", detail: 1 },
        { name: "Elder Wildcat", shape: "wildcat", color: "#df9b53", detail: 2 },
        { name: "Cosmic Wildcat", shape: "wildcat", color: "#e7ae67", detail: 3 }
      ]
    }
  ];

  const PIGEON = { name: "Pigeon", shape: "pigeon", color: "#aebac5" };
  const ANIMALS = [
    { name: "Frog", shape: "frog", color: "#81ca50" },
    { name: "Lizard", shape: "lizard", color: "#8ccf5d", detail: 1 },
    { name: "Monkey", shape: "monkey", color: "#a86637", detail: 1 },
    { name: "Wildcat", shape: "wildcat", color: "#daa15c", detail: 1 }
  ];

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const ui = {
    hud: document.querySelector("#hud"),
    stage: document.querySelector("#stage-name"),
    form: document.querySelector("#form-name"),
    score: document.querySelector("#score"),
    best: document.querySelector("#best-score"),
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
    soundButton: document.querySelector("#sound-toggle"),
    pauseButton: document.querySelector("#pause-button"),
    pauseScreen: document.querySelector("#pause-screen"),
    resumeButton: document.querySelector("#resume-button")
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
    size: 1,
    brightness: 1,
    transformedForm: null,
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
    game.size = 1;
    game.brightness = 1;
    game.transformedForm = null;
    game.stageIndex = 0;
    game.evolutionPoints = 0;
    game.treats = 0;
    game.spawnTimer = 0.75;
    game.entities = [];
    game.particles = [];
    game.damageFlash = 0;
    game.toastTimer = 0;
    ui.toast.classList.remove("visible");
    ui.pauseScreen.classList.add("hidden");
    document.body.classList.remove("paused");
    ui.pauseButton.setAttribute("aria-pressed", "false");
    ui.startScreen.classList.add("hidden");
    ui.gameOverScreen.classList.add("hidden");
    document.body.classList.add("playing");
    syncHud();
    ensureAudio();
  }

  function togglePause() {
    if (game.state !== "PLAYING" && game.state !== "PAUSED") return;
    const paused = game.state === "PLAYING";
    game.state = paused ? "PAUSED" : "PLAYING";
    game.lastFrame = 0;
    pointerStart = null;
    if (paused) {
      document.body.classList.add("paused");
      ui.pauseScreen.classList.remove("hidden");
      ui.resumeButton.focus();
    } else {
      document.body.classList.remove("paused");
      ui.pauseScreen.classList.add("hidden");
      ui.pauseButton.focus();
    }
    ui.pauseButton.setAttribute("aria-pressed", String(paused));
  }

  function endRun() {
    if (game.state !== "PLAYING" && game.state !== "PAUSED") return;
    game.state = "GAME_OVER";
    ui.pauseScreen.classList.add("hidden");
    document.body.classList.remove("paused");
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
    document.querySelector("#restart-button").focus();
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

  function formIndex(stageIndex, points) {
    const forms = STAGES[stageIndex].forms;
    const stageCost = 100 * (2 ** stageIndex);
    return Math.min(forms.length - 1, Math.floor(points / stageCost * forms.length));
  }

  function currentForm() {
    return game.transformedForm || STAGES[game.stageIndex].forms[formIndex(game.stageIndex, game.evolutionPoints)];
  }

  function addEvolutionPoints(points) {
    const previousForm = formIndex(game.stageIndex, game.evolutionPoints);
    game.evolutionPoints += points;
    if (game.stageIndex < STAGES.length - 1 && game.evolutionPoints >= nextEvolutionCost()) {
      game.stageIndex += 1;
      game.evolutionPoints = 0;
      burstAt(playerX(), game.height * 0.73, "#fff09d", 24);
      showToast(`EVOLVED — ${STAGES[game.stageIndex].name.toUpperCase()}`);
      playTone(540, 0.13, "sine", 0.07);
      window.setTimeout(() => playTone(810, 0.2, "sine", 0.055), 110);
    } else if (formIndex(game.stageIndex, game.evolutionPoints) > previousForm) {
      burstAt(playerX(), game.height * 0.73, "#a4f5d2", 16);
      const unlocked = STAGES[game.stageIndex].forms[formIndex(game.stageIndex, game.evolutionPoints)];
      showToast(`NEW FORM — ${unlocked.name.toUpperCase()}`);
      playTone(620, 0.15, "sine", 0.055);
    }
    updateScore();
    syncHud();
  }

  function collect(entity) {
    if (entity.kind === "treat") {
      game.treats += 1;
      adjustCreature(1);
      addEvolutionPoints(CONFIG.treatPoints);
      burstAt(entity.x, entity.y, "#ffd071", 9);
      playTone(690, 0.085, "triangle", 0.045);
    } else if (entity.kind === "transform") {
      transformAnimal();
      burstAt(entity.x, entity.y, "#8af0c8", 15);
      playTone(580, 0.13, "sine", 0.05);
    } else if (entity.kind === "mega") {
      game.treats += 100;
      adjustCreature(1);
      showToast("+100 TREATS!");
      addEvolutionPoints(CONFIG.megaTreatPoints);
      burstAt(entity.x, entity.y, "#fff09d", 26);
      playTone(520, 0.18, "triangle", 0.07);
    } else if (entity.kind === "mystery") {
      if (Math.random() < 0.5) {
        transformAnimal();
        playTone(590, 0.14, "sine", 0.055);
      } else {
        showToast("MYSTERY TREAT — +500 POINTS!");
        addEvolutionPoints(500);
        playTone(720, 0.14, "triangle", 0.055);
      }
      burstAt(entity.x, entity.y, "#d5a5ff", 18);
    }
    syncHud();
  }

  function adjustCreature(steps) {
    game.size = Math.max(CONFIG.minSize, Math.min(CONFIG.maxSize, game.size + CONFIG.sizeStep * steps));
    game.brightness = Math.max(CONFIG.minBrightness, Math.min(CONFIG.maxBrightness, game.brightness + CONFIG.brightnessStep * steps));
  }

  function transformAnimal() {
    const choices = ANIMALS.filter((animal) => animal.shape !== currentForm().shape);
    game.transformedForm = choices[Math.floor(Math.random() * choices.length)];
    showToast(`TRANSFORMED — ${game.transformedForm.name.toUpperCase()}!`);
  }

  function damage(entity) {
    adjustCreature(entity.kind === "heavy" ? -2 : -1);
    game.damageFlash = 0.28;
    if (entity.kind === "deadly") {
      game.transformedForm = PIGEON;
      burstAt(entity.x, entity.y, "#ff6d86", 22);
      showToast("POOF! YOU'RE A PIGEON!");
    } else {
      burstAt(playerX(), game.height * 0.76, "#ff8296", 12);
    }
    playTone(155, 0.18, "square", 0.05);
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
      const rewardKind = rewardRoll < 0.45 ? "transform" : rewardRoll < 0.75 ? "mega" : "mystery";
      game.entities.push(makeEntity(rewardKind, rewardLane));
    }
  }

  function makeEntity(kind, lane) {
    const hazards = HAZARDS[kind];
    return {
      kind,
      lane,
      treat: kind === "treat" ? TREATS[Math.floor(Math.random() * TREATS.length)] : null,
      hazard: hazards ? hazards[Math.floor(Math.random() * hazards.length)] : null,
      remaining: CONFIG.warningSeconds,
      duration: CONFIG.warningSeconds,
      resolved: false,
      x: 0,
      y: 0
    };
  }

  function update(dt) {
    if (game.state !== "PLAYING") return;
    game.elapsed += dt;
    game.distance += dt * (7.5 + Math.min(game.elapsed / 70, 1) * 5);
    game.damageFlash = Math.max(0, game.damageFlash - dt);
    game.toastTimer = Math.max(0, game.toastTimer - dt);
    if (game.toastTimer === 0) ui.toast.classList.remove("visible");

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
    if (game.state === "PLAYING" || game.state === "PAUSED" || game.state === "GAME_OVER") {
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
      if (entity.kind === "treat") entity.treat.draw();
      else if (entity.kind === "transform") drawReward("#8af0c8", "+");
      else if (entity.kind === "mega") {
        ctx.shadowColor = "#ffe37d";
        ctx.shadowBlur = 24;
        drawBone("#ffe47d", "#d18c39", 1.5);
      } else if (entity.kind === "mystery") drawReward("#d6a5ff", "?");
      else drawHazard(entity);
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

  function drawBiscuit() {
    drawBone("#ffc568", "#bd7845", 0.75);
  }

  function roundedFood(x, y, width, height, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  function foodLine(color, width, points) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.stroke();
  }

  function drawCandyCane() {
    ctx.rotate(0.2);
    ctx.lineCap = "round";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#fff8ed";
    ctx.beginPath();
    ctx.moveTo(7, 24);
    ctx.lineTo(7, -13);
    ctx.arc(-4, -13, 11, 0, Math.PI, true);
    ctx.stroke();
    ctx.strokeStyle = "#e84e5c";
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawIceCream() {
    ctx.fillStyle = "#d4934d";
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(0, 27);
    ctx.closePath(); ctx.fill();
    foodLine("#f3c17d", 2, [[-7, 8], [5, 17]]);
    foodLine("#f3c17d", 2, [[7, 8], [-5, 17]]);
    ellipse(0, -6, 15, 13, "#ffb9cf");
    ellipse(-4, -13, 7, 5, "#ffdce5");
  }

  function drawHotDog() {
    ctx.rotate(-0.2);
    roundedFood(-25, -12, 50, 25, 12, "#eeb66a");
    roundedFood(-23, -8, 46, 16, 8, "#c65c42");
    foodLine("#ffe174", 3, [[-17, 0], [-9, -4], [-1, 1], [7, -4], [16, 0]]);
  }

  function drawChickenSandwich() {
    roundedFood(-22, 8, 44, 9, 5, "#e5aa5e");
    roundedFood(-24, 1, 48, 10, 5, "#aa6235");
    ellipse(-12, 0, 8, 4, "#6eaa52");
    ellipse(10, 0, 8, 4, "#6eaa52");
    ellipse(0, -5, 22, 10, "#eebc76");
    ellipse(-7, -10, 2, 1, "#fff3d4");
    ellipse(7, -11, 2, 1, "#fff3d4");
  }

  function drawPancakes() {
    for (const y of [15, 8, 1]) {
      ellipse(0, y, 23, 8, "#bb713e");
      ellipse(0, y - 3, 23, 7, "#f5c377");
    }
    ellipse(0, -3, 15, 4, "#a85c35");
    roundedFood(-5, -8, 10, 5, 2, "#ffe68c");
  }

  function drawFriedChicken() {
    ctx.rotate(-0.65);
    roundedFood(-4, 9, 8, 17, 4, "#fff1d2");
    ellipse(-4, 25, 4, 4, "#fff1d2");
    ellipse(4, 25, 4, 4, "#fff1d2");
    ellipse(0, -6, 17, 20, "#cd7937");
    ellipse(-5, -12, 5, 4, "#f7ba63");
    ellipse(6, -2, 3, 3, "#f7ba63");
  }

  function drawBoba() {
    roundedFood(-16, -18, 32, 43, 6, "#e5b885");
    roundedFood(-18, -21, 36, 6, 3, "#fff1d6");
    foodLine("#ef657e", 4, [[5, -20], [10, -31]]);
    for (const [x, y] of [[-8, 14], [0, 17], [9, 13], [-5, 21], [6, 21]]) {
      ellipse(x, y, 3, 3, "#523b38");
    }
  }

  function drawDoughnut() {
    ellipse(0, 0, 23, 23, "#bd793c");
    ellipse(0, -3, 21, 19, "#f991b5");
    ellipse(0, 0, 7, 7, "#704c39");
    foodLine("#fff0a0", 3, [[-13, -9], [-10, -11]]);
    foodLine("#8be9d1", 3, [[11, -11], [14, -8]]);
    foodLine("#fff0a0", 3, [[-13, 8], [-10, 10]]);
    foodLine("#fff", 3, [[10, 8], [13, 6]]);
  }

  function drawFries() {
    for (const x of [-14, -7, 0, 7, 14]) {
      roundedFood(x - 3, -23 + Math.abs(x) * 0.25, 6, 27, 2, "#ffd774");
    }
    ctx.fillStyle = "#e65b52";
    ctx.beginPath();
    ctx.moveTo(-23, -4); ctx.lineTo(23, -4); ctx.lineTo(17, 24); ctx.lineTo(-17, 24);
    ctx.closePath(); ctx.fill();
    ellipse(0, 9, 6, 6, "#ffe79e");
  }

  function drawMilkshake() {
    roundedFood(-16, -12, 32, 37, 6, "#f3a5bb");
    ellipse(0, -13, 17, 6, "#f9dbe0");
    ellipse(-6, -18, 8, 7, "#fff6e8");
    ellipse(5, -20, 9, 8, "#fff6e8");
    ellipse(1, -28, 4, 4, "#e8555e");
    foodLine("#e8555e", 3, [[10, -20], [16, -30]]);
    roundedFood(-3, 0, 6, 17, 3, "rgba(255,255,255,.35)");
  }

  function drawBurger() {
    roundedFood(-22, 13, 44, 8, 4, "#df9c50");
    roundedFood(-24, 5, 48, 9, 4, "#7f4936");
    foodLine("#f7d45c", 5, [[-21, 5], [-8, 9], [3, 5], [16, 9], [22, 5]]);
    roundedFood(-23, -1, 46, 6, 3, "#75b760");
    ellipse(0, -4, 22, 11, "#eeb66a");
    for (const x of [-10, 0, 10]) ellipse(x, -8, 2, 1, "#fff2cc");
  }

  function drawPizza() {
    ctx.fillStyle = "#efc066";
    ctx.beginPath();
    ctx.moveTo(-22, -18); ctx.lineTo(22, -18); ctx.lineTo(0, 26);
    ctx.closePath(); ctx.fill();
    foodLine("#bf7a3a", 7, [[-21, -19], [21, -19]]);
    for (const [x, y] of [[-9, -8], [8, -9], [0, 4]]) ellipse(x, y, 4, 4, "#d75e49");
  }

  function drawCupcake() {
    ctx.fillStyle = "#af79c9";
    ctx.beginPath();
    ctx.moveTo(-17, 2); ctx.lineTo(17, 2); ctx.lineTo(12, 24); ctx.lineTo(-12, 24);
    ctx.closePath(); ctx.fill();
    ellipse(0, -2, 20, 10, "#ffb9cd");
    ellipse(-7, -10, 10, 8, "#ffb9cd");
    ellipse(6, -13, 10, 9, "#ffb9cd");
    ellipse(0, -23, 4, 4, "#df5667");
    foodLine("#fff2a1", 2, [[-10, -4], [-8, -6]]);
    foodLine("#80daca", 2, [[8, -7], [10, -5]]);
  }

  function drawTaco() {
    ellipse(0, 3, 24, 19, "#f0bf5f");
    ellipse(0, 0, 20, 14, "#80b85c");
    ellipse(-9, -1, 6, 5, "#db7250");
    ellipse(7, -3, 6, 5, "#db7250");
    ctx.fillStyle = "#f5cc70";
    ctx.beginPath();
    ctx.arc(0, 3, 24, 0, Math.PI);
    ctx.closePath(); ctx.fill();
  }

  function drawWatermelon() {
    ctx.fillStyle = "#70b86b";
    ctx.beginPath();
    ctx.arc(0, -7, 24, 0, Math.PI);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f17e83";
    ctx.beginPath();
    ctx.arc(0, -7, 19, 0, Math.PI);
    ctx.closePath(); ctx.fill();
    for (const [x, y] of [[-10, 0], [0, 4], [10, 0]]) ellipse(x, y, 2, 3, "#654143");
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

  function drawHazard(entity) {
    const kind = entity.kind;
    ctx.save();
    ctx.shadowColor = kind === "deadly" ? "#ff4968" : "#111927";
    ctx.shadowBlur = kind === "deadly" ? 16 : 5;
    ctx.fillStyle = kind === "deadly" ? "#702e45" : kind === "heavy" ? "#563c40" : "#344457";
    ctx.strokeStyle = kind === "deadly" ? "#ff7387" : kind === "heavy" ? "#ffad6e" : "#bdcbd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (kind === "deadly") {
      ctx.moveTo(0, -36); ctx.lineTo(34, 26); ctx.lineTo(-34, 26); ctx.closePath();
    } else {
      ctx.roundRect(-31, -30, 62, 58, kind === "heavy" ? 8 : 16);
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.scale(kind === "deadly" ? 0.7 : 0.82, kind === "deadly" ? 0.7 : 0.82);
    if (kind === "deadly") ctx.translate(0, 5);
    entity.hazard.draw();
    ctx.restore();
    if (kind !== "obstacle") {
      ellipse(23, -25, 10, 10, kind === "deadly" ? "#ed3658" : "#ee8d42");
      ctx.fillStyle = "#fff9ec";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(kind === "deadly" ? "!" : "×2", 23, -25);
    }
    ctx.restore();
  }

  function drawPoop() {
    ellipse(0, 18, 24, 9, "#72402f");
    ellipse(0, 9, 20, 10, "#895139");
    ellipse(-2, 0, 15, 9, "#9b6041");
    ellipse(1, -8, 10, 8, "#a86a46");
    ctx.fillStyle = "#a86a46";
    ctx.beginPath(); ctx.moveTo(-5, -12); ctx.quadraticCurveTo(6, -12, 4, -23);
    ctx.quadraticCurveTo(17, -13, 9, -6); ctx.fill();
    creepyEyes(0, 5);
  }

  function creepyEyes(x, y) {
    ellipse(x - 7, y, 4, 5, "#ffecab");
    ellipse(x + 7, y, 4, 5, "#ffecab");
    ellipse(x - 6, y + 1, 2, 3, "#25222a");
    ellipse(x + 8, y + 1, 2, 3, "#25222a");
  }

  function drawGarbage() {
    roundedFood(-20, -14, 40, 37, 5, "#778b82");
    roundedFood(-23, -19, 46, 7, 3, "#a5b2a1");
    roundedFood(-8, -24, 16, 5, 2, "#a5b2a1");
    for (const x of [-10, 0, 10]) foodLine("#536860", 3, [[x, -7], [x, 16]]);
    ellipse(16, 11, 5, 4, "#819d5a");
  }

  function drawDeadAnimal() {
    ellipse(0, 9, 23, 12, "#9b9380");
    ellipse(-13, 1, 12, 10, "#aaa08d");
    ellipse(-20, -7, 5, 7, "#aaa08d");
    foodLine("#3e3538", 2, [[-19, -1], [-14, 4]]);
    foodLine("#3e3538", 2, [[-14, -1], [-19, 4]]);
    foodLine("#726b64", 4, [[7, 15], [12, 22]]);
    foodLine("#726b64", 4, [[-5, 15], [-2, 22]]);
    foodLine("#726b64", 4, [[20, 8], [28, 4]]);
  }

  function drawHornet() {
    ellipse(-10, -12, 12, 8, "#dcebf0");
    ellipse(10, -12, 12, 8, "#dcebf0");
    ellipse(0, 5, 17, 21, "#e4b645");
    roundedFood(-16, -3, 32, 6, 3, "#443a35");
    roundedFood(-14, 10, 28, 6, 3, "#443a35");
    ellipse(0, -12, 12, 9, "#443a35");
    creepyEyes(0, -13);
    ctx.fillStyle = "#443a35";
    ctx.beginPath(); ctx.moveTo(-5, 23); ctx.lineTo(5, 23); ctx.lineTo(0, 31); ctx.fill();
  }

  function drawSpider() {
    for (const side of [-1, 1]) {
      for (const y of [-7, 0, 7, 14]) {
        foodLine("#171d29", 4, [[side * 9, y], [side * 21, y - 5], [side * 27, y + 3]]);
      }
    }
    ellipse(0, 4, 16, 19, "#262936");
    ellipse(0, -10, 11, 9, "#383443");
    creepyEyes(0, -11);
  }

  function drawGhost() {
    ctx.fillStyle = "#dae9e1";
    ctx.beginPath(); ctx.moveTo(-20, 20); ctx.lineTo(-20, -8);
    ctx.arc(0, -8, 20, Math.PI, 0);
    ctx.lineTo(20, 20); ctx.lineTo(12, 14); ctx.lineTo(5, 21);
    ctx.lineTo(-3, 14); ctx.lineTo(-11, 21); ctx.closePath(); ctx.fill();
    creepyEyes(0, -8);
    ellipse(0, 7, 4, 6, "#4a4b50");
  }

  function drawTeacher() {
    roundedFood(-23, 12, 46, 14, 5, "#715572");
    ellipse(0, -5, 20, 21, "#d4ad92");
    ellipse(0, -21, 21, 10, "#4b4049");
    roundedFood(-21, -16, 42, 8, 4, "#4b4049");
    foodLine("#332e37", 3, [[-16, -11], [-6, -14]]);
    foodLine("#332e37", 3, [[6, -14], [16, -11]]);
    creepyEyes(0, -5);
    foodLine("#593a39", 2, [[-5, 9], [0, 6], [5, 9]]);
    foodLine("#e2b568", 4, [[18, 17], [25, -10]]);
  }

  function drawShark() {
    ellipse(0, 4, 24, 19, "#7699a7");
    ctx.fillStyle = "#7699a7";
    ctx.beginPath(); ctx.moveTo(-9, -13); ctx.lineTo(0, -30); ctx.lineTo(10, -12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-19, 5); ctx.lineTo(-29, -6); ctx.lineTo(-26, 13); ctx.fill();
    ellipse(0, 12, 18, 9, "#e9e9d8");
    ellipse(0, 9, 14, 7, "#3b4149");
    for (const x of [-9, -3, 3, 9]) {
      ctx.fillStyle = "#fff8e6"; ctx.beginPath();
      ctx.moveTo(x - 3, 5); ctx.lineTo(x + 3, 5); ctx.lineTo(x, 10); ctx.fill();
    }
    creepyEyes(0, -5);
  }

  function drawWerewolf() {
    ctx.fillStyle = "#685968";
    ctx.beginPath(); ctx.moveTo(-23, -8); ctx.lineTo(-22, -30); ctx.lineTo(-8, -19);
    ctx.lineTo(8, -19); ctx.lineTo(22, -30); ctx.lineTo(23, -8); ctx.fill();
    ellipse(0, 0, 23, 21, "#685968");
    ellipse(0, 11, 13, 10, "#b2a49b");
    creepyEyes(0, -6);
    ellipse(0, 7, 5, 3, "#302d36");
    foodLine("#f2e8d1", 2, [[-8, 14], [-5, 20], [-2, 14], [2, 14], [5, 20], [8, 14]]);
  }

  function drawZombie() {
    roundedFood(-20, -21, 40, 43, 9, "#93ac79");
    roundedFood(-20, -22, 40, 9, 4, "#555453");
    creepyEyes(0, -7);
    foodLine("#46543f", 3, [[-12, 10], [12, 10]]);
    foodLine("#46543f", 2, [[-5, 6], [-5, 14]]);
    foodLine("#46543f", 2, [[5, 6], [5, 14]]);
  }

  function drawMonsterEye() {
    ellipse(0, 0, 24, 24, "#a48fc4");
    ellipse(0, 0, 17, 17, "#f5eace");
    ellipse(0, 0, 9, 11, "#89b46c");
    ellipse(0, 0, 4, 9, "#25232c");
    ellipse(3, -5, 3, 3, "#fff");
    foodLine("#9e5470", 2, [[-15, -5], [-10, -2]]);
  }

  function drawPoison() {
    roundedFood(-8, -26, 16, 8, 2, "#d3d6af");
    roundedFood(-19, -20, 38, 44, 8, "#76bd80");
    roundedFood(-16, -3, 32, 19, 3, "#d8e7bf");
    ctx.fillStyle = "#435449"; ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("!", 0, 7);
  }

  function drawSkull() {
    ellipse(0, -4, 23, 21, "#e7e2ce");
    roundedFood(-14, 8, 28, 16, 4, "#e7e2ce");
    ellipse(-9, -4, 6, 7, "#413c44");
    ellipse(9, -4, 6, 7, "#413c44");
    ellipse(0, 6, 3, 3, "#413c44");
    for (const x of [-7, 0, 7]) foodLine("#8d8982", 2, [[x, 16], [x, 22]]);
  }

  function drawTombstone() {
    roundedFood(-20, -24, 40, 48, 14, "#a19fa7");
    roundedFood(-23, 19, 46, 7, 2, "#777882");
    foodLine("#5c5b66", 3, [[0, -17], [0, 5]]);
    foodLine("#5c5b66", 3, [[-7, -10], [7, -10]]);
    creepyEyes(0, 11);
  }

  function drawPlayer() {
    const road = roadGeometry();
    const x = playerX();
    const y = road.playerY - 5 + Math.sin(game.elapsed * 10) * 3;
    ctx.save();
    ctx.filter = `brightness(${game.brightness})`;
    drawCreature(x, y, currentForm(), game.size);
    ctx.restore();
  }

  function drawPreviewCreature() {
    const x = game.width * 0.5;
    const y = game.height * 0.72 + Math.sin(performance.now() * 0.002) * 5;
    drawCreature(x, y, STAGES[0].forms[0], 1.1);
  }

  function drawCreature(x, y, form, scale = 1) {
    const bounce = Math.sin(game.elapsed * 11) * 2.5;
    ctx.save();
    ctx.translate(x, y + bounce);
    ctx.scale(scale, scale);
    ellipse(0, 30, 30, 7, "rgba(17, 25, 40, .34)");
    if (form.shape === "egg") drawEgg();
    else if (form.shape === "tadpole") drawTadpole(form.color, false);
    else if (form.shape === "froglet") drawTadpole(form.color, true);
    else if (form.shape === "frog") drawFrog(form.color);
    else if (form.shape === "lizard") drawLizard(form);
    else if (form.shape === "monkey") drawMonkey(form);
    else if (form.shape === "wildcat") drawWildcat(form);
    else if (form.shape === "pigeon") drawPigeon(form.color);
    ctx.restore();
  }

  function drawPigeon(color) {
    ellipse(0, 7, 22, 19, color);
    ellipse(9, 8, 11, 13, "#8395a5");
    ellipse(-5, -12, 16, 15, color);
    ellipse(-9, -15, 5, 6, "#fff8ec");
    ellipse(-10, -15, 2.5, 3.5, "#273140");
    ctx.fillStyle = "#e7a65a";
    ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(-29, -8); ctx.lineTo(-19, -5); ctx.closePath(); ctx.fill();
    foodLine("#d98674", 3, [[-7, 24], [-10, 29]]);
    foodLine("#d98674", 3, [[7, 24], [10, 29]]);
  }

  function ellipse(x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function creatureEyes(x, y, spacing, size) {
    for (const side of [-1, 1]) {
      ellipse(x + side * spacing, y, size, size * 1.08, "#fff9e7");
      ellipse(x + side * spacing + 1, y + 1, size * 0.62, size * 0.78, "#1c2b34");
      ellipse(x + side * spacing + 2, y - size * 0.35, size * 0.22, size * 0.22, "#fff");
    }
  }

  function creatureSmile(y) {
    ctx.strokeStyle = "#513a35";
    ctx.lineWidth = 1.7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-4, y);
    ctx.quadraticCurveTo(0, y + 4, 4, y);
    ctx.stroke();
  }

  function drawEgg() {
    ctx.fillStyle = "#b8ebff";
    ctx.strokeStyle = "#72cce5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.bezierCurveTo(14, -30, 23, -7, 23, 8);
    ctx.bezierCurveTo(23, 34, -23, 34, -23, 8);
    ctx.bezierCurveTo(-23, -7, -14, -30, 0, -30);
    ctx.fill();
    ctx.stroke();
    ellipse(-9, -15, 4, 7, "rgba(255,255,255,.55)");
    creatureEyes(0, 5, 7, 5);
    creatureSmile(15);
  }

  function drawTadpole(color, hasLegs) {
    ctx.fillStyle = "#57bba9";
    ctx.beginPath();
    ctx.moveTo(10, 4);
    ctx.quadraticCurveTo(36, 0, 42, 19 + Math.sin(game.elapsed * 8) * 4);
    ctx.quadraticCurveTo(26, 13, 12, 19);
    ctx.closePath();
    ctx.fill();
    if (hasLegs) {
      ellipse(-18, 19, 9, 5, "#679b44");
      ellipse(14, 20, 9, 5, "#679b44");
    }
    ellipse(-2, 0, 24, 21, color);
    ellipse(-2, 10, 15, 9, "#dbefac");
    creatureEyes(-2, -4, 9, 7);
    creatureSmile(11);
  }

  function drawFrog(color) {
    ellipse(-19, 17, 12, 10, "#66a83c");
    ellipse(19, 17, 12, 10, "#66a83c");
    ellipse(0, 8, 23, 20, color);
    ellipse(0, 14, 14, 11, "#dce89d");
    ellipse(-15, -13, 11, 11, color);
    ellipse(15, -13, 11, 11, color);
    ellipse(0, -6, 25, 15, color);
    creatureEyes(0, -13, 14, 7);
    creatureSmile(4);
    ellipse(-20, 25, 9, 4, color);
    ellipse(20, 25, 9, 4, color);
  }

  function drawLizard(form) {
    ctx.strokeStyle = form.color;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(14, 12);
    ctx.bezierCurveTo(44, 23, 41, -2, 28, 0);
    ctx.stroke();
    if (form.detail >= 2) {
      ctx.fillStyle = "#ee8d42";
      for (let i = 0; i < form.detail + 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-18 + i * 8, -15);
        ctx.lineTo(-13 + i * 8, -28 - (i % 2) * 4);
        ctx.lineTo(-7 + i * 8, -13);
        ctx.closePath();
        ctx.fill();
      }
    }
    ellipse(-12, 16, 10, 9, "#6b9f45");
    ellipse(14, 17, 10, 9, "#6b9f45");
    ellipse(0, 8, 24, 18, form.color);
    ellipse(0, 15, 13, 9, "#f1e4a4");
    if (form.detail >= 1) {
      for (const [x, y] of [[-16, 4], [-12, 13], [14, 6], [18, 14]]) {
        ellipse(x, y, 3, 2, "#5c9b42");
      }
    }
    ellipse(0, -9, 23, 18, form.color);
    creatureEyes(0, -12, 10, 7);
    creatureSmile(1);
    if (form.detail >= 3) {
      ellipse(-17, -19, 4, 3, "#ee8d42");
      ellipse(17, -19, 4, 3, "#ee8d42");
    }
  }

  function drawMonkey(form) {
    ctx.strokeStyle = "#88512f";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(17, 16);
    ctx.bezierCurveTo(43, 26, 43, -4, 30, 2);
    ctx.stroke();
    ellipse(0, 12, 20 + form.detail, 19, form.color);
    ellipse(0, 16, 11, 11, "#e6b07d");
    ellipse(-17, 23, 8, 5, form.color);
    ellipse(17, 23, 8, 5, form.color);
    ellipse(-23, -11, 9, 10, form.color);
    ellipse(23, -11, 9, 10, form.color);
    ellipse(-23, -11, 5, 6, "#e8ac81");
    ellipse(23, -11, 5, 6, "#e8ac81");
    ellipse(0, -13, 23, 21, form.color);
    ellipse(0, -7, 18, 15, "#f2c99e");
    ctx.fillStyle = form.color;
    for (let i = 0; i <= form.detail; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-10 + i * 5, -27);
      ctx.lineTo(-6 + i * 5, -35 - form.detail);
      ctx.lineTo(-2 + i * 5, -27);
      ctx.closePath();
      ctx.fill();
    }
    creatureEyes(0, -11, 7, 5);
    ellipse(0, -2, 3, 2, "#704c3e");
    creatureSmile(3);
  }

  function drawWildcat(form) {
    if (form.detail === 3) {
      ctx.strokeStyle = "rgba(176, 154, 255, .8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 39, 28, -0.5, 0, Math.PI * 2);
      ctx.stroke();
      for (const [x, y] of [[-31, -23], [31, -26], [35, 10], [-34, 12]]) {
        ellipse(x, y, 2, 2, "#fff0a0");
      }
    }
    ctx.strokeStyle = form.color;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(17, 15);
    ctx.bezierCurveTo(42, 26, 40, 0, 30, 4);
    ctx.stroke();
    ellipse(0, 12, 22 + form.detail, 18, form.color);
    ellipse(-16, 24, 8, 5, form.color);
    ellipse(16, 24, 8, 5, form.color);
    ctx.fillStyle = form.color;
    ctx.beginPath();
    ctx.moveTo(-22, -13); ctx.lineTo(-20, -35); ctx.lineTo(-6, -23);
    ctx.lineTo(6, -23); ctx.lineTo(20, -35); ctx.lineTo(22, -13);
    ctx.closePath();
    ctx.fill();
    ellipse(0, -10, 23, 20, form.color);
    ellipse(0, 0, 15, 11, "#f6d8aa");
    ctx.fillStyle = "#8c5734";
    for (const [x, y] of [[-14, 8], [14, 9], [-19, 16], [19, 16], [-15, -18], [15, -18]]) {
      ellipse(x, y, 2 + form.detail * 0.25, 2, "#8c5734");
    }
    creatureEyes(0, -12, 9, 6);
    ellipse(0, -2, 3, 2, "#8c5734");
    creatureSmile(3);
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
    ui.form.textContent = currentForm().name;
    ui.score.textContent = game.score.toLocaleString();
    ui.best.textContent = game.highScore.toLocaleString();
    ui.treats.textContent = String(game.treats);
    ui.distance.textContent = `${Math.floor(game.distance)} m`;
    if (game.stageIndex === STAGES.length - 1) {
      ui.evolutionLabel.textContent = "EVO POINTS";
      ui.evolutionValue.textContent = game.evolutionPoints.toLocaleString();
      ui.evolution.style.width = `${Math.min(100, (game.evolutionPoints / nextEvolutionCost()) * 100)}%`;
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
  ui.pauseButton.addEventListener("click", togglePause);
  ui.resumeButton.addEventListener("click", togglePause);
  document.querySelector("#end-run-button").addEventListener("click", endRun);
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
    if (!event.repeat && (event.key.toLowerCase() === "p" || event.key === "Escape")
      && (game.state === "PLAYING" || game.state === "PAUSED")) {
      event.preventDefault();
      togglePause();
      return;
    }
    if (event.key === "Enter" && (game.state === "START" || game.state === "GAME_OVER")
      && !(event.target instanceof HTMLElement && event.target.closest("button"))) {
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
