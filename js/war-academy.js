// ============================================
// WAR ACADEMY - FULLY FIXED (Resources show, Max level works)
// ============================================
function getWarAcademyImageFileName(researchName) {
	const imageMap = {
		'Truegold Battalion (Infantry)': 'truegold_battalion_infantry.webp',
		'Truegold Blades': 'truegold_blades.webp',
		'Truegold Shields': 'truegold_shields.webp',
		'Truegold Legionaries (Infantry)': 'truegold_legionaries_infantry.webp',
		'Truegold Mauls': 'truegold_mauls.webp',
		'Truegold Plating': 'truegold_plating.webp',
		'Truegold Infantry': 'truegold_infantry.webp',
		'Truegold Infantry Healing': 'truegold_infantry_healing.webp',
		'Truegold Infantry Training': 'truegold_infantry_training.webp',
		'Truegold Infantry Aid': 'truegold_infantry_aid.webp',
		'Truegold Battalion (Cavalry)': 'truegold_battalion_cavalry.webp',
		'Truegold Charge': 'truegold_charge.webp',
		'Truegold Farriery': 'truegold_farriery.webp',
		'Truegold Legionaries (Cavalry)': 'truegold_legionaries_cavalry.webp',
		'Truegold Lances': 'truegold_lances.webp',
		'Truegold Platecraft': 'truegold_platecraft.webp',
		'Truegold Cavalry': 'truegold_cavalry.webp',
		'Truegold Cavalry Healing': 'truegold_cavalry_healing.webp',
		'Truegold Cavalry Training': 'truegold_cavalry_training.webp',
		'Truegold Cavalry Aid': 'truegold_cavalry_aid.webp',
		'Truegold Battalion (Archer)': 'truegold_battalion_archer.webp',
		'Truegold Bows': 'truegold_bows.webp',
		'Truegold Bracers': 'truegold_bracers.webp',
		'Truegold Legionaries (Archer)': 'truegold_legionaries_archer.webp',
		'Truegold Arrows': 'truegold_arrows.webp',
		'Truegold Vests': 'truegold_vests.webp',
		'Truegold Archer': 'truegold_archer.webp',
		'Truegold Archer Healing': 'truegold_archer_healing.webp',
		'Truegold Archer Training': 'truegold_archer_training.webp',
		'Truegold Archer Aid': 'truegold_archer_aid.webp',
	};
	if (imageMap[researchName]) {
		return `assets/war_academy/${imageMap[researchName]}`;
	}
	let cleanName = researchName.replace(/[\(\)]/g, '').replace(/\s+/g, ' ').trim();
	if (imageMap[cleanName]) {
		return `assets/war_academy/${imageMap[cleanName]}`;
	}
	const fileName = cleanName.toLowerCase().replace(/ /g, '_') + '.webp';
	return `assets/war_academy/${fileName}`;
}

function getWarAcademyData() {
	const academyData = [];
	const warAcademy = window.gameDB.War_Academy?.["War Academy"];
	if (warAcademy && typeof warAcademy === 'object') {
		for (const researchName in warAcademy) {
			const researchData = warAcademy[researchName];
			if (Array.isArray(researchData) && researchData.length > 0) {
				academyData.push({
					displayName: researchName,
					data: researchData
				});
			}
		}
	}
	return academyData;
}

function getAcademyLevels(dataArray) {
	if (!dataArray?.length) return [0];
	const levels = new Set();
	levels.add(0);
	for (let i = 0; i < dataArray.length - 1; i++) {
		let lvl = dataArray[i].level ?? dataArray[i].current_lvl ?? dataArray[i].current;
		if (lvl !== undefined) levels.add(lvl);
	}
	const targetLevels = getAcademyTargetLevels(dataArray);
	if (targetLevels.length) {
		levels.add(targetLevels[targetLevels.length - 1]);
	}
	return Array.from(levels).sort((a, b) => parseFloat(a) - parseFloat(b));
}

function getAcademyTargetLevels(dataArray) {
	if (!dataArray?.length) return [];
	const levels = new Set();
	for (const item of dataArray) {
		let lvl = item.level ?? item.target_lvl ?? item.target;
		if (lvl !== undefined) levels.add(lvl);
	}
	return Array.from(levels).sort((a, b) => parseFloat(a) - parseFloat(b));
}

function getAcademyUpgradeSteps(dataArray, fromLevel, toLevel) {
	const steps = [];
	const fromStr = String(fromLevel);
	const toStr = String(toLevel);
	if (fromStr === '0') {
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
	for (let safety = 0; safety < 200; safety++) {
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

function getAcademyNextLevel(dataArray, fromLevel) {
	const allLevels = getAcademyTargetLevels(dataArray);
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
	const currentNum = parseFloat(fromLevel);
	for (const lvl of allLevels) {
		if (parseFloat(lvl) > currentNum) {
			return lvl;
		}
	}
	return null;
}

function createAcademyIndividualCard(item, dataArray) {
	if (!dataArray?.length) return '';
	const fromLevels = getAcademyLevels(dataArray);
	const toLevels = getAcademyTargetLevels(dataArray);
	const safeId = `academy_${item.displayName.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	const imgUrl = getWarAcademyImageFileName(item.displayName);
	// CRITICAL FIX: Use buildLevelOptions which properly handles "Max" detection
	const currOpts = buildLevelOptions(fromLevels, 'Current Level', highestLevel, '');
	const targOpts = buildLevelOptions(toLevels, 'Target Level', highestLevel, '');
	return `<div class="item-card" data-type="academy" data-name="${item.displayName}" data-id="${safeId}" style="margin-bottom: 10px;">
        <div class="item-card-header" style="padding: 8px 12px; background: var(--surface-dark);">
            <img loading="lazy" decoding="async" src="${imgUrl}" onerror="this.style.display='none';" alt="${item.displayName}" style="height: 60px; width: 60px; object-fit: contain;">
            <span style="font-size: 0.85rem;">${item.displayName}</span>
        </div>
        <div class="item-card-body" style="padding: 8px 12px;">
            <div class="level-controls" style="gap: 8px;">
                <select id="curr_${safeId}" onchange="onAcademyCurrentSelect('${safeId}', '${item.displayName}')">${currOpts}</select>
                <select id="targ_${safeId}" onchange="onAcademyTargetChange('${safeId}')">${targOpts}</select>
            </div>
            <div class="checkbox-group" style="gap: 8px;">
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px;">
                    <input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onAcademyUpgradeCheckboxChange('${safeId}', this.checked)"> Upgrade
                </label>
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px;">
                    <input class="checkbox" type="checkbox" id="speed_${safeId}" onchange="onAcademySpeedupChange('${safeId}', this.checked)"> +Speedups
                </label>
            </div>
            <div id="status_${safeId}" class="status-pane" style="font-size: 0.7rem; padding: 6px 8px;">Select current & target level</div>
        </div>
    </div>`;
}

function createAcademyGroupCard(categoryName, items, iconPath) {
	let itemsHtml = '';
	for (const item of items) {
		itemsHtml += createAcademyIndividualCard(item, item.data);
	}
	return `
        <div class="item-card" style="border: 1px solid #999; margin-bottom: 16px;">
            <div class="item-card-header" style="background: var(--surface-dark); border-bottom: 2px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 10px;">
                <img loading="lazy" decoding="async" src="${iconPath}" style="height: 32px; width: 32px; object-fit: contain;" onerror="this.style.display='none'" alt="${categoryName}">
                <span style="font-size: 1.1rem;">${categoryName} RESEARCH</span>
                <span style="font-size: 0.7rem; color: var(--text-muted); margin-left: auto;">${items.length} technologies</span>
            </div>
            <div class="item-card-body" style="padding: 12px;">
                <div class="items-grid" style="grid-template-columns: 1fr; gap: 10px;">
                    ${itemsHtml}
                </div>
            </div>
        </div>
    `;
}

function getBuffedTime(originalSeconds) {
	if (typeof window.applyResearchSpeedupBuffs === 'function') {
		return window.applyResearchSpeedupBuffs(originalSeconds);
	}
	return originalSeconds;
}

function calculateAcademyCosts(dataArray, from, to, speedCheck, vault, otherLocked) {
	let actualFrom = from;
	let actualTo = to;
	const toLevels = getAcademyTargetLevels(dataArray);
	const highestLevel = toLevels[toLevels.length - 1];
	if (from === 'max') actualFrom = highestLevel;
	if (to === 'max') actualTo = highestLevel;
	if (String(actualFrom) === String(actualTo)) return null;
	const steps = getAcademyUpgradeSteps(dataArray, actualFrom, actualTo);
	if (!steps.length) return null;
	let stepPoints = 0,
		totalTimeSeconds = 0;
	const costTotals = {};
	for (const step of steps) {
		if (step.truegold_dust) {
			stepPoints += parseCost(step.truegold_dust) * SCORE_RULES.truegold_dust;
		}
		if (step.time) totalTimeSeconds += parseTimeToSeconds(step.time);
		const keys = ['bread', 'wood', 'stone', 'iron', 'gold', 'truegold', 'tempered_truegold', 'truegold_dust', 'forgehammer', 'widgets', 'mithril', 'satin', 'gilded_threads', 'artisans_vision', 'charm_guide', 'charm_design', 'pet_food', 'growth_manual', 'nutrient_potion', 'promotion_medallion'];
		for (const k of keys) {
			if (step[k] !== undefined && step[k] !== null) {
				const norm = k === 'forgehammer' ? 'forge_hammer' : (k === 'truegold_dust' ? 'truegold_dust' : k);
				costTotals[norm] = (costTotals[norm] || 0) + parseCost(step[k]);
			}
		}
	}
	let actualSpeedupUsed = 0,
		partialNote = '';
	if (totalTimeSeconds > 0 && speedCheck) {
		const buffedTimeSeconds = getBuffedTime(totalTimeSeconds);
		const speedupCostMinutes = secondsToSpeedupMinutes(buffedTimeSeconds);
		const speedKey = 'research_speedup';
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
		actualTo: actualTo,
		actualFrom: actualFrom
	};
}
// ============================================
// CRITICAL FIX: refreshCalculations - Custom implementation for War Academy
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
	const cards = document.querySelectorAll('.item-card[data-type="academy"]');
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
		// Get the specific research data
		const academyItems = getWarAcademyData();
		const item = academyItems.find(i => `academy_${i.displayName.replace(/[^a-zA-Z0-9]/g, '_')}` === safeId);
		if (!item) continue;
		const dataArray = item.data;
		const toLevels = getAcademyTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
		// CRITICAL FIX: Properly detect max level
		const isAtMax = highestLevel && String(from) === String(highestLevel);
		if (isAtMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>TECH MAXED!</strong><br>Already at highest level (${highestLevel})`;
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
				stepsCount,
				partialNote
			} = locked;
			if (speedCb && speedCb.checked !== locked.speedupWasChecked) speedCb.checked = locked.speedupWasChecked;
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
			const partialHtml = partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : '';
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>ACTIVE${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}${partialHtml}</div>`;
			totalScore += stepPoints;
			if (activeCb) activeCb.disabled = false;
			if (speedCb) speedCb.disabled = false;
			continue;
		}
		const speedCheck = speedCb?.checked || false;
		// For non-locked upgrades, totalLocked already excludes this upgrade
		const otherLocked = {};
		for (const [res, amt] of Object.entries(totalLocked)) {
			if (!res.startsWith('_')) {
				otherLocked[res] = amt;
			}
		}
		const costs = calculateAcademyCosts(dataArray, from, to, speedCheck, vault, otherLocked);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `Cannot upgrade from ${from} to ${to}`;
			continue;
		}
		const {
			stepPoints,
			costTotals,
			stepsCount,
			partialNote,
			totalTimeSeconds
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
		const partialHtml = partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : '';
		const timeHtml = totalTimeSeconds > 0 ? `<div class="resource-tag">Total Time: ${formatSecondsToTime(getBuffedTime(totalTimeSeconds))}</div>` : '';
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
			const speedKey = 'research_speedup';
			const hasSpeedups = (vault[speedKey] || 0) > 0;
			const canUseSpeedup = canAfford && hasSpeedups;
			speedCb.disabled = !canUseSpeedup;
			speedCb.parentElement.style.opacity = canUseSpeedup ? '1' : '0.5';
			if (!canUseSpeedup) {
				speedCb.parentElement.classList.add('disabled');
				speedCb.parentElement.title = !hasSpeedups ? 'No research speedups in vault' : 'Insufficient resources';
			} else {
				speedCb.parentElement.classList.remove('disabled');
				speedCb.parentElement.title = '';
			}
		}
		if (canAfford) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}${timeHtml}${partialHtml}</div><br><span class="text-remaining">Click "Upgrade" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${costHtml}${timeHtml}${partialHtml}</div>`;
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

function onAcademyCurrentSelect(safeId, name) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	const activeCb = document.getElementById(`active_${safeId}`);
	const speedCb = document.getElementById(`speed_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	const academyItems = getWarAcademyData();
	const item = academyItems.find(i => `academy_${i.displayName.replace(/[^a-zA-Z0-9]/g, '_')}` === safeId);
	if (!item) return;
	const dataArray = item.data;
	const toLevels = getAcademyTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	if (!from || from === '') {
		const targOpts = buildLevelOptions(toLevels, 'Target Level', highestLevel, '');
		targ.innerHTML = targOpts;
		if (lockedUpgrades.has(safeId)) lockedUpgrades.delete(safeId);
		if (activeCb) {
			activeCb.checked = false;
			activeCb.disabled = true;
		}
		if (speedCb) {
			speedCb.checked = false;
			speedCb.disabled = true;
		}
		refreshCalculations();
		return;
	}
	// CRITICAL FIX: Check if current level is max
	if (from === highestLevel) {
		let maxTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
		maxTargOpts += `<option value="${highestLevel}" selected>${highestLevel} (Max)</option>`;
		targ.innerHTML = maxTargOpts;
		if (lockedUpgrades.has(safeId)) lockedUpgrades.delete(safeId);
		if (activeCb) {
			activeCb.checked = false;
			activeCb.disabled = true;
		}
		if (speedCb) {
			speedCb.checked = false;
			speedCb.disabled = true;
		}
		refreshCalculations();
		return;
	}
	const currentNum = parseFloat(from);
	const next = getAcademyNextLevel(dataArray, from);
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
	// CRITICAL FIX: Always show Max option if not already in list
	if (!hasHigherLevels && highestLevel) {
		dynamicTargOpts += `<option value="${highestLevel}" selected>${highestLevel} (Max)</option>`;
	} else if (highestLevel && !toLevels.includes(highestLevel)) {
		dynamicTargOpts += `<option value="${highestLevel}">${highestLevel} (Max)</option>`;
	}
	targ.innerHTML = dynamicTargOpts;
	if (next !== null && next !== undefined) {
		for (let i = 0; i < targ.options.length; i++) {
			if (String(targ.options[i].value) === String(next)) {
				targ.selectedIndex = i;
				break;
			}
		}
	} else if (targ.options.length > 1) {
		targ.selectedIndex = 1;
	}
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		if (activeCb) activeCb.checked = false;
	}
	refreshCalculations();
}

function onAcademyTargetChange(safeId) {
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	refreshCalculations();
}

function onAcademyUpgradeCheckboxChange(safeId, isChecked) {
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
		if (from === '' || to === '' || String(from) === String(to)) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			return;
		}
		const academyItems = getWarAcademyData();
		const item = academyItems.find(i => `academy_${i.displayName.replace(/[^a-zA-Z0-9]/g, '_')}` === safeId);
		if (!item) return;
		const dataArray = item.data;
		const toLevels = getAcademyTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
		if (from === highestLevel) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			refreshCalculations();
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
		const costs = calculateAcademyCosts(dataArray, from, to, speedCheck, vault, otherLocked);
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
			toLevel: displayTo,
			fromLevel: from
		});
	} else {
		lockedUpgrades.delete(safeId);
	}
	refreshCalculations();
}

function onAcademySpeedupChange(safeId, isChecked) {
	if (lockedUpgrades.has(safeId)) {
		const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
		if (!card) return;
		const name = card.dataset.name;
		const curr = document.getElementById(`curr_${safeId}`);
		const targ = document.getElementById(`targ_${safeId}`);
		if (curr && targ) {
			const from = curr.value;
			const to = targ.value;
			if (from !== '' && to !== '' && String(from) !== String(to)) {
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
				const academyItems = getWarAcademyData();
				const item = academyItems.find(i => `academy_${i.displayName.replace(/[^a-zA-Z0-9]/g, '_')}` === safeId);
				if (item) {
					const dataArray = item.data;
					const costs = calculateAcademyCosts(dataArray, from, to, isChecked, vault, otherLocked);
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
							toLevel: displayTo,
							fromLevel: from
						});
					}
				}
			}
		}
	}
	refreshCalculations();
}

function loadWarAcademy() {
	const container = document.getElementById('academyGrid');
	if (!container) return;
	if (!window.gameDB || !window.gameDB.War_Academy) {
		console.warn('War Academy data not loaded yet, retrying...');
		setTimeout(loadWarAcademy, 100);
		return;
	}
	container.innerHTML = '';
	const allItems = getWarAcademyData();
	const categoryGroups = {
		'INFANTRY': {
			techs: ['Truegold Battalion (Infantry)', 'Truegold Blades', 'Truegold Shields', 'Truegold Legionaries (Infantry)', 'Truegold Mauls', 'Truegold Plating', 'Truegold Infantry', 'Truegold Infantry Healing', 'Truegold Infantry Training', 'Truegold Infantry Aid'],
			icon: 'assets/Infantry.webp'
		},
		'CAVALRY': {
			techs: ['Truegold Battalion (Cavalry)', 'Truegold Charge', 'Truegold Farriery', 'Truegold Legionaries (Cavalry)', 'Truegold Lances', 'Truegold Platecraft', 'Truegold Cavalry', 'Truegold Cavalry Healing', 'Truegold Cavalry Training', 'Truegold Cavalry Aid'],
			icon: 'assets/Cavalry.webp'
		},
		'ARCHER': {
			techs: ['Truegold Battalion (Archer)', 'Truegold Bows', 'Truegold Bracers', 'Truegold Legionaries (Archer)', 'Truegold Arrows', 'Truegold Vests', 'Truegold Archer', 'Truegold Archer Healing', 'Truegold Archer Training', 'Truegold Archer Aid'],
			icon: 'assets/Archer.webp'
		}
	};
	for (const [categoryName, group] of Object.entries(categoryGroups)) {
		const categoryItems = [];
		for (const techName of group.techs) {
			const item = allItems.find(i => i.displayName === techName);
			if (item) categoryItems.push(item);
		}
		if (categoryItems.length > 0) {
			container.innerHTML += createAcademyGroupCard(categoryName, categoryItems, group.icon);
		}
	}
	// Restore selections
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('curr_academy_') || id.startsWith('targ_academy_')) {
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
		if (safeId.startsWith('academy_')) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = true;
			const speedCb = document.getElementById(`speed_${safeId}`);
			if (speedCb && data.speedupWasChecked !== undefined) speedCb.checked = data.speedupWasChecked;
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
		}
	}
	refreshCalculations();
}
window.loadWarAcademy = loadWarAcademy;
window.refreshCalculations = refreshCalculations;
window.onAcademyCurrentSelect = onAcademyCurrentSelect;
window.onAcademyTargetChange = onAcademyTargetChange;
window.onAcademyUpgradeCheckboxChange = onAcademyUpgradeCheckboxChange;
window.onAcademySpeedupChange = onAcademySpeedupChange;
