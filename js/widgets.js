// ============================================
// WIDGETS - FIXED (Removed vault widget dependency)
// ============================================
function getSSRHeroes() {
	if (!window.gameDB || !window.gameDB.Hero || !window.gameDB.Hero.Hero) {
		return [];
	}
	const heroes = window.gameDB.Hero.Hero.Heroes || [];
	return heroes.filter(hero => hero.rarity === 'SSR');
}

function getWidgetsData() {
	return window.gameDB.Widgets?.Widgets || [];
}
let heroWidgetQuantities = {};

function loadHeroWidgetsFromStorage() {
	const saved = localStorage.getItem("hero_widget_quantities");
	if (saved) {
		heroWidgetQuantities = JSON.parse(saved);
	} else {
		heroWidgetQuantities = {};
	}
}

function saveHeroWidgetsToStorage() {
	localStorage.setItem("hero_widget_quantities", JSON.stringify(heroWidgetQuantities));
}

function updateHeroWidgetInput(heroName, value) {
	let cleanValue = String(value).replace(/-/g, '');
	cleanValue = cleanValue.replace(/[^0-9.]/g, '');
	let numValue = parseFloat(cleanValue) || 0;
	if (numValue < 0) numValue = 0;
	heroWidgetQuantities[heroName] = numValue;
	saveHeroWidgetsToStorage();
	refreshCalculations();
}

function validateHeroWidgetInput(input) {
	let value = input.value.replace(/-/g, '');
	value = value.replace(/[^0-9.]/g, '');
	if (value === '' || isNaN(parseFloat(value))) {
		input.value = '';
	} else {
		input.value = value;
	}
}

function getHeroWidgetInventory(heroName) {
	return heroWidgetQuantities[heroName] || 0;
}

function getHeroImageFileName(heroName) {
	const imageMap = {
		'Amadeus': 'amadeus_widget.webp',
		'Helga': 'helga_widget.webp',
		'Jabel': 'jabel_widget.webp',
		'Saul': 'saul_widget.webp',
		'Hilde': 'hilde_widget.webp',
		'Marlin': 'marlin_widget.webp',
		'Zoe': 'zoe_widget.webp',
		'Eric': 'eric_widget.webp',
		'Jaeger': 'jaeger_widget.webp',
		'Petra': 'petra_widget.webp',
		'Alcar': 'alcar_widget.webp',
		'Margot': 'margot_widget.webp',
		'Rosa': 'rosa_widget.webp',
		'Long Fei': 'long_fei_widget.webp',
		'Thrud': 'thrud_widget.webp',
		'Vivian': 'vivian_widget.webp',
		'Sophia': 'sophia_widget.webp',
		'Triton': 'triton_widget.webp',
		'Yang': 'yang_widget.webp',
		'Ava': 'ava_widget.webp',
		'Charles': 'charles_widget.webp',
		'Wee & Woo': 'wee_woo_widget.webp'
	};
	const fileName = imageMap[heroName] || heroName.toLowerCase().replace(/ /g, '_') + '.webp';
	return `assets/widget/${fileName}`;
}

function createWidgetInventoryCard() {
	const ssrHeroes = getSSRHeroes();
	let heroesHtml = '';
	for (const hero of ssrHeroes) {
		const widgetValue = heroWidgetQuantities[hero.name] || '';
		const imgUrl = getHeroImageFileName(hero.name);
		heroesHtml += `
            <div class="hero-shard-item">
                <img loading="lazy" decoding="async" src="${imgUrl}" onerror="this.style.display='none';" class="hero-shard-img" alt="${hero.name}">
                <span class="hero-shard-name" title="${hero.name}">${hero.name}</span>
                <input type="text" style="text-align: center;" 
                    id="hero_widget_${hero.name.replace(/[^a-zA-Z0-9]/g, '_')}" 
                    class="hero-shard-input" 
                    value="${widgetValue}" 
                    placeholder="0"
                    oninput="validateHeroWidgetInput(this)"
                    onchange="updateHeroWidgetInput('${hero.name}', this.value)">
            </div>
        `;
	}
	return `
        <div class="speedup-buff-card" style="margin-bottom: 20px;">
            <div class="speedup-buff-header">
                <span>SSR HERO WIDGET INVENTORY</span>
            </div>
            <div class="speedup-buff-body">
                <div class="buff-row">
                    <div class="buff-field">
                        <label>SSR Heroes Only</label>
                        <small>Enter your hero-specific widget counts here. Widgets are hero-specific only.</small>
                    </div>
                </div>
                <div class="hero-shards-grid" id="heroWidgetsGrid">
                    ${heroesHtml}
                </div>
            </div>
        </div>
    `;
}

function getWidgetLevels(dataArray) {
	if (!dataArray?.length) return [0];
	const levels = new Set();
	levels.add(0);
	for (let i = 0; i < dataArray.length; i++) {
		let lvl = dataArray[i].level ?? dataArray[i].current_lvl ?? dataArray[i].current;
		if (lvl !== undefined && lvl !== 0) levels.add(lvl);
	}
	return Array.from(levels).sort((a, b) => parseFloat(a) - parseFloat(b));
}

function getWidgetTargetLevels(dataArray) {
	if (!dataArray?.length) return [];
	const levels = new Set();
	for (const item of dataArray) {
		let lvl = item.level ?? item.target_lvl ?? item.target;
		if (lvl !== undefined && lvl !== 0) levels.add(lvl);
	}
	return Array.from(levels).sort((a, b) => parseFloat(a) - parseFloat(b));
}

function getWidgetUpgradeSteps(dataArray, fromLevel, toLevel) {
	const steps = [];
	const fromStr = String(fromLevel);
	const toStr = String(toLevel);
	if (fromStr === '0') {
		for (const item of dataArray) {
			let lvl = item.level ?? item.target_lvl ?? item.target;
			if (lvl !== undefined && lvl !== 0) {
				steps.push(item);
				if (String(lvl) === toStr) break;
			}
		}
		return steps;
	}
	let start = -1,
		end = -1;
	for (let i = 0; i < dataArray.length; i++) {
		let lvl = dataArray[i].level ?? dataArray[i].target_lvl ?? dataArray[i].target;
		if (lvl !== undefined && lvl !== 0 && String(lvl) === fromStr) start = i;
		if (lvl !== undefined && lvl !== 0 && String(lvl) === toStr) end = i;
	}
	if (start !== -1 && end !== -1 && start < end) {
		for (let i = start + 1; i <= end; i++) steps.push(dataArray[i]);
		return steps;
	}
	return steps;
}

function getWidgetNextLevel(dataArray, fromLevel) {
	const allLevels = getWidgetTargetLevels(dataArray);
	const currentNum = parseFloat(fromLevel);
	for (const lvl of allLevels) {
		if (parseFloat(lvl) > currentNum) {
			return lvl;
		}
	}
	return null;
}

function createWidgetCard(heroName, dataArray) {
	if (!dataArray?.length) return '';
	const fromLevels = getWidgetLevels(dataArray);
	const toLevels = getWidgetTargetLevels(dataArray);
	const safeId = `widgets_${heroName.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	const imgUrl = getHeroImageFileName(heroName);
	const currOpts = buildLevelOptions(fromLevels, 'Current Level', highestLevel, '');
	const targOpts = buildLevelOptions(toLevels, 'Target Level', highestLevel, '');
	return `<div class="item-card" data-type="widgets" data-hero="${heroName}" data-id="${safeId}">
        <div class="item-card-header">
            <img loading="lazy" decoding="async" src="${imgUrl}" onerror="this.style.display='none';" style="height: 60px; width: 60px; object-fit: contain;" alt="${heroName}">
            <span>${heroName}'s Exclusive Widget</span>
        </div>
        <div class="item-card-body">
            <div class="level-controls">
                <select id="curr_${safeId}" onchange="onWidgetCurrentSelect('${safeId}')">${currOpts}</select>
                <select id="targ_${safeId}" onchange="onWidgetTargetChange('${safeId}')">${targOpts}</select>
            </div>
            <div class="checkbox-group">
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onWidgetUpgradeCheckboxChange('${safeId}', this.checked)"> Upgrade</label>
            </div>
            <div id="status_${safeId}" class="status-pane">Select current & target level</div>
        </div>
    </div>`;
}

function calculateWidgetCosts(heroName, dataArray, from, to, vault, otherLocked) {
	let actualFrom = from;
	let actualTo = to;
	const toLevels = getWidgetTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
	if (from === 'max') actualFrom = highestLevel;
	if (to === 'max') actualTo = highestLevel;
	if (String(actualFrom) === String(actualTo)) return null;
	const steps = getWidgetUpgradeSteps(dataArray, actualFrom, actualTo);
	if (!steps.length) return null;
	let stepPoints = 0;
	const costTotals = {};
	let widgetsNeeded = 0;
	for (const step of steps) {
		if (step.widgets) {
			const widgetCost = parseCost(step.widgets);
			widgetsNeeded += widgetCost;
			stepPoints += widgetCost * SCORE_RULES.widgets;
		}
		// Check for other resources (some widget upgrades might need other resources too)
		const keys = ['bread', 'wood', 'stone', 'iron', 'gold', 'truegold', 'tempered_truegold', 'truegold_dust', 'forgehammer', 'mithril', 'satin', 'gilded_threads', 'artisans_vision', 'charm_guide', 'charm_design', 'pet_food', 'growth_manual', 'nutrient_potion', 'promotion_medallion'];
		for (const k of keys) {
			if (step[k] !== undefined) {
				const norm = k === 'forgehammer' ? 'forge_hammer' : k;
				costTotals[norm] = (costTotals[norm] || 0) + parseCost(step[k]);
			}
		}
	}
	// Get hero-specific widget inventory
	const heroWidgetsAvailable = getHeroWidgetInventory(heroName);
	if (heroWidgetsAvailable >= widgetsNeeded) {
		// User has enough hero-specific widgets
		costTotals[`${heroName}_widgets`] = widgetsNeeded;
	} else if (heroWidgetsAvailable > 0) {
		// User has some hero-specific widgets but not enough - can't proceed without more
		const partialWidgets = heroWidgetsAvailable;
		costTotals[`${heroName}_widgets`] = partialWidgets;
		costTotals._widgetStatus = {
			partial: true,
			shortage: widgetsNeeded - partialWidgets,
			hasWidgets: true,
			enoughWidgets: false
		};
	} else {
		// No hero-specific widgets available
		costTotals._widgetStatus = {
			partial: false,
			shortage: widgetsNeeded,
			hasWidgets: false,
			enoughWidgets: false
		};
	}
	return {
		stepPoints,
		costTotals,
		stepsCount: steps.length,
		widgetsNeeded,
		heroWidgetsAvailable,
		actualTo: actualTo,
		actualFrom: actualFrom,
		widgetStatus: costTotals._widgetStatus || null
	};
}
// ============================================
// CRITICAL FIX: refreshCalculations - Removed vault widget dependency
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
	const cards = document.querySelectorAll('.item-card[data-type="widgets"]');
	const dataArray = getWidgetsData();
	for (const card of cards) {
		const heroName = card.dataset.hero;
		const safeId = card.dataset.id;
		const curr = document.getElementById(`curr_${safeId}`);
		const targ = document.getElementById(`targ_${safeId}`);
		const status = document.getElementById(`status_${safeId}`);
		const activeCb = document.getElementById(`active_${safeId}`);
		if (!curr || !targ || !status) continue;
		const from = curr.value;
		const to = targ.value;
		const isLocked = lockedUpgrades.has(safeId);
		if (activeCb && activeCb.checked !== isLocked) activeCb.checked = isLocked;
		const toLevels = getWidgetTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
		if (!from || from === '' || !to || to === '') {
			status.className = "status-pane";
			status.innerHTML = `Select current & target level`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			continue;
		}
		const isAtMax = highestLevel && String(from) === String(highestLevel);
		if (isAtMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>WIDGET MAXED!</strong><br>Already at highest level (${highestLevel})`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			continue;
		}
		if (String(from) === String(to)) {
			status.className = "status-pane status-warning";
			status.innerHTML = `Current and target levels are the same. Select a higher target level.`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			continue;
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
			let costHtml = buildResourceDisplay(costTotals, vault, otherLocked, heroName);
			const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
			const widgetStatus = costTotals._widgetStatus;
			let statusNote = '';
			if (widgetStatus) {
				if (widgetStatus.partial) {
					statusNote = `<div class="resource-tag text-warning">Partial upgrade - ${widgetStatus.shortage} more ${heroName} widgets needed</div>`;
				} else if (!widgetStatus.hasWidgets) {
					statusNote = `<div class="resource-tag text-warning">No ${heroName} widgets available! Need ${widgetStatus.shortage}</div>`;
				}
			}
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>ACTIVE${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}</div>${statusNote}`;
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
		const costs = calculateWidgetCosts(heroName, dataArray, from, to, vault, otherLocked);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `Cannot upgrade from ${from} to ${to}`;
			continue;
		}
		const {
			stepPoints,
			costTotals,
			stepsCount,
			widgetsNeeded,
			heroWidgetsAvailable,
			actualTo,
			widgetStatus
		} = costs;
		let canAfford = true;
		for (const [res, amt] of Object.entries(costTotals)) {
			if (!res.startsWith('_') && res !== `${heroName}_widgets`) {
				if ((vault[res] || 0) < (otherLocked[res] || 0) + amt) {
					canAfford = false;
					break;
				}
			}
		}
		const hasEnoughWidgets = heroWidgetsAvailable >= widgetsNeeded;
		const hasSomeWidgets = heroWidgetsAvailable > 0;
		let costHtml = buildResourceDisplay(costTotals, vault, otherLocked, heroName);
		const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
		let widgetNote = '';
		if (!hasEnoughWidgets && hasSomeWidgets) {
			widgetNote = `<div class="resource-tag text-warning">Need ${widgetsNeeded} widgets, only have ${heroWidgetsAvailable} (${widgetsNeeded - heroWidgetsAvailable} short)</div>`;
		} else if (!hasSomeWidgets) {
			widgetNote = `<div class="resource-tag text-warning">No ${heroName} widgets available! Need ${widgetsNeeded} widgets.</div>`;
		}
		if (activeCb) {
			activeCb.disabled = !canAfford || !hasEnoughWidgets;
			activeCb.parentElement.style.opacity = (canAfford && hasEnoughWidgets) ? '1' : '0.5';
		}
		if (canAfford && hasEnoughWidgets) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}</div><br><span class="text-remaining">Click "Upgrade" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${costHtml}</div>${widgetNote}`;
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

function onWidgetCurrentSelect(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	const dataArray = getWidgetsData();
	if (!from || from === '') {
		const toLevels = getWidgetTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
		const targOpts = buildLevelOptions(toLevels, 'Target Level', highestLevel, '');
		targ.innerHTML = targOpts;
		if (lockedUpgrades.has(safeId)) {
			lockedUpgrades.delete(safeId);
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
		}
		refreshCalculations();
		return;
	}
	const currentNum = parseFloat(from);
	const toLevels = getWidgetTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
	const next = getWidgetNextLevel(dataArray, from);
	let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
	let hasHigherLevels = false;
	for (let i = 0; i < toLevels.length; i++) {
		const targetNum = parseFloat(toLevels[i]);
		if (targetNum > currentNum) {
			const isMax = String(toLevels[i]) === String(highestLevel);
			dynamicTargOpts += `<option value="${toLevels[i]}">${toLevels[i]}${isMax ? ' (Max)' : ''}</option>`;
			hasHigherLevels = true;
		}
	}
	if (!hasHigherLevels && highestLevel) {
		dynamicTargOpts += `<option value="${highestLevel}" selected>${highestLevel} (Max)</option>`;
	}
	targ.innerHTML = dynamicTargOpts;
	if (next) {
		let found = false;
		for (let i = 0; i < targ.options.length; i++) {
			if (String(targ.options[i].value) === String(next)) {
				targ.selectedIndex = i;
				found = true;
				break;
			}
		}
		if (!found && targ.options.length > 1) targ.selectedIndex = 1;
	} else if (targ.options.length > 1) {
		targ.selectedIndex = 1;
	}
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	refreshCalculations();
}

function onWidgetTargetChange(safeId) {
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	refreshCalculations();
}

function onWidgetUpgradeCheckboxChange(safeId, isChecked) {
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	if (!card) return;
	const heroName = card.dataset.hero;
	if (isChecked) {
		const curr = document.getElementById(`curr_${safeId}`);
		const targ = document.getElementById(`targ_${safeId}`);
		if (!curr || !targ) return;
		const from = curr.value;
		const to = targ.value;
		if (!from || from === '' || !to || to === '' || String(from) === String(to)) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
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
		const dataArray = getWidgetsData();
		const costs = calculateWidgetCosts(heroName, dataArray, from, to, vault, otherLocked);
		if (!costs) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			refreshCalculations();
			return;
		}
		let canAfford = true;
		for (const [res, amt] of Object.entries(costs.costTotals)) {
			if (!res.startsWith('_') && res !== `${heroName}_widgets`) {
				if ((vault[res] || 0) < (otherLocked[res] || 0) + amt) {
					canAfford = false;
					break;
				}
			}
		}
		const heroWidgetsAvailable = getHeroWidgetInventory(heroName);
		const hasEnoughWidgets = heroWidgetsAvailable >= costs.widgetsNeeded;
		if (!canAfford || !hasEnoughWidgets) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			refreshCalculations();
			return;
		}
		const displayTo = to === 'max' ? 'max' : (costs.actualTo || to);
		lockedUpgrades.set(safeId, {
			costTotals: JSON.parse(JSON.stringify(costs.costTotals)),
			stepPoints: costs.stepPoints,
			stepsCount: costs.stepsCount,
			heroName: heroName,
			toLevel: displayTo,
			widgetStatus: costs.widgetStatus || null
		});
	} else {
		lockedUpgrades.delete(safeId);
	}
	refreshCalculations();
}

function loadWidgets() {
	const inventoryContainer = document.getElementById('widgetInventoryContainer');
	const widgetsGridContainer = document.getElementById('widgetsGrid');
	if (!inventoryContainer || !widgetsGridContainer) return;
	loadHeroWidgetsFromStorage();
	inventoryContainer.innerHTML = '';
	widgetsGridContainer.innerHTML = '';
	inventoryContainer.innerHTML = createWidgetInventoryCard();
	const ssrHeroes = getSSRHeroes();
	const dataArray = getWidgetsData();
	let widgetsHtml = '';
	for (const hero of ssrHeroes) {
		widgetsHtml += createWidgetCard(hero.name, dataArray);
	}
	widgetsGridContainer.innerHTML = widgetsHtml;
	// Restore selections
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('curr_widgets_') || id.startsWith('targ_widgets_')) {
				const element = document.getElementById(id);
				if (element && element.tagName === "SELECT") {
					let valueExists = false;
					for (let i = 0; i < element.options.length; i++) {
						if (element.options[i].value === value) {
							valueExists = true;
							break;
						}
					}
					if (valueExists) element.value = value;
				}
			}
		}
	}
	for (const [safeId, data] of lockedUpgrades.entries()) {
		if (safeId.startsWith('widgets_')) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = true;
			if (data.toLevel) {
				const targSelect = document.getElementById(`targ_${safeId}`);
				if (targSelect) {
					for (let i = 0; i < targSelect.options.length; i++) {
						if (targSelect.options[i].value === String(data.toLevel)) {
							targSelect.selectedIndex = i;
							break;
						}
					}
				}
			}
		}
	}
	refreshCalculations();
}
// ============================================
// EXPORTS
// ============================================
window.loadHeroWidgetsFromStorage = loadHeroWidgetsFromStorage;
window.saveHeroWidgetsToStorage = saveHeroWidgetsToStorage;
window.updateHeroWidgetInput = updateHeroWidgetInput;
window.getHeroWidgetInventory = getHeroWidgetInventory;
window.loadWidgets = loadWidgets;
window.validateHeroWidgetInput = validateHeroWidgetInput;
window.refreshCalculations = refreshCalculations;
window.onWidgetCurrentSelect = onWidgetCurrentSelect;
window.onWidgetTargetChange = onWidgetTargetChange;
window.onWidgetUpgradeCheckboxChange = onWidgetUpgradeCheckboxChange;
