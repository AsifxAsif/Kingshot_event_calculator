// ============================================
// BUILDINGS - FIXED (Double resource deduction bug fixed)
// ============================================
function getBuildingImageFileName(buildingName) {
	const imageMap = {
		'Town Center': 'town_center.webp',
		'Barracks': 'barracks.webp',
		'Stable': 'stable.webp',
		'Range': 'range.webp',
		'Command Center': 'command_center.webp',
		'War Academy': 'war_academy.webp',
		'Embassy': 'embassy.webp',
		'Academy': 'academy.webp',
		'Infirmary': 'infirmary.webp',
		'Store House': 'store_house.webp'
	};
	return `assets/building/${imageMap[buildingName] || buildingName.toLowerCase().replace(/ /g, '_') + '.webp'}`;
}

function getBuildingsData(buildingName) {
	if (!window.gameDB || !window.gameDB.Buildings) {
		return [];
	}
	return window.gameDB.Buildings[buildingName] || [];
}

function convertLevelToNumeric(level) {
	if (level === undefined || level === null || level === '') return 0;
	const levelStr = String(level);
	const tgMatch = levelStr.match(/^TG(\d+)(?:-(\d+))?$/i);
	if (tgMatch) {
		const mainTg = parseInt(tgMatch[1]);
		const subLevel = tgMatch[2] ? parseInt(tgMatch[2]) : 0;
		let numericValue = 30 + (mainTg * 5);
		if (subLevel > 0) {
			numericValue += subLevel;
		}
		return numericValue;
	}
	const num = parseFloat(levelStr);
	return isNaN(num) ? 0 : num;
}

function getBuildingLevels(dataArray, buildingName) {
	if (!dataArray?.length) return [0];
	const levels = new Set();
	if (buildingName === "Town Center") {
		levels.add(1);
	} else {
		levels.add(0);
	}
	for (let i = 0; i < dataArray.length - 1; i++) {
		let lvl = dataArray[i].level ?? dataArray[i].current_lvl ?? dataArray[i].current;
		if (lvl !== undefined) levels.add(lvl);
	}
	const targetLevels = getBuildingTargetLevels(dataArray);
	if (targetLevels.length) {
		levels.add(targetLevels[targetLevels.length - 1]);
	}
	return Array.from(levels).sort((a, b) => convertLevelToNumeric(a) - convertLevelToNumeric(b));
}

function getBuildingTargetLevels(dataArray) {
	if (!dataArray?.length) return [];
	const levels = new Set();
	for (const item of dataArray) {
		let lvl = item.level ?? item.target_lvl ?? item.target;
		if (lvl !== undefined) levels.add(lvl);
	}
	return Array.from(levels).sort((a, b) => convertLevelToNumeric(a) - convertLevelToNumeric(b));
}

function getBuildingUpgradeSteps(dataArray, fromLevel, toLevel, buildingName) {
	const steps = [];
	const fromStr = String(fromLevel);
	const toStr = String(toLevel);
	const isTownCenter = buildingName === "Town Center";
	const startingLevel = isTownCenter ? '1' : '0';
	if (fromStr === startingLevel) {
		for (const item of dataArray) {
			let lvl = item.level ?? item.target_lvl ?? item.target;
			if (lvl !== undefined) {
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
		if (lvl !== undefined && String(lvl) === fromStr) start = i;
		if (lvl !== undefined && String(lvl) === toStr) end = i;
	}
	if (start !== -1 && end !== -1 && start < end) {
		for (let i = start + 1; i <= end; i++) steps.push(dataArray[i]);
		return steps;
	}
	let current = fromStr;
	const visited = new Set();
	for (let safety = 0; safety < 200; safety++) {
		if (visited.has(current)) break;
		visited.add(current);
		let found = false;
		for (const item of dataArray) {
			let prev = item.current_lvl ?? item.current;
			let next = item.level ?? item.target_lvl ?? item.target;
			if (prev !== undefined && String(prev) === current) {
				steps.push(item);
				current = String(next);
				found = true;
				if (current === toStr) return steps;
				break;
			}
		}
		if (!found) break;
	}
	return steps;
}

function getBuildingNextLevel(dataArray, fromLevel, buildingName) {
	const allLevels = getBuildingTargetLevels(dataArray);
	if (!allLevels.length) return null;
	const highestLevel = allLevels[allLevels.length - 1];
	if (fromLevel === 'max' || String(fromLevel) === String(highestLevel)) {
		return null;
	}
	for (let i = 0; i < dataArray.length; i++) {
		let prev = dataArray[i].current_lvl ?? dataArray[i].current;
		if (prev !== undefined && String(prev) === String(fromLevel)) {
			return dataArray[i].level ?? dataArray[i].target_lvl ?? dataArray[i].target;
		}
		if (i > 0) {
			let prevLvl = dataArray[i - 1].level ?? dataArray[i - 1].target_lvl ?? dataArray[i - 1].target;
			if (prevLvl !== undefined && String(prevLvl) === String(fromLevel)) {
				return dataArray[i].level ?? dataArray[i].target_lvl ?? dataArray[i].target;
			}
		}
	}
	const currentNum = convertLevelToNumeric(fromLevel);
	for (const lvl of allLevels) {
		if (convertLevelToNumeric(lvl) > currentNum) {
			return lvl;
		}
	}
	return null;
}

function createBuildingCard(name, dataArray) {
	if (!dataArray?.length) return '';
	const fromLevels = getBuildingLevels(dataArray, name);
	const toLevels = getBuildingTargetLevels(dataArray);
	const safeId = `building_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	let currOpts = '<option value="" disabled selected hidden>Current Level</option>';
	for (let i = 0; i < fromLevels.length; i++) {
		const display = String(fromLevels[i]);
		currOpts += `<option value="${display}">${display}</option>`;
	}
	if (highestLevel && !fromLevels.includes(highestLevel)) {
		currOpts += `<option value="${highestLevel}">${highestLevel} (Max)</option>`;
	}
	let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
	for (let i = 0; i < toLevels.length; i++) {
		const display = String(toLevels[i]);
		targOpts += `<option value="${display}">${display}</option>`;
	}
	if (highestLevel && !toLevels.includes(highestLevel)) {
		targOpts += `<option value="${highestLevel}">${highestLevel} (Max)</option>`;
	}
	const imgUrl = getBuildingImageFileName(name);
	return `<div class="item-card" data-type="building" data-name="${name}" data-id="${safeId}">
        <div class="item-card-header">
            <img loading="lazy" decoding="async" src="${imgUrl}" onerror="this.style.display='none';" alt="${name}">
            <span>${name}</span>
        </div>
        <div class="item-card-body">
            <div class="level-controls">
                <select id="curr_${safeId}" onchange="onBuildingCurrentSelect('${safeId}', '${name}')">${currOpts}</select>
                <select id="targ_${safeId}" onchange="onBuildingTargetChange('${safeId}')">${targOpts}</select>
            </div>
            <div class="checkbox-group">
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onBuildingUpgradeCheckboxChange('${safeId}', this.checked)"> Upgrade</label>
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="speed_${safeId}" onchange="onBuildingSpeedupChange('${safeId}', this.checked)"> +Speedups</label>
            </div>
            <div id="status_${safeId}" class="status-pane">Select current & target level</div>
        </div>
    </div>`;
}

function calculateBuildingCosts(dataArray, from, to, speedCheck, vault, otherLocked, buildingName) {
	let actualFrom = from;
	let actualTo = to;
	const toLevels = getBuildingTargetLevels(dataArray);
	const highestLevel = toLevels[toLevels.length - 1];
	if (from === 'max') actualFrom = highestLevel;
	if (to === 'max') actualTo = highestLevel;
	if (String(actualFrom) === String(actualTo)) return null;
	const steps = getBuildingUpgradeSteps(dataArray, actualFrom, actualTo, buildingName);
	if (!steps.length) return null;
	let stepPoints = 0,
		totalTimeSeconds = 0;
	const costTotals = {};
	const resourceReductionPercent = typeof window.getResourceReductionPercentage === 'function' ? window.getResourceReductionPercentage() : 0;
	const reductionMultiplier = 1 - (resourceReductionPercent / 100);
	for (const step of steps) {
		if (step.truegold) stepPoints += parseCost(step.truegold) * SCORE_RULES.truegold;
		if (step.tempered_truegold) stepPoints += parseCost(step.tempered_truegold) * SCORE_RULES.tempered_truegold;
		if (step.time) totalTimeSeconds += parseTimeToSeconds(step.time);
		const keys = ['bread', 'wood', 'stone', 'iron', 'gold', 'truegold', 'tempered_truegold', 'truegold_dust', 'forgehammer', 'widgets', 'mithril', 'satin', 'gilded_threads', 'artisans_vision', 'charm_guide', 'charm_design', 'pet_food', 'growth_manual', 'nutrient_potion', 'promotion_medallion'];
		for (const k of keys) {
			if (step[k] !== undefined) {
				const norm = k === 'forgehammer' ? 'forge_hammer' : k;
				const originalCost = parseCost(step[k]);
				const reducedCost = Math.ceil(originalCost * reductionMultiplier);
				costTotals[norm] = (costTotals[norm] || 0) + reducedCost;
			}
		}
	}
	let actualSpeedupUsed = 0,
		partialNote = '';
	if (totalTimeSeconds > 0 && speedCheck) {
		const buffedTimeSeconds = getBuffedTime(totalTimeSeconds);
		const speedupCostMinutes = secondsToSpeedupMinutes(buffedTimeSeconds);
		const speedKey = 'building_speedup';
		const available = (vault[speedKey] || 0) - (otherLocked[speedKey] || 0);
		if (available < speedupCostMinutes) {
			actualSpeedupUsed = Math.max(0, available);
			if (actualSpeedupUsed > 0) {
				partialNote = `Only ${actualSpeedupUsed} min available (need ${speedupCostMinutes})`;
				stepPoints += actualSpeedupUsed * SCORE_RULES.speedup_min;
				costTotals[speedKey] = (costTotals[speedKey] || 0) + actualSpeedupUsed;
			}
		} else {
			actualSpeedupUsed = speedupCostMinutes;
			stepPoints += actualSpeedupUsed * SCORE_RULES.speedup_min;
			costTotals[speedKey] = (costTotals[speedKey] || 0) + actualSpeedupUsed;
		}
	}
	return {
		stepPoints,
		totalTimeSeconds,
		costTotals,
		stepsCount: steps.length,
		actualSpeedupUsed,
		partialNote,
		error: false,
		actualTo: actualTo
	};
}

function getBuffedTime(originalSeconds) {
	if (typeof window.applyBuildingSpeedupBuffs === 'function') {
		return window.applyBuildingSpeedupBuffs(originalSeconds);
	}
	return originalSeconds;
}
// ============================================
// CRITICAL FIX: refreshCalculations - Fixed double resource deduction
// ============================================
function refreshCalculations() {
	let vault = getCurrentVault();
	const totalLocked = {};
	for (const [_, ld] of lockedUpgrades.entries()) {
		for (const [res, amt] of Object.entries(ld.costTotals)) {
			if (!res.startsWith('_')) {
				totalLocked[res] = (totalLocked[res] || 0) + amt;
			}
		}
	}
	let totalScore = 0;
	const cards = document.querySelectorAll('.item-card[data-type="building"]');
	for (const card of cards) {
		const name = card.dataset.name;
		const safeId = card.dataset.id;
		const curr = document.getElementById(`curr_${safeId}`);
		const targ = document.getElementById(`targ_${safeId}`);
		const status = document.getElementById(`status_${safeId}`);
		const activeCb = document.getElementById(`active_${safeId}`);
		const speedCb = document.getElementById(`speed_${safeId}`);
		if (!curr || !targ || !status) continue;
		const from = curr.value;
		const to = targ.value;
		const isLocked = lockedUpgrades.has(safeId);
		if (activeCb && activeCb.checked !== isLocked) activeCb.checked = isLocked;
		if (!from || from === '' || !to || to === '') {
			status.className = "status-pane";
			status.innerHTML = `Select current & target level`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			if (speedCb) {
				speedCb.checked = false;
				speedCb.disabled = true;
			}
			continue;
		}
		const dataArray = getBuildingsData(name);
		const toLevels = getBuildingTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
		const isAtMax = highestLevel && String(from) === String(highestLevel);
		if (isAtMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>BUILDING MAXED!</strong><br>Already at highest level (${highestLevel})`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			if (speedCb) {
				speedCb.checked = false;
				speedCb.disabled = true;
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
			if (speedCb) {
				speedCb.checked = false;
				speedCb.disabled = true;
			}
			continue;
		}
		if (isLocked) {
			const locked = lockedUpgrades.get(safeId);
			const {
				stepPoints,
				costTotals,
				totalTimeSeconds,
				stepsCount,
				partialNote
			} = locked;
			if (speedCb && speedCb.checked !== locked.speedupWasChecked) speedCb.checked = locked.speedupWasChecked;
			const otherLocked = {};
			for (const [res, amt] of Object.entries(totalLocked)) {
				const currentAmt = costTotals[res] || 0;
				if (!res.startsWith('_') && amt - currentAmt > 0) {
					otherLocked[res] = amt - currentAmt;
				}
			}
			let costHtml = buildResourceDisplay(costTotals, vault, otherLocked);
			const buffedTime = getBuffedTime(totalTimeSeconds);
			const timeDisplay = buffedTime > 0 ? `<div class="resource-tag">Total Time: ${formatSecondsToTime(buffedTime)}${buffedTime !== totalTimeSeconds ? ` (original: ${formatSecondsToTime(totalTimeSeconds)})` : ''}</div>` : '';
			const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
			const partialHtml = partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : '';
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>ACTIVE${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}${timeDisplay}${partialHtml}</div>`;
			totalScore += stepPoints;
			if (activeCb) activeCb.disabled = false;
			if (speedCb) speedCb.disabled = false;
			continue;
		}
		const speedCheck = speedCb?.checked || false;
		const otherLocked = {};
		for (const [res, amt] of Object.entries(totalLocked)) {
			if (!res.startsWith('_')) {
				otherLocked[res] = amt;
			}
		}
		const costs = calculateBuildingCosts(dataArray, from, to, speedCheck, vault, otherLocked, name);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `Cannot upgrade from ${from} to ${to}`;
			continue;
		}
		const {
			stepPoints,
			totalTimeSeconds,
			costTotals,
			stepsCount,
			partialNote,
			actualTo
		} = costs;
		let canAfford = true;
		for (const [res, amt] of Object.entries(costTotals)) {
			if (!res.startsWith('_') && (vault[res] || 0) < (otherLocked[res] || 0) + amt) {
				canAfford = false;
				break;
			}
		}
		let costHtml = buildResourceDisplay(costTotals, vault, otherLocked);
		const buffedTime = getBuffedTime(totalTimeSeconds);
		const timeDisplay = buffedTime > 0 ? `<div class="resource-tag">Total Time: ${formatSecondsToTime(buffedTime)}${buffedTime !== totalTimeSeconds ? ` (original: ${formatSecondsToTime(totalTimeSeconds)})` : ''}</div>` : '';
		const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
		const partialHtml = partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : '';
		if (activeCb) {
			activeCb.disabled = !canAfford;
			activeCb.parentElement.style.opacity = canAfford ? '1' : '0.5';
			if (!canAfford) {
				activeCb.parentElement.classList.add('disabled');
			} else {
				activeCb.parentElement.classList.remove('disabled');
			}
		}
		if (speedCb && totalTimeSeconds > 0) {
			const speedKey = 'building_speedup';
			const hasSpeedups = (vault[speedKey] || 0) > 0;
			const canUseSpeedup = canAfford && hasSpeedups;
			speedCb.disabled = !canUseSpeedup;
			speedCb.parentElement.style.opacity = canUseSpeedup ? '1' : '0.5';
			if (!canUseSpeedup) {
				speedCb.parentElement.classList.add('disabled');
				speedCb.parentElement.title = !hasSpeedups ? 'No building speedups in vault' : 'Insufficient resources';
			} else {
				speedCb.parentElement.classList.remove('disabled');
				speedCb.parentElement.title = '';
			}
		}
		if (canAfford) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}${timeDisplay}${partialHtml}</div><br><span class="text-remaining">Click "Upgrade" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${costHtml}${timeDisplay}${partialHtml}</div>`;
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
// Event handlers
function onBuildingCurrentSelect(safeId, name) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	const dataArray = getBuildingsData(name);
	const toLevels = getBuildingTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
	if (!from || from === '') {
		let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
		for (let i = 0; i < toLevels.length; i++) {
			targOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
		}
		if (highestLevel && !toLevels.includes(highestLevel)) {
			targOpts += `<option value="${highestLevel}">${highestLevel} (Max)</option>`;
		}
		targ.innerHTML = targOpts;
		if (lockedUpgrades.has(safeId)) {
			lockedUpgrades.delete(safeId);
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
		}
		refreshCalculations();
		return;
	}
	const currentNum = convertLevelToNumeric(from);
	const next = getBuildingNextLevel(dataArray, from, name);
	let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
	let hasHigherLevels = false;
	for (let i = 0; i < toLevels.length; i++) {
		const targetNum = convertLevelToNumeric(toLevels[i]);
		if (targetNum > currentNum) {
			dynamicTargOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
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
		if (!found && targ.options.length > 1) {
			targ.selectedIndex = 1;
		}
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

function onBuildingTargetChange(safeId) {
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	refreshCalculations();
}

function onBuildingUpgradeCheckboxChange(safeId, isChecked) {
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	if (!card) return;
	const name = card.dataset.name;
	if (isChecked) {
		const curr = document.getElementById(`curr_${safeId}`);
		const targ = document.getElementById(`targ_${safeId}`);
		const speedCb = document.getElementById(`speed_${safeId}`);
		if (!curr || !targ) return;
		const from = curr.value;
		const to = targ.value;
		const speedCheck = speedCb?.checked || false;
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
		const dataArray = getBuildingsData(name);
		const costs = calculateBuildingCosts(dataArray, from, to, speedCheck, vault, otherLocked, name);
		if (!costs || costs.error) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			refreshCalculations();
			return;
		}
		let canAfford = true;
		for (const [res, amt] of Object.entries(costs.costTotals)) {
			if (!res.startsWith('_') && (vault[res] || 0) < (otherLocked[res] || 0) + amt) {
				canAfford = false;
				break;
			}
		}
		if (!canAfford) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			refreshCalculations();
			return;
		}
		const displayTo = to === 'max' ? 'max' : (costs.actualTo || to);
		lockedUpgrades.set(safeId, {
			costTotals: JSON.parse(JSON.stringify(costs.costTotals)),
			stepPoints: costs.stepPoints,
			totalTimeSeconds: costs.totalTimeSeconds,
			stepsCount: costs.stepsCount,
			speedupWasChecked: speedCheck,
			actualSpeedupUsed: costs.actualSpeedupUsed,
			partialNote: costs.partialNote,
			toLevel: displayTo
		});
	} else {
		lockedUpgrades.delete(safeId);
	}
	refreshCalculations();
}

function onBuildingSpeedupChange(safeId, isChecked) {
	if (lockedUpgrades.has(safeId)) {
		const existing = lockedUpgrades.get(safeId);
		existing.speedupWasChecked = isChecked;
		const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
		if (card) {
			const name = card.dataset.name;
			const curr = document.getElementById(`curr_${safeId}`);
			const targ = document.getElementById(`targ_${safeId}`);
			if (curr && targ) {
				const from = curr.value;
				const to = targ.value;
				if (from && from !== '' && to && to !== '' && String(from) !== String(to)) {
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
					const dataArray = getBuildingsData(name);
					const costs = calculateBuildingCosts(dataArray, from, to, isChecked, vault, otherLocked, name);
					if (costs && !costs.error) {
						const displayTo = to === 'max' ? 'max' : (costs.actualTo || to);
						lockedUpgrades.set(safeId, {
							costTotals: JSON.parse(JSON.stringify(costs.costTotals)),
							stepPoints: costs.stepPoints,
							totalTimeSeconds: costs.totalTimeSeconds,
							stepsCount: costs.stepsCount,
							speedupWasChecked: isChecked,
							actualSpeedupUsed: costs.actualSpeedupUsed,
							partialNote: costs.partialNote,
							toLevel: displayTo
						});
					}
				}
			}
		}
	}
	refreshCalculations();
}
// ============================================
// BUILDINGS - FIXED TARGET DROPDOWN RESTORATION
// ============================================
function loadBuildings() {
	loadPresetSelections();
	const currentPage = window.getCurrentPageKey ? window.getCurrentPageKey() : "buildings";
	if (currentPage !== "buildings") return;
	renderBuildingCards();
	// 1. Restore regular preset dropdown choices
	const presetName = localStorage.getItem("current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		// Group restorations by their unique safeId to cleanly handle sequence mapping
		const targetUpdates = new Map();
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('curr_building_') || id.startsWith('targ_building_')) {
				const element = document.getElementById(id);
				if (element && element.tagName === "SELECT") {
					// Isolate whether it's a current or target level selector
					if (id.startsWith('curr_building_')) {
						let valueExists = false;
						for (let i = 0; i < element.options.length; i++) {
							if (element.options[i].value === value) {
								valueExists = true;
								break;
							}
						}
						if (valueExists) {
							element.value = value;
							// CRITICAL FIX: Trigger change event to filter options in the target dropdown
							element.dispatchEvent(new Event('change'));
						}
					} else if (id.startsWith('targ_building_')) {
						// Defer setting targets until current levels have rebuilt the options array
						targetUpdates.set(id, value);
					}
				}
			}
		}
		// Apply target values after options have been filtered by the 'change' events above
		for (const [id, value] of targetUpdates.entries()) {
			const element = document.getElementById(id);
			if (element) {
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
	// 2. Restore locked upgrades checkboxes
	for (const [safeId, data] of lockedUpgrades.entries()) {
		if (safeId.startsWith('building_')) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = true;
			const speedCb = document.getElementById(`speed_${safeId}`);
			if (speedCb && data.speedupWasChecked !== undefined) speedCb.checked = data.speedupWasChecked;
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
// Exports
window.loadBuildings = loadBuildings;
window.refreshCalculations = refreshCalculations;
window.onBuildingCurrentSelect = onBuildingCurrentSelect;
window.onBuildingTargetChange = onBuildingTargetChange;
window.onBuildingUpgradeCheckboxChange = onBuildingUpgradeCheckboxChange;
window.onBuildingSpeedupChange = onBuildingSpeedupChange;
window.convertLevelToNumeric = convertLevelToNumeric;
