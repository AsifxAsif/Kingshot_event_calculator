// ============================================
// GOV GEAR - UPGRADE SYSTEM WITH DUAL IMAGES
// ============================================
// ============================================
// IMAGE MAPPING
// ============================================
function getGovGearImageFileName(gearName, levelName) {
	// Map gear names to folder prefix
	const gearMap = {
		'Head': 'cavalry_gear_1',
		'Watch': 'cavalry_gear_2',
		'Body': 'infantry_gear_1',
		'Pant': 'infantry_gear_2',
		'Belt': 'archery_gear_1',
		'Shoe': 'archery_gear_2'
	};
	const prefix = gearMap[gearName] || gearName.toLowerCase().replace(/ /g, '_');
	// Parse the level name to extract color, tier, and stars
	let color = 'green';
	let tier = '0';
	let stars = '0';
	// Only parse if levelName exists and is not '0' or empty
	if (levelName && String(levelName).trim() !== '' && String(levelName).trim() !== '0') {
		const levelStr = String(levelName).trim();
		// Extract color
		if (levelStr.toLowerCase().includes('green')) color = 'green';
		else if (levelStr.toLowerCase().includes('blue')) color = 'blue';
		else if (levelStr.toLowerCase().includes('purple')) color = 'purple';
		else if (levelStr.toLowerCase().includes('gold')) color = 'gold';
		else if (levelStr.toLowerCase().includes('red')) color = 'red';
		// Extract tier (T1, T2, T3, T4, T5, T6)
		const tierMatch = levelStr.match(/T([0-9])/i);
		if (tierMatch) {
			tier = tierMatch[1];
		}
		// Count stars (⭐ characters)
		const starCount = (levelStr.match(/⭐/g) || []).length;
		stars = String(starCount);
	}
	// Build filename: {prefix}_{color}_t{tier}_s{stars}.png
	const fileName = `${prefix}_${color}_t${tier}_s${stars}.png`;
	return `assets/gov_gears/${fileName}`;
}
// ============================================
// DATA ACCESS FUNCTIONS
// ============================================
function getGovGearData() {
	if (!window.gameDB || !window.gameDB.Gov_Gear) {
		console.warn('GOV Gear data not loaded');
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
// Build level order dynamically from the data
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
// ============================================
// UPDATE IMAGES WHEN LEVEL CHANGES
// ============================================
function updateGovGearImages(safeId, gearName, currentLevel, targetLevel) {
	// Update current level image
	const currentImg = document.getElementById(`gearImgCurrent_${safeId}`);
	if (currentImg) {
		const currentSrc = getGovGearImageFileName(gearName, currentLevel || 'Green');
		currentImg.src = currentSrc;
	}
	// Update target level image
	const targetImg = document.getElementById(`gearImgTarget_${safeId}`);
	if (targetImg) {
		const targetSrc = getGovGearImageFileName(gearName, targetLevel || 'Green');
		targetImg.src = targetSrc;
	}
}
// ============================================
// CREATE GOV GEAR CARD (WITH DUAL IMAGES)
// ============================================
function createGovGearCard(name, dataArray) {
	if (!dataArray?.length) return '';
	const fromLevels = getGovGearLevels(dataArray);
	const toLevels = getGovGearTargetLevels(dataArray);
	const safeId = `govgear_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	// Default images - use Green (green_t0_s0)
	const defaultCurrentImg = getGovGearImageFileName(name, 'Green');
	const defaultTargetImg = getGovGearImageFileName(name, 'Green');
	const sortedFrom = [...fromLevels].sort((a, b) => getGearLevelOrder(a, dataArray) - getGearLevelOrder(b, dataArray));
	const sortedTo = [...toLevels].sort((a, b) => getGearLevelOrder(a, dataArray) - getGearLevelOrder(b, dataArray));
	let currOpts = '<option value="" disabled selected hidden>Current Level</option>';
	const validFrom = sortedFrom.filter(l => l !== 'null' && l !== 'undefined' && l !== '');
	for (let i = 0; i < validFrom.length; i++) {
		currOpts += `<option value="${validFrom[i]}">${validFrom[i]}</option>`;
	}
	if (highestLevel && !validFrom.includes(highestLevel)) {
		currOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
	}
	let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
	const validTo = sortedTo.filter(l => l !== 'null' && l !== 'undefined' && l !== '');
	for (let i = 0; i < validTo.length; i++) {
		targOpts += `<option value="${validTo[i]}">${validTo[i]}</option>`;
	}
	if (highestLevel && !validTo.includes(highestLevel)) {
		targOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
	}
	return `<div class="item-card" data-type="govgear" data-name="${name}" data-id="${safeId}">
        <div class="item-card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.7rem; color: var(--text-muted);">Current</span>
                <img src="${defaultCurrentImg}" onerror="this.style.display='none';" style="height: 50px; width: 50px; object-fit: contain;" id="gearImgCurrent_${safeId}">
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.7rem; color: var(--text-muted);">Target</span>
                <img src="${defaultTargetImg}" onerror="this.style.display='none';" style="height: 50px; width: 50px; object-fit: contain;" id="gearImgTarget_${safeId}">
            </div>
            <span style="font-weight: 700; font-size: 0.9rem;">${name}</span>
        </div>
        <div class="item-card-body">
            <div class="level-controls">
                <select id="curr_${safeId}" onchange="onGovGearCurrentSelect('${safeId}')">${currOpts}</select>
                <select id="targ_${safeId}" onchange="onGovGearTargetChange('${safeId}')">${targOpts}</select>
            </div>
            <div class="checkbox-group">
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onGovGearUpgradeCheckboxChange('${safeId}', this.checked)"> ⬆️ Upgrade</label>
            </div>
            <div id="status_${safeId}" class="status-pane">⚙️ Select current & target level</div>
        </div>
    </div>`;
}
// ============================================
// CALCULATE COSTS
// ============================================
function calculateGovGearCosts(dataArray, from, to, vault, otherLocked) {
	let actualFrom = from;
	let actualTo = to;
	const toLevels = getGovGearTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	if (from === 'max') actualFrom = highestLevel;
	if (to === 'max') actualTo = highestLevel;
	if (String(actualFrom) === String(actualTo)) {
		return null;
	}
	const steps = getGovGearUpgradeSteps(dataArray, actualFrom, actualTo);
	if (!steps.length) return null;
	let stepPoints = 0;
	const costTotals = {};
	for (const step of steps) {
		if (step.point) {
			stepPoints += parseCost(step.point);
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
// REFRESH CALCULATIONS
// ============================================
function refreshCalculations() {
	let vault = getCurrentVault();
	const totalLocked = {};
	for (const [_, ld] of lockedUpgrades.entries()) {
		for (const [res, amt] of Object.entries(ld.costTotals)) {
			totalLocked[res] = (totalLocked[res] || 0) + amt;
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
		// Update images based on selections
		updateGovGearImages(safeId, name, from, to);
		if (!from || from === '' || !to || to === '') {
			status.className = "status-pane";
			status.innerHTML = `⚙️ Select current & target level`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			continue;
		}
		const toLevels = getGovGearTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
		const isAtMax = highestLevel && String(from) === String(highestLevel);
		if (isAtMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `🏆 <strong>GEAR MAXED!</strong><br>Already at highest level (${highestLevel})`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
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
			continue;
		}
		if (isLocked) {
			const locked = lockedUpgrades.get(safeId);
			const {
				stepPoints,
				costTotals,
				stepsCount
			} = locked;
			let costHtml = '';
			for (const [res, amt] of Object.entries(costTotals)) {
				const remaining = (vault[res] || 0) - (totalLocked[res] || 0);
				const disp = res.replace(/_/g, ' ');
				const img = getImageFileName(res);
				const req = formatNumber(amt);
				if (remaining < 0) {
					const short = formatNumber(-remaining);
					costHtml += `<div class="resource-tag"><img src="${img}" onerror="this.style.display='none';"> ${disp}: ${req} <span class="text-deficit">(${short} short)</span></div>`;
				} else {
					const left = formatNumber(remaining);
					costHtml += `<div class="resource-tag"><img src="${img}" onerror="this.style.display='none';"> ${disp}: ${req} <span class="text-remaining">(${left} remaining)</span></div>`;
				}
			}
			if (!Object.keys(costTotals).length) costHtml = '<span>✨ No resources required</span>';
			const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>✓ ACTIVE${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}</div>`;
			totalScore += stepPoints;
			if (activeCb) activeCb.disabled = false;
			continue;
		}
		const otherLocked = {};
		for (const [oid, ld] of lockedUpgrades.entries()) {
			if (oid !== safeId) {
				for (const [res, amt] of Object.entries(ld.costTotals)) {
					otherLocked[res] = (otherLocked[res] || 0) + amt;
				}
			}
		}
		const costs = calculateGovGearCosts(dataArray, from, to, vault, otherLocked);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `❌ Cannot upgrade from ${from} to ${to}`;
			continue;
		}
		const {
			stepPoints,
			costTotals,
			stepsCount
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
			const disp = res.replace(/_/g, ' ');
			const img = getImageFileName(res);
			const req = formatNumber(amt);
			if (remaining < 0) {
				const short = formatNumber(-remaining);
				costHtml += `<div class="resource-tag"><img src="${img}" onerror="this.style.display='none';"> ${disp}: ${req} <span class="text-deficit">(${short} short)</span></div>`;
			} else {
				const left = formatNumber(remaining);
				costHtml += `<div class="resource-tag"><img src="${img}" onerror="this.style.display='none';"> ${disp}: ${req} <span class="text-remaining">(${left} remaining)</span></div>`;
			}
		}
		if (!Object.keys(costTotals).length) costHtml = '<span>✨ No resources required</span>';
		const stepsInfo = stepsCount > 1 ? ` (${stepsCount} levels)` : '';
		if (activeCb) {
			if (!canAfford) {
				activeCb.disabled = true;
				activeCb.parentElement.style.opacity = '0.5';
			} else {
				activeCb.disabled = false;
				activeCb.parentElement.style.opacity = '1';
			}
		}
		if (canAfford) {
			status.className = "status-pane";
			status.innerHTML = `<strong>⚪ ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}</div><br><span class="text-remaining">✓ Click "Upgrade" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>✗ INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${costHtml}</div>`;
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
// EVENT HANDLERS
// ============================================
function onGovGearCurrentSelect(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	const gearName = card ? card.dataset.name : '';
	const dataArray = getGovGearData();
	// Update images with current selection
	const to = targ.value;
	updateGovGearImages(safeId, gearName, from, to);
	if (!from || from === '') {
		let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
		const toLevels = getGovGearTargetLevels(dataArray);
		const sortedTo = [...toLevels].sort((a, b) => getGearLevelOrder(a, dataArray) - getGearLevelOrder(b, dataArray));
		const validTo = sortedTo.filter(l => l && l !== 'null' && l !== 'undefined' && l !== '');
		for (let i = 0; i < validTo.length; i++) {
			targOpts += `<option value="${validTo[i]}">${validTo[i]}</option>`;
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
	const toLevels = getGovGearTargetLevels(dataArray);
	const sortedTo = [...toLevels].sort((a, b) => getGearLevelOrder(a, dataArray) - getGearLevelOrder(b, dataArray));
	const validTo = sortedTo.filter(l => l && l !== 'null' && l !== 'undefined' && l !== '');
	const highestLevel = validTo.length ? validTo[validTo.length - 1] : '';
	const fromOrder = getGearLevelOrder(from, dataArray);
	if (from === highestLevel) {
		let maxTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
		maxTargOpts += `<option value="${highestLevel}" selected>${highestLevel}</option>`;
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
	for (let i = 0; i < validTo.length; i++) {
		const order = getGearLevelOrder(validTo[i], dataArray);
		if (order > fromOrder) {
			dynamicTargOpts += `<option value="${validTo[i]}">${validTo[i]}</option>`;
			hasHigherLevels = true;
			if (nextLevel && String(validTo[i]) === String(nextLevel)) {
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
	// Update images with new target selection
	const from = curr ? curr.value : '';
	const to = targ ? targ.value : '';
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
					otherLocked[res] = (otherLocked[res] || 0) + amt;
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
			stepsCount: costs.stepsCount,
			toLevel: displayTo,
			fromLevel: from
		});
	} else {
		lockedUpgrades.delete(safeId);
	}
	refreshCalculations();
}
// ============================================
// LOAD GOV GEAR
// ============================================
function loadGovGear() {
	const container = document.getElementById('govGearGrid');
	if (!container) return;
	container.innerHTML = '';
	const parents = ['Head', 'Watch', 'Body', 'Pant', 'Belt', 'Shoe'];
	const dataArray = getGovGearData();
	for (const parent of parents) {
		container.innerHTML += createGovGearCard(parent, dataArray);
	}
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
					if (valueExists) {
						targSelect.value = String(data.toLevel);
					}
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
					if (valueExists) {
						currSelect.value = String(data.fromLevel);
					}
				}
			}
			// Update images for restored state
			const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
			if (card) {
				const currSelect = document.getElementById(`curr_${safeId}`);
				const targSelect = document.getElementById(`targ_${safeId}`);
				updateGovGearImages(safeId, card.dataset.name, currSelect ? currSelect.value : 'Green', targSelect ? targSelect.value : 'Green');
			}
		}
	}
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
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
					if (valueExists) {
						element.value = value;
					}
				}
			}
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
					if (valueExists) {
						element.value = value;
					}
				}
			}
		}
		// Update all images after restoring selections
		document.querySelectorAll('.item-card[data-type="govgear"]').forEach(card => {
			const safeId = card.dataset.id;
			const currSelect = document.getElementById(`curr_${safeId}`);
			const targSelect = document.getElementById(`targ_${safeId}`);
			if (currSelect && targSelect) {
				updateGovGearImages(safeId, card.dataset.name, currSelect.value || 'Green', targSelect.value || 'Green');
			}
		});
	}
	refreshCalculations();
}
// ============================================
// EXPORTS
// ============================================
window.loadGovGear = loadGovGear;
window.refreshCalculations = refreshCalculations;
window.onGovGearCurrentSelect = onGovGearCurrentSelect;
window.onGovGearTargetChange = onGovGearTargetChange;
window.onGovGearUpgradeCheckboxChange = onGovGearUpgradeCheckboxChange;
window.getGovGearImageFileName = getGovGearImageFileName;
window.updateGovGearImages = updateGovGearImages;
