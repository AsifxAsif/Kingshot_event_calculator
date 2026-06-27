// ============================================
// CORE APPLICATION - OPTIMIZED FOR SPEED
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
let refreshTimeout = null;
let dataLoadPromise = null;
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
	id: "gems",
	placeholder: "10000"
}, {
	id: "truegold",
	placeholder: "500"
}, {
	id: "truegold_dust",
	placeholder: "1000"
}, {
	id: "tempered_truegold",
	placeholder: "25"
}, {
	id: "hero_xp",
	placeholder: "1000"
}, {
	id: "stamina",
	placeholder: "100"
}, {
	id: "master_manuscript",
	placeholder: "50"
}, {
	id: "general_emblem",
	placeholder: "20"
}, {
	id: "promotion_medallion",
	placeholder: "10"
}, {
	id: "nutrient_potion",
	placeholder: "20"
}, {
	id: "growth_manual",
	placeholder: "100"
}, {
	id: "advanced_taming_mark",
	placeholder: "10"
}, {
	id: "common_taming_mark",
	placeholder: "30"
}, {
	id: "pet_food",
	placeholder: "5000"
}, {
	id: "charm_design",
	placeholder: "80"
}, {
	id: "charm_guide",
	placeholder: "100"
}, {
	id: "artisans_vision",
	placeholder: "50"
}, {
	id: "gilded_threads",
	placeholder: "200"
}, {
	id: "satin",
	placeholder: "5000"
}, {
	id: "mithril",
	placeholder: "10"
}, {
	id: "forge_hammer",
	placeholder: "50"
}, {
	id: "mythic_general_shard",
	placeholder: "50"
}, {
	id: "epic_general_shard",
	placeholder: "200"
}, {
	id: "rare_general_shard",
	placeholder: "500"
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
	id: "master_speedup",
	placeholder: "1d"
}, {
	id: "general_speedup",
	placeholder: "10d 8h 45m"
}, {
	id: "mythic_gear",
	placeholder: "10"
}, {
	id: "hero_roulette_token",
	placeholder: "100"
}];
// ============================================
// POINT RULES
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
// PERFORMANCE: Preload Critical Assets
// ============================================
function preloadCriticalAssets() {
	if (document.querySelector('link[rel="preload"][as="image"][href*="Bread.webp"]')) return;
	const criticalImages = ['Bread.webp', 'Wood.webp', 'Stone.webp', 'Iron.webp', 'Gold.webp'];
	criticalImages.forEach(img => {
		const link = document.createElement('link');
		link.rel = 'preload';
		link.as = 'image';
		link.href = `assets/${img}`;
		document.head.appendChild(link);
	});
}
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', preloadCriticalAssets);
} else {
	preloadCriticalAssets();
}
// ============================================
// PERFORMANCE: Debounced Refresh
// ============================================
function debouncedRefresh(module) {
	if (refreshTimeout) {
		clearTimeout(refreshTimeout);
	}
	refreshTimeout = setTimeout(() => {
		if (module === 'troops' && typeof refreshTroopsCalculations === 'function') {
			refreshTroopsCalculations();
		} else if (typeof refreshCalculations === 'function') {
			refreshCalculations();
		}
		refreshTimeout = null;
	}, 50);
}
window.debouncedRefresh = debouncedRefresh;
// ============================================
// PERFORMANCE: Cache DOM queries
// ============================================
const DOMCache = {
	get: function(id) {
		if (!this[id]) {
			this[id] = document.getElementById(id);
		}
		return this[id];
	},
	query: function(selector) {
		const key = 'q_' + selector;
		if (!this[key]) {
			this[key] = document.querySelector(selector);
		}
		return this[key];
	},
	queryAll: function(selector) {
		const key = 'qa_' + selector;
		if (!this[key]) {
			this[key] = document.querySelectorAll(selector);
		}
		return this[key];
	},
	clear: function() {
		Object.keys(this).forEach(k => {
			if (k !== 'get' && k !== 'query' && k !== 'queryAll' && k !== 'clear') {
				delete this[k];
			}
		});
	}
};
window.DOMCache = DOMCache;
// ============================================
// RESOURCE DISPLAY
// ============================================
function buildResourceDisplay(costTotals, vault, lockedResources, heroName) {
	if (!costTotals || !Object.keys(costTotals).length) {
		return '<span>No resources required</span>';
	}
	const filteredCosts = {};
	for (const [key, value] of Object.entries(costTotals)) {
		if (!key.startsWith('_')) {
			filteredCosts[key] = value;
		}
	}
	if (!Object.keys(filteredCosts).length) {
		return '<span>No resources required</span>';
	}
	let basicResources = '',
		premiumResources = '',
		heroResources = '',
		speedupResources = '',
		otherResources = '';
	const basicKeys = ['bread', 'wood', 'stone', 'iron', 'gold'];
	const premiumKeys = ['truegold', 'tempered_truegold', 'truegold_dust', 'forge_hammer', 'widgets', 'mithril', 'satin', 'gilded_threads', 'artisans_vision', 'charm_guide', 'charm_design', 'pet_food', 'growth_manual', 'nutrient_potion', 'promotion_medallion', 'mythic_gear'];
	const speedupKeys = ['building_speedup', 'research_speedup', 'training_speedup', 'general_speedup', 'master_speedup'];
	const isHeroResource = (res) => res.endsWith('_shards') || res.endsWith('_widgets');
	for (const [res, amt] of Object.entries(filteredCosts)) {
		const lockedAmt = lockedResources && lockedResources[res] ? lockedResources[res] : 0;
		let remaining;
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
		}
		const req = isSpeed ? `${amt} min` : formatNumber(amt);
		const statusClass = remaining < 0 ? 'text-deficit' : 'text-remaining';
		const statusText = remaining < 0 ? `${formatNumber(-remaining)} short` : `${formatNumber(remaining)} remaining`;
		const imgStyle = isHeroResource(res) ? 'height:20px;width:20px;object-fit:contain;border-radius:4px;' : '';
		const tag = `<div class="resource-tag"><img loading="lazy" decoding="async" src="${img}" onerror="this.style.display='none';" style="${imgStyle}" alt="${disp}"> ${disp}: ${req} <span class="${statusClass}">(${statusText})</span></div>`;
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
	if (heroResources) result += `<div class="resource-group-label">Hero Resources:</div>${heroResources}`;
	if (basicResources) result += `<div class="resource-group-label">Basic Resources:</div>${basicResources}`;
	if (premiumResources) result += `<div class="resource-group-label">Premium Resources:</div>${premiumResources}`;
	if (speedupResources) result += `<div class="resource-group-label">Speedups:</div>${speedupResources}`;
	if (otherResources) result += `<div class="resource-group-label">Other Resources:</div>${otherResources}`;
	return result;
}
// ============================================
// POINTS LOADER
// ============================================
function loadPointsFromData() {
	if (!gameDB.Points || !gameDB.Points.Points) {
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
	const overlay = DOMCache.get('loadingOverlay');
	if (overlay) overlay.classList.add('active');
}

function hideLoading() {
	const overlay = DOMCache.get('loadingOverlay');
	if (overlay) overlay.classList.remove('active');
}
// ============================================
// MODAL SYSTEM
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
	let html = `<div class="app-modal-header"><h3>${title || 'Confirm'}</h3><button class="app-modal-close" onclick="closeModal()">✕</button></div><div class="app-modal-body">`;
	if (message) {
		html += `<p>${message}</p>`;
	}
	if (inputLabel !== undefined) {
		html += `<div class="app-modal-input-group"><label>${inputLabel}</label><input type="text" id="appModalInput" value="${inputValue || ''}" placeholder="Enter name..."></div>`;
	}
	const primaryBtnClass = isDanger ? 'app-modal-btn-danger' : 'app-modal-btn-primary';
	html += `</div><div class="app-modal-footer"><button class="app-modal-btn app-modal-btn-secondary" onclick="closeModal()">${cancelText || 'Cancel'}</button><button class="app-modal-btn ${primaryBtnClass}" id="appModalConfirm">${confirmText || 'Confirm'}</button></div>`;
	modal.innerHTML = html;
	overlay.appendChild(modal);
	document.body.appendChild(overlay);
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
		setTimeout(() => {
			input.focus();
			input.select();
		}, 50);
	}
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
	const navLinks = DOMCache.get('navLinks');
	const hamburger = DOMCache.get('hamburgerIcon');
	const checkbox = DOMCache.get('hamburgerCheckbox');
	let overlay = DOMCache.get('menuOverlay');
	if (!overlay) {
		const newOverlay = document.createElement('div');
		newOverlay.id = 'menuOverlay';
		newOverlay.className = 'menu-overlay';
		newOverlay.onclick = closeNavMenu;
		document.body.appendChild(newOverlay);
		overlay = DOMCache.get('menuOverlay');
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
	const navLinks = DOMCache.get('navLinks');
	const hamburger = DOMCache.get('hamburgerIcon');
	const checkbox = DOMCache.get('hamburgerCheckbox');
	const overlay = DOMCache.get('menuOverlay');
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
	const navLinks = DOMCache.get('navLinks');
	const hamburger = DOMCache.get('hamburgerIcon');
	if (navLinks && navLinks.classList.contains('show')) {
		if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
			closeNavMenu();
		}
	}
});
// ============================================
// PRESET FUNCTIONS
// ============================================
function togglePresetMenu() {
	const dropdown = DOMCache.get('presetDropdown');
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
	const dropdown = DOMCache.get('presetDropdown');
	const button = document.querySelector('.preset-hamburger');
	if (event && !dropdown.contains(event.target) && !button.contains(event.target)) {
		dropdown.classList.remove('show');
		document.removeEventListener('click', closePresetMenuOutside);
	}
}
async function createNewPreset() {
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
			onConfirm: function(value) {}
		});
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
				onConfirm: function() {}
			});
			if (overwrite === undefined || overwrite === null) {
				return;
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
	for (const item of RESOURCE_ITEMS) {
		const input = DOMCache.get(`vault_${item.id}`);
		if (input) {
			presetData.vault[item.id] = input.value;
		}
	}
	const page = getCurrentPageCategory();
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
	document.querySelectorAll("select").forEach(select => {
		if (select.id) {
			presetData.selections[select.id] = select.value;
		}
	});
	document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
		if (cb.id) {
			presetData.selections[cb.id] = cb.checked;
		}
	});
	document.querySelectorAll('input[type="number"], input[type="text"]').forEach(inp => {
		if (inp.id && !inp.id.includes('search')) {
			presetData.selections[inp.id] = inp.value;
		}
	});
	if (page === 'hero' && typeof heroFlowerStates !== 'undefined') {
		for (const [safeId, state] of Object.entries(heroFlowerStates)) {
			presetData.heroFlowerStates[safeId] = {
				currentMaxIdx: state.currentMaxIdx !== undefined ? state.currentMaxIdx : -1,
				targetMaxIdx: state.targetMaxIdx !== undefined ? state.targetMaxIdx : -1
			};
		}
	}
	if (page === 'hero' && typeof heroSpecificShards !== 'undefined') {
		for (const [heroName, shards] of Object.entries(heroSpecificShards)) {
			presetData.heroSpecificShards[heroName] = shards;
		}
	}
	if (page === 'widgets' && typeof heroWidgetQuantities !== 'undefined') {
		for (const [heroName, qty] of Object.entries(heroWidgetQuantities)) {
			presetData.heroWidgetQuantities[heroName] = qty;
		}
	}
	const buffInputs = ['globalBuildingBuffPercent', 'globalPansMasterArtifact', 'globalWolfPet', 'globalKingPosition', 'globalSaulsResourceful', 'globalGroundWorksCheckbox', 'globalDoubleTimeCheckbox', 'globalTrainingBuffPercent', 'globalTrainingKingPosition', 'globalTrainingMobilizeCheckbox', 'globalTrainingKvKBonusCheckbox', 'globalResearchBuffPercent', 'globalResearchKingPosition', 'globalResearchFreshIdeasCheckbox', 'globalGatheringBuffPercent', 'globalMarchUnits', 'globalBisonGrip', 'globalBisonResource', 'globalBisonNode', 'heroRouletteCount', 'gatherBread', 'gatherWood', 'gatherStone', 'gatherIron'];
	for (const id of buffInputs) {
		const el = DOMCache.get(id);
		if (el) {
			if (el.type === 'checkbox') {
				presetData.selections[id] = el.checked;
			} else {
				presetData.selections[id] = el.value;
			}
		}
	}
	if (page === 'misc') {
		document.querySelectorAll('.gathering-card').forEach(card => {
			const cardId = card.dataset.cardId;
			const resourceSelect = DOMCache.get(`gather_resource_${cardId}`);
			const nodeSelect = DOMCache.get(`gather_node_${cardId}`);
			const skillSelect = DOMCache.get(`gather_skill_${cardId}`);
			const speedInput = DOMCache.get(`gather_speed_${cardId}`);
			if (resourceSelect) presetData.selections[`gather_resource_${cardId}`] = resourceSelect.value;
			if (nodeSelect) presetData.selections[`gather_node_${cardId}`] = nodeSelect.value;
			if (skillSelect) presetData.selections[`gather_skill_${cardId}`] = skillSelect.value;
			if (speedInput) presetData.selections[`gather_speed_${cardId}`] = speedInput.value;
		});
	}
	allPresets[presetName] = presetData;
	localStorage.setItem("governor_presets", JSON.stringify(allPresets));
	localStorage.setItem("governor_current_preset", presetName);
	currentPreset = presetName;
	updatePresetSelect();
	showNotification(`Preset "${presetName}" saved!`, 'success');
}

function getCurrentPageInfo() {
	const path = window.location.pathname;
	if (path.includes('forgehammer')) return {
		category: 'forgehammer',
		display: 'Forgehammer'
	};
	if (path.includes('hero-gear')) return {
		category: 'herogear',
		display: 'Hero Gear'
	};
	if (path.includes('war-academy')) return {
		category: 'academy',
		display: 'War Academy'
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
	if (path.includes('misc')) return {
		category: 'misc',
		display: 'Misc'
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
			onConfirm: function() {}
		});
		if (value === undefined || value === null) {
			return;
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
	const select = DOMCache.get("presetSelect");
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
			onConfirm: function() {}
		});
		if (value === undefined || value === null) {
			return;
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
window.clearAllSelections = function() {
	const pageInfo = getCurrentPageInfo();
	const category = pageInfo.category;
	const prefix = category + '_';
	document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
		if (input.id && (input.id.includes('preset') || input.id.includes('search'))) {
			return;
		}
		if (input.type === 'hidden' || input.type === 'button' || input.type === 'submit') {
			return;
		}
		input.value = '';
		input.dispatchEvent(new Event('input', {
			bubbles: true
		}));
		if (input.id && input.id.startsWith('vault_')) {
			const resourceId = input.id.replace('vault_', '');
			localStorage.removeItem(`vault_${resourceId}`);
			if (typeof window.updateVaultResource === 'function') {
				window.updateVaultResource(resourceId, '');
			}
		}
	});
	document.querySelectorAll('select').forEach(select => {
		if (select.id && select.id.includes('preset')) {
			return;
		}
		select.selectedIndex = 0;
		select.dispatchEvent(new Event('change', {
			bubbles: true
		}));
	});
	document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
		if (cb.id && cb.id.includes('preset')) {
			return;
		}
		cb.checked = false;
		cb.dispatchEvent(new Event('change', {
			bubbles: true
		}));
	});
	const toRemove = [];
	for (const [key] of lockedUpgrades) {
		if (key.startsWith(prefix) || key.startsWith('promotion_') || key.startsWith('troops_')) {
			toRemove.push(key);
		}
	}
	for (const key of toRemove) {
		lockedUpgrades.delete(key);
	}
	if (category === 'building') {
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
		if (typeof selectedMaxGeneration !== 'undefined') {
			selectedMaxGeneration = 7;
			localStorage.setItem("hero_max_generation", "7");
			const genSelect = DOMCache.get('heroGenerationSelect');
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
		document.querySelectorAll('input[id^="setCurrent_"], input[id^="setTarget_"]').forEach(input => {
			input.value = '';
		});
	}
	if (category === 'misc') {
		const fields = ['heroRouletteCount', 'gatherBread', 'gatherWood', 'gatherStone', 'gatherIron'];
		for (const id of fields) {
			const el = DOMCache.get(id);
			if (el) {
				el.value = '';
			}
		}
		localStorage.removeItem('misc_data');
		if (typeof refreshCalculations === 'function') refreshCalculations();
	}
	if (category === 'vault') {
		RESOURCE_ITEMS.forEach(item => {
			localStorage.removeItem(`vault_${item.id}`);
		});
	}
	const pageKey = getCurrentPageKey();
	if (pageKey) {
		localStorage.setItem(pageKey, '0');
	}
	const scoreDisplay = DOMCache.get('globalScoreDisplay');
	if (scoreDisplay) {
		scoreDisplay.innerText = '0';
	}
	const presetName = currentPreset || localStorage.getItem("governor_current_preset") || "default";
	const presetData = allPresets[presetName];
	if (presetData) {
		if (presetData.selections) {
			const keysToRemove = [];
			const categoryPattern = '_' + category + '_';
			for (const key of Object.keys(presetData.selections)) {
				if (key.includes(categoryPattern) || key.startsWith(category + '_')) {
					keysToRemove.push(key);
				}
			}
			for (const key of keysToRemove) {
				delete presetData.selections[key];
			}
		}
		if (presetData.vault) {
			const vaultKeys = Object.keys(presetData.vault);
			for (const key of vaultKeys) {
				delete presetData.vault[key];
			}
		}
		if (presetData.lockedUpgrades) {
			presetData.lockedUpgrades = presetData.lockedUpgrades.filter(item => {
				return !item.safeId.startsWith(prefix) && !item.safeId.startsWith('promotion_') && !item.safeId.startsWith('troops_');
			});
		}
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
		allPresets[presetName] = presetData;
		localStorage.setItem("governor_presets", JSON.stringify(allPresets));
	}
	if (category === 'troops') {
		if (typeof refreshTroopsCalculations === 'function') {
			refreshTroopsCalculations();
		}
	} else {
		if (typeof refreshCalculations === 'function') {
			refreshCalculations();
		}
	}
	if (typeof updateGlobalTotalScore === 'function') {
		setTimeout(updateGlobalTotalScore, 50);
	}
	window.dispatchEvent(new Event('vaultUpdate'));
	showNotification(`All selections on this page have been reset.`, 'info');
};
window.updateVaultResource = function(id, value) {
	localStorage.setItem(`vault_${id}`, value);
	window.dispatchEvent(new Event('vaultUpdate'));
};
// ============================================
// APPLY PRESET
// ============================================
function applyPresetToCurrentPage(preset) {
	if (!preset) return;
	const pageInfo = getCurrentPageInfo();
	const category = pageInfo.category;
	const selectValues = {};
	if (preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			const element = DOMCache.get(id);
			if (element && element.tagName === "SELECT") {
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
	const checkboxValues = {};
	if (preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			const element = DOMCache.get(id);
			if (element && element.type === "checkbox") {
				checkboxValues[id] = value === true || value === "true";
			}
		}
	}
	const inputValues = {};
	if (preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			const element = DOMCache.get(id);
			if (element && (element.type === "text" || element.type === "number")) {
				inputValues[id] = value !== undefined && value !== null ? value : '';
			}
		}
	}
	const currSelects = [];
	const targSelects = [];
	document.querySelectorAll("select").forEach(select => {
		if (select.id && !select.id.includes("presetSelect")) {
			if (select.id.startsWith('curr_')) {
				currSelects.push(select);
			} else if (select.id.startsWith('targ_')) {
				targSelects.push(select);
			}
		}
	});
	for (const select of targSelects) {
		if (selectValues[select.id] !== undefined) {
			select.value = selectValues[select.id];
		}
	}
	for (const select of currSelects) {
		if (selectValues[select.id] !== undefined) {
			select.value = selectValues[select.id];
		}
	}
	document.querySelectorAll("select").forEach(select => {
		if (select.id && !select.id.includes("presetSelect") && !select.id.startsWith('curr_') && !select.id.startsWith('targ_')) {
			if (selectValues[select.id] !== undefined) {
				select.value = selectValues[select.id];
			}
		}
	});
	for (const [id, checked] of Object.entries(checkboxValues)) {
		const element = DOMCache.get(id);
		if (element) {
			element.checked = checked;
		}
	}
	for (const [id, value] of Object.entries(inputValues)) {
		const element = DOMCache.get(id);
		if (element) {
			element.value = value;
		}
	}
	for (const item of RESOURCE_ITEMS) {
		const input = DOMCache.get(`vault_${item.id}`);
		if (input && preset.vault[item.id] !== undefined) {
			input.value = preset.vault[item.id];
			localStorage.setItem(`vault_${item.id}`, preset.vault[item.id]);
		}
	}
	lockedUpgrades.clear();
	if (preset.lockedUpgrades) {
		for (const item of preset.lockedUpgrades) {
			lockedUpgrades.set(item.safeId, item.data);
		}
	}
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
	const buffInputs = ['globalBuildingBuffPercent', 'globalPansMasterArtifact', 'globalWolfPet', 'globalKingPosition', 'globalSaulsResourceful', 'globalGroundWorksCheckbox', 'globalDoubleTimeCheckbox', 'globalTrainingBuffPercent', 'globalTrainingKingPosition', 'globalTrainingMobilizeCheckbox', 'globalTrainingKvKBonusCheckbox', 'globalResearchBuffPercent', 'globalResearchKingPosition', 'globalResearchFreshIdeasCheckbox', 'globalGatheringBuffPercent', 'globalMarchUnits', 'globalBisonGrip', 'globalBisonResource', 'globalBisonNode', 'heroRouletteCount', 'gatherBread', 'gatherWood', 'gatherStone', 'gatherIron'];
	for (const id of buffInputs) {
		if (preset.selections && preset.selections[id] !== undefined) {
			const el = DOMCache.get(id);
			if (el) {
				if (el.type === 'checkbox') {
					el.checked = preset.selections[id] === true || preset.selections[id] === "true";
				} else {
					el.value = preset.selections[id];
				}
			}
		}
	}
	document.querySelectorAll("select").forEach(select => {
		if (select.id && !select.id.includes("presetSelect") && !select.id.startsWith('curr_') && !select.id.startsWith('targ_')) {
			select.dispatchEvent(new Event('change', {
				bubbles: true
			}));
		}
	});
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
	if (typeof refreshTroopsCalculations === "function") refreshTroopsCalculations();
	if (typeof refreshCalculations === "function") refreshCalculations();
	if (typeof renderBuildingsGrid === "function") renderBuildingsGrid();
	if (typeof renderAcademyGrid === "function") renderAcademyGrid();
	if (typeof updateAllGridRows === "function") updateAllGridRows();
	if (typeof loadCategorySelections === "function") loadCategorySelections();
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

function getImageFileName(resourceId) {
	const imageMap = {
		bread: "Bread.webp",
		wood: "Wood.webp",
		stone: "Stone.webp",
		iron: "Iron.webp",
		gold: "Gold.webp",
		gems: "Gem.webp",
		truegold: "truegold.webp",
		truegold_dust: "truegold_dust.webp",
		tempered_truegold: "tempered_truegold.webp",
		hero_xp: "hero_xp.webp",
		stamina: "stamina.webp",
		master_manuscript: "master_manuscript.webp",
		general_emblem: "general_emblem.webp",
		promotion_medallion: "promotion_medallion.webp",
		nutrient_potion: "nutrient_potion.webp",
		growth_manual: "growth_manual.webp",
		advanced_taming_mark: "advanced_taming_mark.webp",
		common_taming_mark: "common_taming_mark.webp",
		pet_food: "pet_food.webp",
		charm_design: "charm_design.webp",
		charm_guide: "charm_guide.webp",
		artisans_vision: "artisans_vision.webp",
		gilded_threads: "gilded_threads.webp",
		satin: "satin.webp",
		mithril: "mithril.webp",
		forge_hammer: "forge_hammer.webp",
		mythic_general_shard: "mythic_general_shard.webp",
		epic_general_shard: "epic_general_shard.webp",
		rare_general_shard: "rare_general_shard.webp",
		building_speedup: "building_speedup.webp",
		research_speedup: "research_speedup.webp",
		training_speedup: "training_speedup.webp",
		master_speedup: "master_speedup.webp",
		general_speedup: "general_speedup.webp",
		mythic_gear: "mythic-gear.webp",
		hero_roulette_token: "hero_roulette_token.webp",
		bread_node: "bread_node.webp",
		wood_node: "wood_node.webp",
		stone_node: "stone_node.webp",
		iron_node: "iron_node.webp",
		gathering_speed: "gathering_speed.webp",
		grip_of_the_titan: "grip_of_the_titan.webp",
		hero_roulette: "hero_roulette.webp"
	};
	return `assets/${imageMap[resourceId] || resourceId + ".webp"}`;
}

function getCurrentVault() {
	let vault = {};
	for (const item of RESOURCE_ITEMS) {
		const input = DOMCache.get(`vault_${item.id}`);
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
	if (path.includes('misc')) return 'score_misc';
	return null;
}
// ============================================
// PERFORMANCE: Data Loading with Caching
// ============================================
async function fetchWithCache(filename) {
	const cacheKey = `data_${filename}`;
	try {
		const cached = sessionStorage.getItem(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}
	} catch (e) {}
	const response = await fetch(`data/${filename}.json`);
	const data = await response.json();
	try {
		sessionStorage.setItem(cacheKey, JSON.stringify(data));
	} catch (e) {}
	return data;
}
async function loadGameData(filesToLoad = null) {
	if (dataLoadPromise) {
		return dataLoadPromise;
	}
	dataLoadPromise = (async () => {
		if (!filesToLoad) {
			filesToLoad = ["Points"];
		}
		const results = await Promise.allSettled(filesToLoad.map(f => fetchWithCache(f)));
		results.forEach((result, i) => {
			const fileName = filesToLoad[i];
			if (result.status === 'fulfilled') {
				gameDB[fileName] = result.value;
			} else {
				console.error(`Failed to load: ${fileName}.json`, result.reason);
				gameDB[fileName] = {};
			}
		});
		loadPointsFromData();
		return true;
	})();
	return dataLoadPromise;
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
// INPUT VALIDATION
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
	const pageKeys = ['score_buildings', 'score_academy', 'score_forgehammer', 'score_widgets', 'score_heroes', 'score_herogear', 'score_govgear', 'score_govcharm', 'score_pets', 'score_troops', 'score_misc'];
	let total = 0;
	for (const key of pageKeys) {
		total += parseInt(localStorage.getItem(key) || '0');
	}
	globalTotalScore = total;
	const totalDisplay = DOMCache.get('globalTotalScoreDisplay');
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
	const scoreDisplay = DOMCache.get('globalScoreDisplay');
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
	const buildingInput = DOMCache.get("globalBuildingBuffPercent");
	if (buildingInput) {
		globalBuildingBuffPercent = parseFloat(buildingInput.value) || 0;
		localStorage.setItem("globalBuildingBuffPercent", globalBuildingBuffPercent);
	}
	const pansInput = DOMCache.get("globalPansMasterArtifact");
	if (pansInput) {
		globalPansReductionSeconds = parseTimeStringToSeconds(pansInput.value || "0");
		localStorage.setItem("globalPansMasterArtifact", pansInput.value || "0");
	}
	const wolfSelect = DOMCache.get("globalWolfPet");
	if (wolfSelect) {
		globalWolfPetPercent = parseFloat(wolfSelect.value) || 0;
		localStorage.setItem("globalWolfPet", globalWolfPetPercent);
	}
	const kingSelect = DOMCache.get("globalKingPosition");
	if (kingSelect) {
		globalKingPositionPercent = parseFloat(kingSelect.value) || 0;
		localStorage.setItem("globalKingPosition", globalKingPositionPercent);
	}
	const saulsSelect = DOMCache.get("globalSaulsResourceful");
	if (saulsSelect) {
		globalSaulsResourcefulPercent = parseFloat(saulsSelect.value) || 0;
		localStorage.setItem("globalSaulsResourceful", globalSaulsResourcefulPercent);
	}
	const groundWorksCheckbox = DOMCache.get("globalGroundWorksCheckbox");
	if (groundWorksCheckbox) {
		globalGroundWorksActive = groundWorksCheckbox.checked;
		localStorage.setItem("globalGroundWorksActive", globalGroundWorksActive);
	}
	const doubleTimeCheckbox = DOMCache.get("globalDoubleTimeCheckbox");
	if (doubleTimeCheckbox) {
		globalDoubleTimeActive = doubleTimeCheckbox.checked;
		localStorage.setItem("globalDoubleTimeActive", globalDoubleTimeActive);
	}
	const displayElement = DOMCache.get("globalTotalBuffDisplay");
	if (displayElement) {
		const totalPercent = getBuildingTotalBuffPercentage();
		let displayText = `${totalPercent}%`;
		if (globalPansReductionSeconds > 0) {
			displayText += ` + ${formatSecondsToTime(globalPansReductionSeconds)}`;
		}
		displayElement.textContent = displayText;
	}
	const reductionDisplay = DOMCache.get("globalResourceReductionDisplay");
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
	const buildingInput = DOMCache.get("globalBuildingBuffPercent");
	if (buildingInput) buildingInput.value = globalBuildingBuffPercent;
	const pansInput = DOMCache.get("globalPansMasterArtifact");
	if (pansInput) pansInput.value = localStorage.getItem("globalPansMasterArtifact") || "0";
	const wolfSelect = DOMCache.get("globalWolfPet");
	if (wolfSelect) wolfSelect.value = globalWolfPetPercent;
	const kingSelect = DOMCache.get("globalKingPosition");
	if (kingSelect) kingSelect.value = globalKingPositionPercent;
	const saulsSelect = DOMCache.get("globalSaulsResourceful");
	if (saulsSelect) saulsSelect.value = globalSaulsResourcefulPercent;
	const groundWorksCheckbox = DOMCache.get("globalGroundWorksCheckbox");
	if (groundWorksCheckbox) groundWorksCheckbox.checked = globalGroundWorksActive;
	const doubleTimeCheckbox = DOMCache.get("globalDoubleTimeCheckbox");
	if (doubleTimeCheckbox) doubleTimeCheckbox.checked = globalDoubleTimeActive;
	const reductionDisplay = DOMCache.get("globalResourceReductionDisplay");
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
	const researchInput = DOMCache.get("globalResearchBuffPercent");
	if (researchInput) {
		globalResearchBuffPercent = parseFloat(researchInput.value) || 0;
		localStorage.setItem("globalResearchBuffPercent", globalResearchBuffPercent);
	}
	const kingSelect = DOMCache.get("globalResearchKingPosition");
	if (kingSelect) {
		globalResearchKingPositionPercent = parseFloat(kingSelect.value) || 0;
		localStorage.setItem("globalResearchKingPosition", globalResearchKingPositionPercent);
	}
	const freshIdeasCheckbox = DOMCache.get("globalResearchFreshIdeasCheckbox");
	if (freshIdeasCheckbox) {
		globalResearchFreshIdeasActive = freshIdeasCheckbox.checked;
		localStorage.setItem("globalResearchFreshIdeasActive", globalResearchFreshIdeasActive);
	}
	const displayElement = DOMCache.get("globalResearchTotalBuffDisplay");
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
	const researchInput = DOMCache.get("globalResearchBuffPercent");
	if (researchInput) researchInput.value = globalResearchBuffPercent;
	const kingSelect = DOMCache.get("globalResearchKingPosition");
	if (kingSelect) kingSelect.value = globalResearchKingPositionPercent;
	const freshIdeasCheckbox = DOMCache.get("globalResearchFreshIdeasCheckbox");
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
	const trainingInput = DOMCache.get("globalTrainingBuffPercent");
	if (trainingInput) {
		globalTrainingBuffPercent = parseFloat(trainingInput.value) || 0;
		localStorage.setItem("globalTrainingBuffPercent", globalTrainingBuffPercent);
	}
	const kingSelect = DOMCache.get("globalTrainingKingPosition");
	if (kingSelect) {
		globalTrainingKingPositionPercent = parseFloat(kingSelect.value) || 0;
		localStorage.setItem("globalTrainingKingPosition", globalTrainingKingPositionPercent);
	}
	const mobilizeCheckbox = DOMCache.get("globalTrainingMobilizeCheckbox");
	if (mobilizeCheckbox) {
		globalTrainingMobilizeActive = mobilizeCheckbox.checked;
		localStorage.setItem("globalTrainingMobilizeActive", globalTrainingMobilizeActive);
	}
	const kvkBonusCheckbox = DOMCache.get("globalTrainingKvKBonusCheckbox");
	if (kvkBonusCheckbox) {
		globalTrainingKvKBonusActive = kvkBonusCheckbox.checked;
		localStorage.setItem("globalTrainingKvKBonusActive", globalTrainingKvKBonusActive);
	}
	const displayElement = DOMCache.get("globalTrainingTotalBuffDisplay");
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
	const trainingInput = DOMCache.get("globalTrainingBuffPercent");
	if (trainingInput) trainingInput.value = globalTrainingBuffPercent;
	const kingSelect = DOMCache.get("globalTrainingKingPosition");
	if (kingSelect) kingSelect.value = globalTrainingKingPositionPercent;
	const mobilizeCheckbox = DOMCache.get("globalTrainingMobilizeCheckbox");
	if (mobilizeCheckbox) mobilizeCheckbox.checked = globalTrainingMobilizeActive;
	const kvkBonusCheckbox = DOMCache.get("globalTrainingKvKBonusCheckbox");
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
	const header = customHeader || `<div class="item-card-header"><img loading="lazy" decoding="async" src="${imgUrl}" onerror="this.style.display='none';" alt="${name}"><span>${name}</span></div>`;
	const body = customBody || `<div class="level-controls"><select id="${currId}" onchange="${onCurrentChange}('${safeId}')">${currOpts}</select><select id="${targId}" onchange="${onTargetChange}('${safeId}')">${targOpts}</select></div>${extraControls}<div class="checkbox-group">${showCheckbox ? `<label class="checkbox-label"><input class="checkbox" type="checkbox" id="${activeId}" onchange="${onUpgradeChange}('${safeId}', this.checked)"> Upgrade</label>` : ''}${showSpeedup ? `<label class="checkbox-label"><input class="checkbox" type="checkbox" id="${speedId}" onchange="${onSpeedupChange}('${safeId}', this.checked)"> +Speedups</label>` : ''}</div><div id="${statusId}" class="status-pane">Select current & target level</div>`;
	return `<div class="item-card" data-type="${type}" data-name="${name}" data-id="${safeId}">${header}<div class="item-card-body">${body}</div></div>`;
}

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
		const curr = DOMCache.get(`curr_${safeId}`);
		const targ = DOMCache.get(`targ_${safeId}`);
		const status = DOMCache.get(`status_${safeId}`);
		const activeCb = DOMCache.get(`active_${safeId}`);
		const speedCb = DOMCache.get(`speed_${safeId}`);
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
		const toLevels = getTargetLevels(dataArray);
		const highestLevel = toLevels.length ? toLevels[toLevels.length - 1] : null;
		const isAtMax = highestLevel && String(from) === String(highestLevel);
		if (isAtMax) {
			status.className = "status-pane status-ok";
			status.innerHTML = `<strong>MAXED!</strong><br>Already at highest level (${highestLevel})`;
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
		const otherLocked = {};
		for (const [res, amt] of Object.entries(totalLocked)) {
			if (!res.startsWith('_')) {
				otherLocked[res] = amt;
			}
		}
		const costs = calculateCosts(dataArray, from, to, speedCheck, vault, otherLocked);
		if (!costs) {
			status.className = "status-pane status-error";
			status.innerHTML = `Cannot upgrade from ${from} to ${to}`;
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
		const timeHtml = getBuffedTime && costs.totalTimeSeconds ? `<div class="resource-tag">Total Time: ${formatSecondsToTime(getBuffedTime(costs.totalTimeSeconds))}</div>` : '';
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
			status.innerHTML = `<strong>ESTIMATED${stepsInfo}</strong> +${stepPoints.toLocaleString()} pts<br><div class="cost-grid">${costHtml}${timeHtml}${partialHtml}</div><br><span class="text-remaining">Click "Upgrade" to lock</span>`;
		} else {
			status.className = "status-pane status-error";
			status.innerHTML = `<strong>INSUFFICIENT RESOURCES${stepsInfo}</strong><br><div class="cost-grid">${costHtml}${timeHtml}${partialHtml}</div>`;
		}
	}
	const scoreDisplay = DOMCache.get('globalScoreDisplay');
	if (scoreDisplay) {
		scoreDisplay.innerText = totalScore.toLocaleString();
		if (typeof saveCurrentPageScore === 'function') {
			saveCurrentPageScore(totalScore);
		}
	}
}
// ============================================
// SERVICE WORKER
// ============================================
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('sw.js').then(registration => {
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
window.fetchWithCache = fetchWithCache;
window.debouncedRefresh = debouncedRefresh;
window.DOMCache = DOMCache;
window.preloadCriticalAssets = preloadCriticalAssets;
