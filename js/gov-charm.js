// ============================================
// GOV CHARM - FULLY FIXED (Clean dropdowns + Group Set All)
// ============================================
function getGovCharmImageFileName(charmName, levelName) {
	const typeMap = {
		'Helmet': 'cavalry',
		'Watch': 'cavalry',
		'Armor': 'infantry',
		'Pant': 'infantry',
		'Belt': 'archery',
		'Weapon': 'archery'
	};
	let baseType = 'infantry';
	const match = charmName.match(/^(Helmet|Watch|Armor|Pant|Belt|Weapon)/);
	if (match) baseType = match[1];
	const type = typeMap[baseType] || 'infantry';
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
				if (numMatch) level = numMatch[1];
			}
		}
	}
	const fileName = `${type}_lvl${level}.webp`;
	return `assets/gov_charms/${fileName}`;
}

function getGovCharmData() {
	if (!window.gameDB || !window.gameDB.Gov_Charm) {
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
	const targetLevels = getGovCharmTargetLevels(dataArray);
	if (targetLevels.length) {
		levels.add(targetLevels[targetLevels.length - 1]);
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

function updateGovCharmImages(safeId, charmName, currentLevel, targetLevel) {
	const currentImg = document.getElementById(`charmImgCurrent_${safeId}`);
	if (currentImg) {
		currentImg.src = getGovCharmImageFileName(charmName, currentLevel || '1');
	}
	const targetImg = document.getElementById(`charmImgTarget_${safeId}`);
	if (targetImg) {
		targetImg.src = getGovCharmImageFileName(charmName, targetLevel || '1');
	}
}
// ============================================
// FIXED: Build level options with clean display (just numbers)
// ============================================
function buildCleanLevelOptions(levels, placeholder, highestLevel, selectedValue) {
	let opts = `<option value="" disabled selected hidden>${placeholder || 'Select Level'}</option>`;
	if (!levels || !levels.length) return opts;
	for (const level of levels) {
		const display = String(level);
		const isMax = String(level) === String(highestLevel);
		const selected = String(level) === String(selectedValue) ? 'selected' : '';
		// CRITICAL FIX: Display just the number without "Level " prefix
		const cleanDisplay = display.replace(/^Level\s*/i, '');
		opts += `<option value="${display}" ${selected}>${cleanDisplay}${isMax ? ' (Max)' : ''}</option>`;
	}
	if (highestLevel && !levels.some(l => String(l) === String(highestLevel))) {
		const selected = String(highestLevel) === String(selectedValue) ? 'selected' : '';
		const cleanDisplay = String(highestLevel).replace(/^Level\s*/i, '');
		opts += `<option value="${highestLevel}" ${selected}>${cleanDisplay} (Max)</option>`;
	}
	return opts;
}

function createIndividualCharmCard(charmName, charmNumber, dataArray) {
	const fromLevels = getGovCharmLevels(dataArray);
	const toLevels = getGovCharmTargetLevels(dataArray);
	const safeId = `govcharm_${charmName.replace(/[^a-zA-Z0-9]/g, '_')}_${charmNumber}`;
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	const defaultCurrentImg = getGovCharmImageFileName(charmName, '1');
	const defaultTargetImg = getGovCharmImageFileName(charmName, '1');
	const sortedFrom = [...fromLevels].sort((a, b) => getCharmLevelOrder(a, dataArray) - getCharmLevelOrder(b, dataArray));
	const sortedTo = [...toLevels].sort((a, b) => getCharmLevelOrder(a, dataArray) - getCharmLevelOrder(b, dataArray));
	// Use clean level options (just numbers)
	const currOpts = buildCleanLevelOptions(sortedFrom, 'Current', highestLevel, '');
	const targOpts = buildCleanLevelOptions(sortedTo, 'Target', highestLevel, '');
	return `
        <div class="item-card" data-type="govcharm" data-name="${charmName}" data-charm-number="${charmNumber}" data-id="${safeId}" style="margin-bottom: 10px;">
            <div class="item-card-header" style="display: flex; justify-content: space-evenly; align-items: center; padding: 8px 12px; background: var(--surface-dark);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.7rem; color: var(--text-muted);">Current</span>
                    <img loading="lazy" decoding="async" src="${defaultCurrentImg}" onerror="this.style.display='none';" style="height: 50px; width: 50px; object-fit: contain;" id="charmImgCurrent_${safeId}" alt="Current ${charmName}">
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.7rem; color: var(--text-muted);">Target</span>
                    <img loading="lazy" decoding="async" src="${defaultTargetImg}" onerror="this.style.display='none';" style="height: 50px; width: 50px; object-fit: contain;" id="charmImgTarget_${safeId}" alt="Target ${charmName}">
                </div>
            </div>
            <div class="item-card-body" style="padding: 8px 12px;">
                <div class="level-controls" style="gap: 8px;">
                    <select id="curr_${safeId}" onchange="onGovCharmCurrentSelect('${safeId}')">${currOpts}</select>
                    <select id="targ_${safeId}" onchange="onGovCharmTargetChange('${safeId}')">${targOpts}</select>
                </div>
                <div class="checkbox-group" style="gap: 8px;">
                    <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px; height: auto; min-height: 32px;">
                        <input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onGovCharmUpgradeCheckboxChange('${safeId}', this.checked)"> Upgrade
                    </label>
                </div>
                <div id="status_${safeId}" class="status-pane" style="font-size: 0.7rem; padding: 6px 8px;">Select current & target level</div>
            </div>
        </div>
    `;
}
// ============================================
// NEW: Group Set All Functions
// ============================================
function setGroupCurrentLevel(groupType, value) {
	const cards = document.querySelectorAll(`.item-card[data-type="govcharm"]`);
	const cleanValue = String(value).trim();
	if (!cleanValue) return;
	// Find the numeric part (e.g., "3" from "3" or "Level 3")
	let numericLevel = cleanValue.replace(/^Level\s*/i, '');
	for (const card of cards) {
		// Only apply to cards in this group
		const cardName = card.dataset.name;
		if (!cardName.includes(groupType)) continue;
		const safeId = card.dataset.id;
		const currSelect = document.getElementById(`curr_${safeId}`);
		if (!currSelect) continue;
		// Find if the value exists in options
		let valueExists = false;
		for (let i = 0; i < currSelect.options.length; i++) {
			const optionValue = currSelect.options[i].value;
			// Check if the numeric part matches
			const optionNumeric = String(optionValue).replace(/^Level\s*/i, '');
			if (optionNumeric === numericLevel || optionValue === numericLevel) {
				currSelect.selectedIndex = i;
				valueExists = true;
				break;
			}
		}
		// If value doesn't exist, try to find closest match
		if (!valueExists && currSelect.options.length > 1) {
			// Try to find exact number match
			for (let i = 0; i < currSelect.options.length; i++) {
				const optionValue = currSelect.options[i].value;
				if (String(optionValue) === numericLevel) {
					currSelect.selectedIndex = i;
					valueExists = true;
					break;
				}
			}
		}
		// Trigger change event
		if (currSelect) {
			currSelect.dispatchEvent(new Event('change', {
				bubbles: true
			}));
		}
	}
	refreshCalculations();
}

function setGroupTargetLevel(groupType, value) {
	const cards = document.querySelectorAll(`.item-card[data-type="govcharm"]`);
	const cleanValue = String(value).trim();
	if (!cleanValue) return;
	// Find the numeric part (e.g., "3" from "3" or "Level 3")
	let numericLevel = cleanValue.replace(/^Level\s*/i, '');
	for (const card of cards) {
		const cardName = card.dataset.name;
		if (!cardName.includes(groupType)) continue;
		const safeId = card.dataset.id;
		const targSelect = document.getElementById(`targ_${safeId}`);
		if (!targSelect) continue;
		// Find if the value exists in options
		let valueExists = false;
		for (let i = 0; i < targSelect.options.length; i++) {
			const optionValue = targSelect.options[i].value;
			const optionNumeric = String(optionValue).replace(/^Level\s*/i, '');
			if (optionNumeric === numericLevel || optionValue === numericLevel) {
				targSelect.selectedIndex = i;
				valueExists = true;
				break;
			}
		}
		if (!valueExists && targSelect.options.length > 1) {
			// Try to find exact number match
			for (let i = 0; i < targSelect.options.length; i++) {
				const optionValue = targSelect.options[i].value;
				if (String(optionValue) === numericLevel) {
					targSelect.selectedIndex = i;
					valueExists = true;
					break;
				}
			}
		}
		if (targSelect) {
			targSelect.dispatchEvent(new Event('change', {
				bubbles: true
			}));
		}
	}
	refreshCalculations();
}

function createGovCharmGroupCard(groupName, charmNames, dataArray) {
	const iconMap = {
		'Helmet': 'assets/Cavalry.webp',
		'Watch': 'assets/Cavalry.webp',
		'Armor': 'assets/Infantry.webp',
		'Pant': 'assets/Infantry.webp',
		'Belt': 'assets/Archer.webp',
		'Weapon': 'assets/Archer.webp'
	};
	const iconPath = iconMap[groupName] || 'assets/Infantry.webp';
	let charmsHtml = '';
	for (let i = 0; i < charmNames.length; i++) {
		charmsHtml += createIndividualCharmCard(charmNames[i], i + 1, dataArray);
	}
	// Build safe group name for input IDs
	const groupSafeId = groupName.toLowerCase();
	return `
        <div class="item-card" style="border: 1px solid #999; margin-bottom: 16px;">
            <div class="item-card-header" style="background: var(--surface-dark); border-bottom: 2px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <img loading="lazy" decoding="async" src="${iconPath}" style="height: 32px; width: 32px; object-fit: contain;" onerror="this.style.display='none'" alt="${groupName}">
                <span style="font-size: 1.1rem;">${groupName} Charms</span>
            </div>
            <div class="item-card-body" style="padding: 12px;">
                <!-- NEW: Group Set All Controls -->
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.03); border-radius: 8px; border: 1px solid #d0d0d0;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">Set All Current:</span>
                        <input type="text" id="setCurrent_${groupSafeId}" placeholder="e.g., 3" style="width: 100px; padding: 4px 8px; text-align: center; border-radius: 4px; border: 1px solid #d0d0d0; background: var(--surface); box-shadow: var(--shadow-inset); font-weight: 700;">
                        <button class="preset-btn" onclick="setGroupCurrentLevel('${groupName}', document.getElementById('setCurrent_${groupSafeId}').value)" style="padding: 4px 12px; font-size: 0.7rem;">Apply</button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">Set All Target:</span>
                        <input type="text" id="setTarget_${groupSafeId}" placeholder="e.g., 4" style="width: 100px; padding: 4px 8px; text-align: center; border-radius: 4px; border: 1px solid #d0d0d0; background: var(--surface); box-shadow: var(--shadow-inset); font-weight: 700;">
                        <button class="preset-btn" onclick="setGroupTargetLevel('${groupName}', document.getElementById('setTarget_${groupSafeId}').value)" style="padding: 4px 12px; font-size: 0.7rem;">Apply</button>
                    </div>
                </div>
                ${charmsHtml}
            </div>
        </div>
    `;
}

function calculateGovCharmCosts(dataArray, from, to, vault, otherLocked) {
	let actualFrom = from;
	let actualTo = to;
	const toLevels = getGovCharmTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	if (from === 'max') actualFrom = highestLevel;
	if (to === 'max') actualTo = highestLevel;
	if (String(actualFrom) === String(actualTo)) return null;
	const steps = getGovCharmUpgradeSteps(dataArray, actualFrom, actualTo);
	if (!steps.length) return null;
	let stepPoints = 0;
	const costTotals = {};
	for (const step of steps) {
		if (step.point) {
			stepPoints += parseCost(step.point) * SCORE_RULES.gov_charm_score;
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
	const cards = document.querySelectorAll('.item-card[data-type="govcharm"]');
	const dataArray = getGovCharmData();
	for (const card of cards) {
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
		// Update images when levels change
		updateGovCharmImages(safeId, card.dataset.name, from, to);
		const toLevels = getGovCharmTargetLevels(dataArray);
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
			status.innerHTML = `<strong>CHARM MAXED!</strong><br>Already at highest level (${highestLevel})`;
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
		const costs = calculateGovCharmCosts(dataArray, from, to, vault, otherLocked);
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

function onGovCharmCurrentSelect(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	const charmName = card ? card.dataset.name : '';
	const dataArray = getGovCharmData();
	const to = targ.value;
	// Update images immediately
	updateGovCharmImages(safeId, charmName, from, to);
	if (!from || from === '') {
		const toLevels = getGovCharmTargetLevels(dataArray);
		const sortedTo = [...toLevels].sort((a, b) => getCharmLevelOrder(a, dataArray) - getCharmLevelOrder(b, dataArray));
		const highestLevel = sortedTo.length ? sortedTo[sortedTo.length - 1] : '';
		const targOpts = buildCleanLevelOptions(sortedTo, 'Target', highestLevel, '');
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
	const highestLevel = sortedTo.length ? sortedTo[sortedTo.length - 1] : '';
	const fromOrder = getCharmLevelOrder(from, dataArray);
	if (from === highestLevel) {
		let maxTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
		const cleanDisplay = String(highestLevel).replace(/^Level\s*/i, '');
		maxTargOpts += `<option value="${highestLevel}" selected>${cleanDisplay} (Max)</option>`;
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
	for (let i = 0; i < sortedTo.length; i++) {
		const order = getCharmLevelOrder(sortedTo[i], dataArray);
		if (order > fromOrder) {
			const isMax = String(sortedTo[i]) === String(highestLevel);
			const cleanDisplay = String(sortedTo[i]).replace(/^Level\s*/i, '');
			dynamicTargOpts += `<option value="${sortedTo[i]}">${cleanDisplay}${isMax ? ' (Max)' : ''}</option>`;
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

function onGovCharmTargetChange(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	const charmName = card ? card.dataset.name : '';
	const from = curr ? curr.value : '';
	const to = targ ? targ.value : '';
	// Update images immediately
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
					if (!res.startsWith('_')) {
						otherLocked[res] = (otherLocked[res] || 0) + amt;
					}
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

function loadGovCharm() {
	const container = document.getElementById('govCharmGrid');
	if (!container) return;
	if (!window.gameDB || !window.gameDB.Gov_Charm) {
		console.warn('GOV Charm data not loaded yet, retrying...');
		setTimeout(loadGovCharm, 100);
		return;
	}
	container.innerHTML = '';
	container.className = 'items-grid gov-charm-grid';
	const dataArray = getGovCharmData();
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
		type: 'Weapon',
		charms: ['Weapon Charm #1', 'Weapon Charm #2', 'Weapon Charm #3']
	}];
	for (const group of charmGroups) {
		container.innerHTML += createGovCharmGroupCard(group.type, group.charms, dataArray);
	}
	// CRITICAL FIX: Auto-filter target dropdowns based on current selections
	document.querySelectorAll('.item-card[data-type="govcharm"]').forEach(card => {
		const safeId = card.dataset.id;
		const currSelect = document.getElementById(`curr_${safeId}`);
		if (currSelect && currSelect.value && currSelect.value !== '') {
			onGovCharmCurrentSelect(safeId);
		}
	});
	// Restore selections from preset
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('curr_govcharm_') || id.startsWith('targ_govcharm_')) {
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
	// Restore locked upgrades
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
				updateGovCharmImages(safeId, card.dataset.name, currSelect ? currSelect.value : '1', targSelect ? targSelect.value : '1');
			}
		}
	}
	refreshCalculations();
}
// Expose group set functions globally
window.setGroupCurrentLevel = setGroupCurrentLevel;
window.setGroupTargetLevel = setGroupTargetLevel;
window.loadGovCharm = loadGovCharm;
window.refreshCalculations = refreshCalculations;
window.onGovCharmCurrentSelect = onGovCharmCurrentSelect;
window.onGovCharmTargetChange = onGovCharmTargetChange;
window.onGovCharmUpgradeCheckboxChange = onGovCharmUpgradeCheckboxChange;
window.getGovCharmImageFileName = getGovCharmImageFileName;
window.updateGovCharmImages = updateGovCharmImages;
