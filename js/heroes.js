// ============================================
// HEROES - FIXED (Hero flower states now persist, double deduction fixed)
// ============================================
// ============================================
// HERO SPECIFIC SHARDS INVENTORY SYSTEM
// ============================================
function getHeroesList() {
	if (!window.gameDB || !window.gameDB.Hero || !window.gameDB.Hero.Hero) {
		return [];
	}
	return window.gameDB.Hero.Hero.Heroes || [];
}

function getHeroShardsData() {
	if (!window.gameDB || !window.gameDB.Hero || !window.gameDB.Hero.Hero) {
		return [];
	}
	return window.gameDB.Hero.Hero["Hero Shards"] || [];
}
let heroSpecificShards = {};

function loadHeroShardsFromStorage() {
	const saved = localStorage.getItem("hero_specific_shards");
	if (saved) {
		heroSpecificShards = JSON.parse(saved);
	} else {
		heroSpecificShards = {};
	}
}

function saveHeroShardsToStorage() {
	localStorage.setItem("hero_specific_shards", JSON.stringify(heroSpecificShards));
}

function updateHeroShardInput(heroName, value) {
	let cleanValue = String(value).replace(/-/g, '');
	cleanValue = cleanValue.replace(/[^0-9.]/g, '');
	let numValue = parseFloat(cleanValue) || 0;
	if (numValue < 0) numValue = 0;
	heroSpecificShards[heroName] = numValue;
	saveHeroShardsToStorage();
	refreshCalculations();
}

function validateHeroShardInput(input) {
	let value = input.value.replace(/-/g, '');
	value = value.replace(/[^0-9.]/g, '');
	if (value === '' || isNaN(parseFloat(value))) {
		input.value = '';
	} else {
		input.value = value;
	}
}

function getHeroShardInventory(heroName) {
	return heroSpecificShards[heroName] || 0;
}
// ============================================
// GENERATION FILTER SYSTEM
// ============================================
let selectedMaxGeneration = 7;

function loadGenerationFilterFromStorage() {
	const saved = localStorage.getItem("hero_max_generation");
	if (saved) {
		selectedMaxGeneration = parseInt(saved) || 7;
	} else {
		selectedMaxGeneration = 7;
	}
	const select = document.getElementById('heroGenerationSelect');
	if (select) {
		select.value = selectedMaxGeneration;
	}
}

function saveGenerationFilterToStorage() {
	localStorage.setItem("hero_max_generation", selectedMaxGeneration);
}

function updateGenerationFilter() {
	const select = document.getElementById('heroGenerationSelect');
	if (select) {
		selectedMaxGeneration = parseInt(select.value) || 7;
		saveGenerationFilterToStorage();
	}
	loadHeroes();
}
// ============================================
// HERO SPECIFIC SHARDS CARD UI
// ============================================
function getHeroImageFileName(heroName) {
	const imageMap = {
		'Edwin': 'edwin.webp',
		'Forrest': 'forrest.webp',
		'Olive': 'olive.webp',
		'Seth': 'seth.webp',
		'Amane': 'amane.webp',
		'Chenko': 'chenko.webp',
		'Diana': 'diana.webp',
		'Fahd': 'fahd.webp',
		'Gordon': 'gordon.webp',
		'Howard': 'howard.webp',
		'Quinn': 'quinn.webp',
		'Yeonwoo': 'yeonwoo.webp',
		'Amadeus': 'amadeus.webp',
		'Helga': 'helga.webp',
		'Jabel': 'jabel.webp',
		'Saul': 'saul.webp',
		'Hilde': 'hilde.webp',
		'Marlin': 'marlin.webp',
		'Zoe': 'zoe.webp',
		'Eric': 'eric.webp',
		'Jaeger': 'jaeger.webp',
		'Petra': 'petra.webp',
		'Alcar': 'alcar.webp',
		'Margot': 'margot.webp',
		'Rosa': 'rosa.webp',
		'Long Fei': 'long_fei.webp',
		'Thrud': 'thrud.webp',
		'Vivian': 'vivian.webp',
		'Sophia': 'sophia.webp',
		'Triton': 'triton.webp',
		'Yang': 'yang.webp',
		'Ava': 'ava.webp',
		'Charles': 'charles.webp',
		'Wee & Woo': 'wee_woo.webp'
	};
	const fileName = imageMap[heroName] || heroName.toLowerCase().replace(/ /g, '_') + '.webp';
	return `assets/heroes/${fileName}`;
}

function getFilteredHeroes() {
	const allHeroes = getHeroesList();
	return allHeroes.filter(hero => hero.generation <= selectedMaxGeneration);
}

function createHeroShardsInventoryCard() {
	const heroesList = getFilteredHeroes();
	let heroesHtml = '';
	for (const hero of heroesList) {
		const shardValue = heroSpecificShards[hero.name] || '';
		const imgUrl = getHeroImageFileName(hero.name);
		heroesHtml += `
            <div class="hero-shard-item">
                <img loading="lazy" decoding="async" src="${imgUrl}" onerror="this.style.display='none';" class="hero-shard-img" alt="${hero.name}">
                <span class="hero-shard-name" title="${hero.name}">${hero.name}</span>
                <input type="text" style="text-align: center;" 
                    id="hero_shard_${hero.name.replace(/[^a-zA-Z0-9]/g, '_')}" 
                    class="hero-shard-input" 
                    value="${shardValue}" 
                    placeholder="0"
                    oninput="validateHeroShardInput(this)"
                    onchange="updateHeroShardInput('${hero.name}', this.value)">
            </div>
        `;
	}
	let genOptions = '';
	for (let i = 1; i <= 7; i++) {
		const selected = selectedMaxGeneration === i ? 'selected' : '';
		genOptions += `<option value="${i}" ${selected}>Gen ${i}</option>`;
	}
	return `
        <div class="speedup-buff-card" style="margin-bottom: 20px;">
            <div class="speedup-buff-header">
                <span>HERO SPECIFIC SHARDS INVENTORY</span>
            </div>
            <div class="speedup-buff-body">
                <div class="buff-row">
                    <div class="buff-field">
                        <label>Latest Hero Generation</label>
                        <select id="heroGenerationSelect" onchange="updateGenerationFilter()">
                            ${genOptions}
                        </select>
                        <small>Only shows heroes from Gen 1 to selected generation</small>
                    </div>
                </div>
                <div class="hero-shards-grid" id="heroShardsGrid">
                    ${heroesHtml}
                </div>
            </div>
        </div>
    `;
}
// ============================================
// FLOWER SELECTOR FUNCTIONS
// ============================================
function getHeroLevels(dataArray) {
	if (!dataArray?.length) return [1];
	const levels = new Set();
	for (let i = 0; i < dataArray.length; i++) {
		let lvl = dataArray[i].level ?? dataArray[i].current_lvl ?? dataArray[i].current;
		if (lvl !== undefined && lvl !== 0) levels.add(lvl);
	}
	if (levels.size === 0) return [1];
	return Array.from(levels).sort((a, b) => parseFloat(a) - parseFloat(b));
}

function getHeroTargetLevels(dataArray) {
	if (!dataArray?.length) return [1];
	const levels = new Set();
	for (const item of dataArray) {
		let lvl = item.level ?? item.target_lvl ?? item.target;
		if (lvl !== undefined && lvl !== 0) levels.add(lvl);
	}
	if (levels.size === 0) return [1];
	return Array.from(levels).sort((a, b) => parseFloat(a) - parseFloat(b));
}

function getHeroUpgradeSteps(dataArray, fromLevel, toLevel) {
	const steps = [];
	const fromStr = String(fromLevel);
	const toStr = String(toLevel);

	function normalize(level) {
		const num = parseFloat(level);
		if (isNaN(num)) return String(level);
		return num.toString();
	}
	const normalizedFrom = normalize(fromStr);
	const normalizedTo = normalize(toStr);
	let startIndex = -1;
	let endIndex = -1;
	for (let i = 0; i < dataArray.length; i++) {
		const curr = dataArray[i].current_lvl ?? dataArray[i].current;
		const next = dataArray[i].level ?? dataArray[i].target_lvl ?? dataArray[i].target;
		if (curr !== undefined && normalize(String(curr)) === normalizedFrom) {
			startIndex = i;
		}
		if (next !== undefined && normalize(String(next)) === normalizedTo) {
			endIndex = i;
			break;
		}
	}
	if (startIndex !== -1 && endIndex === -1) {
		const nextMap = {};
		for (const item of dataArray) {
			const curr = item.current_lvl ?? item.current;
			const next = item.level ?? item.target_lvl ?? item.target;
			if (curr !== undefined && next !== undefined) {
				nextMap[normalize(String(curr))] = normalize(String(next));
			}
		}
		let current = normalizedFrom;
		let foundSteps = [];
		let safety = 0;
		const maxSteps = 100;
		while (current !== normalizedTo && safety < maxSteps) {
			const next = nextMap[current];
			if (!next) break;
			const step = dataArray.find(item => {
				const curr = item.current_lvl ?? item.current;
				return curr !== undefined && normalize(String(curr)) === current;
			});
			if (step) {
				foundSteps.push(step);
			}
			current = next;
			safety++;
		}
		if (foundSteps.length > 0 && current === normalizedTo) {
			return foundSteps;
		}
	}
	if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
		for (let i = startIndex; i <= endIndex; i++) {
			steps.push(dataArray[i]);
		}
	}
	return steps;
}

function getHeroNextLevel(dataArray, fromLevel) {
	const allLevels = getHeroTargetLevels(dataArray);
	const currentNum = parseFloat(fromLevel);
	for (const lvl of allLevels) {
		if (parseFloat(lvl) > currentNum) {
			return lvl;
		}
	}
	return null;
}
const FLOWERS_CONFIG = [{
	id: 0,
	values: ["0.1", "0.2", "0.3", "0.4", "0.5", "1.0"]
}, {
	id: 1,
	values: ["1.1", "1.2", "1.3", "1.4", "1.5", "2.0"]
}, {
	id: 2,
	values: ["2.1", "2.2", "2.3", "2.4", "2.5", "3.0"]
}, {
	id: 3,
	values: ["3.1", "3.2", "3.3", "3.4", "3.5", "4.0"]
}, {
	id: 4,
	values: ["4.1", "4.2", "4.3", "4.4", "4.5", "5.0"]
}];

function findAbsoluteIndex(flowerId, petalIndex) {
	let absoluteIdx = 0;
	for (let i = 0; i < flowerId; i++) {
		absoluteIdx += FLOWERS_CONFIG[i].values.length;
	}
	return absoluteIdx + petalIndex;
}
const heroFlowerStates = {};
// ============================================
// CRITICAL FIX: Hero Flower State Persistence
// ============================================
function saveHeroFlowerStates() {
	localStorage.setItem('hero_flower_states', JSON.stringify(heroFlowerStates));
}

function loadHeroFlowerStates() {
	const saved = localStorage.getItem('hero_flower_states');
	if (saved) {
		try {
			const parsed = JSON.parse(saved);
			Object.assign(heroFlowerStates, parsed);
		} catch (e) {}
	}
}

function generateFlowerContainerMarkup(safeId, type) {
	let html = `<div class="flowers-container" data-type="${type}" data-hero="${safeId}">`;
	const petalPath = "M 75,24 L 87.5,51.5 L 75,73 L 62.5,51.5 Z";
	const petalAngles = [0, -60, -120, -180, -240, -300];
	FLOWERS_CONFIG.forEach((flowerData, flowerIdx) => {
		html += `<div class="flower-wrapper"><svg viewBox="0 0 150 150" class="flower-svg">`;
		for (let i = 0; i < flowerData.values.length; i++) {
			const absIdx = findAbsoluteIndex(flowerIdx, i);
			html += `<path class="petal" 
                data-index="${i}" 
                data-value="${flowerData.values[i]}" 
                data-flower-id="${flowerIdx}" 
                data-absolute-index="${absIdx}" 
                style="--rotate: ${petalAngles[i]}deg; transform-origin: 75px 75px;" 
                d="${petalPath}"
                onclick="handleHeroPetalClick(event, '${safeId}', '${type}', ${flowerIdx}, ${i}, '${flowerData.values[i]}', ${absIdx})">
            </path>`;
		}
		html += `<circle class="center-core" cx="75" cy="75" r="4"></circle></svg></div>`;
	});
	html += `</div>`;
	return html;
}

function handleHeroPetalClick(event, safeId, type, flowerId, clickedIndex, clickedValue, absoluteIndex) {
	event.stopPropagation();
	if (!heroFlowerStates[safeId]) {
		heroFlowerStates[safeId] = {
			currentMaxIdx: -1,
			targetMaxIdx: -1
		};
	}
	const currentMaxIdx = heroFlowerStates[safeId].currentMaxIdx;
	if (type === 'targ') {
		const clickedNumeric = parseFloat(clickedValue);
		let currentNumeric = 0;
		if (currentMaxIdx !== -1) {
			let currentCount = 0;
			for (let f = 0; f < FLOWERS_CONFIG.length; f++) {
				const len = FLOWERS_CONFIG[f].values.length;
				if (currentMaxIdx < currentCount + len) {
					currentNumeric = parseFloat(FLOWERS_CONFIG[f].values[currentMaxIdx - currentCount]);
					break;
				}
				currentCount += len;
			}
		}
		if (clickedNumeric < currentNumeric) {
			showNotification(`Target level (${clickedValue}) cannot be lower than current level (${currentNumeric === 0 ? '0' : currentNumeric})`, 'error');
			return;
		}
	}
	const stateKey = type === 'curr' ? 'currentMaxIdx' : 'targetMaxIdx';
	const currentVal = heroFlowerStates[safeId][stateKey];
	if (currentVal === absoluteIndex) {
		heroFlowerStates[safeId][stateKey] = -1;
	} else {
		heroFlowerStates[safeId][stateKey] = absoluteIndex;
	}
	if (type === 'curr' && clickedValue === "5.0") {
		const targetAbsoluteIndex = findAbsoluteIndex(4, 5);
		heroFlowerStates[safeId].targetMaxIdx = targetAbsoluteIndex;
		updateHeroFlowerVisuals(safeId);
	}
	if (type === 'curr') {
		const newCurrentMaxIdx = heroFlowerStates[safeId].currentMaxIdx;
		const newTargetMaxIdx = heroFlowerStates[safeId].targetMaxIdx;
		if (newTargetMaxIdx !== -1 && newCurrentMaxIdx > newTargetMaxIdx) {
			heroFlowerStates[safeId].targetMaxIdx = newCurrentMaxIdx;
			updateHeroFlowerVisuals(safeId);
		}
	}
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	// CRITICAL FIX: Save flower states to localStorage
	saveHeroFlowerStates();
	updateHeroFlowerVisuals(safeId);
	refreshCalculations();
}

function updateHeroFlowerVisuals(safeId) {
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	if (!card) return;
	const state = heroFlowerStates[safeId] || {
		currentMaxIdx: -1,
		targetMaxIdx: -1
	};
	['curr', 'targ'].forEach(type => {
		const container = card.querySelector(`.flowers-container[data-type="${type}"]`);
		if (!container) return;
		const maxIdx = type === 'curr' ? state.currentMaxIdx : state.targetMaxIdx;
		const wrappers = container.querySelectorAll('.flower-wrapper');
		let remainingSelections = maxIdx + 1;
		wrappers.forEach((wrapper, fIdx) => {
			const petals = wrapper.querySelectorAll('.petal');
			const flowerLength = FLOWERS_CONFIG[fIdx].values.length;
			let activeSelectionLimit = -1;
			if (remainingSelections >= flowerLength) {
				activeSelectionLimit = flowerLength - 1;
				remainingSelections -= flowerLength;
			} else if (remainingSelections > 0) {
				activeSelectionLimit = remainingSelections - 1;
				remainingSelections = 0;
			}
			petals.forEach((petal, pIdx) => {
				if (activeSelectionLimit !== -1 && pIdx <= activeSelectionLimit) {
					petal.classList.add('selected');
				} else {
					petal.classList.remove('selected');
				}
			});
		});
	});
}

function getActiveValueFromState(safeId, type) {
	const state = heroFlowerStates[safeId];
	if (!state) return null;
	const maxIdx = type === 'curr' ? state.currentMaxIdx : state.targetMaxIdx;
	if (type === 'curr' && maxIdx === -1) {
		return "0";
	}
	if (type === 'targ' && maxIdx === -1) {
		return null;
	}
	let currentCount = 0;
	for (let f = 0; f < FLOWERS_CONFIG.length; f++) {
		const len = FLOWERS_CONFIG[f].values.length;
		if (maxIdx < currentCount + len) {
			return FLOWERS_CONFIG[f].values[maxIdx - currentCount];
		}
		currentCount += len;
	}
	return null;
}

function createHeroCard(hero, shardData) {
	const safeId = `hero_${hero.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const currentFlowerSlot = generateFlowerContainerMarkup(safeId, 'curr');
	const targetFlowerSlot = generateFlowerContainerMarkup(safeId, 'targ');
	return `<div class="item-card" data-type="hero" data-name="${hero.name}" data-rarity="${hero.rarity}" data-generation="${hero.generation}" data-id="${safeId}">
        <div class="item-card-header">
            <img loading="lazy" decoding="async" src="${getHeroImageFileName(hero.name)}" onerror="this.style.display='none';" style="height: 60px; width: 60px; object-fit: contain;" alt="${hero.name}">
            <span>${hero.name}'s Star Level (Gen ${hero.generation})</span>
        </div>
        <div class="item-card-body">
            <div class="level-controls-flowers">
                <div class="flower-control-block">
                    <span class="control-label">Current Shards:</span>
                    ${currentFlowerSlot}
                </div>
                <div class="flower-control-block">
                    <span class="control-label">Target Shards:</span>
                    ${targetFlowerSlot}
                </div>
            </div>
            <div class="checkbox-group">
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onHeroUpgradeCheckboxChange('${safeId}', this.checked)"> Upgrade</label>
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="general_${safeId}" onchange="onHeroGeneralShardsChange('${safeId}', this.checked)" disabled> General Shards</label>
            </div>
            <div id="status_${safeId}" class="status-pane">Select current & target level (0 = no shards)</div>
        </div>
    </div>`;
}
// ============================================
// CALCULATIONS WITH SHARDS
// ============================================
function getGeneralShardType(rarity) {
	if (rarity === 'SSR') return 'mythic_general_shard';
	if (rarity === 'SR') return 'epic_general_shard';
	if (rarity === 'R') return 'rare_general_shard';
	return 'rare_general_shard';
}

function areGeneralShardsAvailable(heroRarity, vault) {
	const generalShardType = getGeneralShardType(heroRarity);
	const availableShards = vault[generalShardType] || 0;
	return availableShards > 0;
}

function calculateHeroCostsWithShards(hero, shardData, from, to, vault, otherLocked, useGeneralShards) {
	const steps = getHeroUpgradeSteps(shardData, from, to);
	if (!steps.length) return null;
	let stepPoints = 0;
	const costTotals = {};
	let heroShardsNeeded = 0;
	for (const step of steps) {
		if (step.shards) {
			heroShardsNeeded += step.shards;
		}
	}
	const availableHeroShards = getHeroShardInventory(hero.name);
	const heroShardsShortage = Math.max(0, heroShardsNeeded - availableHeroShards);
	let heroShardsUsed = Math.min(availableHeroShards, heroShardsNeeded);
	let generalShardsUsed = useGeneralShards ? heroShardsShortage : 0;
	if (!useGeneralShards && heroShardsShortage > 0) {
		return {
			error: true,
			missingHeroShards: heroShardsShortage,
			stepPoints: 0,
			costTotals: {},
			stepsCount: steps.length,
			heroShardsNeeded: heroShardsNeeded,
			heroShardsAvailable: availableHeroShards
		};
	}
	const generalShardType = getGeneralShardType(hero.rarity);
	const generalShardValue = SCORE_RULES[generalShardType];
	stepPoints += heroShardsUsed * generalShardValue;
	if (heroShardsUsed > 0) {
		costTotals[`${hero.name}_shards`] = heroShardsUsed;
	}
	if (generalShardsUsed > 0) {
		stepPoints += generalShardsUsed * generalShardValue;
		costTotals[generalShardType] = (costTotals[generalShardType] || 0) + generalShardsUsed;
	}
	const keys = ['bread', 'wood', 'stone', 'iron', 'gold', 'truegold', 'tempered_truegold', 'truegold_dust', 'forgehammer', 'widgets', 'mithril', 'satin', 'gilded_threads', 'artisans_vision', 'charm_guide', 'charm_design', 'pet_food', 'growth_manual', 'nutrient_potion', 'promotion_medallion'];
	for (const step of steps) {
		for (const k of keys) {
			if (step[k] !== undefined) {
				const norm = k === 'forgehammer' ? 'forge_hammer' : k;
				costTotals[norm] = (costTotals[norm] || 0) + parseCost(step[k]);
			}
		}
	}
	return {
		stepPoints,
		costTotals,
		stepsCount: steps.length,
		heroShardsNeeded,
		heroShardsAvailable: availableHeroShards,
		heroShardsUsed,
		generalShardsUsed,
		heroShardsShortage
	};
}

function getAchievableTargetLevel(hero, shardData, from, vault, otherLocked, heroShardsAvailable) {
	const allTargetLevels = getHeroTargetLevels(shardData);
	const currentIndex = allTargetLevels.indexOf(parseFloat(from));
	if (currentIndex === -1) return from;
	let bestAchievableLevel = from;
	let bestAchievableLevelValue = parseFloat(from);
	for (let i = allTargetLevels.length - 1; i > currentIndex; i--) {
		const targetLevel = allTargetLevels[i];
		const targetStr = String(targetLevel);
		const steps = getHeroUpgradeSteps(shardData, from, targetStr);
		if (steps.length === 0) continue;
		let heroShardsNeeded = 0;
		for (const step of steps) {
			if (step.shards) heroShardsNeeded += step.shards;
		}
		const heroShardsShortage = Math.max(0, heroShardsNeeded - heroShardsAvailable);
		const generalShardType = getGeneralShardType(hero.rarity);
		const availableGeneralShards = (vault[generalShardType] || 0) - (otherLocked[generalShardType] || 0);
		if (heroShardsShortage <= availableGeneralShards) {
			bestAchievableLevel = targetStr;
			bestAchievableLevelValue = parseFloat(targetStr);
			break;
		}
	}
	return bestAchievableLevel;
}
// ============================================
// CRITICAL FIX: refreshCalculations - Fixed double deduction
// ============================================
function refreshCalculations() {
	let vault = getCurrentVault();
	// Collect ALL locked upgrades
	const totalLocked = {};
	for (const [_, ld] of lockedUpgrades.entries()) {
		for (const [res, amt] of Object.entries(ld.costTotals)) {
			if (!res.startsWith('_')) {
				totalLocked[res] = (totalLocked[res] || 0) + amt;
			}
		}
	}
	let totalScore = 0;
	const cards = document.querySelectorAll('.item-card[data-type="hero"]');
	const shardData = getHeroShardsData();
	for (const card of cards) {
		const hero = {
			name: card.dataset.name,
			rarity: card.dataset.rarity
		};
		const safeId = card.dataset.id;
		const status = document.getElementById(`status_${safeId}`);
		const activeCb = document.getElementById(`active_${safeId}`);
		const generalCb = document.getElementById(`general_${safeId}`);
		if (!status) continue;
		const from = getActiveValueFromState(safeId, 'curr');
		const to = getActiveValueFromState(safeId, 'targ');
		const isLocked = lockedUpgrades.has(safeId);
		const useGeneralShards = generalCb?.checked || false;
		if (activeCb && activeCb.checked !== isLocked) activeCb.checked = isLocked;
		if (!from || !to) {
			status.className = "status-pane";
			if ((!from || from === "0") && !to) {
				status.innerHTML = `Select current AND target level`;
			} else if (!from || from === "0") {
				status.innerHTML = `Select current level first`;
			} else {
				status.innerHTML = `Select target level`;
			}
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			if (generalCb) {
				generalCb.checked = false;
				generalCb.disabled = true;
			}
			continue;
		}
		const currentNumeric = parseFloat(from);
		const targetNumeric = parseFloat(to);
		if (targetNumeric < currentNumeric) {
			status.className = "status-pane status-error";
			status.innerHTML = `Target level (${to}) cannot be lower than current level (${from === "0" ? "0" : from}). Please select a higher target level.`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
				window.clearTimeout(timeoutId);
			}
			if (generalCb) {
				generalCb.checked = false;
				generalCb.disabled = true;
			}
			continue;
		}
		if (String(from) === String(to)) {
			const isMaxLevel = (String(from) === "5.0");
			if (isMaxLevel) {
				status.className = "status-pane status-ok";
				status.innerHTML = `HERO MAXED!`;
			} else {
				status.className = "status-pane status-warning";
				status.innerHTML = `Current and target levels are the same. Select a higher target level.`;
			}
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			if (generalCb) {
				generalCb.checked = false;
				generalCb.disabled = true;
			}
			continue;
		}
		const steps = getHeroUpgradeSteps(shardData, from, to);
		if (steps.length === 0) {
			status.className = "status-pane status-error";
			status.innerHTML = `Cannot upgrade from ${from} to ${to}. No upgrade path found.`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			if (generalCb) {
				generalCb.checked = false;
				generalCb.disabled = true;
			}
			continue;
		}
		let totalHeroShardsNeeded = 0;
		for (const step of steps) {
			if (step.shards) totalHeroShardsNeeded += step.shards;
		}
		const availableHeroShards = getHeroShardInventory(hero.name);
		const hasEnoughHeroShards = availableHeroShards >= totalHeroShardsNeeded;
		const generalShardsAvailable = areGeneralShardsAvailable(hero.rarity, vault);
		const achievableLevel = getAchievableTargetLevel(hero, shardData, from, vault, {}, availableHeroShards);
		const generalShardType = getGeneralShardType(hero.rarity);
		const availableGeneralShards = (vault[generalShardType] || 0);
		if (generalCb) {
			if (hasEnoughHeroShards || !generalShardsAvailable) {
				generalCb.disabled = true;
				generalCb.checked = false;
				generalCb.parentElement.style.opacity = '0.5';
				if (!generalShardsAvailable) {
					generalCb.parentElement.title = `No ${generalShardType.replace(/_/g, ' ')}s available in vault`;
				} else if (hasEnoughHeroShards) {
					generalCb.parentElement.title = `You already have enough ${hero.name} shards`;
				}
			} else {
				generalCb.disabled = false;
				generalCb.parentElement.style.opacity = '1';
				if (parseFloat(achievableLevel) < parseFloat(to)) {
					generalCb.parentElement.title = `With your current ${availableGeneralShards} ${generalShardType.replace(/_/g, ' ')}s, you can only reach level ${achievableLevel}`;
				} else {
					generalCb.parentElement.title = `You have enough general shards to reach level ${to}`;
				}
			}
		}
		if (isLocked) {
			const locked = lockedUpgrades.get(safeId);
			const {
				stepPoints,
				costTotals,
				stepsCount
			} = locked;
			// CRITICAL FIX: Exclude current upgrade from totalLocked
			const otherLocked = {};
			for (const [res, amt] of Object.entries(totalLocked)) {
				const currentAmt = costTotals[res] || 0;
				if (!res.startsWith('_') && amt - currentAmt > 0) {
					otherLocked[res] = amt - currentAmt;
				}
			}
			let costHtml = buildResourceDisplay(costTotals, vault, otherLocked, hero.name);
			const stepsInfo = stepsCount > 1 ? ` (${stepsCount} steps)` : '';
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>ACTIVE${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}</div>`;
			totalScore += stepPoints;
			if (activeCb) activeCb.disabled = false;
			continue;
		}
		const otherLocked = {};
		for (const [res, amt] of Object.entries(totalLocked)) {
			if (!res.startsWith('_')) {
				otherLocked[res] = amt;
			}
		}
		const costs = calculateHeroCostsWithShards(hero, shardData, from, to, vault, otherLocked, useGeneralShards);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `Cannot upgrade from ${from} to ${to}`;
			continue;
		}
		if (costs.error) {
			const achievableLevel2 = getAchievableTargetLevel(hero, shardData, from, vault, otherLocked, availableHeroShards);
			const availableGeneralShards2 = (vault[generalShardType] || 0) - (otherLocked[generalShardType] || 0);
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT HERO SHARDS</strong><br>
                Need ${costs.heroShardsNeeded} ${hero.name} shards, only have ${availableHeroShards}.<br>
                <strong>Tip:</strong> Check "General Shards" to use ${generalShardType.replace(/_/g, ' ')}s as fallback.<br>
                <span style="color: #ff0000;"> With your current ${availableGeneralShards2} ${generalShardType.replace(/_/g, ' ')}s, you can reach up to level ${achievableLevel2}.</span><br>
                <span style="font-size: 0.7rem;">(Current target is ${to})</span>`;
			if (activeCb) activeCb.disabled = true;
			continue;
		}
		const {
			stepPoints,
			costTotals,
			stepsCount,
			heroShardsUsed,
			generalShardsUsed,
			heroShardsNeeded
		} = costs;
		let canAfford = true;
		for (const [res, amt] of Object.entries(costTotals)) {
			if (!res.startsWith('_') && res !== `${hero.name}_shards`) {
				if ((vault[res] || 0) < (otherLocked[res] || 0) + amt) {
					canAfford = false;
					break;
				}
			}
		}
		let costHtml = buildResourceDisplay(costTotals, vault, otherLocked, hero.name);
		const stepsInfo = stepsCount > 1 ? ` (${stepsCount} steps)` : '';
		const generalShardInfo = generalShardsUsed > 0 ? `<div class="resource-tag text-warning">Using ${generalShardsUsed} general ${generalShardType.replace(/_/g, ' ')}s</div>` : '';
		const heroShardInfo = heroShardsUsed > 0 ? `<div class="resource-tag">Using ${heroShardsUsed} of ${heroShardsNeeded} ${hero.name} shards</div>` : '';
		if (activeCb) {
			activeCb.disabled = !canAfford;
			activeCb.parentElement.style.opacity = canAfford ? '1' : '0.5';
		}
		if (canAfford) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${heroShardInfo}${generalShardInfo}${costHtml}</div><br><span class="text-remaining">Click "Upgrade" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${heroShardInfo}${generalShardInfo}${costHtml}</div>`;
		}
	}
	const scoreDisplay = document.getElementById('globalScoreDisplay');
	if (scoreDisplay) {
		scoreDisplay.innerText = totalScore.toLocaleString();
		if (typeof saveCurrentPageScore === 'function') {
			saveCurrentPageScore(totalScore);
		}
	}
}
// ============================================
// UPGRADE AND GENERAL SHARDS HANDLERS
// ============================================
function onHeroUpgradeCheckboxChange(safeId, isChecked) {
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	if (!card) return;
	const hero = {
		name: card.dataset.name,
		rarity: card.dataset.rarity
	};
	if (isChecked) {
		const from = getActiveValueFromState(safeId, 'curr');
		const to = getActiveValueFromState(safeId, 'targ');
		const useGeneralShards = document.getElementById(`general_${safeId}`)?.checked || false;
		if (!from || !to || String(from) === String(to)) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			if (String(from) === "5.0" && String(to) === "5.0") {
				const status = document.getElementById(`status_${safeId}`);
				if (status) {
					status.className = "status-pane status-ok";
					status.innerHTML = `HERO MAXED!`;
				}
			}
			return;
		}
		const vault = getCurrentVault();
		let otherLocked = {};
		for (const [oid, ld] of lockedUpgrades.entries()) {
			if (oid !== safeId) {
				for (const [res, amt] of Object.entries(ld.costTotals)) {
					if (!res.startsWith('_')) {
						otherLocked[res] = (otherLocked[res] || 0) + amt;
					}
				}
			}
		}
		const shardData = getHeroShardsData();
		const costs = calculateHeroCostsWithShards(hero, shardData, from, to, vault, otherLocked, useGeneralShards);
		if (!costs || costs.error) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			refreshCalculations();
			return;
		}
		let canAfford = true;
		for (const [res, amt] of Object.entries(costs.costTotals)) {
			if (!res.startsWith('_')) {
				if (res === `${hero.name}_shards`) {
					const available = getHeroShardInventory(hero.name);
					if (available < amt + (otherLocked[res] || 0)) {
						canAfford = false;
						break;
					}
				} else {
					if ((vault[res] || 0) < (otherLocked[res] || 0) + amt) {
						canAfford = false;
						break;
					}
				}
			}
		}
		if (!canAfford) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			refreshCalculations();
			return;
		}
		lockedUpgrades.set(safeId, {
			costTotals: JSON.parse(JSON.stringify(costs.costTotals)),
			stepPoints: costs.stepPoints,
			stepsCount: costs.stepsCount,
			useGeneralShards: useGeneralShards,
			heroShardsUsed: costs.heroShardsUsed,
			generalShardsUsed: costs.generalShardsUsed
		});
	} else {
		lockedUpgrades.delete(safeId);
	}
	refreshCalculations();
}

function onHeroGeneralShardsChange(safeId, isChecked) {
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	if (!card) return;
	const hero = {
		name: card.dataset.name,
		rarity: card.dataset.rarity
	};
	const from = getActiveValueFromState(safeId, 'curr');
	let to = getActiveValueFromState(safeId, 'targ');
	if (!from || !to) return;
	const vault = getCurrentVault();
	let otherLocked = {};
	for (const [oid, ld] of lockedUpgrades.entries()) {
		if (oid !== safeId) {
			for (const [res, amt] of Object.entries(ld.costTotals)) {
				if (!res.startsWith('_')) {
					otherLocked[res] = (otherLocked[res] || 0) + amt;
				}
			}
		}
	}
	const shardData = getHeroShardsData();
	const availableHeroShards = getHeroShardInventory(hero.name);
	if (isChecked) {
		const achievableLevel = getAchievableTargetLevel(hero, shardData, from, vault, otherLocked, availableHeroShards);
		const achievableNumeric = parseFloat(achievableLevel);
		const targetNumeric = parseFloat(to);
		const generalShardType = getGeneralShardType(hero.rarity);
		const availableGeneralShards = (vault[generalShardType] || 0) - (otherLocked[generalShardType] || 0);
		const stepsToTarget = getHeroUpgradeSteps(shardData, from, to);
		let neededForTarget = 0;
		for (const step of stepsToTarget) {
			if (step.shards) neededForTarget += step.shards;
		}
		const shortageForTarget = Math.max(0, neededForTarget - availableHeroShards);
		const status = document.getElementById(`status_${safeId}`);
		if (achievableNumeric < targetNumeric) {
			let targetAbsoluteIndex = -1;
			let targetFound = false;
			let currentCount = 0;
			for (let f = 0; f < FLOWERS_CONFIG.length; f++) {
				const values = FLOWERS_CONFIG[f].values;
				for (let p = 0; p < values.length; p++) {
					if (parseFloat(values[p]) === achievableNumeric) {
						targetAbsoluteIndex = currentCount + p;
						targetFound = true;
						break;
					}
				}
				if (targetFound) break;
				currentCount += values.length;
			}
			if (targetFound && targetAbsoluteIndex !== -1) {
				if (!heroFlowerStates[safeId]) {
					heroFlowerStates[safeId] = {
						currentMaxIdx: -1,
						targetMaxIdx: -1
					};
				}
				heroFlowerStates[safeId].targetMaxIdx = targetAbsoluteIndex;
				updateHeroFlowerVisuals(safeId);
				saveHeroFlowerStates();
				to = achievableLevel;
				if (status) {
					status.className = "status-pane status-warning";
					status.innerHTML = `TARGET AUTO-ADJUSTED<br>
                        <strong>Original target: ${targetNumeric} New target: ${achievableLevel}</strong><br>
                        Not enough ${generalShardType.replace(/_/g, ' ')}s to reach ${targetNumeric}.<br>
                        Available ${generalShardType.replace(/_/g, ' ')}s: ${availableGeneralShards}<br>
                        Shortage for ${targetNumeric}: ${shortageForTarget} ${generalShardType.replace(/_/g, ' ')}s<br>
                        <span style="font-size: 0.7rem;">Target has been automatically reduced. Click "Upgrade" to lock.</span>`;
					setTimeout(() => {
						if (status.className === "status-pane status-warning") {
							refreshCalculations();
						}
					}, 6000);
				}
			}
		} else if (shortageForTarget > availableGeneralShards && availableGeneralShards > 0) {
			if (status) {
				status.className = "status-pane status-warning";
				status.innerHTML = `INSUFFICIENT GENERAL SHARDS<br>
                    Need ${shortageForTarget} ${generalShardType.replace(/_/g, ' ')}s, only have ${availableGeneralShards}.<br>
                    Please select a lower target level.`;
				setTimeout(() => {
					if (status.className === "status-pane status-warning") {
						refreshCalculations();
					}
				}, 4000);
			}
		} else if (shortageForTarget > 0 && shortageForTarget <= availableGeneralShards) {
			if (status) {
				status.className = "status-pane status-ok";
				status.innerHTML = `Using ${shortageForTarget} ${generalShardType.replace(/_/g, ' ')}s as fallback.<br>
                    Available: ${availableGeneralShards} ${generalShardType.replace(/_/g, ' ')}s<br>
                    <span style="font-size: 0.7rem;">Click "Upgrade" to lock.</span>`;
				setTimeout(() => {
					refreshCalculations();
				}, 3000);
			}
		}
		if (availableGeneralShards <= 0) {
			const generalCb = document.getElementById(`general_${safeId}`);
			if (generalCb) {
				generalCb.checked = false;
				generalCb.disabled = true;
			}
			if (status) {
				status.className = "status-pane status-error";
				status.innerHTML = `No ${generalShardType.replace(/_/g, ' ')}s available in vault!`;
			}
			return;
		}
	}
	const costs = calculateHeroCostsWithShards(hero, shardData, from, to, vault, otherLocked, isChecked);
	if (costs && !costs.error) {
		if (lockedUpgrades.has(safeId)) {
			lockedUpgrades.set(safeId, {
				costTotals: JSON.parse(JSON.stringify(costs.costTotals)),
				stepPoints: costs.stepPoints,
				stepsCount: costs.stepsCount,
				useGeneralShards: isChecked,
				heroShardsUsed: costs.heroShardsUsed,
				generalShardsUsed: costs.generalShardsUsed
			});
		}
	}
	refreshCalculations();
}
// ============================================
// LOAD HEROES
// ============================================
function loadHeroes() {
	const inventoryContainer = document.getElementById('heroInventoryContainer');
	const heroesGridContainer = document.getElementById('heroesGrid');
	if (!inventoryContainer || !heroesGridContainer) return;
	loadHeroShardsFromStorage();
	loadGenerationFilterFromStorage();
	loadHeroFlowerStates();
	inventoryContainer.innerHTML = '';
	heroesGridContainer.innerHTML = '';
	inventoryContainer.innerHTML = createHeroShardsInventoryCard();
	const heroes = getFilteredHeroes();
	const shardData = getHeroShardsData();
	let heroesHtml = '';
	for (const hero of heroes) {
		heroesHtml += createHeroCard(hero, shardData);
		const safeId = `hero_${hero.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
		if (!heroFlowerStates[safeId]) {
			heroFlowerStates[safeId] = {
				currentMaxIdx: -1,
				targetMaxIdx: -1
			};
		}
	}
	heroesGridContainer.innerHTML = heroesHtml;
	// Restore selections
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.heroFlowerStates) {
		for (const [safeId, state] of Object.entries(preset.heroFlowerStates)) {
			if (heroFlowerStates[safeId]) {
				heroFlowerStates[safeId].currentMaxIdx = state.currentMaxIdx !== undefined ? state.currentMaxIdx : -1;
				heroFlowerStates[safeId].targetMaxIdx = state.targetMaxIdx !== undefined ? state.targetMaxIdx : -1;
			}
		}
		saveHeroFlowerStates();
	}
	if (preset && preset.heroSpecificShards) {
		for (const [heroName, shards] of Object.entries(preset.heroSpecificShards)) {
			heroSpecificShards[heroName] = shards;
		}
		document.querySelectorAll('.hero-shard-input[id^="hero_shard_"]').forEach(input => {
			const heroName = input.id.replace('hero_shard_', '').replace(/_/g, ' ');
			if (heroSpecificShards[heroName] !== undefined) {
				input.value = heroSpecificShards[heroName];
			}
		});
		saveHeroShardsToStorage();
	}
	for (const [safeId, data] of lockedUpgrades.entries()) {
		if (safeId.startsWith('hero_')) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = true;
			const generalCb = document.getElementById(`general_${safeId}`);
			if (generalCb && data.useGeneralShards) generalCb.checked = true;
		}
	}
	Object.keys(heroFlowerStates).forEach(id => updateHeroFlowerVisuals(id));
	refreshCalculations();
}
// ============================================
// EXPORTS
// ============================================
window.heroSpecificShards = heroSpecificShards;
window.heroFlowerStates = heroFlowerStates;
window.updateHeroShardInput = updateHeroShardInput;
window.loadHeroShardsFromStorage = loadHeroShardsFromStorage;
window.saveHeroShardsToStorage = saveHeroShardsToStorage;
window.getHeroShardInventory = getHeroShardInventory;
window.loadGenerationFilterFromStorage = loadGenerationFilterFromStorage;
window.saveGenerationFilterToStorage = saveGenerationFilterToStorage;
window.updateGenerationFilter = updateGenerationFilter;
window.onHeroGeneralShardsChange = onHeroGeneralShardsChange;
window.loadHeroes = loadHeroes;
window.validateHeroShardInput = validateHeroShardInput;
window.refreshCalculations = refreshCalculations;
window.onHeroUpgradeCheckboxChange = onHeroUpgradeCheckboxChange;
window.handleHeroPetalClick = handleHeroPetalClick;
window.updateHeroFlowerVisuals = updateHeroFlowerVisuals;
window.saveHeroFlowerStates = saveHeroFlowerStates;
window.loadHeroFlowerStates = loadHeroFlowerStates;
