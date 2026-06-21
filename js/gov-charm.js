// ============================================
// IMAGE MAPPING
// ============================================
function getGovCharmImageFileName(charmName, levelName) {
	const typeMap = {
		'Helmet': 'cavalry',
		'Watch': 'cavalry',
		'Armor': 'infantry',
		'Pant': 'infantry',
		'Belt': 'archery',
		'Boot': 'archery'
	};
	// Extract base type from full charm name
	let baseType = 'infantry'; // fallback
	const match = charmName.match(/^(Helmet|Watch|Armor|Pant|Belt|Boot)/);
	if (match) {
		baseType = match[1];
	}
	const type = typeMap[baseType] || 'infantry';
	// DEFAULT: Level 1 (since no lvl0 image exists)
	let level = '1';
	if (levelName) {
		const levelStr = String(levelName).trim();
		if (levelStr === '0' || levelStr === '') {
			level = '1';
		} else {
			const levelMatch = levelStr.match(/Level\s*(\d+)/i);
			if (levelMatch) {
				level = levelMatch[1];
			} else {
				const numMatch = levelStr.match(/(\d+)/);
				if (numMatch) {
					level = numMatch[1];
				}
			}
		}
	}
	const fileName = `${type}_lvl${level}.png`;
	return `assets/gov_charms/${fileName}`;
}
// ============================================
// DATA ACCESS FUNCTIONS
// ============================================
function getGovCharmData() {
	if (!window.gameDB || !window.gameDB.Gov_Charm) {
		console.warn('GOV Charm data not loaded');
		return [];
	}
	return window.gameDB.Gov_Charm["GOV Charm"] || window.gameDB.Gov_Charm || [];
}

function getGovCharmLevels(dataArray) {
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

function getGovCharmTargetLevels(dataArray) {
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
function buildCharmLevelOrder(dataArray) {
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

function getCharmLevelOrder(level, dataArray) {
	if (!level) return 0;
	const levelStr = String(level);
	const orderMap = buildCharmLevelOrder(dataArray);
	if (orderMap[levelStr] !== undefined) return orderMap[levelStr];
	const num = parseFloat(levelStr);
	return isNaN(num) ? 0 : num;
}

function getGovCharmUpgradeSteps(dataArray, fromLevel, toLevel) {
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

function getGovCharmNextLevel(dataArray, fromLevel) {
	const allLevels = getGovCharmTargetLevels(dataArray);
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
	const fromOrder = getCharmLevelOrder(fromStr, dataArray);
	let nextLevel = null;
	let nextOrder = Infinity;
	for (const lvl of allLevels) {
		const order = getCharmLevelOrder(lvl, dataArray);
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
function updateGovCharmImages(safeId, charmName, currentLevel, targetLevel) {
	const currentImg = document.getElementById(`charmImgCurrent_${safeId}`);
	if (currentImg) {
		const currentSrc = getGovCharmImageFileName(charmName, currentLevel || 'Level 1');
		currentImg.src = currentSrc;
	}
	const targetImg = document.getElementById(`charmImgTarget_${safeId}`);
	if (targetImg) {
		const targetSrc = getGovCharmImageFileName(charmName, targetLevel || 'Level 1');
		targetImg.src = targetSrc;
	}
}
// ============================================
// CREATE INDIVIDUAL CHARM CARD (for use inside group)
// ============================================
function createIndividualCharmCard(charmName, charmNumber, dataArray) {
	const fromLevels = getGovCharmLevels(dataArray);
	const toLevels = getGovCharmTargetLevels(dataArray);
	const safeId = `govcharm_${charmName.replace(/[^a-zA-Z0-9]/g, '_')}_${charmNumber}`;
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	// Default images - use Level 1
	const defaultCurrentImg = getGovCharmImageFileName(charmName, 'Level 1');
	const defaultTargetImg = getGovCharmImageFileName(charmName, 'Level 1');
	const sortedFrom = [...fromLevels].sort((a, b) => getCharmLevelOrder(a, dataArray) - getCharmLevelOrder(b, dataArray));
	const sortedTo = [...toLevels].sort((a, b) => getCharmLevelOrder(a, dataArray) - getCharmLevelOrder(b, dataArray));
	// Build current level dropdown
	let currOpts = '<option value="" disabled selected hidden>Current Level</option>';
	const validFrom = sortedFrom.filter(l => l !== 'null' && l !== 'undefined' && l !== '');
	for (let i = 0; i < validFrom.length; i++) {
		currOpts += `<option value="${validFrom[i]}">${validFrom[i]}</option>`;
	}
	if (highestLevel && !validFrom.includes(highestLevel)) {
		currOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
	}
	// Build target dropdown
	let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
	const validTo = sortedTo.filter(l => l !== 'null' && l !== 'undefined' && l !== '');
	for (let i = 0; i < validTo.length; i++) {
		targOpts += `<option value="${validTo[i]}">${validTo[i]}</option>`;
	}
	if (highestLevel && !validTo.includes(highestLevel)) {
		targOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
	}
	return `
        <div class="item-card" data-type="govcharm" data-name="${charmName}" data-charm-number="${charmNumber}" data-id="${safeId}" style="margin-bottom: 10px;">
            <div class="item-card-header" style="display: flex; justify-content: space-evenly; align-items: center; padding: 8px 12px; background: #d8d8d8;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.7rem; color: var(--text-muted);">Current</span>
                    <img src="${defaultCurrentImg}" onerror="this.style.display='none';" style="height: 40px; width: 40px; object-fit: contain;" id="charmImgCurrent_${safeId}">
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.7rem; color: var(--text-muted);">Target</span>
                    <img src="${defaultTargetImg}" onerror="this.style.display='none';" style="height: 40px; width: 40px; object-fit: contain;" id="charmImgTarget_${safeId}">
                </div>
            </div>
            <div class="item-card-body" style="padding: 8px 12px;">
                <div class="level-controls" style="gap: 8px;">
                    <select id="curr_${safeId}" onchange="onGovCharmCurrentSelect('${safeId}')">${currOpts}</select>
                    <select id="targ_${safeId}" onchange="onGovCharmTargetChange('${safeId}')">${targOpts}</select>
                </div>
                <div class="checkbox-group" style="gap: 8px;">
                    <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px; height: auto; min-height: 32px;">
                        <input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onGovCharmUpgradeCheckboxChange('${safeId}', this.checked)"> ⬆️ Upgrade
                    </label>
                </div>
                <div id="status_${safeId}" class="status-pane" style="font-size: 0.7rem; padding: 6px 8px;">⚙️ Select current & target level</div>
            </div>
        </div>
    `;
}
// ============================================
// CREATE GROUP CARD (contains multiple charms)
// ============================================
function createGovCharmGroupCard(groupName, charmNames, dataArray) {
	// Map group name to icon path
	const iconMap = {
		'Helmet': 'assets/cavalry.png',
		'Watch': 'assets/cavalry.png',
		'Armor': 'assets/infantry.png',
		'Pant': 'assets/infantry.png',
		'Belt': 'assets/archer.png',
		'Boot': 'assets/archer.png'
	};
	const iconPath = iconMap[groupName] || 'assets/infantry.png';
	let charmsHtml = '';
	for (let i = 0; i < charmNames.length; i++) {
		charmsHtml += createIndividualCharmCard(charmNames[i], i + 1, dataArray);
	}
	return `
        <div class="item-card" style="border: 1px solid #999; margin-bottom: 16px;">
            <div class="item-card-header" style="background: #c8c8c8; border-bottom: 1px solid #888; display: flex; align-items: center; gap: 10px;">
                <img src="${iconPath}" style="height: 32px; width: 32px; object-fit: contain;" onerror="this.style.display='none'">
                <span style="font-size: 1.1rem;">${groupName} Charms</span>
                <span style="font-size: 0.7rem; color: var(--text-muted); margin-left: auto;">${charmNames.length} charms</span>
            </div>
            <div class="item-card-body" style="padding: 12px;">
                ${charmsHtml}
            </div>
        </div>
    `;
}
// ============================================
// CALCULATE COSTS
// ============================================
function calculateGovCharmCosts(dataArray, from, to, vault, otherLocked) {
	let actualFrom = from;
	let actualTo = to;
	const toLevels = getGovCharmTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	if (from === 'max') actualFrom = highestLevel;
	if (to === 'max') actualTo = highestLevel;
	if (String(actualFrom) === String(actualTo)) {
		return null;
	}
	const steps = getGovCharmUpgradeSteps(dataArray, actualFrom, actualTo);
	if (!steps.length) return null;
	let stepPoints = 0;
	const costTotals = {};
	for (const step of steps) {
		if (step.point) {
			stepPoints += parseCost(step.point);
		}
		if (step.guides) {
			costTotals.charm_guide = (costTotals.charm_guide || 0) + parseCost(step.guides);
		}
		if (step.designs) {
			costTotals.charm_design = (costTotals.charm_design || 0) + parseCost(step.designs);
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
	const cards = document.querySelectorAll('.item-card[data-type="govcharm"]');
	const dataArray = getGovCharmData();
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
		updateGovCharmImages(safeId, name, from, to);
		if (!from || from === '' || !to || to === '') {
			status.className = "status-pane";
			status.innerHTML = `⚙️ Select current & target level`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			continue;
		}
		const toLevels = getGovCharmTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
		const isAtMax = highestLevel && String(from) === String(highestLevel);
		if (isAtMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `🏆 <strong>CHARM MAXED!</strong><br>Already at highest level (${highestLevel})`;
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
		const costs = calculateGovCharmCosts(dataArray, from, to, vault, otherLocked);
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
function onGovCharmCurrentSelect(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	const charmName = card ? card.dataset.name : '';
	const dataArray = getGovCharmData();
	const to = targ.value;
	updateGovCharmImages(safeId, charmName, from, to);
	if (!from || from === '') {
		let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
		const toLevels = getGovCharmTargetLevels(dataArray);
		const sortedTo = [...toLevels].sort((a, b) => getCharmLevelOrder(a, dataArray) - getCharmLevelOrder(b, dataArray));
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
	const toLevels = getGovCharmTargetLevels(dataArray);
	const sortedTo = [...toLevels].sort((a, b) => getCharmLevelOrder(a, dataArray) - getCharmLevelOrder(b, dataArray));
	const validTo = sortedTo.filter(l => l && l !== 'null' && l !== 'undefined' && l !== '');
	const highestLevel = validTo.length ? validTo[validTo.length - 1] : '';
	const fromOrder = getCharmLevelOrder(from, dataArray);
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
	const nextLevel = getGovCharmNextLevel(dataArray, from);
	let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
	let hasHigherLevels = false;
	let nextLevelFound = false;
	for (let i = 0; i < validTo.length; i++) {
		const order = getCharmLevelOrder(validTo[i], dataArray);
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

function onGovCharmTargetChange(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	const charmName = card ? card.dataset.name : '';
	const from = curr ? curr.value : '';
	const to = targ ? targ.value : '';
	updateGovCharmImages(safeId, charmName, from, to);
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	refreshCalculations();
}

function onGovCharmUpgradeCheckboxChange(safeId, isChecked) {
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
		const dataArray = getGovCharmData();
		const costs = calculateGovCharmCosts(dataArray, from, to, vault, otherLocked);
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
// LOAD GOV CHARM
// ============================================
function loadGovCharm() {
	const container = document.getElementById('govCharmGrid');
	if (!container) return;
	container.innerHTML = '';
	const dataArray = getGovCharmData();
	// Define charm groups - each group has a type and the charm names
	const charmGroups = [{
		type: 'Helmet',
		charms: ['Helmet Charm #1', 'Helmet Charm #2', 'Helmet Charm #3']
	}, {
		type: 'Watch',
		charms: ['Watch Charm #1', 'Watch Charm #2', 'Watch Charm #3']
	}, {
		type: 'Armor',
		charms: ['Armor Charm #1', 'Armor Charm #2', 'Armor Charm #3']
	}, {
		type: 'Pant',
		charms: ['Pant Charm #1', 'Pant Charm #2', 'Pant Charm #3']
	}, {
		type: 'Belt',
		charms: ['Belt Charm #1', 'Belt Charm #2', 'Belt Charm #3']
	}, {
		type: 'Boot',
		charms: ['Boot Charm #1', 'Boot Charm #2', 'Boot Charm #3']
	}];
	// Create group cards
	for (const group of charmGroups) {
		container.innerHTML += createGovCharmGroupCard(group.type, group.charms, dataArray);
	}
	// Restore locked upgrades and selections from preset
	for (const [safeId, data] of lockedUpgrades.entries()) {
		if (safeId.startsWith('govcharm_')) {
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
			const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
			if (card) {
				const currSelect = document.getElementById(`curr_${safeId}`);
				const targSelect = document.getElementById(`targ_${safeId}`);
				updateGovCharmImages(safeId, card.dataset.name, currSelect ? currSelect.value : 'Level 1', targSelect ? targSelect.value : 'Level 1');
			}
		}
	}
	// Restore current level selections from preset selections
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('curr_govcharm_')) {
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
			if (id.startsWith('targ_govcharm_')) {
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
		document.querySelectorAll('.item-card[data-type="govcharm"]').forEach(card => {
			const safeId = card.dataset.id;
			const currSelect = document.getElementById(`curr_${safeId}`);
			const targSelect = document.getElementById(`targ_${safeId}`);
			if (currSelect && targSelect) {
				updateGovCharmImages(safeId, card.dataset.name, currSelect.value || 'Level 1', targSelect.value || 'Level 1');
			}
		});
	}
	// ============================================
	// FORCE 2 COLUMN LAYOUT FOR GOV CHARM PAGE
	// ============================================
	// Remove any existing resize listener to prevent duplicates
	if (window._govCharmResizeHandler) {
		window.removeEventListener('resize', window._govCharmResizeHandler);
	}
	const resizeHandler = function() {
		if (window.innerWidth > 768) {
			container.style.gridTemplateColumns = 'repeat(2, 1fr)';
		} else {
			container.style.gridTemplateColumns = '1fr';
		}
	};
	// Store reference to remove later
	window._govCharmResizeHandler = resizeHandler;
	// Apply initial layout
	resizeHandler();
	// Add resize listener
	window.addEventListener('resize', resizeHandler);
	refreshCalculations();
}
// ============================================
// EXPORTS
// ============================================
window.loadGovCharm = loadGovCharm;
window.refreshCalculations = refreshCalculations;
window.onGovCharmCurrentSelect = onGovCharmCurrentSelect;
window.onGovCharmTargetChange = onGovCharmTargetChange;
window.onGovCharmUpgradeCheckboxChange = onGovCharmUpgradeCheckboxChange;
window.getGovCharmImageFileName = getGovCharmImageFileName;
window.updateGovCharmImages = updateGovCharmImages;
