// ============================================
// TROOPS - FIXED (Double deduction fixed)
// ============================================
function getTroopsTrainingData(type) {
	const training = window.gameDB.Troops?.Troops?.Training;
	if (!training) return null;
	if (type === 'Infantry') return training.Infantry || [];
	if (type === 'Cavalry') return training.Cavalry || [];
	if (type === 'Archer') return training.Archer || [];
	return null;
}

function getTroopsPromotionData(type) {
	const promoting = window.gameDB.Troops?.Troops?.Promoting;
	if (!promoting) return null;
	if (type === 'Infantry') return promoting.Infantry || [];
	if (type === 'Cavalry') return promoting.Cavalry || [];
	if (type === 'Archer') return promoting.Archer || [];
	return null;
}

function validateNumberInput(input) {
	let value = input.value.replace(/-/g, '');
	value = value.replace(/[^0-9.]/g, '');
	const parts = value.split('.');
	if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
	if (value === '' || isNaN(parseFloat(value))) {
		input.value = '';
	} else {
		input.value = value;
	}
}

function getTroopImageFileName(troopType) {
	const imageMap = {
		'Infantry': 'Infantry.webp',
		'Cavalry': 'Cavalry.webp',
		'Archer': 'Archer.webp'
	};
	let baseType = troopType;
	if (troopType.includes('Infantry')) baseType = 'Infantry';
	else if (troopType.includes('Cavalry')) baseType = 'Cavalry';
	else if (troopType.includes('Archer')) baseType = 'Archer';
	return `assets/${imageMap[baseType] || 'Infantry.webp'}`;
}

function createTroopIndividualCard(troopType) {
	const safeId = `troops_${troopType.replace(/[^a-zA-Z0-9]/g, '_')}`;
	let tierOptions = '<option value="" disabled selected hidden>Select Tier</option>';
	for (let tier = 1; tier <= 11; tier++) {
		const label = tier === 11 ? 'Tier 11 (Max)' : `Tier ${tier}`;
		tierOptions += `<option value="${tier}">${label}</option>`;
	}
	const imgUrl = getTroopImageFileName(troopType);
	return `<div class="item-card troop-card" data-type="troops" data-name="${troopType}" data-id="${safeId}" style="margin-bottom: 10px;">
        <div class="item-card-header" style="padding: 8px 12px; background: var(--surface-dark);">
            <img loading="lazy" decoding="async" src="${imgUrl}" onerror="this.style.display='none';" alt="${troopType}" style="height: 40px; width: 40px; object-fit: contain;">
            <span style="font-size: 0.85rem;">${troopType}</span>
        </div>
        <div class="item-card-body" style="padding: 8px 12px;">
            <div class="level-controls" style="gap: 8px;">
                <select id="troop_lvl_${safeId}" onchange="refreshTroopsCalculations()">${tierOptions}</select>
                <input type="text" id="troop_qty_${safeId}" style="text-align: center;" placeholder="Quantity" value="" oninput="validateNumberInput(this); refreshTroopsCalculations()">
            </div>
            <div class="checkbox-group" style="gap: 8px;">
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px;">
                    <input class="checkbox" type="checkbox" id="active_${safeId}" onchange="refreshTroopsCalculations()"> 🚀 Train Active
                </label>
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px;">
                    <input class="checkbox" type="checkbox" id="speed_${safeId}" onchange="refreshTroopsCalculations()"> ⏩ +Speedups
                </label>
            </div>
            <div id="status_${safeId}" class="status-pane" style="font-size: 0.7rem; padding: 6px 8px;">⚔️ Select troop tier and quantity</div>
        </div>
    </div>`;
}

function createPromotionIndividualCard(troopType) {
	const safeId = `promotion_${troopType.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const promotionData = getTroopsPromotionData(troopType);
	if (!promotionData || promotionData.length === 0) return '';
	const fromTiers = [];
	const allTiers = [];
	for (const item of promotionData) {
		if (item.current_lvl && !fromTiers.includes(item.current_lvl)) fromTiers.push(item.current_lvl);
		if (item.target_lvl && !allTiers.includes(item.target_lvl)) allTiers.push(item.target_lvl);
	}
	fromTiers.sort((a, b) => a - b);
	allTiers.sort((a, b) => a - b);
	const highestTier = allTiers.length > 0 ? Math.max(...allTiers) : 0;
	let fromOptions = '<option value="" disabled selected hidden>Current Tier</option>';
	for (const tier of fromTiers) {
		if (tier === highestTier) continue;
		fromOptions += `<option value="${tier}">Tier ${tier}</option>`;
	}
	let toOptions = '<option value="" selected hidden>Target Tier</option>';
	const firstTier = fromTiers.length > 0 ? fromTiers[0] : 0;
	for (const tier of allTiers) {
		if (tier > firstTier) {
			const isMax = tier === highestTier;
			toOptions += `<option value="${tier}">Tier ${tier}${isMax ? ' (Max)' : ''}</option>`;
		}
	}
	const imgUrl = getTroopImageFileName(troopType);
	return `<div class="item-card troop-card" data-type="promotion" data-name="${troopType}" data-id="${safeId}" style="margin-bottom: 10px;">
        <div class="item-card-header" style="padding: 8px 12px; background: var(--surface-dark);">
            <img loading="lazy" decoding="async" src="${imgUrl}" onerror="this.style.display='none';" alt="${troopType}" style="height: 40px; width: 40px; object-fit: contain;">
            <span style="font-size: 0.85rem;">${troopType} Promotion</span>
        </div>
        <div class="item-card-body" style="padding: 8px 12px;">
            <div class="level-controls" style="gap: 8px;">
                <select id="promo_from_${safeId}" onchange="onPromotionCurrentSelect('${safeId}', '${troopType}')">${fromOptions}</select>
                <select id="promo_to_${safeId}" onchange="refreshTroopsCalculations()">${toOptions}</select>
            </div>
            <div class="level-controls" style="grid-template-columns: 1fr; gap: 8px;">
                <input type="text" id="promo_qty_${safeId}" style="text-align: center;" placeholder="Quantity to promote" value="" oninput="validateNumberInput(this); refreshTroopsCalculations()">
            </div>
            <div class="checkbox-group" style="gap: 8px;">
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px;">
                    <input class="checkbox" type="checkbox" id="promo_active_${safeId}" onchange="refreshTroopsCalculations()"> ⬆️ Promote Active
                </label>
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px;">
                    <input class="checkbox" type="checkbox" id="promo_speed_${safeId}" onchange="refreshTroopsCalculations()"> ⏩ +Speedups
                </label>
            </div>
            <div id="promo_status_${safeId}" class="status-pane" style="font-size: 0.7rem; padding: 6px 8px;">⚙️ Select current tier, target tier, and quantity</div>
        </div>
    </div>`;
}

function createTroopGroupCard(groupName, itemsHtml) {
	const icon = groupName === 'TRAINING' ? '⚔️' : '⬆️';
	return `
        <div class="item-card" style="border: 1px solid #999; margin-bottom: 16px;">
            <div class="item-card-header" style="background: var(--surface-dark); border-bottom: 2px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.1rem;">${icon} ${groupName}</span>
            </div>
            <div class="item-card-body" style="padding: 12px;">
                <div class="items-grid" style="grid-template-columns: 1fr; gap: 10px;">
                    ${itemsHtml}
                </div>
            </div>
        </div>
    `;
}

function onPromotionCurrentSelect(safeId, troopType) {
	const fromSelect = document.getElementById(`promo_from_${safeId}`);
	const toSelect = document.getElementById(`promo_to_${safeId}`);
	if (!fromSelect || !toSelect) return;
	const from = parseInt(fromSelect.value) || 0;
	const promotionData = getTroopsPromotionData(troopType);
	if (!promotionData) return;
	const allTiers = [];
	for (const item of promotionData) {
		if (item.target_lvl && !allTiers.includes(item.target_lvl)) allTiers.push(item.target_lvl);
	}
	allTiers.sort((a, b) => a - b);
	const highestTier = allTiers.length > 0 ? Math.max(...allTiers) : 0;
	if (from === 0 || from === '') {
		let toOptions = '<option value="" selected hidden>Target Tier</option>';
		for (const tier of allTiers) {
			const isMax = tier === highestTier;
			toOptions += `<option value="${tier}">Tier ${tier}${isMax ? ' (Max)' : ''}</option>`;
		}
		toSelect.innerHTML = toOptions;
		refreshTroopsCalculations();
		return;
	}
	let toOptions = '<option value="" selected hidden>Target Tier</option>';
	let hasHigherLevels = false;
	let firstHigher = null;
	for (const tier of allTiers) {
		if (tier > from) {
			const isMax = tier === highestTier;
			toOptions += `<option value="${tier}">Tier ${tier}${isMax ? ' (Max)' : ''}</option>`;
			if (!firstHigher) firstHigher = tier;
			hasHigherLevels = true;
		}
	}
	if (!hasHigherLevels) {
		toOptions += `<option value="" disabled>No higher tiers available</option>`;
		toSelect.innerHTML = toOptions;
		refreshTroopsCalculations();
		return;
	}
	toSelect.innerHTML = toOptions;
	if (firstHigher) {
		for (let i = 0; i < toSelect.options.length; i++) {
			if (parseInt(toSelect.options[i].value) === firstHigher) {
				toSelect.selectedIndex = i;
				break;
			}
		}
	}
	refreshTroopsCalculations();
}

function getTroopResourceCosts(troopType, level, quantity) {
	let troopDataName = '';
	if (troopType.includes('Infantry')) troopDataName = 'Infantry';
	else if (troopType.includes('Cavalry')) troopDataName = 'Cavalry';
	else if (troopType.includes('Archer')) troopDataName = 'Archer';
	const trainingData = getTroopsTrainingData(troopDataName);
	if (!trainingData) return null;
	const troopData = trainingData.find(t => t.lvl === level);
	if (!troopData) return null;
	const costs = {};
	const resourceKeys = ['bread', 'wood', 'stone', 'iron', 'gold', 'truegold', 'tempered_truegold', 'truegold_dust'];
	for (const key of resourceKeys) {
		if (troopData[key] !== undefined && troopData[key] !== null) {
			costs[key] = parseCost(troopData[key]) * quantity;
		}
	}
	return costs;
}

function getPromotionResourceCosts(troopType, fromLevel, toLevel, quantity) {
	let troopDataName = '';
	if (troopType.includes('Infantry')) troopDataName = 'Infantry';
	else if (troopType.includes('Cavalry')) troopDataName = 'Cavalry';
	else if (troopType.includes('Archer')) troopDataName = 'Archer';
	const promotionData = getTroopsPromotionData(troopDataName);
	if (!promotionData) return null;
	let step = null;
	for (const item of promotionData) {
		if (item.current_lvl === fromLevel && item.target_lvl === toLevel) {
			step = item;
			break;
		}
	}
	if (!step) return null;
	const costs = {};
	const resourceKeys = ['bread', 'wood', 'stone', 'iron', 'gold', 'truegold', 'tempered_truegold', 'truegold_dust'];
	for (const key of resourceKeys) {
		if (step[key] !== undefined && step[key] !== null) {
			costs[key] = parseCost(step[key]) * quantity;
		}
	}
	return costs;
}

function getTroopTrainingTime(troopType, level, quantity) {
	let troopDataName = '';
	if (troopType.includes('Infantry')) troopDataName = 'Infantry';
	else if (troopType.includes('Cavalry')) troopDataName = 'Cavalry';
	else if (troopType.includes('Archer')) troopDataName = 'Archer';
	const trainingData = getTroopsTrainingData(troopDataName);
	if (!trainingData) return 0;
	const troopData = trainingData.find(t => t.lvl === level);
	if (!troopData || !troopData.time) return 0;
	const secondsPerUnit = parseTimeToSeconds(troopData.time);
	return secondsPerUnit * quantity;
}

function getPromotionTime(troopType, fromLevel, toLevel, quantity) {
	let troopDataName = '';
	if (troopType.includes('Infantry')) troopDataName = 'Infantry';
	else if (troopType.includes('Cavalry')) troopDataName = 'Cavalry';
	else if (troopType.includes('Archer')) troopDataName = 'Archer';
	const promotionData = getTroopsPromotionData(troopDataName);
	if (!promotionData) return 0;
	let step = null;
	for (const item of promotionData) {
		if (item.current_lvl === fromLevel && item.target_lvl === toLevel) {
			step = item;
			break;
		}
	}
	if (!step || !step.time) return 0;
	const secondsPerUnit = parseTimeToSeconds(step.time);
	return secondsPerUnit * quantity;
}

function getTroopPointsForLevel(troopType, level) {
	let troopDataName = '';
	if (troopType.includes('Infantry')) troopDataName = 'Infantry';
	else if (troopType.includes('Cavalry')) troopDataName = 'Cavalry';
	else if (troopType.includes('Archer')) troopDataName = 'Archer';
	const trainingData = getTroopsTrainingData(troopDataName);
	if (!trainingData) return 0;
	const troopData = trainingData.find(t => t.lvl === level);
	if (!troopData) return SCORE_RULES.troops[level] || 0;
	return troopData.point || SCORE_RULES.troops[level] || 0;
}

function getBuffedTrainingTime(originalSeconds) {
	if (typeof window.applyTrainingSpeedupBuffs === 'function') {
		return window.applyTrainingSpeedupBuffs(originalSeconds);
	}
	return originalSeconds;
}
// ============================================
// CRITICAL FIX: refreshTroopsCalculations - Fixed double deduction
// ============================================
function refreshTroopsCalculations() {
	let vault = getCurrentVault();
	let runningLocked = {};
	let totalTroopPoints = 0;
	let totalSpeedupPoints = 0;
	// Collect ALL locked upgrades first
	const allLocked = {};
	for (const [_, ld] of lockedUpgrades.entries()) {
		for (const [res, amt] of Object.entries(ld.costTotals)) {
			if (!res.startsWith('_')) {
				allLocked[res] = (allLocked[res] || 0) + amt;
			}
		}
	}
	// Training Cards
	const cards = document.querySelectorAll('.troop-card[data-type="troops"]');
	for (const card of cards) {
		const troopType = card.dataset.name;
		const safeId = card.dataset.id;
		const lvlSelect = document.getElementById(`troop_lvl_${safeId}`);
		const qtyInput = document.getElementById(`troop_qty_${safeId}`);
		const status = document.getElementById(`status_${safeId}`);
		const activeCb = document.getElementById(`active_${safeId}`);
		const speedCb = document.getElementById(`speed_${safeId}`);
		if (!lvlSelect || !qtyInput || !status) continue;
		const level = parseInt(lvlSelect.value) || 0;
		let rawQty = qtyInput.value.replace(/,/g, '');
		const quantity = parseFloat(rawQty) || 0;
		let costTotals = {};
		let canAfford = true;
		let stepPoints = 0;
		let totalTimeSeconds = 0;
		const isLocked = lockedUpgrades.has(safeId);
		if (activeCb && activeCb.checked !== isLocked) activeCb.checked = isLocked;
		if (level > 0 && quantity > 0) {
			const troopPoints = getTroopPointsForLevel(troopType, level);
			stepPoints = quantity * troopPoints;
			costTotals = getTroopResourceCosts(troopType, level, quantity) || {};
			// CRITICAL FIX: Calculate other locked (excluding this upgrade if locked)
			const otherLocked = {};
			if (isLocked) {
				// If locked, exclude this upgrade from total
				for (const [res, amt] of Object.entries(allLocked)) {
					const currentAmt = costTotals[res] || 0;
					if (!res.startsWith('_') && amt - currentAmt > 0) {
						otherLocked[res] = amt - currentAmt;
					}
				}
			} else {
				// If not locked, use all locked
				for (const [res, amt] of Object.entries(allLocked)) {
					if (!res.startsWith('_')) {
						otherLocked[res] = amt;
					}
				}
			}
			for (const [res, amt] of Object.entries(costTotals)) {
				if (!res.startsWith('_') && (vault[res] || 0) < (otherLocked[res] || 0) + amt) {
					canAfford = false;
					break;
				}
			}
			totalTimeSeconds = getTroopTrainingTime(troopType, level, quantity);
		}
		const upgradeKey = safeId;
		if (level > 0 && quantity > 0 && canAfford) {
			const buffedTimeSeconds = getBuffedTrainingTime(totalTimeSeconds);
			let finalSpeedupPoints = 0;
			let actualSpeedupUsed = 0;
			if (activeCb?.checked && speedCb?.checked && totalTimeSeconds > 0) {
				const speedupCostMinutes = secondsToSpeedupMinutes(buffedTimeSeconds);
				const speedKey = 'training_speedup';
				const available = (vault[speedKey] || 0) - (allLocked[speedKey] || 0);
				if (available < speedupCostMinutes) {
					actualSpeedupUsed = Math.max(0, available);
					if (actualSpeedupUsed > 0) {
						finalSpeedupPoints = actualSpeedupUsed * SCORE_RULES.speedup_min;
						costTotals[speedKey] = (costTotals[speedKey] || 0) + actualSpeedupUsed;
					}
				} else {
					actualSpeedupUsed = speedupCostMinutes;
					finalSpeedupPoints = actualSpeedupUsed * SCORE_RULES.speedup_min;
					costTotals[speedKey] = (costTotals[speedKey] || 0) + actualSpeedupUsed;
				}
			}
			if (activeCb?.checked) {
				lockedUpgrades.set(upgradeKey, {
					costTotals: JSON.parse(JSON.stringify(costTotals)),
					stepPoints: stepPoints + finalSpeedupPoints,
					qty: quantity,
					level: level,
					speedupWasChecked: speedCb?.checked || false,
					isActive: true,
					type: 'training'
				});
				totalTroopPoints += stepPoints;
				totalSpeedupPoints += finalSpeedupPoints;
			} else {
				if (lockedUpgrades.has(upgradeKey)) lockedUpgrades.delete(upgradeKey);
			}
		} else {
			if (lockedUpgrades.has(upgradeKey)) lockedUpgrades.delete(upgradeKey);
		}
		if (activeCb) {
			activeCb.disabled = !canAfford || level === 0 || quantity === 0;
			activeCb.checked = activeCb.disabled ? false : activeCb.checked;
			activeCb.parentElement.style.opacity = activeCb.disabled ? '0.5' : '1';
			if (activeCb.disabled) {
				activeCb.parentElement.classList.add('disabled');
			} else {
				activeCb.parentElement.classList.remove('disabled');
			}
		}
		if (speedCb) {
			const speedKey = 'training_speedup';
			const hasSpeedups = (vault[speedKey] || 0) > 0;
			const canUseSpeedup = canAfford && hasSpeedups && totalTimeSeconds > 0;
			speedCb.disabled = !canUseSpeedup || level === 0 || quantity === 0;
			speedCb.checked = speedCb.disabled ? false : speedCb.checked;
			speedCb.parentElement.style.opacity = speedCb.disabled ? '0.5' : '1';
			if (speedCb.disabled) {
				speedCb.parentElement.classList.add('disabled');
				speedCb.parentElement.title = !hasSpeedups ? 'No training speedups in vault' : 'Insufficient resources';
			} else {
				speedCb.parentElement.classList.remove('disabled');
				speedCb.parentElement.title = '';
			}
		}
		// Calculate other locked for display
		const displayOtherLocked = {};
		const isCurrentlyLocked = lockedUpgrades.has(safeId);
		if (isCurrentlyLocked && costTotals) {
			for (const [res, amt] of Object.entries(allLocked)) {
				const currentAmt = costTotals[res] || 0;
				if (!res.startsWith('_') && amt - currentAmt > 0) {
					displayOtherLocked[res] = amt - currentAmt;
				}
			}
		} else {
			for (const [res, amt] of Object.entries(allLocked)) {
				if (!res.startsWith('_')) {
					displayOtherLocked[res] = amt;
				}
			}
		}
		displayTroopStatus(status, troopType, level, quantity, activeCb?.checked || false, speedCb?.checked || false, costTotals, stepPoints, totalTimeSeconds, canAfford, vault, displayOtherLocked);
		// Update running locked for subsequent cards
		if (level > 0 && quantity > 0 && activeCb?.checked) {
			for (const [res, amt] of Object.entries(costTotals)) {
				if (!res.startsWith('_')) {
					runningLocked[res] = (runningLocked[res] || 0) + amt;
				}
			}
		}
	}
	// Promotion Cards
	const promoCards = document.querySelectorAll('.troop-card[data-type="promotion"]');
	for (const card of promoCards) {
		const troopType = card.dataset.name;
		const safeId = card.dataset.id;
		const fromSelect = document.getElementById(`promo_from_${safeId}`);
		const toSelect = document.getElementById(`promo_to_${safeId}`);
		const qtyInput = document.getElementById(`promo_qty_${safeId}`);
		const status = document.getElementById(`promo_status_${safeId}`);
		const activeCb = document.getElementById(`promo_active_${safeId}`);
		const speedCb = document.getElementById(`promo_speed_${safeId}`);
		if (!fromSelect || !toSelect || !qtyInput || !status) continue;
		const fromLevel = parseInt(fromSelect.value) || 0;
		const toLevel = parseInt(toSelect.value) || 0;
		let rawQty = qtyInput.value.replace(/,/g, '');
		const quantity = parseFloat(rawQty) || 0;
		let costTotals = {};
		let canAfford = true;
		let stepPoints = 0;
		let totalTimeSeconds = 0;
		let pointsPerUnit = 0;
		const isLocked = lockedUpgrades.has(safeId);
		if (activeCb && activeCb.checked !== isLocked) activeCb.checked = isLocked;
		if (fromLevel > 0 && toLevel > 0 && fromLevel !== toLevel && quantity > 0) {
			if (toLevel <= fromLevel) {
				status.className = "status-pane status-warning";
				status.innerHTML = `⚠️ Target tier (${toLevel}) must be higher than current tier (${fromLevel})`;
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
			const currentPoints = getTroopPointsForLevel(troopType, fromLevel);
			const targetPoints = getTroopPointsForLevel(troopType, toLevel);
			pointsPerUnit = Math.max(0, targetPoints - currentPoints);
			stepPoints = quantity * pointsPerUnit;
			costTotals = getPromotionResourceCosts(troopType, fromLevel, toLevel, quantity) || {};
			// CRITICAL FIX: Calculate other locked (excluding this upgrade if locked)
			const otherLocked = {};
			if (isLocked) {
				for (const [res, amt] of Object.entries(allLocked)) {
					const currentAmt = costTotals[res] || 0;
					if (!res.startsWith('_') && amt - currentAmt > 0) {
						otherLocked[res] = amt - currentAmt;
					}
				}
			} else {
				for (const [res, amt] of Object.entries(allLocked)) {
					if (!res.startsWith('_')) {
						otherLocked[res] = amt;
					}
				}
			}
			for (const [res, amt] of Object.entries(costTotals)) {
				if (!res.startsWith('_') && (vault[res] || 0) < (otherLocked[res] || 0) + amt) {
					canAfford = false;
					break;
				}
			}
			totalTimeSeconds = getPromotionTime(troopType, fromLevel, toLevel, quantity);
		}
		const upgradeKey = safeId;
		if (fromLevel > 0 && toLevel > 0 && fromLevel !== toLevel && toLevel > fromLevel && quantity > 0 && canAfford) {
			const buffedTimeSeconds = getBuffedTrainingTime(totalTimeSeconds);
			let finalSpeedupPoints = 0;
			let actualSpeedupUsed = 0;
			if (activeCb?.checked && speedCb?.checked && totalTimeSeconds > 0) {
				const speedupCostMinutes = secondsToSpeedupMinutes(buffedTimeSeconds);
				const speedKey = 'training_speedup';
				const available = (vault[speedKey] || 0) - (allLocked[speedKey] || 0);
				if (available < speedupCostMinutes) {
					actualSpeedupUsed = Math.max(0, available);
					if (actualSpeedupUsed > 0) {
						finalSpeedupPoints = actualSpeedupUsed * SCORE_RULES.speedup_min;
						costTotals[speedKey] = (costTotals[speedKey] || 0) + actualSpeedupUsed;
					}
				} else {
					actualSpeedupUsed = speedupCostMinutes;
					finalSpeedupPoints = actualSpeedupUsed * SCORE_RULES.speedup_min;
					costTotals[speedKey] = (costTotals[speedKey] || 0) + actualSpeedupUsed;
				}
			}
			if (activeCb?.checked) {
				lockedUpgrades.set(upgradeKey, {
					costTotals: JSON.parse(JSON.stringify(costTotals)),
					stepPoints: stepPoints + finalSpeedupPoints,
					qty: quantity,
					fromLevel: fromLevel,
					toLevel: toLevel,
					speedupWasChecked: speedCb?.checked || false,
					isActive: true,
					type: 'promotion',
					pointsPerUnit: pointsPerUnit
				});
				totalTroopPoints += stepPoints;
				totalSpeedupPoints += finalSpeedupPoints;
			} else {
				if (lockedUpgrades.has(upgradeKey)) lockedUpgrades.delete(upgradeKey);
			}
		} else {
			if (lockedUpgrades.has(upgradeKey)) lockedUpgrades.delete(upgradeKey);
		}
		// ✅ FIXED: Use fromLevel and toLevel instead of level
		if (activeCb) {
			const isDisabled = !canAfford || fromLevel === 0 || toLevel === 0 || quantity === 0 || toLevel <= fromLevel;
			activeCb.disabled = isDisabled;
			activeCb.checked = activeCb.disabled ? false : activeCb.checked;
			activeCb.parentElement.style.opacity = activeCb.disabled ? '0.5' : '1';
			if (activeCb.disabled) {
				activeCb.parentElement.classList.add('disabled');
			} else {
				activeCb.parentElement.classList.remove('disabled');
			}
		}
		if (speedCb) {
			const speedKey = 'training_speedup';
			const hasSpeedups = (vault[speedKey] || 0) > 0;
			const canUseSpeedup = canAfford && hasSpeedups && totalTimeSeconds > 0 && fromLevel > 0 && toLevel > 0 && toLevel > fromLevel && quantity > 0;
			speedCb.disabled = !canUseSpeedup;
			speedCb.checked = speedCb.disabled ? false : speedCb.checked;
			speedCb.parentElement.style.opacity = speedCb.disabled ? '0.5' : '1';
			if (speedCb.disabled) {
				speedCb.parentElement.classList.add('disabled');
				speedCb.parentElement.title = !hasSpeedups ? 'No training speedups in vault' : 'Insufficient resources or invalid selection';
			} else {
				speedCb.parentElement.classList.remove('disabled');
				speedCb.parentElement.title = '';
			}
		}
		// Calculate other locked for display
		const displayOtherLocked = {};
		const isCurrentlyLocked = lockedUpgrades.has(safeId);
		if (isCurrentlyLocked && costTotals) {
			for (const [res, amt] of Object.entries(allLocked)) {
				const currentAmt = costTotals[res] || 0;
				if (!res.startsWith('_') && amt - currentAmt > 0) {
					displayOtherLocked[res] = amt - currentAmt;
				}
			}
		} else {
			for (const [res, amt] of Object.entries(allLocked)) {
				if (!res.startsWith('_')) {
					displayOtherLocked[res] = amt;
				}
			}
		}
		displayPromotionStatus(status, troopType, fromLevel, toLevel, quantity, activeCb?.checked || false, speedCb?.checked || false, costTotals, stepPoints, totalTimeSeconds, canAfford, vault, displayOtherLocked, pointsPerUnit);
	}
	const totalScore = totalTroopPoints + totalSpeedupPoints;
	document.getElementById('globalScoreDisplay').innerText = totalScore.toLocaleString();
	if (typeof saveCurrentPageScore === 'function') saveCurrentPageScore(totalScore);
	window.dispatchEvent(new Event('troopsUpdate'));
}

function displayTroopStatus(status, troopType, level, quantity, isActive, speedupTroop, costTotals, stepPoints, totalTimeSeconds, canAfford, vault, totalLocked) {
	if (level > 0 && quantity > 0 && isActive) {
		let finalTroopPoints = stepPoints;
		let finalSpeedupPoints = 0;
		let partialNote = '';
		const buffedTimeSeconds = getBuffedTrainingTime(totalTimeSeconds);
		if (speedupTroop && totalTimeSeconds > 0) {
			const speedupCostMinutes = secondsToSpeedupMinutes(buffedTimeSeconds);
			const speedKey = 'training_speedup';
			const available = (vault[speedKey] || 0) - (totalLocked[speedKey] || 0);
			if (available < speedupCostMinutes) {
				const actualSpeedupUsed = Math.max(0, available);
				if (actualSpeedupUsed > 0) {
					partialNote = `⚠️ Only ${actualSpeedupUsed} min available (need ${speedupCostMinutes})`;
					finalSpeedupPoints = actualSpeedupUsed * SCORE_RULES.speedup_min;
				}
			} else {
				finalSpeedupPoints = speedupCostMinutes * SCORE_RULES.speedup_min;
			}
		}
		let costHtml = buildResourceDisplay(costTotals, vault, totalLocked);
		let timeDisplay = buildTimeDisplay(totalTimeSeconds, buffedTimeSeconds, speedupTroop);
		let pointsDisplay = buildPointsDisplay(finalTroopPoints, finalSpeedupPoints);
		if (canAfford) {
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>✓ ACTIVE</strong><br>${pointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : ''}`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>✗ INSUFFICIENT RESOURCES</strong><br>${pointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : ''}`;
		}
	} else if (level > 0 && quantity > 0 && !isActive) {
		let costHtml = buildResourceDisplay(costTotals, vault, totalLocked);
		let timeDisplay = buildTimeDisplay(totalTimeSeconds, getBuffedTrainingTime(totalTimeSeconds), speedupTroop);
		let estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">🎖️ Troop Points: +${stepPoints.toLocaleString()}</div></div>`;
		if (speedupTroop && totalTimeSeconds > 0) {
			const buffedTimeSeconds = getBuffedTrainingTime(totalTimeSeconds);
			const estimatedSpeedupMinutes = secondsToSpeedupMinutes(buffedTimeSeconds);
			const estimatedSpeedupPoints = estimatedSpeedupMinutes * SCORE_RULES.speedup_min;
			estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">🎖️ Troop Points: +${stepPoints.toLocaleString()}</div><div class="resource-tag">⚡ Speedup Points: +${estimatedSpeedupPoints.toLocaleString()} (if used)</div></div>`;
		}
		if (canAfford) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>⚪ ESTIMATED</strong><br>${estimatedPointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}<br><span class="text-remaining">✅ Check "TRAIN ACTIVE" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>✗ INSUFFICIENT RESOURCES</strong><br>${estimatedPointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}`;
		}
	} else {
		status.className = "status-pane";
		status.innerHTML = `⚔️ Select troop tier and quantity`;
	}
}

function displayPromotionStatus(status, troopType, fromLevel, toLevel, quantity, isActive, speedupTroop, costTotals, stepPoints, totalTimeSeconds, canAfford, vault, totalLocked, pointsPerUnit) {
	if (fromLevel > 0 && toLevel > 0 && toLevel <= fromLevel && quantity > 0) {
		status.className = "status-pane status-warning";
		status.innerHTML = `⚠️ Target tier (${toLevel}) must be higher than current tier (${fromLevel})`;
		return;
	}
	if (fromLevel > 0 && toLevel > 0 && fromLevel !== toLevel && quantity > 0 && isActive) {
		let finalSpeedupPoints = 0;
		let partialNote = '';
		const buffedTimeSeconds = getBuffedTrainingTime(totalTimeSeconds);
		if (speedupTroop && totalTimeSeconds > 0) {
			const speedupCostMinutes = secondsToSpeedupMinutes(buffedTimeSeconds);
			const speedKey = 'training_speedup';
			const available = (vault[speedKey] || 0) - (totalLocked[speedKey] || 0);
			if (available < speedupCostMinutes) {
				const actualSpeedupUsed = Math.max(0, available);
				if (actualSpeedupUsed > 0) {
					partialNote = `⚠️ Only ${actualSpeedupUsed} min available (need ${speedupCostMinutes})`;
					finalSpeedupPoints = actualSpeedupUsed * SCORE_RULES.speedup_min;
				}
			} else {
				finalSpeedupPoints = speedupCostMinutes * SCORE_RULES.speedup_min;
			}
		}
		let costHtml = buildResourceDisplay(costTotals, vault, totalLocked);
		let timeDisplay = buildTimeDisplay(totalTimeSeconds, buffedTimeSeconds, speedupTroop);
		let pointsDisplay = `<div class="cost-grid"><div class="resource-tag">🎖️ Promotion Points: +${stepPoints.toLocaleString()} (${pointsPerUnit} pts per unit)</div>${finalSpeedupPoints > 0 ? `<div class="resource-tag">⚡ Speedup Points: +${finalSpeedupPoints.toLocaleString()}</div>` : ''}</div>`;
		if (canAfford) {
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>✓ ACTIVE PROMOTION</strong><br>${pointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : ''}`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>✗ INSUFFICIENT RESOURCES</strong><br>${pointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : ''}`;
		}
	} else if (fromLevel > 0 && toLevel > 0 && fromLevel !== toLevel && quantity > 0 && !isActive) {
		let costHtml = buildResourceDisplay(costTotals, vault, totalLocked);
		let timeDisplay = buildTimeDisplay(totalTimeSeconds, getBuffedTrainingTime(totalTimeSeconds), speedupTroop);
		let estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">🎖️ Promotion Points: +${stepPoints.toLocaleString()} (${pointsPerUnit} pts per unit)</div></div>`;
		if (speedupTroop && totalTimeSeconds > 0) {
			const buffedTimeSeconds = getBuffedTrainingTime(totalTimeSeconds);
			const estimatedSpeedupMinutes = secondsToSpeedupMinutes(buffedTimeSeconds);
			const estimatedSpeedupPoints = estimatedSpeedupMinutes * SCORE_RULES.speedup_min;
			estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">🎖️ Promotion Points: +${stepPoints.toLocaleString()} (${pointsPerUnit} pts per unit)</div><div class="resource-tag">⚡ Speedup Points: +${estimatedSpeedupPoints.toLocaleString()} (if used)</div></div>`;
		}
		if (canAfford) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>⚪ ESTIMATED PROMOTION</strong><br>${estimatedPointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}<br><span class="text-remaining">✅ Check "PROMOTE ACTIVE" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>✗ INSUFFICIENT RESOURCES</strong><br>${estimatedPointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}`;
		}
	} else if (fromLevel > 0 && toLevel === fromLevel && quantity > 0) {
		status.className = "status-pane status-warning";
		status.innerHTML = `⚠️ Current tier and target tier are the same. Select different tiers to promote.`;
	} else if (fromLevel > 0 && quantity > 0 && !toLevel) {
		status.className = "status-pane";
		status.innerHTML = `⚙️ Select target tier`;
	} else {
		status.className = "status-pane";
		status.innerHTML = `⚙️ Select current tier, target tier, and quantity`;
	}
}

function buildTimeDisplay(totalTimeSeconds, buffedTimeSeconds, speedupTroop) {
	if (totalTimeSeconds <= 0) return '';
	if (buffedTimeSeconds !== totalTimeSeconds) {
		return `<div class="resource-tag">⏱️ Total Time: ${formatSecondsToTime(buffedTimeSeconds)} (original: ${formatSecondsToTime(totalTimeSeconds)})</div>`;
	}
	return `<div class="resource-tag">⏱️ Total Time: ${formatSecondsToTime(totalTimeSeconds)}</div>`;
}

function buildPointsDisplay(troopPoints, speedupPoints) {
	if (troopPoints > 0 && speedupPoints > 0) {
		return `<div class="cost-grid"><div class="resource-tag">🎖️ Troop Points: +${troopPoints.toLocaleString()}</div><div class="resource-tag">⚡ Speedup Points: +${speedupPoints.toLocaleString()}</div></div>`;
	} else if (troopPoints > 0) {
		return `<div class="cost-grid"><div class="resource-tag">🎖️ Troop Points: +${troopPoints.toLocaleString()}</div></div>`;
	} else if (speedupPoints > 0) {
		return `<div class="cost-grid"><div class="resource-tag">⚡ Speedup Points: +${speedupPoints.toLocaleString()}</div></div>`;
	}
	return '';
}

function loadTroops() {
	const container = document.getElementById('troopsGrid');
	if (!container) return;
	container.innerHTML = '';
	const troopTypes = ['Infantry', 'Cavalry', 'Archer'];
	let trainingHtml = '';
	for (const troopType of troopTypes) {
		trainingHtml += createTroopIndividualCard(troopType + ' Tiers');
	}
	container.innerHTML += createTroopGroupCard('TRAINING', trainingHtml);
	let promotionHtml = '';
	for (const troopType of troopTypes) {
		const promoCard = createPromotionIndividualCard(troopType);
		if (promoCard) promotionHtml += promoCard;
	}
	if (promotionHtml) {
		container.innerHTML += createTroopGroupCard('PROMOTION', promotionHtml);
	}
	// Restore selections
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('troop_lvl_') || id.startsWith('troop_qty_') || id.startsWith('promo_from_') || id.startsWith('promo_to_') || id.startsWith('promo_qty_')) {
				const element = document.getElementById(id);
				if (element) {
					if (element.tagName === "SELECT") {
						let valueExists = false;
						for (let i = 0; i < element.options.length; i++) {
							if (element.options[i].value === value) {
								valueExists = true;
								break;
							}
						}
						if (valueExists) element.value = value;
					} else {
						element.value = value || '';
					}
				}
			}
		}
	}
	for (const [safeId, data] of lockedUpgrades.entries()) {
		if (safeId.startsWith('troops_')) {
			const activeCb = document.getElementById(`active_${safeId}`);
			if (activeCb && data.isActive !== undefined) activeCb.checked = data.isActive;
			const speedCb = document.getElementById(`speed_${safeId}`);
			if (speedCb && data.speedupWasChecked !== undefined) speedCb.checked = data.speedupWasChecked;
			if (data.qty) {
				const qtyInput = document.getElementById(`troop_qty_${safeId}`);
				if (qtyInput) qtyInput.value = data.qty;
			}
			if (data.level) {
				const lvlSelect = document.getElementById(`troop_lvl_${safeId}`);
				if (lvlSelect) {
					let valueExists = false;
					for (let i = 0; i < lvlSelect.options.length; i++) {
						if (String(lvlSelect.options[i].value) === String(data.level)) {
							valueExists = true;
							break;
						}
					}
					if (valueExists) lvlSelect.value = data.level;
				}
			}
		}
		if (safeId.startsWith('promotion_')) {
			const activeCb = document.getElementById(`promo_active_${safeId}`);
			if (activeCb && data.isActive !== undefined) activeCb.checked = data.isActive;
			const speedCb = document.getElementById(`promo_speed_${safeId}`);
			if (speedCb && data.speedupWasChecked !== undefined) speedCb.checked = data.speedupWasChecked;
			if (data.qty) {
				const qtyInput = document.getElementById(`promo_qty_${safeId}`);
				if (qtyInput) qtyInput.value = data.qty;
			}
			if (data.fromLevel) {
				const fromSelect = document.getElementById(`promo_from_${safeId}`);
				if (fromSelect) {
					let valueExists = false;
					for (let i = 0; i < fromSelect.options.length; i++) {
						if (String(fromSelect.options[i].value) === String(data.fromLevel)) {
							valueExists = true;
							break;
						}
					}
					if (valueExists) fromSelect.value = data.fromLevel;
				}
			}
			if (data.toLevel) {
				const toSelect = document.getElementById(`promo_to_${safeId}`);
				if (toSelect) {
					let valueExists = false;
					for (let i = 0; i < toSelect.options.length; i++) {
						if (String(toSelect.options[i].value) === String(data.toLevel)) {
							valueExists = true;
							break;
						}
					}
					if (valueExists) toSelect.value = data.toLevel;
				}
			}
		}
	}
	// Force 2 column layout
	if (window._troopsResizeHandler) {
		window.removeEventListener('resize', window._troopsResizeHandler);
	}
	const resizeHandler = function() {
		if (window.innerWidth > 768) {
			container.style.gridTemplateColumns = 'repeat(2, 1fr)';
		} else {
			container.style.gridTemplateColumns = '1fr';
		}
	};
	window._troopsResizeHandler = resizeHandler;
	resizeHandler();
	window.addEventListener('resize', resizeHandler);
	setTimeout(() => {
		refreshTroopsCalculations();
	}, 50);
}
window.validateNumberInput = validateNumberInput;
window.loadTroops = loadTroops;
window.refreshTroopsCalculations = refreshTroopsCalculations;
window.onPromotionCurrentSelect = onPromotionCurrentSelect;
