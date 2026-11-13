"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadGame(random = Math.random) {
  const elements = new Map();
  const context2d = new Proxy({}, {
    get(target, property) {
      if (property === "createLinearGradient" || property === "createRadialGradient") {
        return () => ({ addColorStop() {} });
      }
      return target[property] || (() => {});
    }
  });
  function element(selector) {
    if (!elements.has(selector)) {
      elements.set(selector, {
        textContent: "",
        style: {},
        classList: { add() {}, remove() {} },
        addEventListener() {},
        setAttribute() {},
        focus() {},
        getBoundingClientRect: () => ({ width: 390, height: 844 }),
        getContext: () => context2d
      });
    }
    return elements.get(selector);
  }
  const document = {
    querySelector: element,
    body: element("body"),
    addEventListener() {},
    hidden: false
  };
  const window = {
    devicePixelRatio: 1,
    addEventListener() {},
    requestAnimationFrame() {},
    setTimeout() {}
  };
  const sandbox = {
    document, window, navigator: {}, location: { protocol: "file:" },
    localStorage: { getItem: () => null, setItem() {} },
    performance: { now: () => 0 },
    Math: Object.assign(Object.create(Math), { random }),
    console
  };
  const source = fs.readFileSync(path.join(__dirname, "..", "game.js"), "utf8");
  const instrumented = source.replace(/\}\)\(\);\s*$/, `
    globalThis.testGame = { game, STAGES, TREATS, HAZARDS, ANIMALS, PIGEON, formIndex, currentForm, addEvolutionPoints, startRun, endRun, togglePause, update, moveLane, damage, drawCreature, drawHazard, syncHud, makeEntity, collect, spawnWave };
  })();`);
  assert.notEqual(instrumented, source, "game test instrumentation was not inserted");
  vm.runInNewContext(instrumented, sandbox);
  return { ...sandbox.testGame, elements };
}

test("each stage unlocks its four forms at quarter thresholds", () => {
  const { STAGES, formIndex } = loadGame();
  for (let stage = 0; stage < STAGES.length; stage += 1) {
    const cost = 100 * (2 ** stage);
    assert.equal(STAGES[stage].forms.length, 4);
    for (let form = 0; form < 4; form += 1) {
      const threshold = cost * form / 4;
      assert.equal(formIndex(stage, threshold), form);
      if (form > 0) assert.equal(formIndex(stage, threshold - 1), form - 1);
    }
    assert.equal(formIndex(stage, cost * 10), 3);
  }
});

test("major evolutions reset points and discard excess from large rewards", () => {
  const { game, currentForm, addEvolutionPoints, startRun } = loadGame();
  startRun();
  addEvolutionPoints(75);
  assert.equal(currentForm().name, "Frog");
  addEvolutionPoints(2500);
  assert.equal(game.stageIndex, 1);
  assert.equal(game.evolutionPoints, 0);
  assert.equal(currentForm().name, "Little Lizard");
  addEvolutionPoints(200);
  assert.equal(game.stageIndex, 2);
  addEvolutionPoints(400);
  assert.equal(game.stageIndex, 3);
  assert.equal(currentForm().name, "Wildcat Cub");
});

test("final stage unlocks mini forms at 200, 400, and 600 while points accumulate", () => {
  const { game, currentForm, addEvolutionPoints, startRun, elements } = loadGame();
  startRun();
  addEvolutionPoints(100);
  addEvolutionPoints(200);
  addEvolutionPoints(400);
  for (const [amount, expected] of [[199, "Wildcat Cub"], [1, "Spotted Wildcat"], [200, "Elder Wildcat"], [200, "Cosmic Wildcat"]]) {
    addEvolutionPoints(amount);
    assert.equal(currentForm().name, expected);
  }
  addEvolutionPoints(2500);
  assert.equal(game.stageIndex, 3);
  assert.equal(game.evolutionPoints, 3100);
  assert.equal(elements.get("#evolution-value").textContent, "3,100");
  assert.equal(elements.get("#evolution-fill").style.width, "100%");
});

test("damage preserves the current form and a new run resets it", () => {
  const { game, currentForm, addEvolutionPoints, startRun, damage } = loadGame();
  startRun();
  addEvolutionPoints(50);
  damage({ kind: "obstacle", x: 0, y: 0 });
  assert.equal(game.evolutionPoints, 50);
  assert.equal(currentForm().name, "Froglet");
  startRun();
  assert.equal(game.stageIndex, 0);
  assert.equal(game.evolutionPoints, 0);
  assert.equal(currentForm().name, "Little Egg");
});

test("every configured creature form renders without error", () => {
  const { STAGES, drawCreature } = loadGame();
  for (const stage of STAGES) {
    for (const form of stage.forms) {
      assert.doesNotThrow(() => drawCreature(100, 100, form));
    }
  }
});

test("every treat variety can spawn, render, and award 25 points", () => {
  const { TREATS } = loadGame();
  assert.equal(TREATS.length, 16);
  assert.equal(new Set(TREATS.map((treat) => treat.name)).size, TREATS.length);
  for (let index = 0; index < TREATS.length; index += 1) {
    const { game, startRun, makeEntity, collect } = loadGame(() => (index + 0.5) / TREATS.length);
    startRun();
    const treat = makeEntity("treat", 1);
    assert.equal(treat.treat.name, TREATS[index].name);
    assert.doesNotThrow(() => treat.treat.draw());
    collect(treat);
    assert.equal(game.treats, 1);
    assert.equal(game.evolutionPoints, 25);
    assert.equal(game.score, 100);
    assert.ok(game.size > 1);
    assert.ok(game.brightness > 1);
  }
});

test("spawned treats stay in a safe lane and special rewards retain their types", () => {
  const { game, startRun, spawnWave, makeEntity } = loadGame(() => 0);
  startRun();
  spawnWave();
  const hazard = game.entities.find((entity) => entity.kind === "deadly");
  const treat = game.entities.find((entity) => entity.kind === "treat");
  assert.ok(hazard);
  assert.ok(treat);
  assert.notEqual(hazard.lane, treat.lane);
  assert.ok(treat.treat);
  assert.equal(game.entities.find((entity) => entity.kind === "transform").treat, null);
  assert.equal(makeEntity("mega", 0).treat, null);
  assert.equal(makeEntity("mystery", 0).treat, null);
});

test("each hazard renders and changes size and shade without ending the run", () => {
  const { HAZARDS } = loadGame();
  for (const [kind, hazards] of Object.entries(HAZARDS)) {
    assert.ok(hazards.length > 1);
    for (let index = 0; index < hazards.length; index += 1) {
      const { game, makeEntity, startRun, damage, drawHazard } = loadGame(() => (index + 0.5) / hazards.length);
      startRun();
      const entity = makeEntity(kind, 1);
      assert.equal(entity.hazard.name, hazards[index].name);
      assert.doesNotThrow(() => drawHazard(entity));
      damage(entity);
      assert.ok(game.size < 1);
      assert.ok(game.brightness < 1);
      assert.equal(game.state, "PLAYING");
      assert.equal(game.transformedForm === null ? null : game.transformedForm.name, kind === "deadly" ? "Pigeon" : null);
    }
  }
});

test("red signs transform into a pigeon and plus transforms into a persistent animal", () => {
  const { game, makeEntity, startRun, damage, collect, currentForm, addEvolutionPoints, ANIMALS } = loadGame(() => 0);
  startRun();
  damage(makeEntity("deadly", 1));
  assert.equal(currentForm().name, "Pigeon");
  addEvolutionPoints(100);
  assert.equal(game.stageIndex, 1);
  assert.equal(currentForm().name, "Pigeon");
  collect(makeEntity("transform", 1));
  assert.equal(currentForm().name, ANIMALS[0].name);
  addEvolutionPoints(200);
  assert.equal(currentForm().name, ANIMALS[0].name);
  collect(makeEntity("transform", 1));
  assert.notEqual(currentForm().name, ANIMALS[0].name);
  damage(makeEntity("deadly", 1));
  assert.equal(currentForm().name, "Pigeon");
  startRun();
  assert.equal(currentForm().name, "Little Egg");
  assert.equal(game.size, 1);
  assert.equal(game.brightness, 1);
});

test("size and brightness stay within bounds during repeated hits", () => {
  const { game, startRun, makeEntity, damage, collect, drawCreature, PIGEON, ANIMALS } = loadGame();
  startRun();
  for (let i = 0; i < 100; i += 1) damage(makeEntity("obstacle", 1));
  assert.equal(game.size, 0.6);
  assert.equal(game.brightness, 0.55);
  for (let i = 0; i < 100; i += 1) collect(makeEntity("treat", 1));
  assert.equal(game.size, 1.6);
  assert.equal(game.brightness, 1.5);
  for (const form of [PIGEON, ...ANIMALS]) assert.doesNotThrow(() => drawCreature(0, 0, form));
});

test("pause freezes the run and resume continues without resetting progress", () => {
  const { game, startRun, togglePause, update, moveLane, makeEntity, addEvolutionPoints } = loadGame();
  startRun();
  addEvolutionPoints(25);
  const entity = makeEntity("obstacle", 0);
  game.entities.push(entity);
  update(0.5);
  togglePause();
  const snapshot = {
    elapsed: game.elapsed, distance: game.distance, size: game.size,
    spawnTimer: game.spawnTimer, remaining: entity.remaining,
    points: game.evolutionPoints, lane: game.lane
  };
  update(10);
  moveLane(-1);
  assert.equal(game.state, "PAUSED");
  assert.deepEqual({
    elapsed: game.elapsed, distance: game.distance, size: game.size,
    spawnTimer: game.spawnTimer, remaining: entity.remaining,
    points: game.evolutionPoints, lane: game.lane
  }, snapshot);
  togglePause();
  assert.equal(game.state, "PLAYING");
  assert.equal(game.lastFrame, 0);
  update(0.5);
  assert.ok(game.distance > snapshot.distance);
  assert.equal(game.evolutionPoints, snapshot.points);
  assert.ok(entity.remaining < snapshot.remaining);
});

test("pause has no effect on start and game-over screens", () => {
  const { game, startRun, togglePause, endRun } = loadGame();
  togglePause();
  assert.equal(game.state, "START");
  startRun();
  togglePause();
  endRun();
  togglePause();
  assert.equal(game.state, "GAME_OVER");
});
