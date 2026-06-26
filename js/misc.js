// ============================================
// MISC - Hero Roulette & Gathering Calculator
// ============================================
// ============================================
// GLOBAL STATE
// ============================================
let globalMarchUnits = 0;
let globalBisonGrip = 0;
let globalBisonResource = 'bread';
let globalBisonNode = 1;
// ============================================
// GATHERING DATA
// ============================================
function getGatheringData() {
	return window.gameDB.Misc?.Gathering || [];
}

function getGatheringNodeData(nodeLevel, resourceType) {
	const data = getGatheringData();
	return data.find(item => parseInt(item.node.replace('lvl ', '')) === nodeLevel && item.item === resourceType);
}
// ============================================
// LOCAL STORAGE
// ============================================
function loadMiscFromStorage() {
	const saved = localStorage.getItem('misc_data');
	if (saved) {
		try {
			const data = JSON.parse(saved);
			if (data.heroRouletteCount !== undefined) {
				document.getElementById('heroRouletteCount').value = data.heroRouletteCount || '';
			}
			// Gathering cards data
			if (data.gatheringCards) {
				for (const [cardId, cardData] of Object.entries(data.gatheringCards)) {
					const resourceSelect = document.getElementById(`gather_resource_${cardId}`);
					const nodeSelect = document.getElementById(`gather_node_${cardId}`);
					const skillSelect = document.getElementById(`gather_skill_${cardId}`);
					const speedInput = document.getElementById(`gather_speed_${cardId}`);
					if (resourceSelect) resourceSelect.value = cardData.resource || '';
					if (nodeSelect) nodeSelect.value = cardData.node || '';
					if (skillSelect) skillSelect.value = cardData.skill || '';
					if (speedInput) speedInput.value = cardData.speed || '';
				}
			}
		} catch (e) {
			console.warn('Failed to load misc data:', e);
		}
	}
}

function saveMiscToStorage() {
	const data = {
		heroRouletteCount: document.getElementById('heroRouletteCount').value || '',
		gatheringCards: {}
	};
	// Save gathering card data
	document.querySelectorAll('.gathering-card').forEach((card, index) => {
		const cardId = index + 1;
		const resourceSelect = document.getElementById(`gather_resource_${cardId}`);
		const nodeSelect = document.getElementById(`gather_node_${cardId}`);
		const skillSelect = document.getElementById(`gather_skill_${cardId}`);
		const speedInput = document.getElementById(`gather_speed_${cardId}`);
		if (resourceSelect && nodeSelect && skillSelect && speedInput) {
			data.gatheringCards[cardId] = {
				resource: resourceSelect.value,
				node: nodeSelect.value,
				skill: skillSelect.value,
				speed: speedInput.value
			};
		}
	});
	localStorage.setItem('misc_data', JSON.stringify(data));
}
// ============================================
// VALIDATION
// ============================================
function validateMiscInput(input) {
	let value = input.value;
	value = value.replace(/-/g, '');
	const match = value.match(/^([0-9]*\.?[0-9]+)\s*([KMBkmb])?$/);
	if (match) {
		input.value = match[1] + (match[2] || '');
	} else {
		let cleaned = value.replace(/[^0-9.KMBkmb]/g, '');
		const suffixMatch = cleaned.match(/[KMBkmb]/);
		if (suffixMatch) {
			const suffix = suffixMatch[0];
			const numberPart = cleaned.substring(0, cleaned.lastIndexOf(suffix)).replace(/[^0-9.]/g, '');
			cleaned = numberPart + suffix;
		} else {
			cleaned = cleaned.replace(/[^0-9.]/g, '');
		}
		input.value = cleaned;
	}
}
// ============================================
// GATHERING CALCULATIONS
// ============================================
function getSkillTitle(resourceType) {
	const titles = {
		'bread': "Olive's Forager's Luck",
		'wood': "Forrest's Master Woodcutter",
		'stone': "Edwin's Stone Mining",
		'iron': "Seth's Craftmanship"
	};
	return titles[resourceType] || 'Skill Level';
}

function getSpeedupLabel(resourceType) {
	const labels = {
		'bread': '🍞 Bread Gathering Speedup (%)',
		'wood': '🪵 Wood Gathering Speedup (%)',
		'stone': '🪨 Stone Gathering Speedup (%)',
		'iron': '⛏️ Iron Gathering Speedup (%)'
	};
	return labels[resourceType] || '⚡ Gathering Speedup (%)';
}

function getSkillBonus(skillLevel) {
	const bonuses = {
		0: 0,
		1: 5,
		2: 10,
		3: 15,
		4: 20,
		5: 25
	};
	return bonuses[skillLevel] || 0;
}

function calculateGatheringTime(resourceType, nodeLevel, skillLevel, speedBuffPercent = 0) {
	const nodeData = getGatheringNodeData(nodeLevel, resourceType);
	if (!nodeData) return {
		timeSeconds: 0,
		resourceAmount: 0
	};
	const timeSeconds = parseTimeToSeconds(nodeData.time);
	const resourceAmount = parseCost(nodeData.resource);
	// Apply skill bonus + resource-specific speed buff
	const totalBonus = getSkillBonus(skillLevel) + (parseFloat(speedBuffPercent) || 0);
	let buffedTime = timeSeconds;
	if (totalBonus > 0) {
		buffedTime = Math.max(1, Math.ceil(timeSeconds / (1 + totalBonus / 100)));
	}
	return {
		timeSeconds: buffedTime,
		resourceAmount: resourceAmount,
		originalTime: timeSeconds,
		totalBonus: totalBonus
	};
}
// ============================================
// Bison Grip Calculation - Instant full node gather
// ============================================
function calculateBisonGripPoints() {
	if (globalBisonGrip === 0) return 0;
	// Get the node data for the selected resource and level
	const nodeData = getGatheringNodeData(globalBisonNode, globalBisonResource);
	if (!nodeData) return 0;
	// Get the resource amount from the node
	const resourceAmount = parseCost(nodeData.resource);
	// Calculate points for this full node
	const points = calculateGatheringPoints(resourceAmount, globalBisonResource);
	// Multiply by the number of rotations (1 or 2)
	return points * globalBisonGrip;
}

function calculateGatheringPoints(resourceAmount, resourceType) {
	const rates = getGatheringRates();
	const rate = rates[resourceType] || {
		rate: 3,
		per: 2500
	};
	const units = Math.floor(resourceAmount / rate.per);
	return units * rate.rate;
}

function getGatheringRates() {
	const rates = {
		bread: {
			rate: 3,
			per: 2500
		},
		wood: {
			rate: 3,
			per: 2500
		},
		stone: {
			rate: 3,
			per: 500
		},
		iron: {
			rate: 3,
			per: 100
		}
	};
	if (window.gameDB && window.gameDB.Points && window.gameDB.Points.Points) {
		const pointsData = window.gameDB.Points.Points;
		for (const item of pointsData) {
			if (item.mission && item.sg) {
				const mission = item.mission.toLowerCase();
				const parts = String(item.sg).split(' per ');
				if (parts.length === 2) {
					if (mission.includes('gather bread')) {
						rates.bread.rate = parseFloat(parts[0]) || 3;
						rates.bread.per = parseFloat(parts[1]) || 2500;
					} else if (mission.includes('gather wood')) {
						rates.wood.rate = parseFloat(parts[0]) || 3;
						rates.wood.per = parseFloat(parts[1]) || 2500;
					} else if (mission.includes('gather stone')) {
						rates.stone.rate = parseFloat(parts[0]) || 3;
						rates.stone.per = parseFloat(parts[1]) || 500;
					} else if (mission.includes('gather iron')) {
						rates.iron.rate = parseFloat(parts[0]) || 3;
						rates.iron.per = parseFloat(parts[1]) || 100;
					}
				}
			}
		}
	}
	return rates;
}
// ============================================
// RENDER GATHERING CARDS - 2 columns layout
// ============================================
function renderGatheringCards() {
	const container = document.getElementById('gatheringGrid');
	if (!container) return;
	container.innerHTML = '';
	container.className = 'items-grid misc-grid';
	const marchUnits = globalMarchUnits || 1;
	const numCards = Math.min(marchUnits, 6);
	for (let i = 1; i <= numCards; i++) {
		container.innerHTML += createGatheringCard(i);
	}
	// Restore saved values
	loadMiscFromStorage();
	refreshCalculations();
}

function createGatheringCard(cardId) {
	// Resource options with placeholder
	const resourceOptions = `
        <option value="" disabled selected hidden>Resource Type</option>
        <option value="bread">Bread</option>
        <option value="wood">Wood</option>
        <option value="stone">Stone</option>
        <option value="iron">Iron</option>
    `;
	// Node options with placeholder
	let nodeOptions = '<option value="" disabled selected hidden>Node Level</option>';
	for (let i = 1; i <= 8; i++) {
		nodeOptions += `<option value="${i}">Level ${i}</option>`;
	}
	// Skill options with placeholder
	let skillOptions = '<option value="" disabled selected hidden>Skill Level</option>';
	for (let i = 0; i <= 5; i++) {
		skillOptions += `<option value="${i}">Level ${i} (${i * 5}%)</option>`;
	}
	return `
        <div class="item-card gathering-card" data-card-id="${cardId}">
            <div class="item-card-header" style="background: var(--surface-dark);">
                <span style="font-size: 1rem;">⛏️ Gathering March ${cardId}</span>
            </div>
            <div class="item-card-body">
                <!-- Row 1: Resource Type + Node Level -->
                <div class="level-controls">
                    <div class="buff-field" style="min-width: 100%;">
                        <label>📦 Resource Type</label>
                        <select id="gather_resource_${cardId}" onchange="onGatheringCardChange(${cardId})">
                            ${resourceOptions}
                        </select>
                    </div>
                    <div class="buff-field" style="min-width: 100%;">
                        <label>📊 Node Level</label>
                        <select id="gather_node_${cardId}" onchange="onGatheringCardChange(${cardId})">
                            ${nodeOptions}
                        </select>
                    </div>
                </div>
                <!-- Row 2: Skill Level + Speedup -->
                <div class="level-controls">
                    <div class="buff-field" style="min-width: 100%;">
                        <label id="skill_label_${cardId}">Skill Level</label>
                        <select id="gather_skill_${cardId}" onchange="onGatheringCardChange(${cardId})">
                            ${skillOptions}
                        </select>
                    </div>
                    <div class="buff-field" style="min-width: 100%;">
                        <label id="speed_label_${cardId}">⚡ Gathering Speedup (%)</label>
                        <input type="text" style="text-align: center;" id="gather_speed_${cardId}" value="" placeholder="e.g., 50" oninput="validateMiscInput(this); onGatheringCardChange(${cardId})">
                        <small>Resource-specific speed buff %</small>
                    </div>
                </div>
                <div id="gather_status_${cardId}" class="status-pane">⚙️ Select resource type, node level, and skill level</div>
            </div>
        </div>
    `;
}

function onGatheringCardChange(cardId) {
	// Update skill label and speedup label
	const resourceSelect = document.getElementById(`gather_resource_${cardId}`);
	const skillLabel = document.getElementById(`skill_label_${cardId}`);
	const speedLabel = document.getElementById(`speed_label_${cardId}`);
	if (resourceSelect) {
		const resource = resourceSelect.value;
		// Update skill label
		if (skillLabel) {
			skillLabel.textContent = resource ? getSkillTitle(resource) : 'Skill Level';
		}
		// Update speedup label
		if (speedLabel) {
			speedLabel.textContent = resource ? getSpeedupLabel(resource) : '⚡ Gathering Speedup (%)';
		}
	}
	saveMiscToStorage();
	refreshCalculations();
}
// ============================================
// REFRESH CALCULATIONS
// ============================================
function refreshCalculations() {
	let totalScore = 0;
	let totalGatheringPoints = 0;
	let totalGatheringTimeSeconds = 0;
	// ============================================
	// 1. Hero Roulette
	// ============================================
	const rouletteInput = document.getElementById('heroRouletteCount');
	let roulettePoints = 0;
	if (rouletteInput) {
		const count = parseFloat(rouletteInput.value) || 0;
		const pointsPerPlay = SCORE_RULES.roulette || 8000;
		roulettePoints = count * pointsPerPlay;
		totalScore += roulettePoints;
	}
	// ============================================
	// 2. Bison Grip - Instant full node gather
	// ============================================
	const bisonPoints = calculateBisonGripPoints();
	if (bisonPoints > 0) {
		totalGatheringPoints += bisonPoints;
	}
	// ============================================
	// 3. Gathering Cards
	// ============================================
	const cards = document.querySelectorAll('.gathering-card');
	let cardDetails = [];
	for (const card of cards) {
		const cardId = card.dataset.cardId;
		const resourceSelect = document.getElementById(`gather_resource_${cardId}`);
		const nodeSelect = document.getElementById(`gather_node_${cardId}`);
		const skillSelect = document.getElementById(`gather_skill_${cardId}`);
		const speedInput = document.getElementById(`gather_speed_${cardId}`);
		const status = document.getElementById(`gather_status_${cardId}`);
		if (!resourceSelect || !nodeSelect || !skillSelect || !speedInput || !status) continue;
		const resource = resourceSelect.value;
		const node = parseInt(nodeSelect.value) || 0;
		const skill = parseInt(skillSelect.value) || 0;
		const speedBuff = parseFloat(speedInput.value) || 0;
		// Only calculate if resource and node are selected
		if (resource && node > 0) {
			// Calculate gathering time and resource amount
			const result = calculateGatheringTime(resource, node, skill, speedBuff);
			const points = calculateGatheringPoints(result.resourceAmount, resource);
			totalGatheringPoints += points;
			totalGatheringTimeSeconds += result.timeSeconds;
			// Build status display
			const totalBonus = result.totalBonus;
			let statusHtml = `
                <strong>${resource.charAt(0).toUpperCase() + resource.slice(1)} - Level ${node}</strong><br>
                📦 Resource: ${formatNumber(result.resourceAmount)}<br>
                ⏱️ Time: ${formatSecondsToTime(result.timeSeconds)} 
                ${result.originalTime !== result.timeSeconds ? `(original: ${formatSecondsToTime(result.originalTime)})` : ''}<br>
                🎯 Skill: Level ${skill} (+${getSkillBonus(skill)}%)<br>
                ⚡ Speed Buff: +${speedBuff}%<br>
                🔥 Total Bonus: +${totalBonus}%<br>
                🎖️ Points: +${points.toLocaleString()}
            `;
			if (points > 0) {
				status.className = "status-pane status-ok";
			} else {
				status.className = "status-pane status-info";
			}
			status.innerHTML = statusHtml;
			cardDetails.push({
				resource,
				node,
				skill,
				speedBuff,
				points,
				timeSeconds: result.timeSeconds
			});
		} else {
			// Show placeholder message
			status.className = "status-pane";
			status.innerHTML = `⚙️ Select resource type and node level`;
		}
	}
	// ============================================
	// Update Displays
	// ============================================
	// Update Bison Grip Display
	const bisonDisplay = document.getElementById('bisonPointsDisplay');
	const bisonValue = document.getElementById('bisonPointsValue');
	if (bisonDisplay && bisonValue) {
		if (bisonPoints > 0) {
			bisonDisplay.style.display = 'block';
			bisonValue.textContent = bisonPoints.toLocaleString();
		} else {
			bisonDisplay.style.display = 'none';
		}
	}
	// Update page score (navbar shows this)
	const scoreDisplay = document.getElementById('globalScoreDisplay');
	if (scoreDisplay) {
		const totalMiscPoints = totalScore + totalGatheringPoints;
		scoreDisplay.innerText = totalMiscPoints.toLocaleString();
		if (typeof saveCurrentPageScore === 'function') {
			saveCurrentPageScore(totalMiscPoints);
		}
	}
	// Save to localStorage
	saveMiscToStorage();
}
// ============================================
// CLEAR ALL SELECTIONS
// ============================================
function clearAllSelections() {
	const fields = ['heroRouletteCount'];
	for (const id of fields) {
		const el = document.getElementById(id);
		if (el) el.value = '';
	}
	// Reset all gathering cards to defaults (empty)
	document.querySelectorAll('.gathering-card').forEach(card => {
		const cardId = card.dataset.cardId;
		const resourceSelect = document.getElementById(`gather_resource_${cardId}`);
		const nodeSelect = document.getElementById(`gather_node_${cardId}`);
		const skillSelect = document.getElementById(`gather_skill_${cardId}`);
		const speedInput = document.getElementById(`gather_speed_${cardId}`);
		if (resourceSelect) resourceSelect.value = '';
		if (nodeSelect) nodeSelect.value = '';
		if (skillSelect) skillSelect.value = '';
		if (speedInput) speedInput.value = '';
	});
	// Reset buffs
	localStorage.removeItem('globalMarchUnits');
	localStorage.removeItem('globalBisonGrip');
	localStorage.removeItem('globalBisonResource');
	localStorage.removeItem('globalBisonNode');
	localStorage.removeItem('misc_data');
	// Reload global settings
	loadGlobalSettings();
	renderGatheringCards();
	refreshCalculations();
	showNotification('All Misc inputs have been reset.', 'info');
}
window.clearAllSelections = clearAllSelections;
// ============================================
// GLOBAL SETTINGS LOAD/SAVE - FIXED: Placeholder works
// ============================================
function loadGlobalSettings() {
	globalMarchUnits = parseInt(localStorage.getItem("globalMarchUnits") || "0");
	globalBisonGrip = parseInt(localStorage.getItem("globalBisonGrip") || "0");
	globalBisonResource = localStorage.getItem("globalBisonResource") || "bread";
	globalBisonNode = parseInt(localStorage.getItem("globalBisonNode") || "1");
	const marchSelect = document.getElementById("globalMarchUnits");
	if (marchSelect) {
		// Only set value if it's a valid option (1-6)
		if (globalMarchUnits >= 1 && globalMarchUnits <= 6) {
			marchSelect.value = globalMarchUnits;
		} else {
			// Reset to default placeholder
			marchSelect.value = "";
		}
	}
	const bisonSelect = document.getElementById("globalBisonGrip");
	if (bisonSelect) bisonSelect.value = globalBisonGrip;
	const bisonResource = document.getElementById("globalBisonResource");
	if (bisonResource) bisonResource.value = globalBisonResource;
	const bisonNode = document.getElementById("globalBisonNode");
	if (bisonNode) bisonNode.value = globalBisonNode;
	const details = document.getElementById('bisonGripDetails');
	if (details) {
		details.style.display = globalBisonGrip > 0 ? 'flex' : 'none';
	}
}

function updateGlobalSettings() {
	const marchSelect = document.getElementById("globalMarchUnits");
	if (marchSelect) {
		const value = parseInt(marchSelect.value) || 0;
		// Only save if it's a valid option (1-6)
		if (value >= 1 && value <= 6) {
			globalMarchUnits = value;
			localStorage.setItem("globalMarchUnits", globalMarchUnits);
		} else {
			// If invalid, reset to 0 and show placeholder
			globalMarchUnits = 0;
			localStorage.setItem("globalMarchUnits", "0");
			marchSelect.value = "";
		}
	}
	const bisonSelect = document.getElementById("globalBisonGrip");
	if (bisonSelect) {
		globalBisonGrip = parseInt(bisonSelect.value) || 0;
		localStorage.setItem("globalBisonGrip", globalBisonGrip);
		const details = document.getElementById('bisonGripDetails');
		if (details) {
			details.style.display = globalBisonGrip > 0 ? 'flex' : 'none';
		}
	}
	const bisonResource = document.getElementById("globalBisonResource");
	if (bisonResource) {
		globalBisonResource = bisonResource.value;
		localStorage.setItem("globalBisonResource", globalBisonResource);
	}
	const bisonNode = document.getElementById("globalBisonNode");
	if (bisonNode) {
		globalBisonNode = parseInt(bisonNode.value) || 1;
		localStorage.setItem("globalBisonNode", globalBisonNode);
	}
	renderGatheringCards();
	refreshCalculations();
}
// ============================================
// RESET FUNCTION
// ============================================
function resetWithConfirmation() {
	if (typeof window.clearAllSelections === 'function') {
		window.clearAllSelections();
	}
}
// ============================================
// EXPORTS
// ============================================
window.loadMiscFromStorage = loadMiscFromStorage;
window.saveMiscToStorage = saveMiscToStorage;
window.validateMiscInput = validateMiscInput;
window.refreshCalculations = refreshCalculations;
window.clearAllSelections = clearAllSelections;
window.resetWithConfirmation = resetWithConfirmation;
window.renderGatheringCards = renderGatheringCards;
window.onGatheringCardChange = onGatheringCardChange;
window.updateGlobalSettings = updateGlobalSettings;
window.loadGlobalSettings = loadGlobalSettings;
window.calculateGatheringTime = calculateGatheringTime;
window.calculateGatheringPoints = calculateGatheringPoints;
window.getGatheringRates = getGatheringRates;
window.getSkillTitle = getSkillTitle;
window.getSpeedupLabel = getSpeedupLabel;
window.getSkillBonus = getSkillBonus;
window.calculateBisonGripPoints = calculateBisonGripPoints;
