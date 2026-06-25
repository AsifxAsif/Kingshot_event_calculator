// ============================================
// PETS - FIXED (Double deduction fixed)
// ============================================
function getPetImageFileName(petName) {
	// Try sprite first
	const spriteMap = {
		'Grey Wolf': 'sprite-pets-grey_wolf',
		'Lynx': 'sprite-pets-lynx',
		'Bison': 'sprite-pets-bison',
		'Cheetah': 'sprite-pets-cheetah',
		'Moose': 'sprite-pets-moose',
		'Grizzly Bear': 'sprite-pets-grizzly_bear',
		'Lion': 'sprite-pets-lion',
		'Giant Rhino': 'sprite-pets-giant_rhino',
		'Mighty Bison': 'sprite-pets-mighty_bison',
		'Alpha Black Panther': 'sprite-pets-alpha_black_panther',
		'Great Moose': 'sprite-pets-great_moose',
		'Ironclad War Elephant': 'sprite-pets-ironclad_war_elephant',
		'Regal White Lion': 'sprite-pets-regal_white_lion',
		'Ironclad War Bear': 'sprite-pets-ironclad_war_bear'
	};
	const spriteClass = spriteMap[petName];
	if (spriteClass && document.querySelector('.sprite-pets')) {
		return spriteClass;
	}
	// Fallback to individual images
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

function convertPetLevelToNumeric(level) {
	if (level === undefined || level === null || level === '') return 0;
	const levelStr = String(level).trim();
	const advMatch = levelStr.match(/^(\d+)_[Aa]dvancement$/);
	if (advMatch) {
		return parseFloat(advMatch[1]) + 0.5;
	}
	const num = parseFloat(levelStr);
	return isNaN(num) ? 0 : num;
}

function getPetLevels(dataArray) {
	if (!dataArray?.length) return ["0"];
	const levels = new Set();
	levels.add("0");
	for (let i = 0; i < dataArray.length; i++) {
		let currLvl = dataArray[i].current_lvl ?? dataArray[i].current;
		if (currLvl !== undefined && currLvl !== null) {
			levels.add(String(currLvl).trim());
		}
	}
	const targetLevels = getPetTargetLevels(dataArray);
	if (targetLevels.length) {
		levels.add(targetLevels[targetLevels.length - 1]);
	}
	return Array.from(levels).sort((a, b) => {
		return convertPetLevelToNumeric(a) - convertPetLevelToNumeric(b);
	});
}

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
	const nextMap = {};
	for (const item of dataArray) {
		const curr = String(item.current_lvl ?? item.current ?? '').trim();
		const next = String(item.target_lvl ?? item.target ?? item.level ?? '').trim();
		if (curr !== '' && next !== '') nextMap[curr] = next;
	}
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
		if (step) steps.push(step);
		current = next;
		safety++;
	}
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

function getDisplayLevel(level) {
	return String(level).trim();
}

function getPetAdvancementPoints(targetLevelStr) {
	const levelStr = String(targetLevelStr).toLowerCase().trim();
	const match = levelStr.match(/^(\d+)_[Aa]dvancement$/);
	if (!match) return 0;
	const baseMilestone = parseInt(match[1]);
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
	return basePoints * 50;
}

function createPetCard(pet) {
	const dataArray = pet.data;
	const fromLevels = getPetLevels(dataArray);
	const toLevels = getPetTargetLevels(dataArray);
	const safeId = `pet_${pet.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const imgUrl = getPetImageFileName(pet.name);
	const maxLvl = getMaxLevel(dataArray);
	const currOpts = buildLevelOptions(fromLevels, 'Current Level', maxLvl, '');
	const targOpts = buildLevelOptions(toLevels, 'Target Level', maxLvl, '');
	const isSprite = imgUrl && imgUrl.startsWith('sprite-');
	let headerHtml;
	if (isSprite) {
		headerHtml = `<div class="sprite ${imgUrl}" style="height:60px;width:60px;flex-shrink:0;"></div>`;
	} else {
		headerHtml = `<img src="${imgUrl}" onerror="this.style.display='none';" alt="${pet.name}">`;
	}
	return `<div class="item-card" data-type="pet" data-name="${pet.name}" data-id="${safeId}">
        <div class="item-card-header">
            ${headerHtml}
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
		const targetLvl = step.target_lvl || step.target || step.level;
		const advPoints = getPetAdvancementPoints(targetLvl);
		if (advPoints > 0) {
			stepPoints += advPoints;
		} else {
			const pts = step.point ?? step.points ?? step.score ?? 0;
			stepPoints += (parseFloat(pts) || 0);
		}
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
// ============================================
// CRITICAL FIX: refreshCalculations - Fixed double deduction
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
			status.className = "status-pane status-warning";
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
			status.innerHTML = `<strong>✓ ACTIVE${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}</div>`;
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
			status.innerHTML = `<strong>⚪ ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}</div><br><span class="text-remaining">✅ Click "Upgrade" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>✗ INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${costHtml}</div>`;
		}
	}
	const globalScore = document.getElementById('globalScoreDisplay');
	if (globalScore) {
		globalScore.innerText = totalScore.toLocaleString();
		if (typeof saveCurrentPageScore === 'function') saveCurrentPageScore(totalScore);
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
	if (!from || from === '') {
		const targOpts = buildLevelOptions(toLevels, 'Target Level', maxLvl, '');
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
	let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
	let hasHigherLevels = false;
	for (let i = 0; i < toLevels.length; i++) {
		const targetNum = convertPetLevelToNumeric(toLevels[i]);
		if (targetNum > currentNum) {
			const isMax = String(toLevels[i]) === String(maxLvl);
			dynamicTargOpts += `<option value="${toLevels[i]}">${getDisplayLevel(toLevels[i])}${isMax ? ' (Max)' : ''}</option>`;
			hasHigherLevels = true;
		}
	}
	if (maxLvl && maxLvl !== "0" && !toLevels.includes(maxLvl) && convertPetLevelToNumeric(maxLvl) > currentNum) {
		dynamicTargOpts += `<option value="${maxLvl}">${getDisplayLevel(maxLvl)} (Max)</option>`;
		hasHigherLevels = true;
	}
	if (!hasHigherLevels && maxLvl && maxLvl !== "0") {
		dynamicTargOpts = `<option value="max" selected>${getDisplayLevel(maxLvl)} (Max)</option>`;
	}
	targ.innerHTML = dynamicTargOpts;
	if (nextLevelVal !== null && nextLevelVal !== undefined) {
		let found = false;
		for (let i = 0; i < targ.options.length; i++) {
			if (String(targ.options[i].value) === String(nextLevelVal)) {
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
		for (const [oid, ld] of lockedUpgrades.entries()) {
			if (oid !== safeId) {
				for (const [res, amt] of Object.entries(ld.costTotals)) {
					if (!res.startsWith('_')) {
						otherLocked[res] = (otherLocked[res] || 0) + amt;
					}
				}
			}
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
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('curr_pet_') || id.startsWith('targ_pet_')) {
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
		if (safeId.startsWith('pet_')) {
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
		}
	}
	refreshCalculations();
}
window.loadPets = loadPets;
window.refreshCalculations = refreshCalculations;
window.onPetCurrentSelect = onPetCurrentSelect;
window.onPetTargetChange = onPetTargetChange;
window.onPetUpgradeCheckboxChange = onPetUpgradeCheckboxChange;
