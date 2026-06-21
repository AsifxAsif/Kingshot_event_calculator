// ============================================
// PETS - UPGRADE SYSTEM
// ============================================
function getPetImageFileName(petName) {
	// Standardizes names into lowercase snake_case (e.g., "Fire Fox" -> "fire_fox.png")
	const fileName = petName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_') + '.png';
	return `assets/pet/${fileName}`;
}

function getPetData(petName) {
	return window.gameDB.Pet?.Pet?.[petName] || window.gameDB.Pet?.[petName] || [];
}

function getAllPets() {
	const pets = window.gameDB.Pet?.Pet || window.gameDB.Pet || {};
	const petList = [];
	for (const petName in pets) {
		if (Array.isArray(pets[petName])) {
			petList.push({
				name: petName,
				data: pets[petName]
			});
		}
	}
	return petList;
}
// Convert pet level string to a numeric coordinate for sequence sorting
// Handles "10_Advancement" as 10.5 so it evaluates immediately after level 10
function convertPetLevelToNumeric(level) {
	if (level === undefined || level === null || level === '') return 0;
	const levelStr = String(level).trim();
	// Match pattern "10_Advancement" or similar case variants
	const advMatch = levelStr.match(/^(\d+)_[Aa]dvancement$/);
	if (advMatch) {
		return parseFloat(advMatch[1]) + 0.5;
	}
	const num = parseFloat(levelStr);
	return isNaN(num) ? 0 : num;
}
// Generates sorted source options for the 'Current Level' Dropdown
function getPetLevels(dataArray) {
	if (!dataArray?.length) return ["0"];
	const levels = new Set();
	levels.add("0"); // Always ensure base level exists
	for (let i = 0; i < dataArray.length; i++) {
		let currLvl = dataArray[i].current_lvl ?? dataArray[i].current;
		if (currLvl !== undefined && currLvl !== null) {
			levels.add(String(currLvl).trim());
		}
	}
	return Array.from(levels).sort((a, b) => {
		return convertPetLevelToNumeric(a) - convertPetLevelToNumeric(b);
	});
}
// Generates sorted target options for the 'Target Level' Dropdown
function getPetTargetLevels(dataArray) {
	if (!dataArray?.length) return [];
	const levels = new Set();
	for (let i = 0; i < dataArray.length; i++) {
		let targLvl = dataArray[i].target_lvl ?? dataArray[i].target ?? dataArray[i].level;
		if (targLvl !== undefined && targLvl !== null) {
			levels.add(String(targLvl).trim());
		}
	}
	return Array.from(levels).sort((a, b) => {
		return convertPetLevelToNumeric(a) - convertPetLevelToNumeric(b);
	});
}

function getPetUpgradeSteps(dataArray, fromLevel, toLevel) {
	const steps = [];
	let fromStr = String(fromLevel).trim();
	let toStr = String(toLevel).trim();
	const maxLvl = getMaxLevel(dataArray);
	if (fromStr === 'max') fromStr = maxLvl;
	if (toStr === 'max') toStr = maxLvl;
	if (fromStr === toStr) return steps;
	// Build exact sequential lookup map
	const nextMap = {};
	for (const item of dataArray) {
		const curr = String(item.current_lvl ?? item.current ?? '').trim();
		const next = String(item.target_lvl ?? item.target ?? item.level ?? '').trim();
		if (curr !== '' && next !== '') {
			nextMap[curr] = next;
		}
	}
	// Step link traversal
	let current = fromStr;
	let safety = 0;
	const maxSteps = 150;
	while (current !== toStr && safety < maxSteps) {
		const next = nextMap[current];
		if (!next) break;
		const step = dataArray.find(item => {
			const curr = String(item.current_lvl ?? item.current ?? '').trim();
			return curr === current;
		});
		if (step) {
			steps.push(step);
		}
		current = next;
		safety++;
	}
	// Fallback to array indices if link sequence drops out
	if (current !== toStr) {
		let startIndex = -1;
		let endIndex = -1;
		for (let i = 0; i < dataArray.length; i++) {
			const curr = String(dataArray[i].current_lvl ?? dataArray[i].current ?? '').trim();
			const next = String(dataArray[i].target_lvl ?? dataArray[i].target ?? dataArray[i].level ?? '').trim();
			if (curr === fromStr) startIndex = i;
			if (next === toStr) {
				endIndex = i;
				break;
			}
		}
		if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
			return dataArray.slice(startIndex, endIndex + 1);
		}
	}
	return steps;
}

function getPetNextLevel(dataArray, fromLevel) {
	if (fromLevel === 'max') return null;
	const fromStr = String(fromLevel).trim();
	const match = dataArray.find(item => String(item.current_lvl ?? item.current ?? '').trim() === fromStr);
	if (match) {
		return String(match.target_lvl ?? match.target ?? match.level).trim();
	}
	// Fallback lookup via target sequences
	const allLevels = getPetTargetLevels(dataArray);
	const fromNum = convertPetLevelToNumeric(fromLevel);
	let nextLevel = null;
	let nextNum = Infinity;
	for (const lvl of allLevels) {
		const lvlNum = convertPetLevelToNumeric(lvl);
		if (lvlNum > fromNum && lvlNum < nextNum) {
			nextNum = lvlNum;
			nextLevel = lvl;
		}
	}
	return nextLevel;
}

function getMaxLevel(dataArray) {
	if (!dataArray?.length) return "1";
	const lastItem = dataArray[dataArray.length - 1];
	return String(lastItem.target_lvl ?? lastItem.target ?? lastItem.level).trim();
}
// Clean pass-through: preserves exactly "10_Advancement", "20_Advancement" inside UI selections
function getDisplayLevel(level) {
	return String(level).trim();
}

function createPetCard(pet) {
	const dataArray = pet.data;
	const fromLevels = getPetLevels(dataArray);
	const toLevels = getPetTargetLevels(dataArray);
	const safeId = `pet_${pet.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const imgUrl = getPetImageFileName(pet.name);
	const maxLvl = getMaxLevel(dataArray);
	// Build current level dropdown
	let currOpts = '<option value="" disabled selected hidden>Current Level</option>';
	// Add level 0 first
	if (!fromLevels.includes("0")) {
		currOpts += `<option value="0">0</option>`;
	}
	for (let i = 0; i < fromLevels.length; i++) {
		const display = getDisplayLevel(fromLevels[i]);
		currOpts += `<option value="${fromLevels[i]}">${display}</option>`;
	}
	// Add max level as an option if not already in the list
	if (maxLvl && !fromLevels.includes(maxLvl)) {
		currOpts += `<option value="${maxLvl}">${getDisplayLevel(maxLvl)}</option>`;
	}
	// Build target dropdown - SHOW ALL LEVELS initially
	let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
	for (let i = 0; i < toLevels.length; i++) {
		const display = getDisplayLevel(toLevels[i]);
		targOpts += `<option value="${toLevels[i]}">${display}</option>`;
	}
	// Add max level if not in the list
	if (maxLvl && maxLvl !== "0" && !toLevels.includes(maxLvl)) {
		targOpts += `<option value="${maxLvl}">${getDisplayLevel(maxLvl)}</option>`;
	}
	return `<div class="item-card" data-type="pet" data-name="${pet.name}" data-id="${safeId}">
        <div class="item-card-header">
            <img src="${imgUrl}" onerror="this.style.display='none';">
            <span>${pet.name}</span>
        </div>
        <div class="item-card-body">
            <div class="level-controls">
                <select id="curr_${safeId}" onchange="onPetCurrentSelect('${safeId}')">${currOpts}</select>
                <select id="targ_${safeId}" onchange="onPetTargetChange('${safeId}')">${targOpts}</select>
            </div>
            <div class="checkbox-group">
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onPetUpgradeCheckboxChange('${safeId}', this.checked)"> ⬆️ Upgrade</label>
            </div>
            <div id="status_${safeId}" class="status-pane">⚙️ Select current & target level</div>
        </div>
    </div>`;
}
// Helper function to look up dynamic event points for hitting advancement targets
function getPetAdvancementPoints(targetLevelStr) {
	const levelStr = String(targetLevelStr).toLowerCase().trim();
	// Check if this level follows the pattern (e.g., "10_advancement")
	const match = levelStr.match(/^(\d+)_[Aa]dvancement$/);
	if (!match) return 0;
	const baseMilestone = parseInt(match[1]);
	// Precise event milestone points map
	const milestoneMap = {
		10: 500,
		20: 1000,
		30: 2000,
		40: 3000,
		50: 4500,
		60: 6750,
		70: 10000,
		80: 12000,
		90: 14500,
		100: 17500
	};
	const basePoints = milestoneMap[baseMilestone] || 0;
	// Multiply by 50 to return full event points for the navbar
	return basePoints * 50;
}

function calculatePetCosts(pet, from, to, vault, otherLocked) {
	let actualFrom = from;
	let actualTo = to;
	const maxLvl = getMaxLevel(pet.data);
	if (from === 'max') actualFrom = maxLvl;
	if (to === 'max') actualTo = maxLvl;
	const steps = getPetUpgradeSteps(pet.data, actualFrom, actualTo);
	if (!steps.length) return null;
	let stepPoints = 0;
	const costTotals = {};
	for (const step of steps) {
		// 1. Point Evaluation Engine
		const targetLvl = step.target_lvl || step.target || step.level;
		const advPoints = getPetAdvancementPoints(targetLvl);
		if (advPoints > 0) {
			stepPoints += advPoints;
		} else {
			// Fallback: If it's a standard numeric step, look for a base data point value
			const pts = step.point ?? step.points ?? step.score ?? 0;
			stepPoints += (parseFloat(pts) || 0);
		}
		// 2. Resource Accumulation
		const keys = ['bread', 'wood', 'stone', 'iron', 'gold', 'truegold', 'tempered_truegold', 'truegold_dust', 'forgehammer', 'widgets', 'mithril', 'satin', 'gilded_threads', 'artisans_vision', 'charm_guide', 'charm_design', 'pet_food', 'growth_manual', 'nutrient_potion', 'promotion_medallion'];
		for (const k of keys) {
			if (step[k] !== undefined && step[k] !== null) {
				const norm = k === 'forgehammer' ? 'forge_hammer' : k;
				costTotals[norm] = (costTotals[norm] || 0) + parseCost(step[k]);
			}
		}
	}
	return {
		stepPoints,
		costTotals,
		stepsCount: steps.length,
		actualTo: actualTo
	};
}

function refreshCalculations() {
	let vault = getCurrentVault();
	const totalLocked = {};
	for (const [_, ld] of lockedUpgrades.entries()) {
		for (const [res, amt] of Object.entries(ld.costTotals)) totalLocked[res] = (totalLocked[res] || 0) + amt;
	}
	let totalScore = 0;
	const cards = document.querySelectorAll('.item-card[data-type="pet"]');
	for (const card of cards) {
		const pet = {
			name: card.dataset.name,
			data: getPetData(card.dataset.name)
		};
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
		// Check if no levels are selected (placeholder)
		if (!from || from === '' || !to || to === '') {
			status.className = "status-pane";
			status.innerHTML = `⚙️ Select current & target level`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			continue;
		}
		const maxLvl = getMaxLevel(pet.data);
		const isMax = String(from).trim() === 'max' || String(from).trim() === String(maxLvl).trim();
		if (isMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `🏆 PET MAXED! 🏆<br>Already at maximum level (${getDisplayLevel(maxLvl)})`;
			if (activeCb) {
				activeCb.checked = false;
				activeCb.disabled = true;
			}
			continue;
		}
		if (String(from).trim() === String(to).trim()) {
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
		for (const [oid, ld] of lockedUpgrades.entries())
			if (oid !== safeId) {
				for (const [res, amt] of Object.entries(ld.costTotals)) otherLocked[res] = (otherLocked[res] || 0) + amt;
			}
		const costs = calculatePetCosts(pet, from, to, vault, otherLocked);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `❌ Cannot upgrade from ${getDisplayLevel(from)} to ${getDisplayLevel(to)}`;
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
	const globalScore = document.getElementById('globalScoreDisplay');
	if (globalScore) {
		globalScore.innerText = totalScore.toLocaleString();
		if (typeof saveCurrentPageScore === 'function') {
			saveCurrentPageScore(totalScore);
		}
	}
}

function onPetCurrentSelect(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	if (!curr || !targ) return;
	const from = curr.value;
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	if (!card) return;
	const petData = getPetData(card.dataset.name);
	const toLevels = getPetTargetLevels(petData);
	const maxLvl = getMaxLevel(petData);
	// If "Current Level" placeholder is selected, show ALL levels in target
	if (!from || from === '') {
		let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
		for (let i = 0; i < toLevels.length; i++) {
			targOpts += `<option value="${toLevels[i]}">${getDisplayLevel(toLevels[i])}</option>`;
		}
		if (maxLvl && maxLvl !== "0" && !toLevels.includes(maxLvl)) {
			targOpts += `<option value="${maxLvl}">${getDisplayLevel(maxLvl)}</option>`;
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
	if (from === 'max') {
		if (lockedUpgrades.has(safeId)) {
			lockedUpgrades.delete(safeId);
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
		}
		refreshCalculations();
		return;
	}
	const currentNum = convertPetLevelToNumeric(from);
	const nextLevelVal = getPetNextLevel(petData, from);
	// Dynamically rebuild target dropdown - only show levels above current
	let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
	let hasHigherLevels = false;
	for (let i = 0; i < toLevels.length; i++) {
		const targetNum = convertPetLevelToNumeric(toLevels[i]);
		if (targetNum > currentNum) {
			dynamicTargOpts += `<option value="${toLevels[i]}">${getDisplayLevel(toLevels[i])}</option>`;
			hasHigherLevels = true;
		}
	}
	// Add max level if not in the list and higher than current
	if (maxLvl && maxLvl !== "0" && !toLevels.includes(maxLvl) && convertPetLevelToNumeric(maxLvl) > currentNum) {
		dynamicTargOpts += `<option value="${maxLvl}">${getDisplayLevel(maxLvl)}</option>`;
		hasHigherLevels = true;
	}
	// If no higher levels exist (already at max), show the max level as the only option
	if (!hasHigherLevels && maxLvl && maxLvl !== "0") {
		dynamicTargOpts = `<option value="max" selected>${getDisplayLevel(maxLvl)}</option>`;
	}
	targ.innerHTML = dynamicTargOpts;
	// Auto-select the next logical level if it exists
	if (nextLevelVal !== null && nextLevelVal !== undefined) {
		let found = false;
		for (let i = 0; i < targ.options.length; i++) {
			if (String(targ.options[i].value) === String(nextLevelVal)) {
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

function onPetTargetChange(safeId) {
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	refreshCalculations();
}

function onPetUpgradeCheckboxChange(safeId, isChecked) {
	const card = document.querySelector(`.item-card[data-id="${safeId}"]`);
	if (!card) return;
	const pet = {
		name: card.dataset.name,
		data: getPetData(card.dataset.name)
	};
	if (isChecked) {
		const curr = document.getElementById(`curr_${safeId}`);
		const targ = document.getElementById(`targ_${safeId}`);
		if (!curr || !targ) return;
		const from = curr.value;
		const to = targ.value;
		const maxLvl = getMaxLevel(pet.data);
		// Validate selections
		if (!from || from === '' || !to || to === '') {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			return;
		}
		if (String(from).trim() === 'max' || String(from).trim() === String(maxLvl).trim()) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = false;
			refreshCalculations();
			return;
		}
		if (String(from).trim() === String(to).trim()) {
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
		const costs = calculatePetCosts(pet, from, to, vault, otherLocked);
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
			stepsCount: costs.stepsCount,
			toLevel: displayTo
		});
	} else {
		lockedUpgrades.delete(safeId);
	}
	refreshCalculations();
}

function loadPets() {
	const container = document.getElementById('petsGrid');
	if (!container) return;
	container.innerHTML = '';
	const pets = getAllPets();
	for (const pet of pets) {
		container.innerHTML += createPetCard(pet);
	}
	// Restore locked upgrades states
	for (const [safeId, data] of lockedUpgrades.entries()) {
		if (safeId.startsWith('pet_')) {
			const cb = document.getElementById(`active_${safeId}`);
			if (cb) cb.checked = true;
			if (data.toLevel) {
				const targSelect = document.getElementById(`targ_${safeId}`);
				if (targSelect) {
					let valueExists = false;
					for (let i = 0; i < targSelect.options.length; i++) {
						if (String(targSelect.options[i].value) === String(data.toLevel)) {
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
// ============================================
// EXPORTS
// ============================================
window.loadPets = loadPets;
window.refreshCalculations = refreshCalculations;
window.onPetCurrentSelect = onPetCurrentSelect;
window.onPetTargetChange = onPetTargetChange;
window.onPetUpgradeCheckboxChange = onPetUpgradeCheckboxChange;
