function getBuildingImageFileName(buildingName) {
	const imageMap = {
		'Town Center': 'town_center.png',
		'Barracks': 'barracks.png',
		'Stable': 'stable.png',
		'Range': 'range.png',
		'Command Center': 'command_center.png',
		'War Academy': 'war_academy.png',
		'Embassy': 'embassy.png',
		'Academy': 'academy.png',
		'Infirmary': 'infirmary.png',
		'Store House': 'store_house.png'
	};
	return `assets/building/${imageMap[buildingName] || buildingName.toLowerCase().replace(/ /g, '_') + '.png'}`;
}

function getBuildingsData(buildingName) {
	if (!window.gameDB || !window.gameDB.Buildings) {
		console.warn('Buildings data not loaded');
		return [];
	}
	return window.gameDB.Buildings[buildingName] || [];
}

function convertLevelToNumeric(level) {
	if (level === undefined || level === null || level === '') return 0;
	const levelStr = String(level);
	// Check for TG format: TG1, TG1-1, TG2, TG2-1, etc.
	const tgMatch = levelStr.match(/^TG(\d+)(?:-(\d+))?$/i);
	if (tgMatch) {
		const mainTg = parseInt(tgMatch[1]);
		const subLevel = tgMatch[2] ? parseInt(tgMatch[2]) : 0;
		// TG1 = 35 (after levels 1-34)
		// TG2 = 40, TG3 = 45, TG4 = 50, TG5 = 55, TG6 = 60, TG7 = 65, TG8 = 70
		// TG1-1 = 36, TG1-2 = 37, TG1-3 = 38, TG1-4 = 39
		// TG2-1 = 41, TG2-2 = 42, TG2-3 = 43, TG2-4 = 44
		let numericValue = 30 + (mainTg * 5);
		if (subLevel > 0) {
			numericValue += subLevel;
		}
		return numericValue;
	}
	// Handle regular numeric levels
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
	// Fallback: traverse using current/target relationships
	let current = fromStr;
	const visited = new Set();
	for (let safety = 0; safety < 200; safety++) {
		if (visited.has(current)) {
			console.warn('Circular dependency detected in building upgrades for', buildingName);
			break;
		}
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
	// If fromLevel is already the highest, return null
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
	// Build current level dropdown with proper placeholder
	let currOpts = '<option value="" disabled selected hidden>Current Level</option>';
	for (let i = 0; i < fromLevels.length; i++) {
		currOpts += `<option value="${fromLevels[i]}">${fromLevels[i]}</option>`;
	}
	// Add the highest level as an option (if it's not already in the list)
	if (highestLevel && !fromLevels.includes(highestLevel)) {
		currOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
	}
	// Build target dropdown - SHOW ALL LEVELS
	let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
	// Add all target levels
	for (let i = 0; i < toLevels.length; i++) {
		targOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
	}
	// If highest level is not in the list, add it
	if (highestLevel && !toLevels.includes(highestLevel)) {
		targOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
	}
	const imgUrl = getBuildingImageFileName(name);
	return `<div class="item-card" data-type="building" data-name="${name}" data-id="${safeId}">
        <div class="item-card-header">
            <img src="${imgUrl}" onerror="this.style.display='none';">
            <span>${name}</span>
        </div>
        <div class="item-card-body">
            <div class="level-controls">
                <select id="curr_${safeId}" onchange="onBuildingCurrentSelect('${safeId}', '${name}')">${currOpts}</select>
                <select id="targ_${safeId}" onchange="onBuildingTargetChange('${safeId}')">${targOpts}</select>
            </div>
            <div class="checkbox-group">
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onBuildingUpgradeCheckboxChange('${safeId}', this.checked)"> ⬆️ Upgrade</label>
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="speed_${safeId}" onchange="onBuildingSpeedupChange('${safeId}', this.checked)"> ⏩ +Speedups</label>
            </div>
            <div id="status_${safeId}" class="status-pane">⚙️ Select current & target level</div>
        </div>
    </div>`;
}

function calculateBuildingCosts(dataArray, from, to, speedCheck, vault, otherLocked, buildingName) {
	let actualFrom = from;
	let actualTo = to;
	const toLevels = getBuildingTargetLevels(dataArray);
	const highestLevel = toLevels[toLevels.length - 1];
	if (from === 'max') {
		actualFrom = highestLevel;
	}
	if (to === 'max') {
		actualTo = highestLevel;
	}
	// Check if from and to are the same
	if (String(actualFrom) === String(actualTo)) {
		return null;
	}
	const steps = getBuildingUpgradeSteps(dataArray, actualFrom, actualTo, buildingName);
	if (!steps.length) return null;
	let stepPoints = 0,
		totalTimeSeconds = 0;
	const costTotals = {};
	// Get resource reduction percentage from global
	const resourceReductionPercent = typeof window.getResourceReductionPercentage === 'function' ? window.getResourceReductionPercentage() : 0;
	const reductionMultiplier = 1 - (resourceReductionPercent / 100);
	for (const step of steps) {
		// Add points for resources (points are NOT reduced - you still get full points)
		if (step.truegold) stepPoints += parseCost(step.truegold) * SCORE_RULES.truegold;
		if (step.tempered_truegold) stepPoints += parseCost(step.tempered_truegold) * SCORE_RULES.tempered_truegold;
		if (step.time) totalTimeSeconds += parseTimeToSeconds(step.time);
		// Accumulate resource costs WITH reduction applied
		const keys = ['bread', 'wood', 'stone', 'iron', 'gold', 'truegold', 'tempered_truegold', 'truegold_dust', 'forgehammer', 'widgets', 'mithril', 'satin', 'gilded_threads', 'artisans_vision', 'charm_guide', 'charm_design', 'pet_food', 'growth_manual', 'nutrient_potion', 'promotion_medallion'];
		for (const k of keys) {
			if (step[k] !== undefined) {
				const norm = k === 'forgehammer' ? 'forge_hammer' : k;
				// Apply resource reduction to costs
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
				partialNote = `⚠️ Only ${actualSpeedupUsed} min available (need ${speedupCostMinutes})`;
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

function refreshCalculations() {
	let vault = getCurrentVault();
	const totalLocked = {};
	for (const [_, ld] of lockedUpgrades.entries()) {
		for (const [res, amt] of Object.entries(ld.costTotals)) totalLocked[res] = (totalLocked[res] || 0) + amt;
	}
	let totalScore = 0;
	const cards = document.querySelectorAll('.item-card[data-type="building"]');
	for (const card of cards) {
		const name = card.dataset.name;
		const safeId = card.dataset.id;
		const curr = document.getElementById(`curr_${safeId}`),
			targ = document.getElementById(`targ_${safeId}`);
		const status = document.getElementById(`status_${safeId}`);
		const activeCb = document.getElementById(`active_${safeId}`);
		const speedCb = document.getElementById(`speed_${safeId}`);
		if (!curr || !targ || !status) continue;
		const from = curr.value,
			to = targ.value;
		const isLocked = lockedUpgrades.has(safeId);
		if (activeCb && activeCb.checked !== isLocked) activeCb.checked = isLocked;
		// Check if no levels are selected (placeholder)
		if (!from || from === '' || !to || to === '') {
			status.className = "status-pane";
			status.innerHTML = `⚙️ Select current & target level`;
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
		// Check if current level is already the highest
		const isAtMax = highestLevel && String(from) === String(highestLevel);
		if (isAtMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `🏆 <strong>BUILDING MAXED!</strong><br>Already at highest level (${highestLevel})`;
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
			status.className = "status-pane";
			status.innerHTML = `⚙️ Current and target levels are the same. Select a higher target level.`;
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
			let costHtml = '';
			for (const [res, amt] of Object.entries(costTotals)) {
				const remaining = (vault[res] || 0) - (totalLocked[res] || 0);
				const isSpeed = res.includes('speedup');
				const disp = res.replace(/_/g, ' ');
				const img = getImageFileName(res);
				const req = isSpeed ? `${amt} min` : formatNumber(amt);
				if (remaining < 0) {
					const short = isSpeed ? `${Math.ceil(-remaining)} min` : formatNumber(-remaining);
					costHtml += `<div class="resource-tag"><img src="${img}" onerror="this.style.display='none';"> ${disp}: ${req} <span class="text-deficit">(${short} short)</span></div>`;
				} else {
					const left = isSpeed ? `${remaining} min` : formatNumber(remaining);
					costHtml += `<div class="resource-tag"><img src="${img}" onerror="this.style.display='none';"> ${disp}: ${req} <span class="text-remaining">(${left} remaining)</span></div>`;
				}
			}
			if (!Object.keys(costTotals).length) costHtml = '<span>✨ No resources required</span>';
			const buffedTime = getBuffedTime(totalTimeSeconds);
			const timeDisplay = buffedTime > 0 ? `<div class="resource-tag">⏱️ Total Time: ${formatSecondsToTime(buffedTime)}${buffedTime !== totalTimeSeconds ? ` (original: ${formatSecondsToTime(totalTimeSeconds)})` : ''}</div>` : '';
			const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
			const partialHtml = partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : '';
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>✓ ACTIVE${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}${timeDisplay}${partialHtml}</div>`;
			totalScore += stepPoints;
			if (activeCb) activeCb.disabled = false;
			if (speedCb) speedCb.disabled = false;
			continue;
		}
		const speedCheck = speedCb?.checked || false;
		const otherLocked = {};
		for (const [oid, ld] of lockedUpgrades.entries())
			if (oid !== safeId) {
				for (const [res, amt] of Object.entries(ld.costTotals)) otherLocked[res] = (otherLocked[res] || 0) + amt;
			}
		const costs = calculateBuildingCosts(dataArray, from, to, speedCheck, vault, otherLocked, name);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `❌ Cannot upgrade from ${from} to ${to}`;
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
			if ((vault[res] || 0) < (totalLocked[res] || 0) + amt) {
				canAfford = false;
				break;
			}
		}
		let costHtml = '';
		for (const [res, amt] of Object.entries(costTotals)) {
			const lockedAmt = totalLocked[res] || 0;
			const remaining = (vault[res] || 0) - lockedAmt - amt;
			const isSpeed = res.includes('speedup');
			const disp = res.replace(/_/g, ' ');
			const img = getImageFileName(res);
			const req = isSpeed ? `${amt} min` : formatNumber(amt);
			if (remaining < 0) {
				const short = isSpeed ? `${Math.ceil(-remaining)} min` : formatNumber(-remaining);
				costHtml += `<div class="resource-tag"><img src="${img}" onerror="this.style.display='none';"> ${disp}: ${req} <span class="text-deficit">(${short} short)</span></div>`;
			} else {
				const left = isSpeed ? `${remaining} min` : formatNumber(remaining);
				costHtml += `<div class="resource-tag"><img src="${img}" onerror="this.style.display='none';"> ${disp}: ${req} <span class="text-remaining">(${left} remaining)</span></div>`;
			}
		}
		if (!Object.keys(costTotals).length) costHtml = '<span>✨ No resources required</span>';
		const buffedTime = getBuffedTime(totalTimeSeconds);
		const timeDisplay = buffedTime > 0 ? `<div class="resource-tag">⏱️ Total Time: ${formatSecondsToTime(buffedTime)}${buffedTime !== totalTimeSeconds ? ` (original: ${formatSecondsToTime(totalTimeSeconds)})` : ''}</div>` : '';
		const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
		const partialHtml = partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : '';
		if (activeCb) {
			if (!canAfford) {
				activeCb.disabled = true;
				activeCb.parentElement.style.opacity = '0.5';
			} else {
				activeCb.disabled = false;
				activeCb.parentElement.style.opacity = '1';
			}
		}
		if (speedCb && totalTimeSeconds > 0) {
			if (!canAfford) {
				speedCb.disabled = true;
				speedCb.parentElement.style.opacity = '0.5';
			} else {
				speedCb.disabled = false;
				speedCb.parentElement.style.opacity = '1';
			}
		}
		if (canAfford) {
			status.className = "status-pane";
			status.innerHTML = `<strong>⚪ ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}${timeDisplay}${partialHtml}</div><br><span class="text-remaining">✓ Click "Upgrade" to lock</span>`;
		} else if (status.innerHTML.indexOf('TARGET LEVEL NOT ACHIEVABLE') === -1) {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>✗ INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${costHtml}${timeDisplay}${partialHtml}</div>`;
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

function onBuildingCurrentSelect(safeId, name) {
	const curr = document.getElementById(`curr_${safeId}`),
		targ = document.getElementById(`targ_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	// If "Current Level" placeholder is selected, show ALL levels in target
	if (!from || from === '') {
		const dataArray = getBuildingsData(name);
		const toLevels = getBuildingTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
		// Reset target dropdown with ALL levels
		let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
		for (let i = 0; i < toLevels.length; i++) {
			targOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
		}
		if (highestLevel && !toLevels.includes(highestLevel)) {
			targOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
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
	const dataArray = getBuildingsData(name);
	const currentNum = convertLevelToNumeric(from);
	const toLevels = getBuildingTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
	const next = getBuildingNextLevel(dataArray, from, name);
	// Dynamically rebuild target dropdown - only show levels above current
	let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
	let hasHigherLevels = false;
	for (let i = 0; i < toLevels.length; i++) {
		const targetNum = convertLevelToNumeric(toLevels[i]);
		if (targetNum > currentNum) {
			dynamicTargOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
			hasHigherLevels = true;
		}
	}
	// If no higher levels exist (already at max), show the highest level as the only option
	if (!hasHigherLevels && highestLevel) {
		dynamicTargOpts += `<option value="${highestLevel}" selected>${highestLevel}</option>`;
	}
	targ.innerHTML = dynamicTargOpts;
	// Auto-select the next logical level if it exists
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
		const curr = document.getElementById(`curr_${safeId}`),
			targ = document.getElementById(`targ_${safeId}`);
		const speedCb = document.getElementById(`speed_${safeId}`);
		if (!curr || !targ) return;
		const from = curr.value,
			to = targ.value,
			speedCheck = speedCb?.checked || false;
		// Validate selections
		if (!from || from === '' || !to || to === '' || String(from) === String(to)) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			return;
		}
		const vault = getCurrentVault();
		let otherLocked = {};
		for (const [oid, ld] of lockedUpgrades.entries())
			if (oid !== safeId) {
				for (const [res, amt] of Object.entries(ld.costTotals)) otherLocked[res] = (otherLocked[res] || 0) + amt;
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
			if ((vault[res] || 0) < (otherLocked[res] || 0) + amt) {
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
	// Update the locked upgrade data if it exists
	if (lockedUpgrades.has(safeId)) {
		const existing = lockedUpgrades.get(safeId);
		// Update the speedup flag
		existing.speedupWasChecked = isChecked;
		// Recalculate costs with the new speedup setting
		const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
		if (!card) return;
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
							otherLocked[res] = (otherLocked[res] || 0) + amt;
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
	} else {
		// If not locked, just refresh calculations to show the updated estimate
		refreshCalculations();
	}
	refreshCalculations();
}

function loadBuildings() {
	const container = document.getElementById('buildingsGrid');
	if (!container) return;
	container.innerHTML = '';
	for (const name in window.gameDB.Buildings) {
		if (window.gameDB.Buildings[name]?.length) {
			container.innerHTML += createBuildingCard(name, window.gameDB.Buildings[name]);
		}
	}
	// Restore saved current levels from presets
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('curr_')) {
				const element = document.getElementById(id);
				if (element && element.tagName === "SELECT") {
					let valueExists = false;
					for (let i = 0; i < element.options.length; i++) {
						if (element.options[i].value === value) {
							valueExists = true;
							break;
						}
					}
					if (valueExists) {
						element.value = value;
					}
				}
			}
		}
	}
	for (const [safeId, data] of lockedUpgrades.entries()) {
		if (safeId.startsWith('building_')) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = true;
			const speedCb = document.getElementById(`speed_${safeId}`);
			if (speedCb && data.speedupWasChecked !== undefined) speedCb.checked = data.speedupWasChecked;
			if (data.toLevel) {
				const targSelect = document.getElementById(`targ_${safeId}`);
				if (targSelect) {
					const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
					if (card) {
						const name = card.dataset.name;
						const dataArray = getBuildingsData(name);
						const currSelect = document.getElementById(`curr_${safeId}`);
						const currentNum = currSelect ? convertLevelToNumeric(currSelect.value) : 0;
						const toLevels = getBuildingTargetLevels(dataArray);
						const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
						let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
						let hasHigherLevels = false;
						for (let i = 0; i < toLevels.length; i++) {
							const targetNum = convertLevelToNumeric(toLevels[i]);
							if (currSelect?.value === 'max' || targetNum > currentNum) {
								dynamicTargOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
								hasHigherLevels = true;
							}
						}
						if (!hasHigherLevels && highestLevel) {
							dynamicTargOpts += `<option value="${highestLevel}" selected>${highestLevel}</option>`;
						}
						targSelect.innerHTML = dynamicTargOpts;
					}
					// Select the saved target level
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
// Expose functions globally
window.loadBuildings = loadBuildings;
window.refreshCalculations = refreshCalculations;
window.onBuildingCurrentSelect = onBuildingCurrentSelect;
window.onBuildingTargetChange = onBuildingTargetChange;
window.onBuildingUpgradeCheckboxChange = onBuildingUpgradeCheckboxChange;
window.onBuildingSpeedupChange = onBuildingSpeedupChange;
window.convertLevelToNumeric = convertLevelToNumeric;
