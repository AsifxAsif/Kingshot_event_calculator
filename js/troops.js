// ============================================
// TROOPS - FULLY FIXED (Remaining resources display correctly)
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
                    <input class="checkbox" type="checkbox" id="active_${safeId}" onchange="refreshTroopsCalculations()"> Train Active
                </label>
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px;">
                    <input class="checkbox" type="checkbox" id="speed_${safeId}" onchange="refreshTroopsCalculations()"> +Speedups
                </label>
            </div>
            <div id="status_${safeId}" class="status-pane" style="font-size: 0.7rem; padding: 6px 8px;">Select troop tier and quantity</div>
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
                    <input class="checkbox" type="checkbox" id="promo_active_${safeId}" onchange="refreshTroopsCalculations()"> Promote Active
                </label>
                <label class="checkbox-label" style="font-size: 0.75rem; padding: 4px 10px;">
                    <input class="checkbox" type="checkbox" id="promo_speed_${safeId}" onchange="refreshTroopsCalculations()"> +Speedups
                </label>
            </div>
            <div id="promo_status_${safeId}" class="status-pane" style="font-size: 0.7rem; padding: 6px 8px;">Select current tier, target tier, and quantity</div>
        </div>
    </div>`;
}

function createTroopGroupCard(groupName, itemsHtml) {
	const icon = groupName === 'TRAINING' ? 'Training' : 'Promotion';
	return `
        <div class="item-card" style="border: 1px solid #999; margin-bottom: 16px;">
            <div class="item-card-header" style="background: var(--surface-dark); border-bottom: 2px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.1rem;">${icon}</span>
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
// Speedup calculation with training first, then general
// ============================================
function calculateSpeedupUsage(totalTimeSeconds, vault, otherLocked) {
	if (totalTimeSeconds <= 0) {
		return {
			usedTraining: 0,
			usedGeneral: 0,
			totalUsed: 0,
			totalPoints: 0,
			partialNote: ''
		};
	}
	const buffedTimeSeconds = getBuffedTrainingTime(totalTimeSeconds);
	const totalSpeedupMinutesNeeded = secondsToSpeedupMinutes(buffedTimeSeconds);
	// Get available speedups (excluding those already locked)
	const trainingAvailable = Math.max(0, (vault.training_speedup || 0) - (otherLocked.training_speedup || 0));
	const generalAvailable = Math.max(0, (vault.general_speedup || 0) - (otherLocked.general_speedup || 0));
	let remainingNeeded = totalSpeedupMinutesNeeded;
	let usedTraining = 0;
	let usedGeneral = 0;
	let partialNote = '';
	// First use training speedups
	if (trainingAvailable > 0) {
		usedTraining = Math.min(trainingAvailable, remainingNeeded);
		remainingNeeded -= usedTraining;
	}
	// Then use general speedups if still needed
	if (remainingNeeded > 0 && generalAvailable > 0) {
		usedGeneral = Math.min(generalAvailable, remainingNeeded);
		remainingNeeded -= usedGeneral;
	}
	// Check if we have enough total
	if (remainingNeeded > 0) {
		const totalNeededDisplay = formatSecondsToTime(totalSpeedupMinutesNeeded * 60);
		const totalUsedDisplay = formatSecondsToTime((usedTraining + usedGeneral) * 60);
		partialNote = `Only ${totalUsedDisplay} available (need ${totalNeededDisplay})`;
		if (usedTraining === 0 && usedGeneral === 0) {
			partialNote = `No speedups available (need ${totalNeededDisplay})`;
		}
	}
	const totalUsed = usedTraining + usedGeneral;
	const totalPoints = totalUsed * SCORE_RULES.speedup_min;
	return {
		usedTraining,
		usedGeneral,
		totalUsed,
		totalPoints,
		totalNeeded: totalSpeedupMinutesNeeded,
		partialNote
	};
}
// ============================================
// FIXED: refreshTroopsCalculations - Remaining resources display correctly
// ============================================
function refreshTroopsCalculations() {
	let vault = getCurrentVault();
	let totalTroopPoints = 0;
	let totalSpeedupPoints = 0;
	// Collect ALL locked upgrades
	const allLocked = {};
	for (const [_, ld] of lockedUpgrades.entries()) {
		for (const [res, amt] of Object.entries(ld.costTotals)) {
			if (!res.startsWith('_')) {
				allLocked[res] = (allLocked[res] || 0) + amt;
			}
		}
	}
	// ============================================
	// 1. Training Cards
	// ============================================
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
		const isValidSelection = level > 0 && quantity > 0;
		if (isValidSelection) {
			const troopPoints = getTroopPointsForLevel(troopType, level);
			stepPoints = quantity * troopPoints;
			costTotals = getTroopResourceCosts(troopType, level, quantity) || {};
			totalTimeSeconds = getTroopTrainingTime(troopType, level, quantity);
			// Calculate what OTHER cards have locked away
			const otherLocked = {};
			for (const [res, amt] of Object.entries(allLocked)) {
				if (!res.startsWith('_')) {
					const currentAmt = isLocked ? (costTotals[res] || 0) : 0;
					if (amt - currentAmt > 0) {
						otherLocked[res] = amt - currentAmt;
					}
				}
			}
			// Verify basic resource affordability
			for (const [res, amt] of Object.entries(costTotals)) {
				if (res === 'training_speedup' || res === 'general_speedup') continue;
				if ((vault[res] || 0) < (otherLocked[res] || 0) + amt) {
					canAfford = false;
					break;
				}
			}
		}
		// Calculate speedup usage
		let speedupResult = {
			usedTraining: 0,
			usedGeneral: 0,
			totalUsed: 0,
			totalPoints: 0,
			partialNote: ''
		};
		let finalSpeedupPoints = 0;
		let partialNote = '';
		if (isValidSelection && speedCb?.checked && totalTimeSeconds > 0) {
			const otherLocked = {};
			for (const [res, amt] of Object.entries(allLocked)) {
				if (!res.startsWith('_')) {
					const currentAmt = isLocked ? (costTotals[res] || 0) : 0;
					if (amt - currentAmt > 0) {
						otherLocked[res] = amt - currentAmt;
					}
				}
			}
			speedupResult = calculateSpeedupUsage(totalTimeSeconds, vault, otherLocked);
			finalSpeedupPoints = speedupResult.totalPoints;
			partialNote = speedupResult.partialNote;
			if (speedupResult.usedTraining > 0) {
				costTotals.training_speedup = (costTotals.training_speedup || 0) + speedupResult.usedTraining;
			}
			if (speedupResult.usedGeneral > 0) {
				costTotals.general_speedup = (costTotals.general_speedup || 0) + speedupResult.usedGeneral;
			}
		}
		// Update interactive UI elements state safely
		if (activeCb) {
			const isDisabled = !isValidSelection || (!canAfford && !activeCb.checked);
			activeCb.disabled = isDisabled;
			if (!isValidSelection) {
				activeCb.checked = false;
			}
			activeCb.parentElement.style.opacity = isDisabled ? '0.5' : '1';
			activeCb.parentElement.classList.toggle('disabled', isDisabled);
		}
		// Process State Storage updates safely based on real-time DOM checked status
		if (isValidSelection && canAfford && activeCb?.checked) {
			lockedUpgrades.set(safeId, {
				costTotals: JSON.parse(JSON.stringify(costTotals)),
				stepPoints: stepPoints + finalSpeedupPoints,
				qty: quantity,
				level: level,
				speedupWasChecked: speedCb?.checked || false,
				isActive: true,
				type: 'training',
				usedTraining: speedupResult.usedTraining || 0,
				usedGeneral: speedupResult.usedGeneral || 0
			});
			if (stepPoints > 0) totalTroopPoints += stepPoints;
			if (finalSpeedupPoints > 0) totalSpeedupPoints += finalSpeedupPoints;
		} else {
			if (lockedUpgrades.has(safeId)) {
				lockedUpgrades.delete(safeId);
			}
		}
		// Speedup Checkbox constraints
		if (speedCb) {
			const otherLocked = {};
			for (const [res, amt] of Object.entries(allLocked)) {
				if (!res.startsWith('_')) {
					const currentAmt = isLocked ? (costTotals[res] || 0) : 0;
					if (amt - currentAmt > 0) {
						otherLocked[res] = amt - currentAmt;
					}
				}
			}
			const trainingAvailable = (vault.training_speedup || 0) - (otherLocked.training_speedup || 0);
			const generalAvailable = (vault.general_speedup || 0) - (otherLocked.general_speedup || 0);
			const hasAnySpeedups = trainingAvailable > 0 || generalAvailable > 0;
			const isSpeedDisabled = !isValidSelection || !canAfford || !hasAnySpeedups;
			speedCb.disabled = isSpeedDisabled;
			if (!isValidSelection) speedCb.checked = false;
			speedCb.parentElement.style.opacity = isSpeedDisabled ? '0.5' : '1';
			speedCb.parentElement.classList.toggle('disabled', isSpeedDisabled);
			speedCb.parentElement.title = !hasAnySpeedups && isValidSelection ? 'No speedups available in vault' : '';
		}
		// ✅ FIXED: Build displayLocked PER CARD - exclude current card's costs when locked
		const displayLocked = {};
		for (const [res, amt] of Object.entries(allLocked)) {
			if (!res.startsWith('_')) {
				const currentAmt = isLocked ? (costTotals[res] || 0) : 0;
				if (amt - currentAmt > 0) {
					displayLocked[res] = (displayLocked[res] || 0) + (amt - currentAmt);
				}
			}
		}
		let speedupDetails = '';
		if (speedCb?.checked && speedupResult.totalUsed > 0) {
			const trainingDisplay = formatSecondsToTime(speedupResult.usedTraining * 60);
			const generalDisplay = formatSecondsToTime(speedupResult.usedGeneral * 60);
			speedupDetails = ` (${trainingDisplay} training + ${generalDisplay} general)`;
		}
		// Pass displayLocked to display function
		displayTroopStatus(status, troopType, level, quantity, activeCb?.checked || false, speedCb?.checked || false, costTotals, stepPoints, finalSpeedupPoints, totalTimeSeconds, canAfford, vault, displayLocked, partialNote, speedupDetails);
	}
	// ============================================
	// 2. Promotion Cards
	// ============================================
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
		const isValidSelection = fromLevel > 0 && toLevel > 0 && toLevel > fromLevel && quantity > 0;
		if (isValidSelection) {
			const currentPoints = getTroopPointsForLevel(troopType, fromLevel);
			const targetPoints = getTroopPointsForLevel(troopType, toLevel);
			pointsPerUnit = Math.max(0, targetPoints - currentPoints);
			stepPoints = quantity * pointsPerUnit;
			costTotals = getPromotionResourceCosts(troopType, fromLevel, toLevel, quantity) || {};
			totalTimeSeconds = getPromotionTime(troopType, fromLevel, toLevel, quantity);
			const otherLocked = {};
			for (const [res, amt] of Object.entries(allLocked)) {
				if (!res.startsWith('_')) {
					const currentAmt = isLocked ? (costTotals[res] || 0) : 0;
					if (amt - currentAmt > 0) {
						otherLocked[res] = amt - currentAmt;
					}
				}
			}
			for (const [res, amt] of Object.entries(costTotals)) {
				if (res === 'training_speedup' || res === 'general_speedup') continue;
				if ((vault[res] || 0) < (otherLocked[res] || 0) + amt) {
					canAfford = false;
					break;
				}
			}
		}
		// Calculate speedup usage
		let speedupResult = {
			usedTraining: 0,
			usedGeneral: 0,
			totalUsed: 0,
			totalPoints: 0,
			partialNote: ''
		};
		let finalSpeedupPoints = 0;
		let partialNote = '';
		if (isValidSelection && speedCb?.checked && totalTimeSeconds > 0) {
			const otherLocked = {};
			for (const [res, amt] of Object.entries(allLocked)) {
				if (!res.startsWith('_')) {
					const currentAmt = isLocked ? (costTotals[res] || 0) : 0;
					if (amt - currentAmt > 0) {
						otherLocked[res] = amt - currentAmt;
					}
				}
			}
			speedupResult = calculateSpeedupUsage(totalTimeSeconds, vault, otherLocked);
			finalSpeedupPoints = speedupResult.totalPoints;
			partialNote = speedupResult.partialNote;
			if (speedupResult.usedTraining > 0) {
				costTotals.training_speedup = (costTotals.training_speedup || 0) + speedupResult.usedTraining;
			}
			if (speedupResult.usedGeneral > 0) {
				costTotals.general_speedup = (costTotals.general_speedup || 0) + speedupResult.usedGeneral;
			}
		}
		// Update interactive UI elements state safely
		if (activeCb) {
			const isDisabled = !isValidSelection || (!canAfford && !activeCb.checked);
			activeCb.disabled = isDisabled;
			if (!isValidSelection) {
				activeCb.checked = false;
			}
			activeCb.parentElement.style.opacity = isDisabled ? '0.5' : '1';
			activeCb.parentElement.classList.toggle('disabled', isDisabled);
		}
		// Process State Storage updates safely based on real-time DOM checked status
		if (isValidSelection && canAfford && activeCb?.checked) {
			lockedUpgrades.set(safeId, {
				costTotals: JSON.parse(JSON.stringify(costTotals)),
				stepPoints: stepPoints + finalSpeedupPoints,
				qty: quantity,
				fromLevel: fromLevel,
				toLevel: toLevel,
				speedupWasChecked: speedCb?.checked || false,
				isActive: true,
				type: 'promotion',
				pointsPerUnit: pointsPerUnit,
				usedTraining: speedupResult.usedTraining || 0,
				usedGeneral: speedupResult.usedGeneral || 0
			});
			if (stepPoints > 0) totalTroopPoints += stepPoints;
			if (finalSpeedupPoints > 0) totalSpeedupPoints += finalSpeedupPoints;
		} else {
			if (lockedUpgrades.has(safeId)) {
				lockedUpgrades.delete(safeId);
			}
		}
		// Speedup Checkbox constraints
		if (speedCb) {
			const otherLocked = {};
			for (const [res, amt] of Object.entries(allLocked)) {
				if (!res.startsWith('_')) {
					const currentAmt = isLocked ? (costTotals[res] || 0) : 0;
					if (amt - currentAmt > 0) {
						otherLocked[res] = amt - currentAmt;
					}
				}
			}
			const trainingAvailable = (vault.training_speedup || 0) - (otherLocked.training_speedup || 0);
			const generalAvailable = (vault.general_speedup || 0) - (otherLocked.general_speedup || 0);
			const hasAnySpeedups = trainingAvailable > 0 || generalAvailable > 0;
			const isSpeedDisabled = !isValidSelection || !canAfford || !hasAnySpeedups;
			speedCb.disabled = isSpeedDisabled;
			if (!isValidSelection) speedCb.checked = false;
			speedCb.parentElement.style.opacity = isSpeedDisabled ? '0.5' : '1';
			speedCb.parentElement.classList.toggle('disabled', isSpeedDisabled);
			speedCb.parentElement.title = !hasAnySpeedups && isValidSelection ? 'No speedups available in vault' : '';
		}
		// ✅ FIXED: Build displayLocked PER CARD - exclude current card's costs when locked
		const displayLocked = {};
		for (const [res, amt] of Object.entries(allLocked)) {
			if (!res.startsWith('_')) {
				const currentAmt = isLocked ? (costTotals[res] || 0) : 0;
				if (amt - currentAmt > 0) {
					displayLocked[res] = (displayLocked[res] || 0) + (amt - currentAmt);
				}
			}
		}
		let speedupDetails = '';
		if (speedCb?.checked && speedupResult.totalUsed > 0) {
			const trainingDisplay = formatSecondsToTime(speedupResult.usedTraining * 60);
			const generalDisplay = formatSecondsToTime(speedupResult.usedGeneral * 60);
			speedupDetails = ` (${trainingDisplay} training + ${generalDisplay} general)`;
		}
		// Pass displayLocked to display function
		displayPromotionStatus(status, troopType, fromLevel, toLevel, quantity, activeCb?.checked || false, speedCb?.checked || false, costTotals, stepPoints, finalSpeedupPoints, totalTimeSeconds, canAfford, vault, displayLocked, pointsPerUnit, partialNote, speedupDetails);
	}
	const totalScore = totalTroopPoints + totalSpeedupPoints;
	const scoreDisplay = document.getElementById('globalScoreDisplay');
	if (scoreDisplay) {
		scoreDisplay.innerText = totalScore.toLocaleString();
		if (typeof saveCurrentPageScore === 'function') saveCurrentPageScore(totalScore);
	}
	window.dispatchEvent(new Event('troopsUpdate'));
}
// displayTroopStatus - Shows remaining correctly
function displayTroopStatus(status, troopType, level, quantity, isActive, speedupTroop, costTotals, stepPoints, finalSpeedupPoints, totalTimeSeconds, canAfford, vault, totalLocked, partialNote, speedupDetails) {
	if (level > 0 && quantity > 0 && isActive) {
		let costHtml = buildResourceDisplay(costTotals, vault, totalLocked);
		let timeDisplay = buildTimeDisplay(totalTimeSeconds, getBuffedTrainingTime(totalTimeSeconds), speedupTroop);
		let pointsDisplay = buildPointsDisplay(stepPoints, finalSpeedupPoints, speedupDetails);
		const partialHtml = partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : '';
		if (canAfford) {
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>ACTIVE</strong><br>${pointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialHtml}`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES</strong><br>${pointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialHtml}`;
		}
	} else if (level > 0 && quantity > 0 && !isActive) {
		let costHtml = buildResourceDisplay(costTotals, vault, totalLocked);
		let timeDisplay = buildTimeDisplay(totalTimeSeconds, getBuffedTrainingTime(totalTimeSeconds), speedupTroop);
		let estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">Troop Points: +${stepPoints.toLocaleString()}</div></div>`;
		if (speedupTroop && totalTimeSeconds > 0) {
			const otherLocked = {};
			for (const [res, amt] of Object.entries(totalLocked)) {
				if (!res.startsWith('_')) {
					otherLocked[res] = amt;
				}
			}
			const speedupResult = calculateSpeedupUsage(totalTimeSeconds, vault, otherLocked);
			if (speedupResult.totalUsed > 0) {
				const trainingDisplay = formatSecondsToTime(speedupResult.usedTraining * 60);
				const generalDisplay = formatSecondsToTime(speedupResult.usedGeneral * 60);
				estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">Troop Points: +${stepPoints.toLocaleString()}</div><div class="resource-tag">Speedup Points: +${speedupResult.totalPoints.toLocaleString()} (${trainingDisplay} training + ${generalDisplay} general available)</div></div>`;
			} else if (speedupResult.totalNeeded > 0) {
				const neededDisplay = formatSecondsToTime(speedupResult.totalNeeded * 60);
				estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">Troop Points: +${stepPoints.toLocaleString()}</div><div class="resource-tag text-warning">No speedups available (need ${neededDisplay})</div></div>`;
			}
		}
		const partialHtml = partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : '';
		if (canAfford) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>ESTIMATED</strong><br>${estimatedPointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialHtml}<br><span class="text-remaining">Check "TRAIN ACTIVE" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES</strong><br>${estimatedPointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialHtml}`;
		}
	} else {
		status.className = "status-pane";
		status.innerHTML = `Select troop tier and quantity`;
	}
}
// displayPromotionStatus - Shows remaining correctly
function displayPromotionStatus(status, troopType, fromLevel, toLevel, quantity, isActive, speedupTroop, costTotals, stepPoints, finalSpeedupPoints, totalTimeSeconds, canAfford, vault, totalLocked, pointsPerUnit, partialNote, speedupDetails) {
	if (fromLevel > 0 && toLevel > 0 && toLevel <= fromLevel && quantity > 0) {
		status.className = "status-pane status-warning";
		status.innerHTML = `Target tier (${toLevel}) must be higher than current tier (${fromLevel})`;
		return;
	}
	const partialHtml = partialNote ? `<div class="resource-tag text-warning">${partialNote}</div>` : '';
	if (fromLevel > 0 && toLevel > 0 && fromLevel !== toLevel && quantity > 0 && isActive) {
		let costHtml = buildResourceDisplay(costTotals, vault, totalLocked);
		let timeDisplay = buildTimeDisplay(totalTimeSeconds, getBuffedTrainingTime(totalTimeSeconds), speedupTroop);
		let pointsDisplay = `<div class="cost-grid"><div class="resource-tag">Promotion Points: +${stepPoints.toLocaleString()} (${pointsPerUnit} pts per unit)</div>${finalSpeedupPoints > 0 ? `<div class="resource-tag">Speedup Points: +${finalSpeedupPoints.toLocaleString()}${speedupDetails || ''}</div>` : ''}</div>`;
		if (canAfford) {
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>ACTIVE PROMOTION</strong><br>${pointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialHtml}`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES</strong><br>${pointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialHtml}`;
		}
	} else if (fromLevel > 0 && toLevel > 0 && fromLevel !== toLevel && quantity > 0 && !isActive) {
		let costHtml = buildResourceDisplay(costTotals, vault, totalLocked);
		let timeDisplay = buildTimeDisplay(totalTimeSeconds, getBuffedTrainingTime(totalTimeSeconds), speedupTroop);
		let estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">Promotion Points: +${stepPoints.toLocaleString()} (${pointsPerUnit} pts per unit)</div></div>`;
		if (speedupTroop && totalTimeSeconds > 0) {
			const otherLocked = {};
			for (const [res, amt] of Object.entries(totalLocked)) {
				if (!res.startsWith('_')) {
					otherLocked[res] = amt;
				}
			}
			const speedupResult = calculateSpeedupUsage(totalTimeSeconds, vault, otherLocked);
			if (speedupResult.totalUsed > 0) {
				const trainingDisplay = formatSecondsToTime(speedupResult.usedTraining * 60);
				const generalDisplay = formatSecondsToTime(speedupResult.usedGeneral * 60);
				estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">Promotion Points: +${stepPoints.toLocaleString()} (${pointsPerUnit} pts per unit)</div><div class="resource-tag">Speedup Points: +${speedupResult.totalPoints.toLocaleString()} (${trainingDisplay} training + ${generalDisplay} general available)</div></div>`;
			} else if (speedupResult.totalNeeded > 0) {
				const neededDisplay = formatSecondsToTime(speedupResult.totalNeeded * 60);
				estimatedPointsDisplay = `<div class="cost-grid"><div class="resource-tag">Promotion Points: +${stepPoints.toLocaleString()} (${pointsPerUnit} pts per unit)</div><div class="resource-tag text-warning">No speedups available (need ${neededDisplay})</div></div>`;
			}
		}
		if (canAfford) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>ESTIMATED PROMOTION</strong><br>${estimatedPointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialHtml}<br><span class="text-remaining">Check "PROMOTE ACTIVE" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES</strong><br>${estimatedPointsDisplay}<div class="cost-grid">${costHtml}</div>${timeDisplay}${partialHtml}`;
		}
	} else if (fromLevel > 0 && toLevel === fromLevel && quantity > 0) {
		status.className = "status-pane status-warning";
		status.innerHTML = `Current tier and target tier are the same. Select different tiers to promote.`;
	} else if (fromLevel > 0 && quantity > 0 && !toLevel) {
		status.className = "status-pane";
		status.innerHTML = `Select target tier`;
	} else {
		status.className = "status-pane";
		status.innerHTML = `Select current tier, target tier, and quantity`;
	}
}

function buildTimeDisplay(totalTimeSeconds, buffedTimeSeconds, speedupTroop) {
	if (totalTimeSeconds <= 0) return '';
	if (buffedTimeSeconds !== totalTimeSeconds) {
		return `<div class="resource-tag">Total Time: ${formatSecondsToTime(buffedTimeSeconds)} (original: ${formatSecondsToTime(totalTimeSeconds)})</div>`;
	}
	return `<div class="resource-tag">Total Time: ${formatSecondsToTime(totalTimeSeconds)}</div>`;
}

function buildPointsDisplay(troopPoints, speedupPoints, speedupDetails) {
	if (troopPoints > 0 && speedupPoints > 0) {
		return `<div class="cost-grid"><div class="resource-tag">Troop Points: +${troopPoints.toLocaleString()}</div><div class="resource-tag">Speedup Points: +${speedupPoints.toLocaleString()}${speedupDetails || ''}</div></div>`;
	} else if (troopPoints > 0) {
		return `<div class="cost-grid"><div class="resource-tag">Troop Points: +${troopPoints.toLocaleString()}</div></div>`;
	} else if (speedupPoints > 0) {
		return `<div class="cost-grid"><div class="resource-tag">Speedup Points: +${speedupPoints.toLocaleString()}${speedupDetails || ''}</div></div>`;
	}
	return '';
}

function loadTroops() {
	const container = document.getElementById('troopsGrid');
	if (!container) return;
	if (!window.gameDB || !window.gameDB.Troops) {
		console.warn('Troops data not loaded yet, retrying...');
		setTimeout(loadTroops, 100);
		return;
	}
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
	// Restore locked upgrades first
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
	// Restore selections from preset
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const preset = allPresets[presetName];
	if (preset && preset.selections) {
		// First restore current/promo_from selections (needed for filtering)
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('promo_from_')) {
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
		// Apply filtering based on promo_from selections
		document.querySelectorAll('.troop-card[data-type="promotion"]').forEach(card => {
			const safeId = card.dataset.id;
			const troopType = card.dataset.name;
			const fromSelect = document.getElementById(`promo_from_${safeId}`);
			if (fromSelect && fromSelect.value && fromSelect.value !== '') {
				onPromotionCurrentSelect(safeId, troopType);
			}
		});
		// Now restore the rest of the selections
		for (const [id, value] of Object.entries(preset.selections)) {
			if (id.startsWith('troop_lvl_') || id.startsWith('troop_qty_') || id.startsWith('promo_qty_')) {
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
			// Restore promo_to (target) values only if they exist in the filtered options
			if (id.startsWith('promo_to_')) {
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
	refreshTroopsCalculations();
}
// ============================================
// EXPORTS
// ============================================
window.validateNumberInput = validateNumberInput;
window.loadTroops = loadTroops;
window.refreshTroopsCalculations = refreshTroopsCalculations;
window.onPromotionCurrentSelect = onPromotionCurrentSelect;
