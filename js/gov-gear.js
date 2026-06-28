// ============================================
// GOV GEAR - FULLY FIXED (Star symbols working, double deduction fixed)
// ============================================
function getGovGearImageFileName(gearName, levelName) {
	const gearMap = {
		'Helmet': 'cavalry_gear_1',
		'Watch': 'cavalry_gear_2',
		'Armor': 'infantry_gear_1',
		'Pant': 'infantry_gear_2',
		'Belt': 'archery_gear_1',
		'Weapon': 'archery_gear_2'
	};
	const prefix = gearMap[gearName] || gearName.toLowerCase().replace(/ /g, '_');
	let color = 'green';
	let tier = '0';
	let stars = '0';
	if (levelName && String(levelName).trim() !== '' && String(levelName).trim() !== '0') {
		const levelStr = String(levelName).trim();
		const lowerLevel = levelStr.toLowerCase();
		if (lowerLevel.includes('green')) color = 'green';
		else if (lowerLevel.includes('blue')) color = 'blue';
		else if (lowerLevel.includes('purple')) color = 'purple';
		else if (lowerLevel.includes('gold')) color = 'gold';
		else if (lowerLevel.includes('red')) color = 'red';
		const tierMatch = levelStr.match(/T([0-9])/i);
		if (tierMatch) tier = tierMatch[1];
		stars = String((levelStr.match(/⭐/g) || []).length);
	}
	const fileName = `${prefix}_${color}_t${tier}_s${stars}.webp`;
	return `assets/gov_gears/${fileName}`;
}

function getGovGearData() {
	if (!window.gameDB || !window.gameDB.Gov_Gear) {
		return [];
	}
	return window.gameDB.Gov_Gear["GOV Gear"] || window.gameDB.Gov_Gear || [];
}

function getGovGearLevels(dataArray) {
	if (!dataArray?.length) return [0];
	const levels = new Set();
	levels.add(0);
	for (let i = 0; i < dataArray.length; i++) {
		let lvl = dataArray[i].current;
		if (lvl !== undefined && lvl !== null && lvl !== 'null') {
			levels.add(String(lvl));
		}
	}
	for (let i = 0; i < dataArray.length; i++) {
		let lvl = dataArray[i].target;
		if (lvl !== undefined && lvl !== null && lvl !== 'null') {
			levels.add(String(lvl));
		}
	}
	const targetLevels = getGovGearTargetLevels(dataArray);
	if (targetLevels.length) {
		levels.add(targetLevels[targetLevels.length - 1]);
	}
	return Array.from(levels);
}

function getGovGearTargetLevels(dataArray) {
	if (!dataArray?.length) return [];
	const levels = new Set();
	for (const item of dataArray) {
		let lvl = item.target;
		if (lvl !== undefined && lvl !== null && lvl !== 'null') {
			levels.add(String(lvl));
		}
	}
	return Array.from(levels);
}

function buildGearLevelOrder(dataArray) {
	const order = {};
	let index = 1;
	order['0'] = 0;
	const allLevels = [];
	const seen = new Set();
	for (const item of dataArray) {
		let target = item.target;
		if (target !== undefined && target !== null && target !== 'null') {
			const targetStr = String(target);
			if (!seen.has(targetStr)) {
				seen.add(targetStr);
				allLevels.push(targetStr);
			}
		}
	}
	for (let i = 0; i < allLevels.length; i++) {
		order[allLevels[i]] = i + 1;
	}
	return order;
}

function getGearLevelOrder(level, dataArray) {
	if (!level) return 0;
	const levelStr = String(level);
	const orderMap = buildGearLevelOrder(dataArray);
	if (orderMap[levelStr] !== undefined) return orderMap[levelStr];
	const num = parseFloat(levelStr);
	return isNaN(num) ? 0 : num;
}

function getGovGearUpgradeSteps(dataArray, fromLevel, toLevel) {
	const steps = [];
	const fromStr = String(fromLevel);
	const toStr = String(toLevel);
	let start = -1,
		end = -1;
	if (fromStr === '0') {
		for (let i = 0; i < dataArray.length; i++) {
			let curr = dataArray[i].current !== undefined && dataArray[i].current !== null && dataArray[i].current !== 'null' ? String(dataArray[i].current) : null;
			let targ = dataArray[i].target !== undefined && dataArray[i].target !== null && dataArray[i].target !== 'null' ? String(dataArray[i].target) : null;
			if (curr === null || curr === 'null' || curr === undefined) {
				start = i;
				break;
			}
		}
		for (let i = 0; i < dataArray.length; i++) {
			let targ = dataArray[i].target !== undefined && dataArray[i].target !== null && dataArray[i].target !== 'null' ? String(dataArray[i].target) : null;
			if (targ === toStr) {
				end = i;
				break;
			}
		}
		if (start !== -1 && end !== -1 && start <= end) {
			for (let i = start; i <= end; i++) steps.push(dataArray[i]);
			return steps;
		}
	}
	for (let i = 0; i < dataArray.length; i++) {
		let curr = dataArray[i].current !== undefined && dataArray[i].current !== null && dataArray[i].current !== 'null' ? String(dataArray[i].current) : null;
		let targ = dataArray[i].target !== undefined && dataArray[i].target !== null && dataArray[i].target !== 'null' ? String(dataArray[i].target) : null;
		if (curr === fromStr) start = i;
		if (targ === toStr) end = i;
	}
	if (start !== -1 && end !== -1 && start <= end) {
		for (let i = start; i <= end; i++) steps.push(dataArray[i]);
		return steps;
	}
	let current = fromStr;
	const visited = new Set();
	for (let safety = 0; safety < 200; safety++) {
		if (visited.has(current)) break;
		visited.add(current);
		let found = false;
		for (const item of dataArray) {
			let curr = item.current !== undefined && item.current !== null && item.current !== 'null' ? String(item.current) : null;
			let next = item.target !== undefined && item.target !== null && item.target !== 'null' ? String(item.target) : null;
			if (curr === current) {
				steps.push(item);
				current = next;
				found = true;
				if (current === toStr) return steps;
				break;
			}
		}
		if (!found) break;
	}
	return steps;
}

function getGovGearNextLevel(dataArray, fromLevel) {
	const allLevels = getGovGearTargetLevels(dataArray);
	if (!allLevels.length) return null;
	const fromStr = String(fromLevel);
	if (fromStr === '0') {
		for (const item of dataArray) {
			let curr = item.current !== undefined && item.current !== null && item.current !== 'null' ? String(item.current) : null;
			if (curr === null || curr === 'null' || curr === undefined) {
				let next = item.target !== undefined && item.target !== null && item.target !== 'null' ? String(item.target) : null;
				if (next) return next;
			}
		}
		return allLevels[0] || null;
	}
	const fromOrder = getGearLevelOrder(fromStr, dataArray);
	let nextLevel = null;
	let nextOrder = Infinity;
	for (const lvl of allLevels) {
		const order = getGearLevelOrder(lvl, dataArray);
		if (order > fromOrder && order < nextOrder) {
			nextOrder = order;
			nextLevel = lvl;
		}
	}
	return nextLevel;
}

function updateGovGearImages(safeId, gearName, currentLevel, targetLevel) {
	const currentImg = document.getElementById(`gearImgCurrent_${safeId}`);
	if (currentImg) {
		currentImg.src = getGovGearImageFileName(gearName, currentLevel || 'Green');
	}
	const targetImg = document.getElementById(`gearImgTarget_${safeId}`);
	if (targetImg) {
		targetImg.src = getGovGearImageFileName(gearName, targetLevel || 'Green');
	}
}

function createGovGearCard(name, dataArray) {
	if (!dataArray?.length) return '';
	const fromLevels = getGovGearLevels(dataArray);
	const toLevels = getGovGearTargetLevels(dataArray);
	const safeId = `govgear_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	const defaultCurrentImg = getGovGearImageFileName(name, 'Green');
	const defaultTargetImg = getGovGearImageFileName(name, 'Green');
	const sortedFrom = [...fromLevels].sort((a, b) => getGearLevelOrder(a, dataArray) - getGearLevelOrder(b, dataArray));
	const sortedTo = [...toLevels].sort((a, b) => getGearLevelOrder(a, dataArray) - getGearLevelOrder(b, dataArray));
	const currOpts = buildLevelOptions(sortedFrom, 'Current Level', highestLevel, '');
	const targOpts = buildLevelOptions(sortedTo, 'Target Level', highestLevel, '');
	return `<div class="item-card" data-type="govgear" data-name="${name}" data-id="${safeId}">
        <div class="item-card-header" style="display: flex; justify-content: space-evenly; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.7rem; color: var(--text-muted);">Current</span>
                <img loading="lazy" decoding="async" src="${defaultCurrentImg}" onerror="this.style.display='none';" style="height: 50px; width: 50px; object-fit: contain;" id="gearImgCurrent_${safeId}" alt="Current ${name}">
            </div>
            <span style="font-weight: 700; font-size: 0.9rem;">${name}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.7rem; color: var(--text-muted);">Target</span>
                <img loading="lazy" decoding="async" src="${defaultTargetImg}" onerror="this.style.display='none';" style="height: 50px; width: 50px; object-fit: contain;" id="gearImgTarget_${safeId}" alt="Target ${name}">
            </div>
        </div>
        <div class="item-card-body">
            <div class="level-controls">
                <select id="curr_${safeId}" onchange="onGovGearCurrentSelect('${safeId}')">${currOpts}</select>
                <select id="targ_${safeId}" onchange="onGovGearTargetChange('${safeId}')">${targOpts}</select>
            </div>
            <div class="checkbox-group">
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onGovGearUpgradeCheckboxChange('${safeId}', this.checked)"> Upgrade</label>
            </div>
            <div id="status_${safeId}" class="status-pane">Select current & target level</div>
        </div>
    </div>`;
}

function calculateGovGearCosts(dataArray, from, to, vault, otherLocked) {
	let actualFrom = from;
	let actualTo = to;
	const toLevels = getGovGearTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	if (from === 'max') actualFrom = highestLevel;
	if (to === 'max') actualTo = highestLevel;
	if (String(actualFrom) === String(actualTo)) return null;
	const steps = getGovGearUpgradeSteps(dataArray, actualFrom, actualTo);
	if (!steps.length) return null;
	let stepPoints = 0;
	const costTotals = {};
	for (const step of steps) {
		if (step.point) {
			stepPoints += parseCost(step.point) * SCORE_RULES.gov_gear_score;
		}
		if (step.satin) {
			costTotals.satin = (costTotals.satin || 0) + parseCost(step.satin);
		}
		if (step.threads) {
			costTotals.gilded_threads = (costTotals.gilded_threads || 0) + parseCost(step.threads);
		}
		if (step.artisans) {
			costTotals.artisans_vision = (costTotals.artisans_vision || 0) + parseCost(step.artisans);
		}
	}
	return {
		stepPoints,
		costTotals,
		stepsCount: steps.length,
		actualTo: actualTo,
		actualFrom: actualFrom
	};
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
	const cards = document.querySelectorAll('.item-card[data-type="govgear"]');
	const dataArray = getGovGearData();
	for (const card of cards) {
		const name = card.dataset.name;
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
		// CRITICAL FIX: Update images whenever from/to changes
		updateGovGearImages(safeId, name, from, to);
		const toLevels = getGovGearTargetLevels(dataArray);
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
			status.innerHTML = `<strong>GEAR MAXED!</strong><br>Already at highest level (${highestLevel})`;
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
			let costHtml = buildResourceDisplay(costTotals, vault, otherLocked);
			const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
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
		const costs = calculateGovGearCosts(dataArray, from, to, vault, otherLocked);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `Cannot upgrade from ${from} to ${to}`;
			continue;
		}
		const {
			stepPoints,
			costTotals,
			stepsCount,
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
		const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
		if (activeCb) {
			activeCb.disabled = !canAfford;
			activeCb.parentElement.style.opacity = canAfford ? '1' : '0.5';
		}
		if (canAfford) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}</div><br><span class="text-remaining">Click "Upgrade" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${costHtml}</div>`;
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

function onGovGearCurrentSelect(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	const gearName = card ? card.dataset.name : '';
	const dataArray = getGovGearData();
	const to = targ.value;
	// Update images immediately
	updateGovGearImages(safeId, gearName, from, to);
	if (!from || from === '') {
		const toLevels = getGovGearTargetLevels(dataArray);
		const sortedTo = [...toLevels].sort((a, b) => getGearLevelOrder(a, dataArray) - getGearLevelOrder(b, dataArray));
		const highestLevel = sortedTo.length ? sortedTo[sortedTo.length - 1] : '';
		const targOpts = buildLevelOptions(sortedTo, 'Target Level', highestLevel, '');
		targ.innerHTML = targOpts;
		if (lockedUpgrades.has(safeId)) {
			lockedUpgrades.delete(safeId);
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
		}
		refreshCalculations();
		return;
	}
	const toLevels = getGovGearTargetLevels(dataArray);
	const sortedTo = [...toLevels].sort((a, b) => getGearLevelOrder(a, dataArray) - getGearLevelOrder(b, dataArray));
	const highestLevel = sortedTo.length ? sortedTo[sortedTo.length - 1] : '';
	const fromOrder = getGearLevelOrder(from, dataArray);
	if (from === highestLevel) {
		let maxTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
		maxTargOpts += `<option value="${highestLevel}" selected>${highestLevel} (Max)</option>`;
		targ.innerHTML = maxTargOpts;
		if (lockedUpgrades.has(safeId)) {
			lockedUpgrades.delete(safeId);
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
		}
		refreshCalculations();
		return;
	}
	const nextLevel = getGovGearNextLevel(dataArray, from);
	let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
	let hasHigherLevels = false;
	let nextLevelFound = false;
	for (let i = 0; i < sortedTo.length; i++) {
		const order = getGearLevelOrder(sortedTo[i], dataArray);
		if (order > fromOrder) {
			const isMax = String(sortedTo[i]) === String(highestLevel);
			dynamicTargOpts += `<option value="${sortedTo[i]}">${sortedTo[i]}${isMax ? ' (Max)' : ''}</option>`;
			hasHigherLevels = true;
			if (nextLevel && String(sortedTo[i]) === String(nextLevel)) {
				nextLevelFound = true;
			}
		}
	}
	if (!hasHigherLevels) {
		dynamicTargOpts += `<option value="" disabled>No higher levels available</option>`;
	}
	targ.innerHTML = dynamicTargOpts;
	if (nextLevel && nextLevelFound) {
		for (let i = 0; i < targ.options.length; i++) {
			if (String(targ.options[i].value) === String(nextLevel)) {
				targ.selectedIndex = i;
				break;
			}
		}
	} else if (hasHigherLevels && targ.options.length > 1) {
		targ.selectedIndex = 1;
	}
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	refreshCalculations();
}

function onGovGearTargetChange(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	const gearName = card ? card.dataset.name : '';
	const from = curr ? curr.value : '';
	const to = targ ? targ.value : '';
	// Update images immediately
	updateGovGearImages(safeId, gearName, from, to);
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	refreshCalculations();
}

function onGovGearUpgradeCheckboxChange(safeId, isChecked) {
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	if (!card) return;
	const name = card.dataset.name;
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
		const dataArray = getGovGearData();
		const costs = calculateGovGearCosts(dataArray, from, to, vault, otherLocked);
		if (!costs) {
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
			stepsCount: costs.stepsCount,
			toLevel: displayTo,
			fromLevel: from
		});
	} else {
		lockedUpgrades.delete(safeId);
	}
	refreshCalculations();
}

function loadGovGear() {
	const container = document.getElementById('govGearGrid');
	if (!container) return;
	if (!window.gameDB || !window.gameDB.Gov_Gear) {
		console.warn('GOV Gear data not loaded yet, retrying...');
		setTimeout(loadGovGear, 100);
		return;
	}
	container.innerHTML = '';
	container.className = 'items-grid gov-gear-grid';
	const parents = ['Helmet', 'Watch', 'Armor', 'Pant', 'Belt', 'Weapon'];
	const dataArray = getGovGearData();
	for (const parent of parents) {
		container.innerHTML += createGovGearCard(parent, dataArray);
	}
	// Restore locked upgrades first
	for (const [safeId, data] of lockedUpgrades.entries()) {
		if (safeId.startsWith('govgear_')) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = true;
			if (data.toLevel) {
				const targSelect = document.getElementById(`targ_${safeId}`);
				if (targSelect) {
					let valueExists = false;
					for (let i = 0; i < targSelect.options.length; i++) {
						if (targSelect.options[i].value === String(data.toLevel)) {
							valueExists = true;
							break;
						}
					}
					if (valueExists) targSelect.value = String(data.toLevel);
				}
			}
			if (data.fromLevel) {
				const currSelect = document.getElementById(`curr_${safeId}`);
				if (currSelect) {
					let valueExists = false;
					for (let i = 0; i < currSelect.options.length; i++) {
						if (currSelect.options[i].value === String(data.fromLevel)) {
							valueExists = true;
							break;
						}
					}
					if (valueExists) currSelect.value = String(data.fromLevel);
				}
			}
			const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
			if (card) {
				const currSelect = document.getElementById(`curr_${safeId}`);
				const targSelect = document.getElementById(`targ_${safeId}`);
				updateGovGearImages(safeId, card.dataset.name, currSelect ? currSelect.value : 'Green', targSelect ? targSelect.value : 'Green');
			}
		}
	}
	// Restore selections from preset
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		// First restore current levels
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('curr_govgear_')) {
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
		// Apply filtering based on current selections
		document.querySelectorAll('.item-card[data-type="govgear"]').forEach(card => {
			const safeId = card.dataset.id;
			const currSelect = document.getElementById(`curr_${safeId}`);
			if (currSelect && currSelect.value && currSelect.value !== '') {
				onGovGearCurrentSelect(safeId);
			}
		});
		// Now restore target values
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('targ_govgear_')) {
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
	refreshCalculations();
}
window.loadGovGear = loadGovGear;
window.refreshCalculations = refreshCalculations;
window.onGovGearCurrentSelect = onGovGearCurrentSelect;
window.onGovGearTargetChange = onGovGearTargetChange;
window.onGovGearUpgradeCheckboxChange = onGovGearUpgradeCheckboxChange;
window.getGovGearImageFileName = getGovGearImageFileName;
window.updateGovGearImages = updateGovGearImages;
