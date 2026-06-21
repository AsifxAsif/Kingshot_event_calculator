function getWarAcademyImageFileName(researchName) {
	const imageMap = {
		'Truegold Battalion (Infantry)': 'truegold_battalion_infantry.png',
		'Truegold Blades': 'truegold_blades.png',
		'Truegold Shields': 'truegold_shields.png',
		'Truegold Legionaries (Infantry)': 'truegold_legionaries_infantry.png',
		'Truegold Mauls': 'truegold_mauls.png',
		'Truegold Plating': 'truegold_plating.png',
		'Truegold Infantry': 'truegold_infantry.png',
		'Truegold Infantry Healing': 'truegold_infantry_healing.png',
		'Truegold Infantry Training': 'truegold_infantry_training.png',
		'Truegold Infantry Aid': 'truegold_infantry_aid.png',
		'Truegold Battalion (Cavalry)': 'truegold_battalion_cavalry.png',
		'Truegold Charge': 'truegold_charge.png',
		'Truegold Farriery': 'truegold_farriery.png',
		'Truegold Legionaries (Cavalry)': 'truegold_legionaries_cavalry.png',
		'Truegold Lances': 'truegold_lances.png',
		'Truegold Platecraft': 'truegold_platecraft.png',
		'Truegold Cavalry': 'truegold_cavalry.png',
		'Truegold Cavalry Healing': 'truegold_cavalry_healing.png',
		'Truegold Cavalry Training': 'truegold_cavalry_training.png',
		'Truegold Cavalry Aid': 'truegold_cavalry_aid.png',
		'Truegold Battalion (Archer)': 'truegold_battalion_archer.png',
		'Truegold Bows': 'truegold_bows.png',
		'Truegold Bracers': 'truegold_bracers.png',
		'Truegold Legionaries (Archer)': 'truegold_legionaries_archer.png',
		'Truegold Arrows': 'truegold_arrows.png',
		'Truegold Vests': 'truegold_vests.png',
		'Truegold Archer': 'truegold_archer.png',
		'Truegold Archer Healing': 'truegold_archer_healing.png',
		'Truegold Archer Training': 'truegold_archer_training.png',
		'Truegold Archer Aid': 'truegold_archer_aid.png',
	};
	if (imageMap[researchName]) {
		return `assets/war_academy/${imageMap[researchName]}`;
	}
	let cleanName = researchName.replace(/[\(\)]/g, '').replace(/\s+/g, ' ').trim();
	if (imageMap[cleanName]) {
		return `assets/war_academy/${imageMap[cleanName]}`;
	}
	const fileName = cleanName.toLowerCase().replace(/ /g, '_') + '.png';
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
	const fromStr = String(fromLevel),
		toStr = String(toLevel);
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
	// If fromLevel is already the highest, return null
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
// ============================================
// CREATE INDIVIDUAL RESEARCH CARD (for use inside group)
// ============================================
function createAcademyIndividualCard(item, dataArray) {
	if (!dataArray?.length) return '';
	const fromLevels = getAcademyLevels(dataArray);
	const toLevels = getAcademyTargetLevels(dataArray);
	const safeId = `academy_${item.displayName.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const maxTargetLvl = toLevels[toLevels.length - 1];
	if (!fromLevels.includes(maxTargetLvl)) {
		fromLevels.push(maxTargetLvl);
		fromLevels.sort((a, b) => parseFloat(a) - parseFloat(b));
	}
	// Build current level dropdown
	let currOpts = '<option value="" disabled selected hidden>Current Level</option>';
	for (let i = 0; i < fromLevels.length; i++) {
		currOpts += `<option value="${fromLevels[i]}">${fromLevels[i]}</option>`;
	}
	// Build target dropdown - SHOW ALL LEVELS (NO "Max" option)
	let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
	for (let i = 0; i < toLevels.length; i++) {
		targOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
	}
	const imgUrl = getWarAcademyImageFileName(item.displayName);
	return `<div class="item-card" data-type="academy" data-name="${item.displayName}" data-id="${safeId}" style="margin-bottom: 10px;">
        <div class="item-card-header" style="padding: 8px 12px; background: #d8d8d8;">
            <img src="${imgUrl}" onerror="this.style.display='none';" style="height: 40px; width: 40px; object-fit: contain;">
            <span style="font-size: 0.85rem;">${item.displayName}</span>
        </div>
        <div class="item-card-body" style="padding: 8px 12px;">
            <div class="level-controls" style="gap: 8px;">
                <select id="curr_${safeId}" onchange="onAcademyCurrentSelect('${safeId}', '${item.displayName}')">${currOpts}</select>
                <select id="targ_${safeId}" onchange="onAcademyTargetChange('${safeId}')">${targOpts}</select>
            </div>
            <div class="checkbox-group" style="gap: 8px;">
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px; height: auto; min-height: 32px;">
                    <input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onAcademyUpgradeCheckboxChange('${safeId}', this.checked)"> ⬆️ Upgrade
                </label>
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px; height: auto; min-height: 32px;">
                    <input class="checkbox" type="checkbox" id="speed_${safeId}" onchange="onAcademySpeedupChange('${safeId}', this.checked)"> ⏩ +Speedups
                </label>
            </div>
            <div id="status_${safeId}" class="status-pane" style="font-size: 0.7rem; padding: 6px 8px;">⚙️ Select current & target level</div>
        </div>
    </div>`;
}
// ============================================
// CREATE GROUP CARD (contains multiple research items)
// ============================================
function createAcademyGroupCard(categoryName, items, iconPath) {
	let itemsHtml = '';
	for (const item of items) {
		itemsHtml += createAcademyIndividualCard(item, item.data);
	}
	return `
        <div class="item-card" style="border: 1px solid #999; margin-bottom: 16px;">
            <div class="item-card-header" style="background: #c8c8c8; border-bottom: 1px solid #888; display: flex; align-items: center; gap: 10px;">
                <img src="${iconPath}" style="height: 32px; width: 32px; object-fit: contain;" onerror="this.style.display='none'">
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
	if (from === 'max') {
		actualFrom = highestLevel;
	}
	if (to === 'max') {
		actualTo = highestLevel;
	}
	if (String(actualFrom) === String(actualTo)) {
		return null;
	}
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
		actualTo: actualTo,
		actualFrom: actualFrom
	};
}

function refreshCalculations() {
	let vault = getCurrentVault();
	const totalLocked = {};
	for (const [_, ld] of lockedUpgrades.entries()) {
		for (const [res, amt] of Object.entries(ld.costTotals)) totalLocked[res] = (totalLocked[res] || 0) + amt;
	}
	let totalScore = 0;
	const cards = document.querySelectorAll('.item-card[data-type="academy"]');
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
		const academyItems = getWarAcademyData();
		const item = academyItems.find(i => `academy_${i.displayName.replace(/[^a-zA-Z0-9]/g, '_')}` === safeId);
		if (!item) continue;
		const dataArray = item.data;
		const toLevels = getAcademyTargetLevels(dataArray);
		const absoluteMaxLevel = String(toLevels[toLevels.length - 1]);
		if (from === '' || to === '') {
			status.className = "status-pane";
			status.innerHTML = `⚙️ Select current & target level`;
			if (activeCb) activeCb.disabled = true;
			if (speedCb) speedCb.disabled = true;
			continue;
		}
		if (from === absoluteMaxLevel) {
			status.className = "status-pane status-ok";
			status.innerHTML = `✨ <strong>Technology Maxed Out</strong><br>This research has already achieved its highest level.`;
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
			if (activeCb) activeCb.disabled = true;
			if (speedCb) {
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
				let disp = res.replace(/_/g, ' ');
				if (res === 'truegold_dust') {
					disp = 'truegold dust';
				}
				const img = getImageFileName(res === 'truegold_dust' ? 'truegold_dust' : res);
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
		const costs = calculateAcademyCosts(item.data, from, to, speedCheck, vault, otherLocked);
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
			partialNote
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
			let disp = res.replace(/_/g, ' ');
			if (res === 'truegold_dust') {
				disp = 'truegold dust';
			}
			const img = getImageFileName(res === 'truegold_dust' ? 'truegold_dust' : res);
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
		} else {
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

function onAcademyCurrentSelect(safeId, name) {
	const curr = document.getElementById(`curr_${safeId}`),
		targ = document.getElementById(`targ_${safeId}`);
	const activeCb = document.getElementById(`active_${safeId}`);
	const speedCb = document.getElementById(`speed_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	const academyItems = getWarAcademyData();
	const item = academyItems.find(i => `academy_${i.displayName.replace(/[^a-zA-Z0-9]/g, '_')}` === safeId);
	if (!item) return;
	const toLevels = getAcademyTargetLevels(item.data);
	const absoluteMaxLevel = String(toLevels[toLevels.length - 1]);
	// If "Current Level" placeholder is selected, show ALL levels
	if (!from || from === '') {
		let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
		for (let i = 0; i < toLevels.length; i++) {
			targOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
		}
		targ.innerHTML = targOpts;
		if (lockedUpgrades.has(safeId)) {
			lockedUpgrades.delete(safeId);
		}
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
	if (from === absoluteMaxLevel) {
		let maxTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
		maxTargOpts += `<option value="${absoluteMaxLevel}" selected>${absoluteMaxLevel}</option>`;
		targ.innerHTML = maxTargOpts;
		targ.value = absoluteMaxLevel;
		if (lockedUpgrades.has(safeId)) {
			lockedUpgrades.delete(safeId);
		}
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
	const next = getAcademyNextLevel(item.data, from);
	// Dynamically rebuild target dropdown - only show levels above current (NO "Max" option)
	let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
	for (let i = 0; i < toLevels.length; i++) {
		const targetNum = parseFloat(toLevels[i]);
		if (targetNum > currentNum) {
			dynamicTargOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
		}
	}
	targ.innerHTML = dynamicTargOpts;
	// Auto-select the next logical level if it exists
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
		const curr = document.getElementById(`curr_${safeId}`),
			targ = document.getElementById(`targ_${safeId}`);
		const speedCb = document.getElementById(`speed_${safeId}`);
		if (!curr || !targ) return;
		const from = curr.value,
			to = targ.value,
			speedCheck = speedCb?.checked || false;
		if (from === '' || to === '' || String(from) === String(to)) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			return;
		}
		const academyItems = getWarAcademyData();
		const item = academyItems.find(i => `academy_${i.displayName.replace(/[^a-zA-Z0-9]/g, '_')}` === safeId);
		if (!item) return;
		const toLevels = getAcademyTargetLevels(item.data);
		const absoluteMaxLevel = String(toLevels[toLevels.length - 1]);
		if (from === absoluteMaxLevel) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			refreshCalculations();
			return;
		}
		const vault = getCurrentVault();
		let otherLocked = {};
		for (const [oid, ld] of lockedUpgrades.entries())
			if (oid !== safeId) {
				for (const [res, amt] of Object.entries(ld.costTotals)) otherLocked[res] = (otherLocked[res] || 0) + amt;
			}
		const costs = calculateAcademyCosts(item.data, from, to, speedCheck, vault, otherLocked);
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
		const curr = document.getElementById(`curr_${safeId}`),
			targ = document.getElementById(`targ_${safeId}`);
		if (curr && targ) {
			const from = curr.value,
				to = targ.value;
			if (from !== '' && to !== '' && String(from) !== String(to)) {
				const vault = getCurrentVault();
				let otherLocked = {};
				for (const [oid, ld] of lockedUpgrades.entries())
					if (oid !== safeId) {
						for (const [res, amt] of Object.entries(ld.costTotals)) otherLocked[res] = (otherLocked[res] || 0) + amt;
					}
				const academyItems = getWarAcademyData();
				const item = academyItems.find(i => `academy_${i.displayName.replace(/[^a-zA-Z0-9]/g, '_')}` === safeId);
				if (item) {
					const costs = calculateAcademyCosts(item.data, from, to, isChecked, vault, otherLocked);
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
// ============================================
// LOAD WAR ACADEMY
// ============================================
function loadWarAcademy() {
	const container = document.getElementById('academyGrid');
	if (!container) return;
	container.innerHTML = '';
	const allItems = getWarAcademyData();
	// Define category groups
	const categoryGroups = {
		'INFANTRY': {
			techs: ['Truegold Battalion (Infantry)', 'Truegold Blades', 'Truegold Shields', 'Truegold Legionaries (Infantry)', 'Truegold Mauls', 'Truegold Plating', 'Truegold Infantry', 'Truegold Infantry Healing', 'Truegold Infantry Training', 'Truegold Infantry Aid'],
			icon: 'assets/infantry.png'
		},
		'CAVALRY': {
			techs: ['Truegold Battalion (Cavalry)', 'Truegold Charge', 'Truegold Farriery', 'Truegold Legionaries (Cavalry)', 'Truegold Lances', 'Truegold Platecraft', 'Truegold Cavalry', 'Truegold Cavalry Healing', 'Truegold Cavalry Training', 'Truegold Cavalry Aid'],
			icon: 'assets/cavalry.png'
		},
		'ARCHER': {
			techs: ['Truegold Battalion (Archer)', 'Truegold Bows', 'Truegold Bracers', 'Truegold Legionaries (Archer)', 'Truegold Arrows', 'Truegold Vests', 'Truegold Archer', 'Truegold Archer Healing', 'Truegold Archer Training', 'Truegold Archer Aid'],
			icon: 'assets/archer.png'
		}
	};
	// Build group cards
	for (const [categoryName, group] of Object.entries(categoryGroups)) {
		const categoryItems = [];
		for (const techName of group.techs) {
			const item = allItems.find(i => i.displayName === techName);
			if (item) {
				categoryItems.push(item);
			}
		}
		if (categoryItems.length > 0) {
			container.innerHTML += createAcademyGroupCard(categoryName, categoryItems, group.icon);
		}
	}
	// Restore locked upgrades
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
					if (valueExists) {
						targSelect.value = String(data.toLevel);
					}
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
