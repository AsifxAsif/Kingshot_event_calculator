// ============================================
// FORGEHAMMER - IMAGE MAPPING
// ============================================
function getForgehammerImageFileName(itemName) {
	const imageMap = {
		'Mastery Forging: Helmet': 'helmet.png',
		'Mastery Forging: Hand': 'hand.png',
		'Mastery Forging: Armor': 'armor.png',
		'Mastery Forging: Boot': 'boot.png'
	};
	// Try exact match first
	if (imageMap[itemName]) {
		return `assets/forgehammer/${imageMap[itemName]}`;
	}
	// Try to extract the item name
	const itemMatch = itemName.match(/Mastery Forging: (.+)/);
	if (itemMatch) {
		const item = itemMatch[1];
		const itemMap = {
			'Helmet': 'helmet.png',
			'Hand': 'hand.png',
			'Armor': 'armor.png',
			'Boot': 'boot.png'
		};
		if (itemMap[item]) {
			return `assets/forgehammer/${itemMap[item]}`;
		}
	}
	// Fallback
	return `assets/forgehammer/${itemName.toLowerCase().replace(/ /g, '_')}.png`;
}

function getForgehammerData() {
	return window.gameDB.Forgehammer?.Mastery || [];
}

function getForgehammerLevels(dataArray) {
	if (!dataArray?.length) return [0];
	const levels = new Set();
	// Add 0 as default starting level
	levels.add(0);
	for (let i = 0; i < dataArray.length; i++) {
		let lvl = dataArray[i].level ?? dataArray[i].current_lvl ?? dataArray[i].current;
		if (lvl !== undefined && lvl !== 0) levels.add(lvl);
	}
	if (levels.size === 0) return [0];
	return Array.from(levels).sort((a, b) => parseFloat(a) - parseFloat(b));
}

function getForgehammerTargetLevels(dataArray) {
	if (!dataArray?.length) return [];
	const levels = new Set();
	for (const item of dataArray) {
		let lvl = item.level ?? item.target_lvl ?? item.target;
		if (lvl !== undefined && lvl !== 0) levels.add(lvl);
	}
	return Array.from(levels).sort((a, b) => parseFloat(a) - parseFloat(b));
}

function getForgehammerUpgradeSteps(dataArray, fromLevel, toLevel) {
	const steps = [];
	const fromStr = String(fromLevel);
	const toStr = String(toLevel);

	// If from is "0", start from the beginning
	if (fromStr === '0') {
		for (const item of dataArray) {
			let lvl = item.level ?? item.target_lvl ?? item.target;
			if (lvl !== undefined && lvl !== 0) {
				steps.push(item);
				if (String(lvl) === toStr) break;
			}
		}
		return steps;
	}

	let start = -1, end = -1;
	for (let i = 0; i < dataArray.length; i++) {
		let lvl = dataArray[i].level ?? dataArray[i].target_lvl ?? dataArray[i].target;
		if (lvl !== undefined && lvl !== 0 && String(lvl) === fromStr) start = i;
		if (lvl !== undefined && lvl !== 0 && String(lvl) === toStr) end = i;
	}
	if (start !== -1 && end !== -1 && start < end) {
		for (let i = start + 1; i <= end; i++) steps.push(dataArray[i]);
		return steps;
	}
	return steps;
}

function getForgehammerNextLevel(dataArray, fromLevel) {
	const allLevels = getForgehammerTargetLevels(dataArray);
	const currentNum = parseFloat(fromLevel);
	for (const lvl of allLevels) {
		if (parseFloat(lvl) > currentNum) {
			return lvl;
		}
	}
	return null;
}

function createForgehammerCard(name, dataArray) {
	if (!dataArray?.length) return '';
	const fromLevels = getForgehammerLevels(dataArray);
	const toLevels = getForgehammerTargetLevels(dataArray);
	const safeId = `forgehammer_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : '';
	
	// Build current level dropdown
	let currOpts = '<option value="" disabled selected hidden>Current Level</option>';
	// Add level 0 first
	if (fromLevels.includes(0) || fromLevels.includes('0')) {
		currOpts += `<option value="0">0</option>`;
	}
	for (let i = 0; i < fromLevels.length; i++) {
		if (fromLevels[i] !== 0 && fromLevels[i] !== '0') {
			currOpts += `<option value="${fromLevels[i]}">${fromLevels[i]}</option>`;
		}
	}
	if (highestLevel && !fromLevels.includes(highestLevel)) {
		currOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
	}
	
	// Build target dropdown - SHOW ALL LEVELS initially
	let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
	// Add all levels from toLevels
	for (let i = 0; i < toLevels.length; i++) {
		targOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
	}
	if (highestLevel && !toLevels.includes(highestLevel)) {
		targOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
	}
	
	const imgUrl = getForgehammerImageFileName(name);
	return `<div class="item-card" data-type="forgehammer" data-name="${name}" data-id="${safeId}">
        <div class="item-card-header">
            <img src="${imgUrl}" onerror="this.style.display='none';" style="height: 60px; width: 60px; object-fit: contain;">
            <span>🔨 ${name}</span>
        </div>
        <div class="item-card-body">
            <div class="level-controls">
                <select id="curr_${safeId}" onchange="onForgehammerCurrentSelect('${safeId}')">${currOpts}</select>
                <select id="targ_${safeId}" onchange="onForgehammerTargetChange('${safeId}')">${targOpts}</select>
            </div>
            <div class="checkbox-group">
                <label class="checkbox-label"><input class="checkbox" type="checkbox" id="active_${safeId}" onchange="onForgehammerUpgradeCheckboxChange('${safeId}', this.checked)"> ⬆️ Upgrade</label>
            </div>
            <div id="status_${safeId}" class="status-pane">⚙️ Select current & target level</div>
        </div>
    </div>`;
}

function calculateForgehammerCosts(dataArray, from, to, vault, otherLocked) {
	// Handle "max" value - convert to actual highest level
	let actualFrom = from;
	let actualTo = to;
	const toLevels = getForgehammerTargetLevels(dataArray);
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
	const steps = getForgehammerUpgradeSteps(dataArray, actualFrom, actualTo);
	if (!steps.length) return null;
	let stepPoints = 0;
	const costTotals = {};
	for (const step of steps) {
		if (step.forgehammer) stepPoints += step.forgehammer * SCORE_RULES.forge_hammer;
		const keys = ['bread', 'wood', 'stone', 'iron', 'gold', 'truegold', 'tempered_truegold', 'truegold_dust', 'forgehammer', 'widgets', 'mithril', 'satin', 'gilded_threads', 'artisans_vision', 'charm_guide', 'charm_design', 'pet_food', 'growth_manual', 'nutrient_potion', 'promotion_medallion'];
		for (const k of keys) {
			if (step[k] !== undefined) {
				const norm = k === 'forgehammer' ? 'forge_hammer' : k;
				costTotals[norm] = (costTotals[norm] || 0) + parseCost(step[k]);
			}
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

function refreshCalculations() {
	let vault = getCurrentVault();
	const totalLocked = {};
	for (const [_, ld] of lockedUpgrades.entries()) {
		for (const [res, amt] of Object.entries(ld.costTotals)) totalLocked[res] = (totalLocked[res] || 0) + amt;
	}
	let totalScore = 0;
	const cards = document.querySelectorAll('.item-card[data-type="forgehammer"]');
	const dataArray = getForgehammerData();
	for (const card of cards) {
		const safeId = card.dataset.id;
		const curr = document.getElementById(`curr_${safeId}`),
			targ = document.getElementById(`targ_${safeId}`);
		const status = document.getElementById(`status_${safeId}`);
		const activeCb = document.getElementById(`active_${safeId}`);
		if (!curr || !targ || !status) continue;
		const from = curr.value,
			to = targ.value;
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

		// Check if already at max
		const toLevels = getForgehammerTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
		const isAtMax = highestLevel && String(from) === String(highestLevel);
		if (isAtMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `🏆 <strong>FORGING MAXED!</strong><br>Already at highest level (${highestLevel})`;
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
		for (const [oid, ld] of lockedUpgrades.entries())
			if (oid !== safeId) {
				for (const [res, amt] of Object.entries(ld.costTotals)) otherLocked[res] = (otherLocked[res] || 0) + amt;
			}
		const costs = calculateForgehammerCosts(dataArray, from, to, vault, otherLocked);
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

function onForgehammerCurrentSelect(safeId) {
	const curr = document.getElementById(`curr_${safeId}`);
	const targ = document.getElementById(`targ_${safeId}`);
	if (!curr || !targ) return;
	
	const from = curr.value;
	const dataArray = getForgehammerData();
	const toLevels = getForgehammerTargetLevels(dataArray);
	const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
	
	// If "Current Level" placeholder is selected, show ALL levels in target
	if (!from || from === '') {
		// Reset target dropdown with ALL levels
		let targOpts = '<option value="" disabled selected hidden>Target Level</option>';
		// Add all levels from toLevels
		for (let i = 0; i < toLevels.length; i++) {
			targOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
		}
		// If highest level is not in the list, add it
		if (highestLevel && !toLevels.includes(highestLevel)) {
			targOpts += `<option value="${highestLevel}">${highestLevel}</option>`;
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
	
	const currentNum = parseFloat(from);
	const next = getForgehammerNextLevel(dataArray, from);
	
	// Dynamically rebuild target dropdown - only show levels above current
	let dynamicTargOpts = '<option value="" disabled selected hidden>Target Level</option>';
	let hasHigherLevels = false;
	for (let i = 0; i < toLevels.length; i++) {
		const targetNum = parseFloat(toLevels[i]);
		if (targetNum > currentNum) {
			dynamicTargOpts += `<option value="${toLevels[i]}">${toLevels[i]}</option>`;
			hasHigherLevels = true;
		}
	}
	// If no higher levels exist (already at max), show the highest level as the only option
	if (!hasHigherLevels && highestLevel) {
		dynamicTargOpts += `<option value="${highestLevel}" selected>${highestLevel}</option>`;
	}
	targ.innerHTML = dynamicTargOpts;
	
	// Auto-select the next logical level if it exists
	if (next) {
		let found = false;
		for (let i = 0; i < targ.options.length; i++) {
			if (String(targ.options[i].value) === String(next)) {
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

function onForgehammerTargetChange(safeId) {
	if (lockedUpgrades.has(safeId)) {
		lockedUpgrades.delete(safeId);
		const cb = document.getElementById(`active_${safeId}`);
		if (cb) cb.checked = false;
	}
	refreshCalculations();
}

function onForgehammerUpgradeCheckboxChange(safeId, isChecked) {
	if (isChecked) {
		const curr = document.getElementById(`curr_${safeId}`),
			targ = document.getElementById(`targ_${safeId}`);
		if (!curr || !targ) return;
		const from = curr.value,
			to = targ.value;

		if (!from || from === '' || !to || to === '' || String(from) === String(to)) {
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
		const dataArray = getForgehammerData();
		const costs = calculateForgehammerCosts(dataArray, from, to, vault, otherLocked);
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

function loadForgehammer() {
	const container = document.getElementById('forgehammerGrid');
	if (!container) return;
	container.innerHTML = '';
	const items = ['Helmet', 'Hand', 'Armor', 'Boot'];
	const dataArray = getForgehammerData();
	for (const item of items) {
		container.innerHTML += createForgehammerCard(`Mastery Forging: ${item}`, dataArray);
	}
	for (const [safeId, data] of lockedUpgrades.entries()) {
		if (safeId.startsWith('forgehammer_')) {
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
		}
	}

	// ============================================
	// FORCE 2 COLUMN LAYOUT FOR FORGEHAMMER PAGE
	// ============================================
	if (window._forgehammerResizeHandler) {
		window.removeEventListener('resize', window._forgehammerResizeHandler);
	}

	const resizeHandler = function () {
		if (window.innerWidth > 768) {
			container.style.gridTemplateColumns = 'repeat(2, 1fr)';
		} else {
			container.style.gridTemplateColumns = '1fr';
		}
	};

	window._forgehammerResizeHandler = resizeHandler;
	resizeHandler();
	window.addEventListener('resize', resizeHandler);

	refreshCalculations();
}

window.loadForgehammer = loadForgehammer;
window.refreshCalculations = refreshCalculations;
window.onForgehammerCurrentSelect = onForgehammerCurrentSelect;
window.onForgehammerTargetChange = onForgehammerTargetChange;
window.onForgehammerUpgradeCheckboxChange = onForgehammerUpgradeCheckboxChange;