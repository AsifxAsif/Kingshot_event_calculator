// ============================================
// CORE APPLICATION - STRONGEST GOVERNOR CALCULATOR
// ============================================
// ============================================
// GAME DATA & STATE
// ============================================
let gameDB = {};
let lockedUpgrades = new Map();
let currentPreset = "default";
let allPresets = {};
let pointData = {};
let currentEventMode = 'sg';
// ============================================
// RESOURCE ITEMS DEFINITION
// ============================================
const RESOURCE_ITEMS = [{
	id: "bread",
	placeholder: "1.5M"
}, {
	id: "wood",
	placeholder: "2.3M"
}, {
	id: "stone",
	placeholder: "500K"
}, {
	id: "iron",
	placeholder: "125K"
}, {
	id: "gold",
	placeholder: "10K"
}, {
	id: "truegold",
	placeholder: "500"
}, {
	id: "tempered_truegold",
	placeholder: "25"
}, {
	id: "truegold_dust",
	placeholder: "1000"
}, {
	id: "forge_hammer",
	placeholder: "50"
}, {
	id: "widgets",
	placeholder: "30"
}, {
	id: "mithril",
	placeholder: "10"
}, {
	id: "satin",
	placeholder: "5000"
}, {
	id: "gilded_threads",
	placeholder: "200"
}, {
	id: "artisans_vision",
	placeholder: "50"
}, {
	id: "charm_guide",
	placeholder: "100"
}, {
	id: "charm_design",
	placeholder: "80"
}, {
	id: "pet_food",
	placeholder: "5000"
}, {
	id: "growth_manual",
	placeholder: "100"
}, {
	id: "nutrient_potion",
	placeholder: "20"
}, {
	id: "promotion_medallion",
	placeholder: "10"
}, {
	id: "building_speedup",
	placeholder: "2d 14h 35m"
}, {
	id: "research_speedup",
	placeholder: "5d 3h 20m"
}, {
	id: "training_speedup",
	placeholder: "1d 12h 5m"
}, {
	id: "general_speedup",
	placeholder: "10d 8h 45m"
}, {
	id: "rare_general_shard",
	placeholder: "500"
}, {
	id: "epic_general_shard",
	placeholder: "200"
}, {
	id: "mythic_general_shard",
	placeholder: "50"
}, {
	id: "hero_roulette",
	placeholder: "100"
}, {
	id: "general_emblem",
	placeholder: "20"
}, {
	id: "master_manuscript",
	placeholder: "50"
}, {
	id: "advanced_taming_mark",
	placeholder: "10"
}, {
	id: "common_taming_mark",
	placeholder: "30"
}, {
	id: "mythic_gear",
	placeholder: "10"
}, {
	id: "hero_xp",
	placeholder: "1000"
}, {
	id: "stamina",
	placeholder: "100"
}, {
	id: "master_speedup",
	placeholder: "1d"
}];
// ============================================
// POINT RULES - SG (Strongest Governor) Mode
// ============================================
const SCORE_RULES = {
	truegold: 2000,
	truegold_dust: 1000,
	tempered_truegold: 30000,
	forge_hammer: 4000,
	widgets: 8000,
	mithril: 40000,
	advanced_taming_mark: 15000,
	common_taming_mark: 1150,
	general_emblem: 6000,
	master_manuscript: 60,
	speedup_min: 30,
	roulette: 8000,
	rare_general_shard: 350,
	epic_general_shard: 1220,
	mythic_general_shard: 3040,
	troops: {
		1: 1,
		2: 2,
		3: 3,
		4: 5,
		5: 7,
		6: 11,
		7: 16,
		8: 23,
		9: 30,
		10: 39,
		11: 49
	},
	gov_gear_score: 36,
	gov_charm_score: 70,
	pet_advancement_score: 50
};
// ============================================
// RESOURCE DISPLAY WITH IMPROVED GROUPING
// ============================================
function buildResourceDisplay(costTotals, vault, lockedResources, heroName) {
	if (!costTotals || !Object.keys(costTotals).length) {
		return '<span>✨ No resources required</span>';
	}
	// Filter out internal flags
	const filteredCosts = {};
	for (const [key, value] of Object.entries(costTotals)) {
		if (!key.startsWith('_')) {
			filteredCosts[key] = value;
		}
	}
	if (!Object.keys(filteredCosts).length) {
		return '<span>✨ No resources required</span>';
	}
	let basicResources = '';
	let premiumResources = '';
	let shardResources = '';
	let otherResources = '';
	let heroResources = '';
	let speedupResources = '';
	// Updated resource categories
	const basicKeys = ['bread', 'wood', 'stone', 'iron', 'gold'];
	const premiumKeys = ['truegold', 'tempered_truegold', 'truegold_dust', 'forge_hammer', 'widgets', 'mithril', 'satin', 'gilded_threads', 'artisans_vision', 'charm_guide', 'charm_design', 'pet_food', 'growth_manual', 'nutrient_potion', 'promotion_medallion', 'mythic_gear'];
	const speedupKeys = ['building_speedup', 'research_speedup', 'training_speedup', 'general_speedup', 'master_speedup'];
	// Check if this is a hero resource
	const isHeroResource = (res) => {
		return res.endsWith('_shards') || res.endsWith('_widgets');
	};
	for (const [res, amt] of Object.entries(filteredCosts)) {
		const lockedAmt = lockedResources && lockedResources[res] ? lockedResources[res] : 0;
		let remaining;
		// Calculate remaining: vault - locked (other upgrades) - this cost
		if (isHeroResource(res)) {
			const heroNameFromRes = res.replace('_shards', '').replace('_widgets', '');
			const inventory = res.includes('shards') ? (typeof getHeroShardInventory === 'function' ? getHeroShardInventory(heroNameFromRes) : 0) : (typeof getHeroWidgetInventory === 'function' ? getHeroWidgetInventory(heroNameFromRes) : 0);
			remaining = (inventory || 0) - lockedAmt - amt;
		} else {
			remaining = (vault && vault[res] ? vault[res] : 0) - lockedAmt - amt;
		}
		const isSpeed = speedupKeys.includes(res);
		let disp = res.replace(/_/g, ' ');
		let img = getImageFileName(res);
		let category = 'other';
		// Special handling for hero-specific resources
		if (isHeroResource(res)) {
			const heroNameFromRes = res.replace('_shards', '').replace('_widgets', '');
			disp = `${heroNameFromRes} ${res.includes('shards') ? 'Shards' : 'Widgets'}`;
			img = getHeroImageFileName ? getHeroImageFileName(heroNameFromRes) : getImageFileName(res);
			category = 'hero';
		} else if (basicKeys.includes(res)) {
			category = 'basic';
		} else if (premiumKeys.includes(res)) {
			category = 'premium';
		} else if (isSpeed) {
			category = 'speedup';
		} else {
			category = 'other';
		}
		const req = isSpeed ? `${amt} min` : formatNumber(amt);
		const statusClass = remaining < 0 ? 'text-deficit' : 'text-remaining';
		const statusText = remaining < 0 ? `${formatNumber(-remaining)} short` : `${formatNumber(remaining)} remaining`;
		const imgStyle = isHeroResource(res) ? 'height:20px;width:20px;object-fit:contain;border-radius:4px;' : '';
		const tag = `<div class="resource-tag"><img loading="lazy" decoding="async" src="${img}" onerror="this.style.display='none';" style="${imgStyle}" alt="${disp}"> ${disp}: ${req} <span class="${statusClass}">(${statusText})</span></div>`;
		// Categorize
		if (category === 'hero') {
			heroResources += tag;
		} else if (category === 'basic') {
			basicResources += tag;
		} else if (category === 'premium') {
			premiumResources += tag;
		} else if (category === 'speedup') {
			speedupResources += tag;
		} else {
			otherResources += tag;
		}
	}
	let result = '';
	if (heroResources) result += `<div class="resource-group-label">🎖️ Hero Resources:</div>${heroResources}`;
	if (basicResources) result += `<div class="resource-group-label">📦 Basic Resources:</div>${basicResources}`;
	if (premiumResources) result += `<div class="resource-group-label">💎 Premium Resources:</div>${premiumResources}`;
	if (speedupResources) result += `<div class="resource-group-label">⏱️ Speedups:</div>${speedupResources}`;
	if (otherResources) result += `<div class="resource-group-label">🔧 Other Resources:</div>${otherResources}`;
	if (!document.getElementById('resource-group-style')) {
		const style = document.createElement('style');
		style.id = 'resource-group-style';
		style.textContent = `
            .resource-group-label {
                font-size: 0.7rem;
                font-weight: 700;
                color: var(--text-secondary);
                margin: 4px 0 2px 0;
                width: 100%;
            }
        `;
		document.head.appendChild(style);
	}
	return result;
}
// ============================================
// POINTS LOADER FROM JSON
// ============================================
function loadPointsFromData() {
	if (!gameDB.Points || !gameDB.Points.Points) {
		console.warn('Points data not loaded, using default SCORE_RULES');
		return;
	}
	const pointsData = gameDB.Points.Points;
	const sgPoints = {};
	for (const item of pointsData) {
		if (item.sg !== null && item.sg !== undefined) {
			const missionKey = item.mission.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
			if (typeof item.sg === 'string' && item.sg.includes(' per ')) {
				const parts = item.sg.split(' per ');
				sgPoints[missionKey] = {
					type: 'per_unit',
					points: parseFloat(parts[0]),
					per: parseFloat(parts[1])
				};
			} else {
				sgPoints[missionKey] = parseFloat(item.sg);
			}
		}
	}
	// Update SCORE_RULES with loaded points
	const mappings = {
		'use_1_truegold_to_upgrade_a_building': 'truegold',
		'use_1_truegold_dust_for_tech_research': 'truegold_dust',
		'use_1_tempered_truegold_to_upgrade_a_building': 'tempered_truegold',
		'use_1_rare_hero_shard_to_ascend_heroes': 'rare_general_shard',
		'use_1_epic_hero_shard_to_ascend_heroes': 'epic_general_shard',
		'use_1_mythic_hero_shard_to_ascend_heroes': 'mythic_general_shard',
		'use_1_hero_gear_forgehammer_s': 'forge_hammer',
		'use_1_widget_for_hero_exclusive_gear': 'widgets',
		'use_1_mithril': 'mithril',
		'use_1_advanced_taming_mark_s_to_refine_pets': 'advanced_taming_mark',
		'use_1_common_taming_mark_s_to_refine_pets': 'common_taming_mark',
		'use_1_master_emblem': 'general_emblem',
		'use_1_masters_manuscript': 'master_manuscript',
		'use_1m_of_speedups_for_construction': 'speedup_min',
		'play_hero_roulette': 'roulette',
		'raise_governor_gear_max_score_by_1': 'gov_gear_score',
		'raise_governor_gear_charm_max_score_by_1': 'gov_charm_score',
		'raise_pet_advancement_score_by_1': 'pet_advancement_score'
	};
	for (const [key, rule] of Object.entries(mappings)) {
		if (sgPoints[key] !== undefined) {
			SCORE_RULES[rule] = sgPoints[key];
		}
	}
	// Troop points
	for (let i = 1; i <= 11; i++) {
		const key = `train_1_level_${i}_troop_s`;
		if (sgPoints[key] !== undefined) {
			SCORE_RULES.troops[i] = sgPoints[key];
		}
	}
}
// ============================================
// LOADING FUNCTIONS
// ============================================
function showLoading() {
	const overlay = document.getElementById('loadingOverlay');
	if (overlay) overlay.classList.add('active');
}

function hideLoading() {
	const overlay = document.getElementById('loadingOverlay');
	if (overlay) overlay.classList.remove('active');
}
// ============================================
// MODAL SYSTEM - FIXED
// ============================================
let modalResolve = null;

function showModal(options) {
	const {
		title,
		message,
		inputLabel,
		inputValue,
		confirmText,
		cancelText,
		onConfirm,
		onCancel,
		isDanger = false
	} = options;
	const existing = document.querySelector('.app-modal-overlay');
	if (existing) existing.remove();
	const overlay = document.createElement('div');
	overlay.className = 'app-modal-overlay';
	const modal = document.createElement('div');
	modal.className = 'app-modal';
	let html = `
        <div class="app-modal-header">
            <h3>${title || 'Confirm'}</h3>
            <button class="app-modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="app-modal-body">
    `;
	if (message) {
		html += `<p>${message}</p>`;
	}
	if (inputLabel !== undefined) {
		html += `
            <div class="app-modal-input-group">
                <label>${inputLabel}</label>
                <input type="text" id="appModalInput" value="${inputValue || ''}" placeholder="Enter name...">
            </div>
        `;
	}
	const primaryBtnClass = isDanger ? 'app-modal-btn-danger' : 'app-modal-btn-primary';
	html += `
        </div>
        <div class="app-modal-footer">
            <button class="app-modal-btn app-modal-btn-secondary" onclick="closeModal()">${cancelText || 'Cancel'}</button>
            <button class="app-modal-btn ${primaryBtnClass}" id="appModalConfirm">${confirmText || 'Confirm'}</button>
        </div>
    `;
	modal.innerHTML = html;
	overlay.appendChild(modal);
	document.body.appendChild(overlay);
	// Store resolve function for promise-based usage
	let resolveFn = null;
	const promise = new Promise((resolve) => {
		resolveFn = resolve;
	});
	const confirmBtn = document.getElementById('appModalConfirm');
	if (confirmBtn) {
		confirmBtn.addEventListener('click', function() {
			const input = document.getElementById('appModalInput');
			let value = input ? input.value : '';
			if (onConfirm) onConfirm(value);
			closeModal();
			if (resolveFn) resolveFn(value);
		});
	}
	const input = document.getElementById('appModalInput');
	if (input) {
		input.addEventListener('keydown', function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				confirmBtn?.click();
			}
		});
		// FIX: Always focus the input after a short delay
		setTimeout(() => {
			input.focus();
			input.select();
		}, 50);
	}
	// Store for cleanup
	modal._resolve = resolveFn;
	return promise;
}

function closeModal() {
	const overlay = document.querySelector('.app-modal-overlay');
	if (overlay) overlay.remove();
}
// ============================================
// NAVIGATION FUNCTIONS
// ============================================
function toggleNavMenu() {
	const navLinks = document.getElementById('navLinks');
	const hamburger = document.getElementById('hamburgerIcon');
	const checkbox = document.getElementById('hamburgerCheckbox');
	let overlay = document.getElementById('menuOverlay');
	if (!overlay) {
		const newOverlay = document.createElement('div');
		newOverlay.id = 'menuOverlay';
		newOverlay.className = 'menu-overlay';
		newOverlay.onclick = function() {
			closeNavMenu();
		};
		document.body.appendChild(newOverlay);
		overlay = document.getElementById('menuOverlay');
	}
	const isOpen = navLinks.classList.contains('show');
	if (!isOpen) {
		navLinks.classList.add('show');
		if (hamburger) hamburger.classList.add('active');
		if (checkbox) checkbox.checked = true;
		if (overlay) overlay.classList.add('active');
		document.body.style.overflow = 'hidden';
	} else {
		closeNavMenu();
	}
}

function closeNavMenu() {
	const navLinks = document.getElementById('navLinks');
	const hamburger = document.getElementById('hamburgerIcon');
	const checkbox = document.getElementById('hamburgerCheckbox');
	const overlay = document.getElementById('menuOverlay');
	if (navLinks) navLinks.classList.remove('show');
	if (hamburger) hamburger.classList.remove('active');
	if (checkbox) checkbox.checked = false;
	if (overlay) overlay.classList.remove('active');
	document.body.style.overflow = '';
}
document.addEventListener('keydown', function(event) {
	if (event.key === 'Escape') {
		closeNavMenu();
		closeModal();
	}
});
document.addEventListener('click', function(event) {
	const navLinks = document.getElementById('navLinks');
	const hamburger = document.getElementById('hamburgerIcon');
	if (navLinks && navLinks.classList.contains('show')) {
		if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
			closeNavMenu();
		}
	}
});
// ============================================
// PRESET FUNCTIONS - FIXED
// ============================================
function togglePresetMenu() {
	const dropdown = document.getElementById('presetDropdown');
	const isOpen = dropdown.classList.contains('show');
	if (!isOpen) {
		dropdown.classList.add('show');
		setTimeout(() => {
			document.addEventListener('click', closePresetMenuOutside);
		}, 10);
	} else {
		dropdown.classList.remove('show');
		document.removeEventListener('click', closePresetMenuOutside);
	}
}

function closePresetMenuOutside(event) {
	const dropdown = document.getElementById('presetDropdown');
	const button = document.querySelector('.preset-hamburger');
	if (event && !dropdown.contains(event.target) && !button.contains(event.target)) {
		dropdown.classList.remove('show');
		document.removeEventListener('click', closePresetMenuOutside);
	}
}
async function createNewPreset() {
	// Check if modal is already open
	if (document.querySelector('.app-modal-overlay')) {
		return;
	}
	try {
		const value = await showModal({
			title: 'Create New Preset',
			message: 'Enter a name for your new preset configuration.',
			inputLabel: 'Preset Name',
			inputValue: '',
			confirmText: 'Create',
			cancelText: 'Cancel',
			onConfirm: function(value) {
				// This is called when confirm is clicked
			}
		});
		// If value is undefined or null, user cancelled
		if (value === undefined || value === null) {
			return;
		}
		const trimmedValue = value ? value.trim() : '';
		if (!trimmedValue || trimmedValue === '') {
			showNotification('Preset name cannot be empty.', 'warning');
			return;
		}
		if (allPresets[trimmedValue]) {
			const overwrite = await showModal({
				title: 'Preset Already Exists',
				message: `Preset "${trimmedValue}" already exists. Do you want to overwrite it?`,
				confirmText: 'Overwrite',
				cancelText: 'Cancel',
				isDanger: true,
				onConfirm: function() {
					// This is called when confirm is clicked
				}
			});
			if (overwrite === undefined || overwrite === null) {
				return; // User cancelled
			}
			saveCurrentToPreset(trimmedValue);
			return;
		}
		saveCurrentToPreset(trimmedValue);
	} catch (error) {
		showNotification('Error creating preset.', 'error');
	}
}

function saveCurrentToPreset(presetName) {
	const existingPreset = allPresets[presetName] || {
		vault: {},
		lockedUpgrades: [],
		selections: {},
		heroFlowerStates: {},
		heroSpecificShards: {},
		heroWidgetQuantities: {}
	};
	const presetData = {
		vault: {
			...existingPreset.vault
		},
		lockedUpgrades: [...(existingPreset.lockedUpgrades || [])],
		selections: {
			...(existingPreset.selections || {})
		},
		heroFlowerStates: {
			...(existingPreset.heroFlowerStates || {})
		},
		heroSpecificShards: {
			...(existingPreset.heroSpecificShards || {})
		},
		heroWidgetQuantities: {
			...(existingPreset.heroWidgetQuantities || {})
		}
	};
	// Save vault inputs
	for (const item of RESOURCE_ITEMS) {
		const input = document.getElementById(`vault_${item.id}`);
		if (input) {
			presetData.vault[item.id] = input.value;
		}
	}
	const page = getCurrentPageCategory();
	// Save current page's locked upgrades
	const currentPageLockedUpgrades = [];
	for (const [safeId, lockedData] of lockedUpgrades.entries()) {
		if (safeId.startsWith(page + '_')) {
			currentPageLockedUpgrades.push({
				safeId,
				data: lockedData
			});
		}
	}
	const otherPageLockedUpgrades = presetData.lockedUpgrades.filter(item => {
		return !item.safeId.startsWith(page + '_');
	});
	presetData.lockedUpgrades = [...otherPageLockedUpgrades, ...currentPageLockedUpgrades];
	// ============================================
	// CRITICAL: Save ALL selects including current and target
	// ============================================
	document.querySelectorAll("select").forEach(select => {
		if (select.id) {
			// Save ALL selects - including curr_ and targ_
			presetData.selections[select.id] = select.value;
		}
	});
	// Save ALL checkboxes
	document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
		if (cb.id) {
			presetData.selections[cb.id] = cb.checked;
		}
	});
	// Save ALL text and number inputs
	document.querySelectorAll('input[type="number"], input[type="text"]').forEach(inp => {
		if (inp.id && !inp.id.includes('search')) {
			presetData.selections[inp.id] = inp.value;
		}
	});
	// Save hero flower states
	if (page === 'hero' && typeof heroFlowerStates !== 'undefined') {
		for (const [safeId, state] of Object.entries(heroFlowerStates)) {
			presetData.heroFlowerStates[safeId] = {
				currentMaxIdx: state.currentMaxIdx !== undefined ? state.currentMaxIdx : -1,
				targetMaxIdx: state.targetMaxIdx !== undefined ? state.targetMaxIdx : -1
			};
		}
	}
	// Save hero shards
	if (page === 'hero' && typeof heroSpecificShards !== 'undefined') {
		for (const [heroName, shards] of Object.entries(heroSpecificShards)) {
			presetData.heroSpecificShards[heroName] = shards;
		}
	}
	// Save hero widgets
	if (page === 'widgets' && typeof heroWidgetQuantities !== 'undefined') {
		for (const [heroName, qty] of Object.entries(heroWidgetQuantities)) {
			presetData.heroWidgetQuantities[heroName] = qty;
		}
	}
	// Save buff inputs
	const buffInputs = ['globalBuildingBuffPercent', 'globalPansMasterArtifact', 'globalWolfPet', 'globalKingPosition', 'globalSaulsResourceful', 'globalGroundWorksCheckbox', 'globalDoubleTimeCheckbox', 'globalTrainingBuffPercent', 'globalTrainingKingPosition', 'globalTrainingMobilizeCheckbox', 'globalTrainingKvKBonusCheckbox', 'globalResearchBuffPercent', 'globalResearchKingPosition', 'globalResearchFreshIdeasCheckbox'];
	for (const id of buffInputs) {
		const el = document.getElementById(id);
		if (el) {
			if (el.type === 'checkbox') {
				presetData.selections[id] = el.checked;
			} else {
				presetData.selections[id] = el.value;
			}
		}
	}
	allPresets[presetName] = presetData;
	localStorage.setItem("governor_presets", JSON.stringify(allPresets));
	localStorage.setItem("governor_current_preset", presetName);
	currentPreset = presetName;
	updatePresetSelect();
	showNotification(`Preset "${presetName}" saved!`, 'success');
}
// ============================================
// GET CURRENT PAGE INFO
// ============================================
function getCurrentPageInfo() {
	const path = window.location.pathname;
	// ✅ Check more specific paths FIRST
	if (path.includes('hero-gear')) return {
		category: 'herogear',
		display: 'Hero Gear'
	};
	if (path.includes('war-academy')) return {
		category: 'academy',
		display: 'War Academy'
	};
	if (path.includes('forgehammer')) return {
		category: 'forgehammer',
		display: 'Forgehammer'
	};
	if (path.includes('buildings')) return {
		category: 'building',
		display: 'Building'
	};
	if (path.includes('widgets')) return {
		category: 'widgets',
		display: 'Widget'
	};
	if (path.includes('heroes')) return {
		category: 'hero',
		display: 'Hero'
	};
	if (path.includes('gov-gear')) return {
		category: 'govgear',
		display: 'GOV Gear'
	};
	if (path.includes('gov-charm')) return {
		category: 'govcharm',
		display: 'GOV Charm'
	};
	if (path.includes('pets')) return {
		category: 'pet',
		display: 'Pet'
	};
	if (path.includes('troops')) return {
		category: 'troops',
		display: 'Troops'
	};
	if (path.includes('index')) return {
		category: 'vault',
		display: 'Vault'
	};
	return {
		category: 'vault',
		display: 'Vault'
	};
}
// ============================================
// CONVENIENCE WRAPPERS (for backward compatibility)
// ============================================
function getCurrentPageCategory() {
	return getCurrentPageInfo().category;
}

function getCurrentPageDisplayName() {
	return getCurrentPageInfo().display;
}

function updatePreset(presetName) {
	if (!presetName || presetName === "default") {
		showNotification("Cannot update default preset. Create a new preset instead.", 'warning');
		return;
	}
	if (!allPresets[presetName]) {
		showNotification(`Preset "${presetName}" not found.`, 'error');
		return;
	}
	saveCurrentToPreset(presetName);
}

function loadPreset(presetName) {
	const preset = allPresets[presetName];
	if (!preset) return;
	currentPreset = presetName;
	localStorage.setItem("governor_current_preset", currentPreset);
	applyPresetToCurrentPage(preset);
	updatePresetSelect();
	if (typeof updateBuildingSpeedupBuffs === "function") updateBuildingSpeedupBuffs();
	if (typeof updateResearchSpeedupBuffs === "function") updateResearchSpeedupBuffs();
	if (typeof updateTrainingSpeedupBuffs === "function") updateTrainingSpeedupBuffs();
	showNotification(`Loaded preset: "${presetName}"`, 'success');
}
async function deletePreset(presetName) {
	if (presetName === "default") {
		showNotification("Cannot delete default preset", 'warning');
		return;
	}
	if (!allPresets[presetName]) return;
	try {
		const value = await showModal({
			title: 'Delete Preset',
			message: `Are you sure you want to delete <strong style="color: var(--color-error);">"${presetName}"</strong>? This action cannot be undone.`,
			confirmText: 'Delete',
			cancelText: 'Cancel',
			isDanger: true,
			onConfirm: function() {
				// This is called when confirm is clicked
			}
		});
		if (value === undefined || value === null) {
			return; // User cancelled
		}
		delete allPresets[presetName];
		localStorage.setItem("governor_presets", JSON.stringify(allPresets));
		if (currentPreset === presetName) {
			loadPreset("default");
		}
		updatePresetSelect();
		showNotification(`Preset "${presetName}" deleted.`, 'info');
	} catch (error) {
		showNotification('Error deleting preset.', 'error');
	}
}

function updatePresetSelect() {
	const select = document.getElementById("presetSelect");
	if (!select) return;
	const currentValue = select.value;
	select.innerHTML = "";
	for (const name in allPresets) {
		const option = document.createElement("option");
		option.value = name;
		option.textContent = name + (name === "default" ? " (Default)" : "");
		if (name === currentPreset) option.selected = true;
		select.appendChild(option);
	}
}
async function resetWithConfirmation() {
	try {
		const pageInfo = getCurrentPageInfo();
		const value = await showModal({
			title: 'Reset All Selections',
			message: `Are you sure you want to reset all selections of <strong style="color: var(--color-error);">"${pageInfo.display}"</strong> page? This will clear all current levels, target levels, and upgrade selections.`,
			confirmText: 'Reset All',
			cancelText: 'Cancel',
			isDanger: true,
			onConfirm: function() {
				// This is called when confirm is clicked
			}
		});
		if (value === undefined || value === null) {
			return; // User cancelled
		}
		if (typeof clearAllSelections === 'function') {
			clearAllSelections();
		} else {
			showNotification('Reset function not found.', 'error');
		}
	} catch (error) {
		showNotification('Error resetting selections.', 'error');
	}
}

function loadPresetsFromStorage() {
	const saved = localStorage.getItem("governor_presets");
	if (saved) {
		allPresets = JSON.parse(saved);
	} else {
		allPresets = {
			default: {
				vault: {},
				lockedUpgrades: [],
				selections: {},
				heroFlowerStates: {},
				heroSpecificShards: {},
				heroWidgetQuantities: {}
			}
		};
		localStorage.setItem("governor_presets", JSON.stringify(allPresets));
	}
	currentPreset = localStorage.getItem("governor_current_preset") || "default";
	updatePresetSelect();
}
// ============================================
// CRITICAL FIX: PAGE-SPECIFIC clearAllSelections
// Resets ONLY the current page and updates the preset
// ============================================
window.clearAllSelections = function() {
	const pageInfo = getCurrentPageInfo();
	const category = pageInfo.category;
	const prefix = category + '_';
	// ============================================
	// 1. Reset ALL input fields on the page
	// ============================================
	// Reset ALL text inputs (vault, shards, widgets, troop quantities, etc.)
	document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
		// Skip preset-related elements and search inputs
		if (input.id && (input.id.includes('preset') || input.id.includes('search'))) {
			return;
		}
		// Skip if it's a hidden field or button
		if (input.type === 'hidden' || input.type === 'button' || input.type === 'submit') {
			return;
		}
		// Clear the value
		input.value = '';
		input.dispatchEvent(new Event('input', {
			bubbles: true
		}));
		// If it's a vault input, also clear localStorage
		if (input.id && input.id.startsWith('vault_')) {
			const resourceId = input.id.replace('vault_', '');
			localStorage.removeItem(`vault_${resourceId}`);
			if (typeof window.updateVaultResource === 'function') {
				window.updateVaultResource(resourceId, '');
			}
		}
	});
	// Reset ALL selects (dropdowns) on the page
	document.querySelectorAll('select').forEach(select => {
		if (select.id && select.id.includes('preset')) {
			return;
		}
		select.selectedIndex = 0;
		select.dispatchEvent(new Event('change', {
			bubbles: true
		}));
	});
	// Reset ALL checkboxes on the page
	document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
		if (cb.id && cb.id.includes('preset')) {
			return;
		}
		cb.checked = false;
		cb.dispatchEvent(new Event('change', {
			bubbles: true
		}));
	});
	// ============================================
	// 2. Clear locked upgrades ONLY for this category
	// ============================================
	const toRemove = [];
	for (const [key] of lockedUpgrades) {
		if (key.startsWith(prefix) || key.startsWith('promotion_') || key.startsWith('troops_')) {
			toRemove.push(key);
		}
	}
	for (const key of toRemove) {
		lockedUpgrades.delete(key);
	}
	// ============================================
	// 3. Category-specific resets
	// ============================================
	if (category === 'building') {
		// Reset building speedup buffs
		localStorage.setItem('globalBuildingBuffPercent', '0');
		localStorage.setItem('globalPansMasterArtifact', '0');
		localStorage.setItem('globalWolfPet', '0');
		localStorage.setItem('globalKingPosition', '0');
		localStorage.setItem('globalSaulsResourceful', '0');
		localStorage.setItem('globalGroundWorksActive', 'false');
		localStorage.setItem('globalDoubleTimeActive', 'false');
		if (typeof loadBuildingSpeedupBuffs === 'function') loadBuildingSpeedupBuffs();
		document.querySelectorAll('#globalBuildingBuffPercent, #globalPansMasterArtifact, #globalWolfPet, #globalKingPosition, #globalSaulsResourceful').forEach(el => {
			if (el) {
				el.value = '0';
				el.dispatchEvent(new Event('change', {
					bubbles: true
				}));
			}
		});
		document.querySelectorAll('#globalGroundWorksCheckbox, #globalDoubleTimeCheckbox').forEach(cb => {
			if (cb) {
				cb.checked = false;
				cb.dispatchEvent(new Event('change', {
					bubbles: true
				}));
			}
		});
	}
	if (category === 'academy') {
		localStorage.setItem('globalResearchBuffPercent', '0');
		localStorage.setItem('globalResearchKingPosition', '0');
		localStorage.setItem('globalResearchFreshIdeasActive', 'false');
		if (typeof loadResearchSpeedupBuffs === 'function') loadResearchSpeedupBuffs();
		document.querySelectorAll('#globalResearchBuffPercent, #globalResearchKingPosition').forEach(el => {
			if (el) {
				el.value = '0';
				el.dispatchEvent(new Event('change', {
					bubbles: true
				}));
			}
		});
		const freshIdeasCb = document.querySelector('#globalResearchFreshIdeasCheckbox');
		if (freshIdeasCb) {
			freshIdeasCb.checked = false;
			freshIdeasCb.dispatchEvent(new Event('change', {
				bubbles: true
			}));
		}
	}
	if (category === 'troops') {
		localStorage.setItem('globalTrainingBuffPercent', '0');
		localStorage.setItem('globalTrainingKingPosition', '0');
		localStorage.setItem('globalTrainingMobilizeActive', 'false');
		localStorage.setItem('globalTrainingKvKBonusActive', 'false');
		if (typeof loadTrainingSpeedupBuffs === 'function') loadTrainingSpeedupBuffs();
		document.querySelectorAll('#globalTrainingBuffPercent, #globalTrainingKingPosition').forEach(el => {
			if (el) {
				el.value = '0';
				el.dispatchEvent(new Event('change', {
					bubbles: true
				}));
			}
		});
		document.querySelectorAll('#globalTrainingMobilizeCheckbox, #globalTrainingKvKBonusCheckbox').forEach(cb => {
			if (cb) {
				cb.checked = false;
				cb.dispatchEvent(new Event('change', {
					bubbles: true
				}));
			}
		});
	}
	if (category === 'hero') {
		// Reset hero flower states
		if (typeof heroFlowerStates !== 'undefined') {
			Object.keys(heroFlowerStates).forEach(key => {
				heroFlowerStates[key] = {
					currentMaxIdx: -1,
					targetMaxIdx: -1
				};
			});
			Object.keys(heroFlowerStates).forEach(id => {
				if (typeof updateHeroFlowerVisuals === 'function') updateHeroFlowerVisuals(id);
			});
			if (typeof saveHeroFlowerStates === 'function') saveHeroFlowerStates();
		}
		// Reset hero shards
		if (typeof heroSpecificShards !== 'undefined') {
			Object.keys(heroSpecificShards).forEach(key => delete heroSpecificShards[key]);
			localStorage.removeItem("hero_specific_shards");
			document.querySelectorAll('.hero-shard-input').forEach(input => {
				input.value = '';
				input.dispatchEvent(new Event('input', {
					bubbles: true
				}));
			});
		}
		// Reset generation filter
		if (typeof selectedMaxGeneration !== 'undefined') {
			selectedMaxGeneration = 7;
			localStorage.setItem("hero_max_generation", "7");
			const genSelect = document.getElementById('heroGenerationSelect');
			if (genSelect) {
				genSelect.value = "7";
				genSelect.dispatchEvent(new Event('change', {
					bubbles: true
				}));
			}
		}
	}
	if (category === 'widgets') {
		if (typeof heroWidgetQuantities !== 'undefined') {
			Object.keys(heroWidgetQuantities).forEach(key => delete heroWidgetQuantities[key]);
			localStorage.removeItem("hero_widget_quantities");
			document.querySelectorAll('.hero-shard-input[id^="hero_widget_"]').forEach(input => {
				input.value = '';
				input.dispatchEvent(new Event('input', {
					bubbles: true
				}));
			});
			if (typeof saveHeroWidgetsToStorage === 'function') saveHeroWidgetsToStorage();
		}
	}
	if (category === 'govcharm') {
		// Reset charm group set inputs if they exist
		document.querySelectorAll('input[id^="setCurrent_"], input[id^="setTarget_"]').forEach(input => {
			input.value = '';
		});
	}
	if (category === 'vault') {
		// Clear all vault inputs from localStorage
		RESOURCE_ITEMS.forEach(item => {
			localStorage.removeItem(`vault_${item.id}`);
		});
	}
	// ============================================
	// 4. Clear ONLY this page's score from localStorage
	// ============================================
	const pageKey = getCurrentPageKey();
	if (pageKey) {
		localStorage.setItem(pageKey, '0');
	}
	// ============================================
	// 5. Update the score display for this page
	// ============================================
	const scoreDisplay = document.getElementById('globalScoreDisplay');
	if (scoreDisplay) {
		scoreDisplay.innerText = '0';
	}
	// ============================================
	// 6. CRITICAL FIX: UPDATE THE PRESET DATA
	// ============================================
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const presetData = allPresets[presetName];
	if (presetData) {
		// A. Remove ONLY selections that belong to this page
		if (presetData.selections) {
			const keysToRemove = [];
			const categoryPattern = '_' + category + '_';
			for (const key of Object.keys(presetData.selections)) {
				// This matches: curr_academy_, targ_academy_, active_academy_, speed_academy_, etc.
				if (key.includes(categoryPattern) || key.startsWith(category + '_')) {
					keysToRemove.push(key);
				}
			}
			for (const key of keysToRemove) {
				delete presetData.selections[key];
			}
		}
		// B. Clear vault data from preset
		if (presetData.vault) {
			const vaultKeys = Object.keys(presetData.vault);
			for (const key of vaultKeys) {
				delete presetData.vault[key];
			}
		}
		// C. Clear locked upgrades for this page
		if (presetData.lockedUpgrades) {
			presetData.lockedUpgrades = presetData.lockedUpgrades.filter(item => {
				return !item.safeId.startsWith(prefix) && !item.safeId.startsWith('promotion_') && !item.safeId.startsWith('troops_');
			});
		}
		// D. Clear hero-specific data from preset
		if (category === 'hero') {
			if (presetData.heroFlowerStates) {
				Object.keys(presetData.heroFlowerStates).forEach(key => delete presetData.heroFlowerStates[key]);
			}
			if (presetData.heroSpecificShards) {
				Object.keys(presetData.heroSpecificShards).forEach(key => delete presetData.heroSpecificShards[key]);
			}
		}
		if (category === 'widgets') {
			if (presetData.heroWidgetQuantities) {
				Object.keys(presetData.heroWidgetQuantities).forEach(key => delete presetData.heroWidgetQuantities[key]);
			}
		}
		// E. Save the updated preset
		allPresets[presetName] = presetData;
		localStorage.setItem("governor_presets", JSON.stringify(allPresets));
	}
	// ============================================
	// 7. Refresh ONLY this page's calculations
	// ============================================
	if (category === 'troops') {
		if (typeof refreshTroopsCalculations === 'function') {
			refreshTroopsCalculations();
		}
	} else {
		if (typeof refreshCalculations === 'function') {
			refreshCalculations();
		}
	}
	// ============================================
	// 8. Update global total score
	// ============================================
	if (typeof updateGlobalTotalScore === 'function') {
		setTimeout(updateGlobalTotalScore, 50);
	}
	// ============================================
	// 9. Trigger vault update event
	// ============================================
	window.dispatchEvent(new Event('vaultUpdate'));
	showNotification(`All selections on this page have been reset.`, 'info');
};
// ============================================
// CENTRALIZED updateVaultResource
// ============================================
window.updateVaultResource = function(id, value) {
	localStorage.setItem(`vault_${id}`, value);
	window.dispatchEvent(new Event('vaultUpdate'));
};
// ============================================
// APPLY PRESET TO CURRENT PAGE (FIXED - Preserves target levels)
// ============================================
function applyPresetToCurrentPage(preset) {
	if (!preset) return;
	const pageInfo = getCurrentPageInfo();
	const category = pageInfo.category;
	// ============================================
	// STEP 1: Restore ALL selections WITHOUT triggering change events
	// ============================================
	// Restore selects (dropdowns) - store values first
	const selectValues = {};
	if (preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			const element = document.getElementById(id);
			if (element && element.tagName === "SELECT") {
				// Check if the value exists in the select options
				let valueExists = false;
				for (let i = 0; i < element.options.length; i++) {
					if (String(element.options[i].value) === String(value)) {
						valueExists = true;
						break;
					}
				}
				if (valueExists) {
					selectValues[id] = value;
				}
			}
		}
	}
	// Restore checkbox values
	const checkboxValues = {};
	if (preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			const element = document.getElementById(id);
			if (element && element.type === "checkbox") {
				checkboxValues[id] = value === true || value === "true";
			}
		}
	}
	// Restore text/number input values
	const inputValues = {};
	if (preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			const element = document.getElementById(id);
			if (element && (element.type === "text" || element.type === "number")) {
				inputValues[id] = value !== undefined && value !== null ? value : '';
			}
		}
	}
	// ============================================
	// STEP 2: Apply current and target level values FIRST
	// ============================================
	// Get all current and target level selects
	const currSelects = [];
	const targSelects = [];
	document.querySelectorAll("select").forEach(select => {
		if (select.id && !select.id.includes("presetSelect")) {
			if (select.id.startsWith('curr_') || select.id.startsWith('targ_')) {
				// Store current/target selects
				if (select.id.startsWith('curr_')) {
					currSelects.push(select);
				} else {
					targSelects.push(select);
				}
			}
		}
	});
	// First, restore target level selects (so they don't get auto-updated)
	for (const select of targSelects) {
		if (selectValues[select.id] !== undefined) {
			select.value = selectValues[select.id];
		}
	}
	// Then restore current level selects
	for (const select of currSelects) {
		if (selectValues[select.id] !== undefined) {
			select.value = selectValues[select.id];
		}
	}
	// Now restore all other selects (non-current/target)
	document.querySelectorAll("select").forEach(select => {
		if (select.id && !select.id.includes("presetSelect") && !select.id.startsWith('curr_') && !select.id.startsWith('targ_')) {
			if (selectValues[select.id] !== undefined) {
				select.value = selectValues[select.id];
			}
		}
	});
	// ============================================
	// STEP 3: Apply all checkbox values
	// ============================================
	for (const [id, checked] of Object.entries(checkboxValues)) {
		const element = document.getElementById(id);
		if (element) {
			element.checked = checked;
		}
	}
	// ============================================
	// STEP 4: Apply all text/number input values
	// ============================================
	for (const [id, value] of Object.entries(inputValues)) {
		const element = document.getElementById(id);
		if (element) {
			element.value = value;
		}
	}
	// ============================================
	// STEP 5: Restore vault
	// ============================================
	for (const item of RESOURCE_ITEMS) {
		const input = document.getElementById(`vault_${item.id}`);
		if (input && preset.vault[item.id] !== undefined) {
			input.value = preset.vault[item.id];
			localStorage.setItem(`vault_${item.id}`, preset.vault[item.id]);
		}
	}
	// ============================================
	// STEP 6: Restore locked upgrades
	// ============================================
	lockedUpgrades.clear();
	if (preset.lockedUpgrades) {
		for (const item of preset.lockedUpgrades) {
			lockedUpgrades.set(item.safeId, item.data);
		}
	}
	// ============================================
	// STEP 7: Restore hero flower states
	// ============================================
	if (preset.heroFlowerStates && typeof heroFlowerStates !== 'undefined') {
		for (const [safeId, state] of Object.entries(preset.heroFlowerStates)) {
			if (heroFlowerStates[safeId]) {
				heroFlowerStates[safeId].currentMaxIdx = state.currentMaxIdx !== undefined ? state.currentMaxIdx : -1;
				heroFlowerStates[safeId].targetMaxIdx = state.targetMaxIdx !== undefined ? state.targetMaxIdx : -1;
			}
		}
		Object.keys(heroFlowerStates).forEach(id => {
			if (typeof updateHeroFlowerVisuals === 'function') {
				updateHeroFlowerVisuals(id);
			}
		});
		if (typeof saveHeroFlowerStates === 'function') {
			saveHeroFlowerStates();
		}
	}
	// ============================================
	// STEP 8: Restore hero shards
	// ============================================
	if (preset.heroSpecificShards && typeof heroSpecificShards !== 'undefined') {
		for (const [heroName, shards] of Object.entries(preset.heroSpecificShards)) {
			heroSpecificShards[heroName] = shards;
		}
		document.querySelectorAll('.hero-shard-input[id^="hero_shard_"]').forEach(input => {
			const heroName = input.id.replace('hero_shard_', '').replace(/_/g, ' ');
			if (heroSpecificShards[heroName] !== undefined) {
				input.value = heroSpecificShards[heroName];
			}
		});
		if (typeof saveHeroShardsToStorage === 'function') {
			saveHeroShardsToStorage();
		}
	}
	// ============================================
	// STEP 9: Restore hero widget quantities
	// ============================================
	if (preset.heroWidgetQuantities && typeof heroWidgetQuantities !== 'undefined') {
		for (const [heroName, qty] of Object.entries(preset.heroWidgetQuantities)) {
			heroWidgetQuantities[heroName] = qty;
		}
		document.querySelectorAll('.hero-shard-input[id^="hero_widget_"]').forEach(input => {
			const heroName = input.id.replace('hero_widget_', '').replace(/_/g, ' ');
			if (heroWidgetQuantities[heroName] !== undefined) {
				input.value = heroWidgetQuantities[heroName];
			}
		});
		if (typeof saveHeroWidgetsToStorage === 'function') {
			saveHeroWidgetsToStorage();
		}
	}
	// ============================================
	// STEP 10: Restore buff inputs
	// ============================================
	const buffInputs = ['globalBuildingBuffPercent', 'globalPansMasterArtifact', 'globalWolfPet', 'globalKingPosition', 'globalSaulsResourceful', 'globalGroundWorksCheckbox', 'globalDoubleTimeCheckbox', 'globalTrainingBuffPercent', 'globalTrainingKingPosition', 'globalTrainingMobilizeCheckbox', 'globalTrainingKvKBonusCheckbox', 'globalResearchBuffPercent', 'globalResearchKingPosition', 'globalResearchFreshIdeasCheckbox'];
	for (const id of buffInputs) {
		if (preset.selections && preset.selections[id] !== undefined) {
			const el = document.getElementById(id);
			if (el) {
				if (el.type === 'checkbox') {
					el.checked = preset.selections[id] === true || preset.selections[id] === "true";
				} else {
					el.value = preset.selections[id];
				}
			}
		}
	}
	// ============================================
	// STEP 11: Trigger change events ONLY for non-current/target selects
	// ============================================
	// Only trigger change events for selects that are NOT current or target
	// (to prevent auto-update of target levels)
	document.querySelectorAll("select").forEach(select => {
		if (select.id && !select.id.includes("presetSelect") && !select.id.startsWith('curr_') && !select.id.startsWith('targ_')) {
			select.dispatchEvent(new Event('change', {
				bubbles: true
			}));
		}
	});
	// Trigger change events for checkboxes and inputs
	document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
		if (cb.id) {
			cb.dispatchEvent(new Event('change', {
				bubbles: true
			}));
		}
	});
	document.querySelectorAll('input[type="number"], input[type="text"]').forEach(inp => {
		if (inp.id && !inp.id.startsWith("vault_")) {
			inp.dispatchEvent(new Event('change', {
				bubbles: true
			}));
		}
	});
	// ============================================
	// STEP 12: Refresh all displays
	// ============================================
	if (typeof refreshTroopsCalculations === "function") refreshTroopsCalculations();
	if (typeof refreshCalculations === "function") refreshCalculations();
	if (typeof renderBuildingsGrid === "function") renderBuildingsGrid();
	if (typeof renderAcademyGrid === "function") renderAcademyGrid();
	if (typeof updateAllGridRows === "function") updateAllGridRows();
	if (typeof loadCategorySelections === "function") loadCategorySelections();
	// Update buff displays
	if (category === 'building' && typeof updateBuildingSpeedupBuffs === 'function') {
		updateBuildingSpeedupBuffs();
	}
	if (category === 'academy' && typeof updateResearchSpeedupBuffs === 'function') {
		updateResearchSpeedupBuffs();
	}
	if (category === 'troops' && typeof updateTrainingSpeedupBuffs === 'function') {
		updateTrainingSpeedupBuffs();
	}
	window.dispatchEvent(new Event("presetLoaded"));
}
// ============================================
// UTILITY FUNCTIONS
// ============================================
function parseTimeToSeconds(timeStr) {
	if (!timeStr) return 0;
	let str = timeStr.toString().toLowerCase().trim();
	let total = 0;
	const d = str.match(/(\d+(?:\.\d+)?)\s*d/);
	if (d) total += parseFloat(d[1]) * 86400;
	const h = str.match(/(\d+(?:\.\d+)?)\s*h/);
	if (h) total += parseFloat(h[1]) * 3600;
	const m = str.match(/(\d+(?:\.\d+)?)\s*m/);
	if (m) total += parseFloat(m[1]) * 60;
	const s = str.match(/(\d+(?:\.\d+)?)\s*s/);
	if (s) total += parseFloat(s[1]);
	if (total === 0 && !isNaN(parseFloat(str))) total = parseFloat(str);
	return Math.ceil(total);
}

function formatSecondsToTime(seconds) {
	if (seconds <= 0) return "0s";
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	let parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (secs > 0) parts.push(`${secs}s`);
	return parts.join(" ");
}

function secondsToSpeedupMinutes(seconds) {
	return Math.max(1, Math.ceil(seconds / 60));
}

function parseTimeToMinutesForVault(timeStr) {
	if (!timeStr) return 0;
	let str = timeStr.toString().toLowerCase().trim();
	let total = 0;
	const d = str.match(/(\d+(?:\.\d+)?)\s*d/);
	if (d) total += parseFloat(d[1]) * 1440;
	const h = str.match(/(\d+(?:\.\d+)?)\s*h/);
	if (h) total += parseFloat(h[1]) * 60;
	const m = str.match(/(\d+(?:\.\d+)?)\s*m/);
	if (m) total += parseFloat(m[1]);
	const s = str.match(/(\d+(?:\.\d+)?)\s*s/);
	if (s) total += parseFloat(s[1]) / 60;
	if (total === 0 && !isNaN(parseFloat(str))) total = parseFloat(str);
	return Math.ceil(total);
}

function parseCost(val) {
	if (!val && val !== 0) return 0;
	if (typeof val === "number") return val;
	let str = val.toString().toUpperCase().trim().replace(/,/g, "");
	if (str.endsWith("B")) return parseFloat(str.replace("B", "")) * 1e9;
	if (str.endsWith("M")) return parseFloat(str.replace("M", "")) * 1e6;
	if (str.endsWith("K")) return parseFloat(str.replace("K", "")) * 1e3;
	return parseFloat(str) || 0;
}

function formatNumber(num) {
	if (num >= 1e9) {
		const val = num / 1e9;
		return val % 1 === 0 ? val.toFixed(0) + "B" : val.toFixed(2) + "B";
	}
	if (num >= 1e6) {
		const val = num / 1e6;
		return val % 1 === 0 ? val.toFixed(0) + "M" : val.toFixed(2) + "M";
	}
	if (num >= 1e3) {
		const val = num / 1e3;
		return val % 1 === 0 ? val.toFixed(0) + "K" : val.toFixed(2) + "K";
	}
	return num.toLocaleString();
}
// ============================================
// FIXED: IMAGE FILE NAME MAPPING (added missing resources)
// ============================================
function getImageFileName(resourceId) {
	const imageMap = {
		bread: "Bread.png",
		wood: "Wood.png",
		stone: "Stone.png",
		iron: "Iron.png",
		gold: "Gold.png",
		truegold: "truegold.png",
		tempered_truegold: "tempered_truegold.png",
		truegold_dust: "truegold_dust.png",
		forge_hammer: "forge_hammer.png",
		widgets: "widgets.png",
		mithril: "mithril.png",
		satin: "satin.png",
		gilded_threads: "gilded_threads.png",
		artisans_vision: "artisans_vision.png",
		charm_guide: "charm_guide.png",
		charm_design: "charm_design.png",
		pet_food: "pet_food.png",
		growth_manual: "growth_manual.png",
		nutrient_potion: "nutrient_potion.png",
		promotion_medallion: "promotion_medallion.png",
		building_speedup: "building_speedup.png",
		research_speedup: "research_speedup.png",
		training_speedup: "training_speedup.png",
		general_speedup: "general_speedup.png",
		rare_general_shard: "rare_general_shard.png",
		epic_general_shard: "epic_general_shard.png",
		mythic_general_shard: "mythic_general_shard.png",
		mythic_gear: "mythic-gear.png",
		hero_roulette: "hero_roulette.png",
		general_emblem: "general_emblem.png",
		master_manuscript: "master_manuscript.png",
		advanced_taming_mark: "advanced_taming_mark.png",
		common_taming_mark: "common_taming_mark.png",
		hero_xp: "hero_xp.png",
		stamina: "stamina.png",
		master_speedup: "master_speedup.png"
	};
	return `assets/${imageMap[resourceId] || resourceId + ".png"}`;
}

function getCurrentVault() {
	let vault = {};
	for (const item of RESOURCE_ITEMS) {
		const input = document.getElementById(`vault_${item.id}`);
		const raw = input ? input.value : localStorage.getItem(`vault_${item.id}`) || "";
		vault[item.id] = item.id.includes("speedup") ? parseTimeToMinutesForVault(raw) : parseCost(raw);
	}
	return vault;
}

function getCurrentPageKey() {
	const path = window.location.pathname;
	if (path.includes('hero-gear')) return 'score_herogear';
	if (path.includes('war-academy')) return 'score_academy';
	if (path.includes('forgehammer')) return 'score_forgehammer';
	if (path.includes('buildings')) return 'score_buildings';
	if (path.includes('widgets')) return 'score_widgets';
	if (path.includes('heroes')) return 'score_heroes';
	if (path.includes('gov-gear')) return 'score_govgear';
	if (path.includes('gov-charm')) return 'score_govcharm';
	if (path.includes('pets')) return 'score_pets';
	if (path.includes('troops')) return 'score_troops';
	return null;
}
// ============================================
// GLOBAL DATA LOADING
// ============================================
async function loadGameData(filesToLoad = null) {
	// If no specific files requested, load minimal set
	if (!filesToLoad) {
		// For vault page, we only need Points.json for scoring
		filesToLoad = ["Points"];
	}
	const results = await Promise.allSettled(filesToLoad.map(f => fetch(`data/${f}.json`).then(r => r.json())));
	results.forEach((result, i) => {
		const fileName = filesToLoad[i];
		if (result.status === 'fulfilled') {
			gameDB[fileName] = result.value;
		} else {
			console.error(`❌ Failed to load: ${fileName}.json`, result.reason);
			gameDB[fileName] = {};
		}
	});
	loadPointsFromData();
}
// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'info') {
	const existing = document.querySelector('.app-notification');
	if (existing) existing.remove();
	const notification = document.createElement('div');
	notification.className = `app-notification app-notification-${type}`;
	notification.textContent = message;
	document.body.appendChild(notification);
	setTimeout(() => {
		notification.style.opacity = '0';
		notification.style.transform = 'translateX(100px)';
		notification.style.transition = 'all 0.3s ease-out';
		setTimeout(() => notification.remove(), 300);
	}, 3000);
}
// ============================================
// INPUT VALIDATION - FIXED: Only apply to numeric fields
// ============================================
function sanitizeNumericInput(input, allowEmpty = false) {
	if (!input) return;
	let value = input.value.trim();
	if (value === '' && allowEmpty) return;
	let num = parseFloat(value);
	if (isNaN(num) || num < 0) {
		input.value = '';
	}
}

function attachInputValidation(input) {
	if (!input) return;
	// Only attach validation to numeric inputs
	const isNumericField = input.id?.startsWith('vault_') || input.id?.includes('qty') || input.id?.includes('quantity') || input.id?.includes('troop') || input.placeholder?.toLowerCase().includes('quantity') || input.classList.contains('hero-shard-input') || input.type === 'number';
	if (!isNumericField) return;
	input.addEventListener('blur', function() {
		sanitizeNumericInput(this, true);
		if (typeof refreshCalculations === 'function') refreshCalculations();
		if (typeof refreshTroopsCalculations === 'function') refreshTroopsCalculations();
	});
	input.addEventListener('keydown', function(e) {
		if (e.key === '-' || e.key === 'Minus') {
			e.preventDefault();
			return false;
		}
	});
	if (input.type === 'number') {
		input.addEventListener('input', function() {
			if (this.value.startsWith('-')) {
				this.value = this.value.replace('-', '');
			}
		});
	}
}

function attachValidationToAllInputs() {
	document.querySelectorAll('input[type="number"]').forEach(input => attachInputValidation(input));
	document.querySelectorAll('input[type="text"]').forEach(input => {
		const isNumericField = input.id?.startsWith('vault_') || input.id?.includes('qty') || input.id?.includes('quantity') || input.id?.includes('troop') || input.placeholder?.toLowerCase().includes('quantity') || input.classList.contains('hero-shard-input');
		if (isNumericField) attachInputValidation(input);
	});
}

function initializeInputValidation() {
	attachValidationToAllInputs();
	const observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			mutation.addedNodes.forEach(function(node) {
				if (node.nodeType === 1) {
					if (node.tagName === 'INPUT') attachInputValidation(node);
					node.querySelectorAll('input[type="number"], input[type="text"]').forEach(input => {
						// Only attach validation to numeric fields
						const isNumericField = input.id?.startsWith('vault_') || input.id?.includes('qty') || input.id?.includes('quantity') || input.id?.includes('troop') || input.placeholder?.toLowerCase().includes('quantity') || input.classList.contains('hero-shard-input') || input.type === 'number';
						if (isNumericField) attachInputValidation(input);
					});
				}
			});
		});
	});
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
}
// ============================================
// GLOBAL SCORE SYSTEM
// ============================================
let globalTotalScore = 0;
let currentPageScore = 0;

function recalculateTotalFromStorage() {
	const pageKeys = ['score_buildings', 'score_academy', 'score_forgehammer', 'score_widgets', 'score_heroes', 'score_herogear', 'score_govgear', 'score_govcharm', 'score_pets', 'score_troops'];
	let total = 0;
	for (const key of pageKeys) {
		total += parseInt(localStorage.getItem(key) || '0');
	}
	globalTotalScore = total;
	const totalDisplay = document.getElementById('globalTotalScoreDisplay');
	if (totalDisplay) {
		totalDisplay.innerText = total.toLocaleString();
		totalDisplay.style.transition = 'none';
		totalDisplay.style.textShadow = '0 0 30px var(--lcd-glow-dim), 0 0 60px rgba(74,242,5,0.2)';
		setTimeout(() => {
			totalDisplay.style.transition = 'text-shadow 0.5s ease';
			totalDisplay.style.textShadow = '0 0 8px rgba(58, 242, 5, .6)';
		}, 50);
	}
}

function saveCurrentPageScore(score) {
	const key = getCurrentPageKey();
	if (key) {
		localStorage.setItem(key, score.toString());
		setTimeout(recalculateTotalFromStorage, 10);
	}
}

function updateGlobalTotalScore() {
	const scoreDisplay = document.getElementById('globalScoreDisplay');
	if (scoreDisplay) {
		currentPageScore = parseInt(scoreDisplay.innerText.replace(/,/g, '')) || 0;
	}
	recalculateTotalFromStorage();
}
// ============================================
// BUILDING SPEEDUP BUFF SYSTEM
// ============================================
let globalBuildingBuffPercent = 0;
let globalPansReductionSeconds = 0;
let globalWolfPetPercent = 0;
let globalKingPositionPercent = 0;
let globalSaulsResourcefulPercent = 0;
let globalGroundWorksActive = false;
let globalDoubleTimeActive = false;

function parseTimeStringToSeconds(timeStr) {
	if (!timeStr || timeStr === "0") return 0;
	let str = timeStr.toString().toLowerCase().trim();
	let totalSeconds = 0;
	const d = str.match(/(\d+(?:\.\d+)?)\s*d/);
	if (d) totalSeconds += parseFloat(d[1]) * 86400;
	const h = str.match(/(\d+(?:\.\d+)?)\s*h/);
	if (h) totalSeconds += parseFloat(h[1]) * 3600;
	const m = str.match(/(\d+(?:\.\d+)?)\s*m/);
	if (m) totalSeconds += parseFloat(m[1]) * 60;
	const s = str.match(/(\d+(?:\.\d+)?)\s*s/);
	if (s) totalSeconds += parseFloat(s[1]);
	if (totalSeconds === 0 && !isNaN(parseFloat(str))) totalSeconds = parseFloat(str);
	return totalSeconds;
}

function getBuildingTotalBuffPercentage() {
	let total = globalBuildingBuffPercent + globalWolfPetPercent + globalKingPositionPercent;
	if (globalGroundWorksActive) total += 10;
	if (globalDoubleTimeActive) total += 20;
	return total;
}

function getResourceReductionPercentage() {
	return globalSaulsResourcefulPercent;
}

function applyBuildingSpeedupBuffs(originalSeconds) {
	if (originalSeconds <= 0) return 0;
	let remainingSeconds = originalSeconds;
	const totalPercent = getBuildingTotalBuffPercentage();
	if (totalPercent > 0) {
		remainingSeconds = remainingSeconds / (1 + totalPercent / 100);
	}
	if (globalPansReductionSeconds > 0) {
		remainingSeconds = Math.max(0, remainingSeconds - globalPansReductionSeconds);
	}
	return Math.max(1, Math.ceil(remainingSeconds));
}

function updateBuildingSpeedupBuffs() {
	const buildingInput = document.getElementById("globalBuildingBuffPercent");
	if (buildingInput) {
		globalBuildingBuffPercent = parseFloat(buildingInput.value) || 0;
		localStorage.setItem("globalBuildingBuffPercent", globalBuildingBuffPercent);
	}
	const pansInput = document.getElementById("globalPansMasterArtifact");
	if (pansInput) {
		globalPansReductionSeconds = parseTimeStringToSeconds(pansInput.value || "0");
		localStorage.setItem("globalPansMasterArtifact", pansInput.value || "0");
	}
	const wolfSelect = document.getElementById("globalWolfPet");
	if (wolfSelect) {
		globalWolfPetPercent = parseFloat(wolfSelect.value) || 0;
		localStorage.setItem("globalWolfPet", globalWolfPetPercent);
	}
	const kingSelect = document.getElementById("globalKingPosition");
	if (kingSelect) {
		globalKingPositionPercent = parseFloat(kingSelect.value) || 0;
		localStorage.setItem("globalKingPosition", globalKingPositionPercent);
	}
	const saulsSelect = document.getElementById("globalSaulsResourceful");
	if (saulsSelect) {
		globalSaulsResourcefulPercent = parseFloat(saulsSelect.value) || 0;
		localStorage.setItem("globalSaulsResourceful", globalSaulsResourcefulPercent);
	}
	const groundWorksCheckbox = document.getElementById("globalGroundWorksCheckbox");
	if (groundWorksCheckbox) {
		globalGroundWorksActive = groundWorksCheckbox.checked;
		localStorage.setItem("globalGroundWorksActive", globalGroundWorksActive);
	}
	const doubleTimeCheckbox = document.getElementById("globalDoubleTimeCheckbox");
	if (doubleTimeCheckbox) {
		globalDoubleTimeActive = doubleTimeCheckbox.checked;
		localStorage.setItem("globalDoubleTimeActive", globalDoubleTimeActive);
	}
	const displayElement = document.getElementById("globalTotalBuffDisplay");
	if (displayElement) {
		const totalPercent = getBuildingTotalBuffPercentage();
		let displayText = `${totalPercent}%`;
		if (globalPansReductionSeconds > 0) {
			displayText += ` + ${formatSecondsToTime(globalPansReductionSeconds)}`;
		}
		displayElement.textContent = displayText;
	}
	const reductionDisplay = document.getElementById("globalResourceReductionDisplay");
	if (reductionDisplay) {
		reductionDisplay.textContent = `${globalSaulsResourcefulPercent}%`;
	}
	if (typeof refreshCalculations === "function") refreshCalculations();
}

function loadBuildingSpeedupBuffs() {
	globalBuildingBuffPercent = parseFloat(localStorage.getItem("globalBuildingBuffPercent") || "0");
	const pansValue = localStorage.getItem("globalPansMasterArtifact") || "0";
	globalPansReductionSeconds = parseTimeStringToSeconds(pansValue);
	globalWolfPetPercent = parseFloat(localStorage.getItem("globalWolfPet") || "0");
	globalKingPositionPercent = parseFloat(localStorage.getItem("globalKingPosition") || "0");
	globalSaulsResourcefulPercent = parseFloat(localStorage.getItem("globalSaulsResourceful") || "0");
	globalGroundWorksActive = localStorage.getItem("globalGroundWorksActive") === "true";
	globalDoubleTimeActive = localStorage.getItem("globalDoubleTimeActive") === "true";
	const buildingInput = document.getElementById("globalBuildingBuffPercent");
	if (buildingInput) buildingInput.value = globalBuildingBuffPercent;
	const pansInput = document.getElementById("globalPansMasterArtifact");
	if (pansInput) pansInput.value = localStorage.getItem("globalPansMasterArtifact") || "0";
	const wolfSelect = document.getElementById("globalWolfPet");
	if (wolfSelect) wolfSelect.value = globalWolfPetPercent;
	const kingSelect = document.getElementById("globalKingPosition");
	if (kingSelect) kingSelect.value = globalKingPositionPercent;
	const saulsSelect = document.getElementById("globalSaulsResourceful");
	if (saulsSelect) saulsSelect.value = globalSaulsResourcefulPercent;
	const groundWorksCheckbox = document.getElementById("globalGroundWorksCheckbox");
	if (groundWorksCheckbox) groundWorksCheckbox.checked = globalGroundWorksActive;
	const doubleTimeCheckbox = document.getElementById("globalDoubleTimeCheckbox");
	if (doubleTimeCheckbox) doubleTimeCheckbox.checked = globalDoubleTimeActive;
	const reductionDisplay = document.getElementById("globalResourceReductionDisplay");
	if (reductionDisplay) {
		reductionDisplay.textContent = `${globalSaulsResourcefulPercent}%`;
	}
	updateBuildingSpeedupBuffs();
}
// ============================================
// RESEARCH SPEEDUP BUFF SYSTEM
// ============================================
let globalResearchBuffPercent = 0;
let globalResearchKingPositionPercent = 0;
let globalResearchFreshIdeasActive = false;

function getResearchTotalBuffPercentage() {
	let total = globalResearchBuffPercent + globalResearchKingPositionPercent;
	if (globalResearchFreshIdeasActive) total += 10;
	return total;
}

function applyResearchSpeedupBuffs(originalSeconds) {
	if (originalSeconds <= 0) return 0;
	let remainingSeconds = originalSeconds;
	const totalPercent = getResearchTotalBuffPercentage();
	if (totalPercent > 0) {
		remainingSeconds = remainingSeconds / (1 + totalPercent / 100);
	}
	return Math.max(1, Math.ceil(remainingSeconds));
}

function updateResearchSpeedupBuffs() {
	const researchInput = document.getElementById("globalResearchBuffPercent");
	if (researchInput) {
		globalResearchBuffPercent = parseFloat(researchInput.value) || 0;
		localStorage.setItem("globalResearchBuffPercent", globalResearchBuffPercent);
	}
	const kingSelect = document.getElementById("globalResearchKingPosition");
	if (kingSelect) {
		globalResearchKingPositionPercent = parseFloat(kingSelect.value) || 0;
		localStorage.setItem("globalResearchKingPosition", globalResearchKingPositionPercent);
	}
	const freshIdeasCheckbox = document.getElementById("globalResearchFreshIdeasCheckbox");
	if (freshIdeasCheckbox) {
		globalResearchFreshIdeasActive = freshIdeasCheckbox.checked;
		localStorage.setItem("globalResearchFreshIdeasActive", globalResearchFreshIdeasActive);
	}
	const displayElement = document.getElementById("globalResearchTotalBuffDisplay");
	if (displayElement) {
		const totalPercent = getResearchTotalBuffPercentage();
		displayElement.textContent = `${totalPercent}%`;
	}
	if (typeof refreshCalculations === "function") refreshCalculations();
}

function loadResearchSpeedupBuffs() {
	globalResearchBuffPercent = parseFloat(localStorage.getItem("globalResearchBuffPercent") || "0");
	globalResearchKingPositionPercent = parseFloat(localStorage.getItem("globalResearchKingPosition") || "0");
	globalResearchFreshIdeasActive = localStorage.getItem("globalResearchFreshIdeasActive") === "true";
	const researchInput = document.getElementById("globalResearchBuffPercent");
	if (researchInput) researchInput.value = globalResearchBuffPercent;
	const kingSelect = document.getElementById("globalResearchKingPosition");
	if (kingSelect) kingSelect.value = globalResearchKingPositionPercent;
	const freshIdeasCheckbox = document.getElementById("globalResearchFreshIdeasCheckbox");
	if (freshIdeasCheckbox) freshIdeasCheckbox.checked = globalResearchFreshIdeasActive;
	updateResearchSpeedupBuffs();
}
// ============================================
// TRAINING SPEEDUP BUFF SYSTEM
// ============================================
let globalTrainingBuffPercent = 0;
let globalTrainingKingPositionPercent = 0;
let globalTrainingMobilizeActive = false;
let globalTrainingKvKBonusActive = false;

function getTrainingTotalBuffPercentage() {
	let total = globalTrainingBuffPercent + globalTrainingKingPositionPercent;
	if (globalTrainingMobilizeActive) total += 30;
	if (globalTrainingKvKBonusActive) total += 25;
	return total;
}

function applyTrainingSpeedupBuffs(originalSeconds) {
	if (originalSeconds <= 0) return 0;
	let remainingSeconds = originalSeconds;
	const totalPercent = getTrainingTotalBuffPercentage();
	if (totalPercent > 0) {
		remainingSeconds = remainingSeconds / (1 + totalPercent / 100);
	}
	return Math.max(1, Math.ceil(remainingSeconds));
}

function updateTrainingSpeedupBuffs() {
	const trainingInput = document.getElementById("globalTrainingBuffPercent");
	if (trainingInput) {
		globalTrainingBuffPercent = parseFloat(trainingInput.value) || 0;
		localStorage.setItem("globalTrainingBuffPercent", globalTrainingBuffPercent);
	}
	const kingSelect = document.getElementById("globalTrainingKingPosition");
	if (kingSelect) {
		globalTrainingKingPositionPercent = parseFloat(kingSelect.value) || 0;
		localStorage.setItem("globalTrainingKingPosition", globalTrainingKingPositionPercent);
	}
	const mobilizeCheckbox = document.getElementById("globalTrainingMobilizeCheckbox");
	if (mobilizeCheckbox) {
		globalTrainingMobilizeActive = mobilizeCheckbox.checked;
		localStorage.setItem("globalTrainingMobilizeActive", globalTrainingMobilizeActive);
	}
	const kvkBonusCheckbox = document.getElementById("globalTrainingKvKBonusCheckbox");
	if (kvkBonusCheckbox) {
		globalTrainingKvKBonusActive = kvkBonusCheckbox.checked;
		localStorage.setItem("globalTrainingKvKBonusActive", globalTrainingKvKBonusActive);
	}
	const displayElement = document.getElementById("globalTrainingTotalBuffDisplay");
	if (displayElement) {
		const totalPercent = getTrainingTotalBuffPercentage();
		displayElement.textContent = `${totalPercent}%`;
	}
	if (typeof refreshTroopsCalculations === "function") refreshTroopsCalculations();
}

function loadTrainingSpeedupBuffs() {
	globalTrainingBuffPercent = parseFloat(localStorage.getItem("globalTrainingBuffPercent") || "0");
	globalTrainingKingPositionPercent = parseFloat(localStorage.getItem("globalTrainingKingPosition") || "0");
	globalTrainingMobilizeActive = localStorage.getItem("globalTrainingMobilizeActive") === "true";
	globalTrainingKvKBonusActive = localStorage.getItem("globalTrainingKvKBonusActive") === "true";
	const trainingInput = document.getElementById("globalTrainingBuffPercent");
	if (trainingInput) trainingInput.value = globalTrainingBuffPercent;
	const kingSelect = document.getElementById("globalTrainingKingPosition");
	if (kingSelect) kingSelect.value = globalTrainingKingPositionPercent;
	const mobilizeCheckbox = document.getElementById("globalTrainingMobilizeCheckbox");
	if (mobilizeCheckbox) mobilizeCheckbox.checked = globalTrainingMobilizeActive;
	const kvkBonusCheckbox = document.getElementById("globalTrainingKvKBonusCheckbox");
	if (kvkBonusCheckbox) kvkBonusCheckbox.checked = globalTrainingKvKBonusActive;
	updateTrainingSpeedupBuffs();
}
// ============================================
// GENERIC CARD FACTORY
// ============================================
function buildLevelOptions(levels, placeholder, highestLevel, selectedValue) {
	let opts = `<option value="" disabled selected hidden>${placeholder || 'Select Level'}</option>`;
	if (!levels || !levels.length) return opts;
	for (const level of levels) {
		const display = String(level);
		const isMax = String(level) === String(highestLevel);
		const selected = String(level) === String(selectedValue) ? 'selected' : '';
		opts += `<option value="${display}" ${selected}>${display}${isMax ? ' (Max)' : ''}</option>`;
	}
	if (highestLevel && !levels.some(l => String(l) === String(highestLevel))) {
		const selected = String(highestLevel) === String(selectedValue) ? 'selected' : '';
		opts += `<option value="${highestLevel}" ${selected}>${highestLevel} (Max)</option>`;
	}
	return opts;
}

function createGenericCard(config) {
	const {
		type,
		name,
		safeId,
		fromLevels,
		toLevels,
		highestLevel,
		imgUrl,
		currentSelectId,
		targetSelectId,
		onCurrentChange,
		onTargetChange,
		onUpgradeChange,
		onSpeedupChange,
		extraControls = '',
		customHeader = '',
		customBody = '',
		showSpeedup = false,
		showCheckbox = true
	} = config;
	const currId = currentSelectId || `curr_${safeId}`;
	const targId = targetSelectId || `targ_${safeId}`;
	const activeId = `active_${safeId}`;
	const speedId = `speed_${safeId}`;
	const statusId = `status_${safeId}`;
	const currOpts = buildLevelOptions(fromLevels, 'Current Level', highestLevel, '');
	const targOpts = buildLevelOptions(toLevels, 'Target Level', highestLevel, '');
	const header = customHeader || `
        <div class="item-card-header">
            <img loading="lazy" decoding="async" src="${imgUrl}" onerror="this.style.display='none';" alt="${name}">
            <span>${name}</span>
        </div>
    `;
	const body = customBody || `
        <div class="level-controls">
            <select id="${currId}" onchange="${onCurrentChange}('${safeId}')">${currOpts}</select>
            <select id="${targId}" onchange="${onTargetChange}('${safeId}')">${targOpts}</select>
        </div>
        ${extraControls}
        <div class="checkbox-group">
            ${showCheckbox ? `<label class="checkbox-label"><input class="checkbox" type="checkbox" id="${activeId}" onchange="${onUpgradeChange}('${safeId}', this.checked)"> ⬆️ Upgrade</label>` : ''}
            ${showSpeedup ? `<label class="checkbox-label"><input class="checkbox" type="checkbox" id="${speedId}" onchange="${onSpeedupChange}('${safeId}', this.checked)"> ⏩ +Speedups</label>` : ''}
        </div>
        <div id="${statusId}" class="status-pane">⚙️ Select current & target level</div>
    `;
	return `<div class="item-card" data-type="${type}" data-name="${name}" data-id="${safeId}">
        ${header}
        <div class="item-card-body">
            ${body}
        </div>
    </div>`;
}
// ============================================
// CRITICAL FIX: GENERIC REFRESH CALCULATIONS 
// (Fixes double resource deduction bug)
// ============================================
function genericRefreshCalculations(config) {
	const {
		type,
		getData,
		getLevels,
		getTargetLevels,
		calculateCosts,
		getBuffedTime = null,
		getDisplayName = null,
		getCategory = null
	} = config;
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
	const cards = document.querySelectorAll(`.item-card[data-type="${type}"]`);
	const dataArray = getData();
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
			status.innerHTML = `⚙️ Select current & target level`;
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
		const toLevels = getTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
		const isAtMax = highestLevel && String(from) === String(highestLevel);
		if (isAtMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `🏆 <strong>MAXED!</strong><br>Already at highest level (${highestLevel})`;
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
			status.innerHTML = `⚙️ Current and target levels are the same. Select a higher target level.`;
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
			const timeHtml = getBuffedTime && locked.totalTimeSeconds ? `<div class="resource-tag">⏱️ Total Time: ${formatSecondsToTime(getBuffedTime(locked.totalTimeSeconds))}</div>` : '';
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>✓ ACTIVE${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}${timeHtml}${partialHtml}</div>`;
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
		const costs = calculateCosts(dataArray, from, to, speedCheck, vault, otherLocked);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `❌ Cannot upgrade from ${from} to ${to}`;
			continue;
		}
		const {
			stepPoints,
			costTotals,
			stepsCount,
			partialNote
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
		const timeHtml = getBuffedTime && costs.totalTimeSeconds ? `<div class="resource-tag">⏱️ Total Time: ${formatSecondsToTime(getBuffedTime(costs.totalTimeSeconds))}</div>` : '';
		if (activeCb) {
			activeCb.disabled = !canAfford;
			activeCb.parentElement.style.opacity = canAfford ? '1' : '0.5';
		}
		if (speedCb && costs.totalTimeSeconds > 0) {
			speedCb.disabled = !canAfford;
			speedCb.parentElement.style.opacity = canAfford ? '1' : '0.5';
		}
		if (canAfford) {
			status.className = "status-pane status-info";
			status.innerHTML = `<strong>⚪ ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}${timeHtml}${partialHtml}</div><br><span class="text-remaining">✅ Click "Upgrade" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>✗ INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${costHtml}${timeHtml}${partialHtml}</div>`;
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
//Service Worker
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').then(registration => {
			console.log('Service Worker registered successfully');
		}).catch(error => {
			console.log('Service Worker registration failed:', error);
		});
	});
}
// ============================================
// EXPORTS
// ============================================
window.gameDB = gameDB;
window.lockedUpgrades = lockedUpgrades;
window.RESOURCE_ITEMS = RESOURCE_ITEMS;
window.SCORE_RULES = SCORE_RULES;
window.currentPreset = currentPreset;
window.allPresets = allPresets;
window.pointData = pointData;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.toggleNavMenu = toggleNavMenu;
window.closeNavMenu = closeNavMenu;
window.togglePresetMenu = togglePresetMenu;
window.closePresetMenuOutside = closePresetMenuOutside;
window.createNewPreset = createNewPreset;
window.saveCurrentToPreset = saveCurrentToPreset;
window.updatePreset = updatePreset;
window.loadPreset = loadPreset;
window.deletePreset = deletePreset;
window.loadPresetsFromStorage = loadPresetsFromStorage;
window.applyPresetToCurrentPage = applyPresetToCurrentPage;
window.getCurrentPageCategory = getCurrentPageCategory;
window.getCurrentPageDisplayName = getCurrentPageDisplayName;
window.getCurrentPageInfo = getCurrentPageInfo;
window.clearAllSelections = window.clearAllSelections;
window.updateVaultResource = window.updateVaultResource;
window.parseTimeToSeconds = parseTimeToSeconds;
window.formatSecondsToTime = formatSecondsToTime;
window.secondsToSpeedupMinutes = secondsToSpeedupMinutes;
window.parseTimeToMinutesForVault = parseTimeToMinutesForVault;
window.parseCost = parseCost;
window.formatNumber = formatNumber;
window.getImageFileName = getImageFileName;
window.getCurrentVault = getCurrentVault;
window.loadGameData = loadGameData;
window.loadPointsFromData = loadPointsFromData;
window.sanitizeNumericInput = sanitizeNumericInput;
window.attachInputValidation = attachInputValidation;
window.attachValidationToAllInputs = attachValidationToAllInputs;
window.initializeInputValidation = initializeInputValidation;
window.globalTotalScore = globalTotalScore;
window.currentPageScore = currentPageScore;
window.updateGlobalTotalScore = updateGlobalTotalScore;
window.recalculateTotalFromStorage = recalculateTotalFromStorage;
window.saveCurrentPageScore = saveCurrentPageScore;
window.getCurrentPageKey = getCurrentPageKey;
window.getBuildingTotalBuffPercentage = getBuildingTotalBuffPercentage;
window.applyBuildingSpeedupBuffs = applyBuildingSpeedupBuffs;
window.updateBuildingSpeedupBuffs = updateBuildingSpeedupBuffs;
window.loadBuildingSpeedupBuffs = loadBuildingSpeedupBuffs;
window.getResourceReductionPercentage = getResourceReductionPercentage;
window.getResearchTotalBuffPercentage = getResearchTotalBuffPercentage;
window.applyResearchSpeedupBuffs = applyResearchSpeedupBuffs;
window.updateResearchSpeedupBuffs = updateResearchSpeedupBuffs;
window.loadResearchSpeedupBuffs = loadResearchSpeedupBuffs;
window.getTrainingTotalBuffPercentage = getTrainingTotalBuffPercentage;
window.applyTrainingSpeedupBuffs = applyTrainingSpeedupBuffs;
window.updateTrainingSpeedupBuffs = updateTrainingSpeedupBuffs;
window.loadTrainingSpeedupBuffs = loadTrainingSpeedupBuffs;
window.showNotification = showNotification;
window.parseTimeStringToSeconds = parseTimeStringToSeconds;
window.showModal = showModal;
window.closeModal = closeModal;
window.buildResourceDisplay = buildResourceDisplay;
window.buildLevelOptions = buildLevelOptions;
window.createGenericCard = createGenericCard;
window.genericRefreshCalculations = genericRefreshCalculations;
