let gameDB = {};
let lockedUpgrades = new Map();
let currentPreset = "default";
let allPresets = {};
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
}];
const SCORE_RULES = {
	truegold: 2e3,
	truegold_dust: 1e3,
	tempered_truegold: 3e4,
	forge_hammer: 4e3,
	widgets: 8e3,
	mithril: 4e4,
	advanced_taming_mark: 15e3,
	common_taming_mark: 1150,
	general_emblem: 6e3,
	master_manuscript: 60,
	speedup_min: 30,
	roulette: 8e3,
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
	}
};

function toggleNavMenu() {
	const navLinks = document.getElementById('navLinks');
	const hamburger = document.getElementById('hamburgerIcon');
	const checkbox = document.getElementById('hamburgerCheckbox');
	let overlay = document.getElementById('menuOverlay');
	// Create overlay if it doesn't exist
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
		// Open menu
		navLinks.classList.add('show');
		if (hamburger) hamburger.classList.add('active');
		if (checkbox) checkbox.checked = true;
		if (overlay) overlay.classList.add('active');
		document.body.style.overflow = 'hidden';
	} else {
		// Close menu
		navLinks.classList.remove('show');
		if (hamburger) hamburger.classList.remove('active');
		if (checkbox) checkbox.checked = false;
		if (overlay) overlay.classList.remove('active');
		document.body.style.overflow = '';
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
// Close menu when pressing Escape key
document.addEventListener('keydown', function(event) {
	if (event.key === 'Escape') {
		closeNavMenu();
	}
});
// Close menu when clicking outside the nav-links card
document.addEventListener('click', function(event) {
	const navLinks = document.getElementById('navLinks');
	const hamburger = document.getElementById('hamburgerIcon');
	if (navLinks && navLinks.classList.contains('show')) {
		// Check if click is NOT on navLinks and NOT on hamburger
		if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
			closeNavMenu();
		}
	}
});
// Sync checkbox state with menu visibility (in case of race conditions)
window.addEventListener('load', function() {
	const navLinks = document.getElementById('navLinks');
	const checkbox = document.getElementById('hamburgerCheckbox');
	const hamburger = document.getElementById('hamburgerIcon');
	if (navLinks && checkbox && hamburger) {
		if (navLinks.classList.contains('show')) {
			checkbox.checked = true;
			hamburger.classList.add('active');
		} else {
			checkbox.checked = false;
			hamburger.classList.remove('active');
		}
	}
});

function togglePresetMenu() {
	const dropdown = document.getElementById('presetDropdown');
	const isOpen = dropdown.classList.contains('show');
	if (!isOpen) {
		dropdown.classList.add('show');
		// Close when clicking outside
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
	if (!dropdown.contains(event.target) && !button.contains(event.target)) {
		dropdown.classList.remove('show');
		document.removeEventListener('click', closePresetMenuOutside);
	}
}

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
	return Math.ceil(total)
}

function formatSecondsToTime(seconds) {
	if (seconds <= 0) return "0s";
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor(seconds % 86400 / 3600);
	const minutes = Math.floor(seconds % 3600 / 60);
	const secs = seconds % 60;
	let parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (secs > 0) parts.push(`${secs}s`);
	return parts.join(" ")
}

function secondsToSpeedupMinutes(seconds) {
	return Math.max(1, Math.ceil(seconds / 60))
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
	return Math.ceil(total)
}

function parseCost(val) {
	if (!val && val !== 0) return 0;
	if (typeof val === "number") return val;
	let str = val.toString().toUpperCase().trim().replace(/,/g, "");
	if (str.endsWith("B")) return parseFloat(str.replace("B", "")) * 1e9;
	if (str.endsWith("M")) return parseFloat(str.replace("M", "")) * 1e6;
	if (str.endsWith("K")) return parseFloat(str.replace("K", "")) * 1e3;
	return parseFloat(str) || 0
}

function formatNumber(num) {
	if (num >= 1e9) {
		const val = (num / 1e9);
		return val % 1 === 0 ? val.toFixed(0) + "B" : val.toFixed(2) + "B";
	}
	if (num >= 1e6) {
		const val = (num / 1e6);
		return val % 1 === 0 ? val.toFixed(0) + "M" : val.toFixed(2) + "M";
	}
	if (num >= 1e3) {
		const val = (num / 1e3);
		return val % 1 === 0 ? val.toFixed(0) + "K" : val.toFixed(2) + "K";
	}
	return num.toLocaleString()
}

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
		common_taming_mark: "common_taming_mark.png"
	};
	return `assets/${imageMap[resourceId] || resourceId + ".png"}`
}

function getCurrentVault() {
	let vault = {};
	for (const item of RESOURCE_ITEMS) {
		const input = document.getElementById(`vault_${item.id}`);
		const raw = input ? input.value : localStorage.getItem(`vault_${item.id}`) || "";
		vault[item.id] = item.id.includes("speedup") ? parseTimeToMinutesForVault(raw) : parseCost(raw)
	}
	return vault
}

function createNewPreset() {
	let presetName = prompt("Enter preset name:");
	if (!presetName) return;
	if (allPresets[presetName]) {
		if (!confirm(`Preset "${presetName}" already exists. Overwrite?`)) return
	}
	saveCurrentToPreset(presetName)
}

function saveCurrentToPreset(presetName) {
	const existingPreset = allPresets[presetName] || {
		vault: {},
		lockedUpgrades: [],
		selections: {}
	};
	// Start with existing data to preserve data from other pages
	const presetData = {
		vault: {
			...existingPreset.vault
		},
		lockedUpgrades: [...(existingPreset.lockedUpgrades || [])],
		selections: {
			...(existingPreset.selections || {})
		}
	};
	// ============================================
	// PRESERVE HERO FLOWER STATES FROM EXISTING PRESET
	// ============================================
	if (existingPreset.heroFlowerStates) {
		presetData.heroFlowerStates = {
			...existingPreset.heroFlowerStates
		};
	}
	// ============================================
	// PRESERVE HERO SPECIFIC SHARDS FROM EXISTING PRESET
	// ============================================
	if (existingPreset.heroSpecificShards) {
		presetData.heroSpecificShards = {
			...existingPreset.heroSpecificShards
		};
	}
	// ============================================
	// PRESERVE HERO WIDGET QUANTITIES FROM EXISTING PRESET
	// ============================================
	if (existingPreset.heroWidgetQuantities) {
		presetData.heroWidgetQuantities = {
			...existingPreset.heroWidgetQuantities
		};
	}
	// Update vault values (overwrite with current page values)
	for (const item of RESOURCE_ITEMS) {
		const input = document.getElementById(`vault_${item.id}`);
		if (input) {
			presetData.vault[item.id] = input.value;
		}
	}
	// ============================================
	// IMPORTANT: Instead of filtering, we need to UPDATE current page's locked upgrades
	// while KEEPING all other pages' locked upgrades
	// ============================================
	// First, identify which page we're on by checking which container exists
	const isBuildingsPage = !!document.getElementById("buildingsGrid");
	const isAcademyPage = !!document.getElementById("academyGrid");
	const isForgehammerPage = !!document.getElementById("forgehammerGrid");
	const isWidgetsPage = !!document.getElementById("widgetsGrid");
	const isHeroesPage = !!document.getElementById("heroesGrid");
	const isHeroGearPage = !!document.getElementById("heroGearGrid");
	const isGovGearPage = !!document.getElementById("govGearGrid");
	const isGovCharmPage = !!document.getElementById("govCharmGrid");
	const isPetsPage = !!document.getElementById("petsGrid");
	const isTroopsPage = !!document.getElementById("troopsGrid");
	// Get current page's locked upgrades from the global lockedUpgrades Map
	const currentPageLockedUpgrades = [];
	for (const [safeId, lockedData] of lockedUpgrades.entries()) {
		const belongsToCurrentPage = (isBuildingsPage && safeId.startsWith("building_")) || (isAcademyPage && safeId.startsWith("academy_")) || (isForgehammerPage && safeId.startsWith("forgehammer_")) || (isWidgetsPage && safeId.startsWith("widgets_")) || (isHeroesPage && safeId.startsWith("hero_")) || (isHeroGearPage && safeId.startsWith("herogear_")) || (isGovGearPage && safeId.startsWith("govgear_")) || (isGovCharmPage && safeId.startsWith("govcharm_")) || (isPetsPage && safeId.startsWith("pet_")) || (isTroopsPage && (safeId.startsWith("troops_") || safeId.startsWith("promotion_")));
		if (belongsToCurrentPage) {
			currentPageLockedUpgrades.push({
				safeId,
				data: lockedData
			});
		}
	}
	// Remove ALL current page locked upgrades from preset data
	const otherPageLockedUpgrades = presetData.lockedUpgrades.filter(item => {
		const belongsToCurrentPage = (isBuildingsPage && item.safeId.startsWith("building_")) || (isAcademyPage && item.safeId.startsWith("academy_")) || (isForgehammerPage && item.safeId.startsWith("forgehammer_")) || (isWidgetsPage && item.safeId.startsWith("widgets_")) || (isHeroesPage && item.safeId.startsWith("hero_")) || (isHeroGearPage && item.safeId.startsWith("herogear_")) || (isGovGearPage && item.safeId.startsWith("govgear_")) || (isGovCharmPage && item.safeId.startsWith("govcharm_")) || (isPetsPage && item.safeId.startsWith("pet_")) || (isTroopsPage && (item.safeId.startsWith("troops_") || item.safeId.startsWith("promotion_")));
		return !belongsToCurrentPage;
	});
	// Combine: other page upgrades + current page checked upgrades
	presetData.lockedUpgrades = [...otherPageLockedUpgrades, ...currentPageLockedUpgrades];
	// ============================================
	// SAVE ALL USER INTERACTIONS - SELECTS, CHECKBOXES, INPUTS
	// ============================================
	// Save all select dropdowns
	document.querySelectorAll("select").forEach(select => {
		if (select.id) {
			presetData.selections[select.id] = select.value;
		}
	});
	// Save all checkboxes
	document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
		if (cb.id) {
			presetData.selections[cb.id] = cb.checked;
		}
	});
	// Save all number inputs
	document.querySelectorAll('input[type="number"]').forEach(inp => {
		if (inp.id) {
			presetData.selections[inp.id] = inp.value;
		}
	});
	// Save ALL text inputs (including troop quantities, vault inputs, shards, widgets, etc.)
	document.querySelectorAll('input[type="text"]').forEach(inp => {
		if (inp.id) {
			// Skip search/autocomplete fields if any
			if (!inp.id.includes('search') && !inp.id.includes('autocomplete')) {
				presetData.selections[inp.id] = inp.value;
			}
		}
	});
	// Save all number inputs that might be missed
	document.querySelectorAll('input[type="number"]').forEach(inp => {
		if (inp.id) {
			presetData.selections[inp.id] = inp.value;
		}
	});
	// ============================================
	// UPDATE HERO FLOWER STATES (only if on heroes page)
	// ============================================
	if (isHeroesPage && typeof heroFlowerStates !== 'undefined') {
		if (!presetData.heroFlowerStates) {
			presetData.heroFlowerStates = {};
		}
		for (const [safeId, state] of Object.entries(heroFlowerStates)) {
			presetData.heroFlowerStates[safeId] = {
				currentMaxIdx: state.currentMaxIdx !== undefined ? state.currentMaxIdx : -1,
				targetMaxIdx: state.targetMaxIdx !== undefined ? state.targetMaxIdx : -1
			};
		}
	}
	// ============================================
	// UPDATE HERO SPECIFIC SHARDS (only if on heroes page)
	// ============================================
	if (isHeroesPage && typeof heroSpecificShards !== 'undefined') {
		if (!presetData.heroSpecificShards) {
			presetData.heroSpecificShards = {};
		}
		for (const [heroName, shards] of Object.entries(heroSpecificShards)) {
			presetData.heroSpecificShards[heroName] = shards;
		}
	}
	// ============================================
	// UPDATE HERO WIDGET QUANTITIES (only if on widgets page)
	// ============================================
	if (isWidgetsPage && typeof heroWidgetQuantities !== 'undefined') {
		if (!presetData.heroWidgetQuantities) {
			presetData.heroWidgetQuantities = {};
		}
		for (const [heroName, qty] of Object.entries(heroWidgetQuantities)) {
			presetData.heroWidgetQuantities[heroName] = qty;
		}
	}
	// Save buff values
	const buildingBuffInput = document.getElementById("globalBuildingBuffPercent");
	const pansBuffInput = document.getElementById("globalPansMasterArtifact");
	const wolfPetSelect = document.getElementById("globalWolfPet");
	const kingPositionSelect = document.getElementById("globalKingPosition");
	const saulsSelect = document.getElementById("globalSaulsResourceful");
	const groundWorksCheckbox = document.getElementById("globalGroundWorksCheckbox");
	const doubleTimeCheckbox = document.getElementById("globalDoubleTimeCheckbox");
	const trainingBuffInput = document.getElementById("globalTrainingBuffPercent");
	const trainingKingPositionSelect = document.getElementById("globalTrainingKingPosition");
	const trainingMobilizeCheckbox = document.getElementById("globalTrainingMobilizeCheckbox");
	const trainingKvKBonusCheckbox = document.getElementById("globalTrainingKvKBonusCheckbox");
	const researchBuffInput = document.getElementById("globalResearchBuffPercent");
	const researchKingPositionSelect = document.getElementById("globalResearchKingPosition");
	const researchFreshIdeasCheckbox = document.getElementById("globalResearchFreshIdeasCheckbox");
	if (buildingBuffInput) presetData.selections["globalBuildingBuffPercent"] = buildingBuffInput.value;
	if (pansBuffInput) presetData.selections["globalPansMasterArtifact"] = pansBuffInput.value;
	if (wolfPetSelect) presetData.selections["globalWolfPet"] = wolfPetSelect.value;
	if (kingPositionSelect) presetData.selections["globalKingPosition"] = kingPositionSelect.value;
	if (saulsSelect) presetData.selections["globalSaulsResourceful"] = saulsSelect.value;
	if (groundWorksCheckbox) presetData.selections["globalGroundWorksCheckbox"] = groundWorksCheckbox.checked;
	if (doubleTimeCheckbox) presetData.selections["globalDoubleTimeCheckbox"] = doubleTimeCheckbox.checked;
	if (trainingBuffInput) presetData.selections["globalTrainingBuffPercent"] = trainingBuffInput.value;
	if (trainingKingPositionSelect) presetData.selections["globalTrainingKingPosition"] = trainingKingPositionSelect.value;
	if (trainingMobilizeCheckbox) presetData.selections["globalTrainingMobilizeCheckbox"] = trainingMobilizeCheckbox.checked;
	if (trainingKvKBonusCheckbox) presetData.selections["globalTrainingKvKBonusCheckbox"] = trainingKvKBonusCheckbox.checked;
	if (researchBuffInput) presetData.selections["globalResearchBuffPercent"] = researchBuffInput.value;
	if (researchKingPositionSelect) presetData.selections["globalResearchKingPosition"] = researchKingPositionSelect.value;
	if (researchFreshIdeasCheckbox) presetData.selections["globalResearchFreshIdeasCheckbox"] = researchFreshIdeasCheckbox.checked;
	allPresets[presetName] = presetData;
	localStorage.setItem("governor_presets", JSON.stringify(allPresets));
	localStorage.setItem("governor_current_preset", presetName);
	currentPreset = presetName;
	updatePresetSelect();
	alert(`Preset "${presetName}" saved!`);
}

function updatePreset(presetName) {
	if (!presetName || presetName === "default") {
		alert("Cannot update default preset. Create a new preset instead.");
		return
	}
	if (!allPresets[presetName]) {
		alert(`Preset "${presetName}" not found.`);
		return
	}
	saveCurrentToPreset(presetName)
}

function applyPresetToCurrentPage(preset) {
	if (!preset) return;
	// ============================================
	// CRITICAL FIX: RESET ALL DOM INPUTS BEFORE LOADING PRESET
	// This ensures that empty/unset fields drop back to default 
	// instead of retaining the previously active preset's values.
	// ============================================
	document.querySelectorAll("select").forEach(select => {
		// Default select elements to their very first option (usually level 0 or blank)
		if (select.id && !select.id.includes("presetSelect")) {
			select.selectedIndex = 0;
		}
	});
	document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
		if (cb.id) cb.checked = false;
	});
	document.querySelectorAll('input[type="number"], input[type="text"]').forEach(inp => {
		// Do not clear the vault panel if it shouldn't be touched, or let it reset gracefully
		if (inp.id && !inp.id.startsWith("vault_")) {
			inp.value = '';
		}
	});
	// 1. Restore vault values synchronously
	for (const item of RESOURCE_ITEMS) {
		const input = document.getElementById(`vault_${item.id}`);
		if (input && preset.vault[item.id] !== undefined) {
			input.value = preset.vault[item.id];
			localStorage.setItem(`vault_${item.id}`, preset.vault[item.id]);
		}
	}
	// 2. Clear and update global state maps
	lockedUpgrades.clear();
	if (preset.lockedUpgrades) {
		for (const item of preset.lockedUpgrades) {
			lockedUpgrades.set(item.safeId, item.data);
		}
	}
	// 3. Restore Hero Flower States
	if (preset.heroFlowerStates && typeof heroFlowerStates !== 'undefined') {
		for (const [safeId, state] of Object.entries(preset.heroFlowerStates)) {
			if (heroFlowerStates[safeId]) {
				heroFlowerStates[safeId].currentMaxIdx = state.currentMaxIdx !== undefined ? state.currentMaxIdx : -1;
				heroFlowerStates[safeId].targetMaxIdx = state.targetMaxIdx !== undefined ? state.targetMaxIdx : -1;
			}
		}
		// Synchronously update visuals if available
		Object.keys(heroFlowerStates).forEach(id => {
			if (typeof updateHeroFlowerVisuals === 'function') {
				updateHeroFlowerVisuals(id);
			}
		});
	}
	// 4. Restore Hero Shards
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
	}
	// 5. Restore Hero Widgets
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
	}
	// 6. Restore ALL form element values synchronously (Selects, levels, checkboxes)
	if (preset.selections) {
		for (const [id, value] of Object.entries(preset.selections)) {
			const element = document.getElementById(id);
			if (element) {
				if (element.tagName === "SELECT") {
					let valueExists = false;
					for (let i = 0; i < element.options.length; i++) {
						if (String(element.options[i].value) === String(value)) {
							valueExists = true;
							break;
						}
					}
					if (valueExists) {
						element.value = value;
					}
				} else if (element.type === "checkbox") {
					element.checked = value === true || value === "true";
				} else if (element.type === "number" || element.type === "text") {
					element.value = value !== undefined && value !== null ? value : '';
				}
			}
		}
	}
	// 6b. Force trigger change notifications across all page nodes so listeners catch structural data resets
	document.querySelectorAll("select, input").forEach(element => {
		if (element.id && !element.id.includes("presetSelect")) {
			element.dispatchEvent(new Event('change', {
				bubbles: true
			}));
		}
	});
	// 7. IMMEDIATE GLOBAL UI REFRESH (No setTimeout delays)
	if (typeof refreshTroopsCalculations === "function") {
		refreshTroopsCalculations();
	}
	if (typeof refreshCalculations === "function") {
		refreshCalculations();
	}
	// Invoke layout render chains across separate script environments instantly
	if (typeof renderBuildingsGrid === "function") renderBuildingsGrid();
	if (typeof renderAcademyGrid === "function") renderAcademyGrid();
	if (typeof updateAllGridRows === "function") updateAllGridRows();
	if (typeof loadCategorySelections === "function") loadCategorySelections();
	window.dispatchEvent(new Event("presetLoaded"));
}

function loadPreset(presetName) {
	const preset = allPresets[presetName];
	if (!preset) return;
	currentPreset = presetName;
	localStorage.setItem("governor_current_preset", currentPreset);
	// Load the preset values directly onto the current view layout
	applyPresetToCurrentPage(preset);
	updatePresetSelect();
	// Force refresh all system buff calculations instantly
	if (typeof updateBuildingSpeedupBuffs === "function") updateBuildingSpeedupBuffs();
	if (typeof updateResearchSpeedupBuffs === "function") updateResearchSpeedupBuffs();
	if (typeof updateTrainingSpeedupBuffs === "function") updateTrainingSpeedupBuffs();
}

function deletePreset(presetName) {
	if (presetName === "default") {
		alert("Cannot delete default preset");
		return
	}
	if (!allPresets[presetName]) return;
	if (confirm(`Delete preset "${presetName}"?`)) {
		delete allPresets[presetName];
		localStorage.setItem("governor_presets", JSON.stringify(allPresets));
		if (currentPreset === presetName) {
			loadPreset("default")
		}
		updatePresetSelect()
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
		select.appendChild(option)
	}
}

function loadPresetsFromStorage() {
	const saved = localStorage.getItem("governor_presets");
	if (saved) {
		allPresets = JSON.parse(saved)
	} else {
		allPresets = {
			default: {
				vault: {},
				lockedUpgrades: [],
				selections: {}
			}
		};
		localStorage.setItem("governor_presets", JSON.stringify(allPresets))
	}
	currentPreset = localStorage.getItem("governor_current_preset") || "default";
	updatePresetSelect()
}
async function loadGameData() {
	const files = ["Buildings", "Forgehammer", "Gov_Charm", "Gov_Gear", "Hero", "Hero_Gear", "Pet", "Troops", "War_Academy", "Widgets"];
	for (const f of files) {
		try {
			const resp = await fetch(`data/${f}.json`);
			if (!resp.ok) {
				console.error(`Failed to load data/${f}.json: HTTP ${resp.status}`);
				gameDB[f] = {};
			} else {
				gameDB[f] = await resp.json();
			}
		} catch (e) {
			console.error(`Failed to load data/${f}.json:`, e);
			gameDB[f] = {};
		}
	}
}
// ============================================
// BUILDING SPEEDUP BUFF SYSTEM (Buildings Page Only)
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
	return totalSeconds
}

function getBuildingTotalBuffPercentage() {
	let total = globalBuildingBuffPercent + globalWolfPetPercent + globalKingPositionPercent;
	if (globalGroundWorksActive) total += 10;
	if (globalDoubleTimeActive) total += 20;
	return total
}

function getResourceReductionPercentage() {
	return globalSaulsResourcefulPercent;
}

function applyBuildingSpeedupBuffs(originalSeconds) {
	if (originalSeconds <= 0) return 0;
	let remainingSeconds = originalSeconds;
	const totalPercent = getBuildingTotalBuffPercentage();
	if (totalPercent > 0) {
		remainingSeconds = remainingSeconds / (1 + totalPercent / 100)
	}
	if (globalPansReductionSeconds > 0) {
		remainingSeconds = Math.max(0, remainingSeconds - globalPansReductionSeconds)
	}
	return Math.max(1, Math.ceil(remainingSeconds))
}

function updateBuildingSpeedupBuffs() {
	const buildingInput = document.getElementById("globalBuildingBuffPercent");
	if (buildingInput) {
		globalBuildingBuffPercent = parseFloat(buildingInput.value) || 0;
		localStorage.setItem("globalBuildingBuffPercent", globalBuildingBuffPercent)
	}
	const pansInput = document.getElementById("globalPansMasterArtifact");
	if (pansInput) {
		globalPansReductionSeconds = parseTimeStringToSeconds(pansInput.value || "0");
		localStorage.setItem("globalPansMasterArtifact", pansInput.value || "0")
	}
	const wolfSelect = document.getElementById("globalWolfPet");
	if (wolfSelect) {
		globalWolfPetPercent = parseFloat(wolfSelect.value) || 0;
		localStorage.setItem("globalWolfPet", globalWolfPetPercent)
	}
	const kingSelect = document.getElementById("globalKingPosition");
	if (kingSelect) {
		globalKingPositionPercent = parseFloat(kingSelect.value) || 0;
		localStorage.setItem("globalKingPosition", globalKingPositionPercent)
	}
	const saulsSelect = document.getElementById("globalSaulsResourceful");
	if (saulsSelect) {
		globalSaulsResourcefulPercent = parseFloat(saulsSelect.value) || 0;
		localStorage.setItem("globalSaulsResourceful", globalSaulsResourcefulPercent)
	}
	const groundWorksCheckbox = document.getElementById("globalGroundWorksCheckbox");
	if (groundWorksCheckbox) {
		globalGroundWorksActive = groundWorksCheckbox.checked;
		localStorage.setItem("globalGroundWorksActive", globalGroundWorksActive)
	}
	const doubleTimeCheckbox = document.getElementById("globalDoubleTimeCheckbox");
	if (doubleTimeCheckbox) {
		globalDoubleTimeActive = doubleTimeCheckbox.checked;
		localStorage.setItem("globalDoubleTimeActive", globalDoubleTimeActive)
	}
	const displayElement = document.getElementById("globalTotalBuffDisplay");
	if (displayElement) {
		const totalPercent = getBuildingTotalBuffPercentage();
		let displayText = `${totalPercent}%`;
		if (globalPansReductionSeconds > 0) {
			displayText += ` + ${formatSecondsToTime(globalPansReductionSeconds)}`
		}
		displayElement.textContent = displayText
	}
	const reductionDisplay = document.getElementById("globalResourceReductionDisplay");
	if (reductionDisplay) {
		reductionDisplay.textContent = `${globalSaulsResourcefulPercent}%`;
	}
	if (typeof refreshCalculations === "function") refreshCalculations()
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
	updateBuildingSpeedupBuffs()
}
// ============================================
// RESEARCH SPEEDUP BUFF SYSTEM (War Academy Page Only)
// ============================================
let globalResearchBuffPercent = 0;
let globalResearchKingPositionPercent = 0;
let globalResearchFreshIdeasActive = false;

function getResearchTotalBuffPercentage() {
	let total = globalResearchBuffPercent + globalResearchKingPositionPercent;
	if (globalResearchFreshIdeasActive) total += 10;
	return total
}

function applyResearchSpeedupBuffs(originalSeconds) {
	if (originalSeconds <= 0) return 0;
	let remainingSeconds = originalSeconds;
	const totalPercent = getResearchTotalBuffPercentage();
	if (totalPercent > 0) {
		remainingSeconds = remainingSeconds / (1 + totalPercent / 100)
	}
	return Math.max(1, Math.ceil(remainingSeconds))
}

function updateResearchSpeedupBuffs() {
	const researchInput = document.getElementById("globalResearchBuffPercent");
	if (researchInput) {
		globalResearchBuffPercent = parseFloat(researchInput.value) || 0;
		localStorage.setItem("globalResearchBuffPercent", globalResearchBuffPercent)
	}
	const kingSelect = document.getElementById("globalResearchKingPosition");
	if (kingSelect) {
		globalResearchKingPositionPercent = parseFloat(kingSelect.value) || 0;
		localStorage.setItem("globalResearchKingPosition", globalResearchKingPositionPercent)
	}
	const freshIdeasCheckbox = document.getElementById("globalResearchFreshIdeasCheckbox");
	if (freshIdeasCheckbox) {
		globalResearchFreshIdeasActive = freshIdeasCheckbox.checked;
		localStorage.setItem("globalResearchFreshIdeasActive", globalResearchFreshIdeasActive)
	}
	const displayElement = document.getElementById("globalResearchTotalBuffDisplay");
	if (displayElement) {
		const totalPercent = getResearchTotalBuffPercentage();
		displayElement.textContent = `${totalPercent}%`
	}
	if (typeof refreshCalculations === "function") refreshCalculations()
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
	updateResearchSpeedupBuffs()
}
// ============================================
// TRAINING SPEEDUP BUFF SYSTEM (Troops Page Only)
// ============================================
let globalTrainingBuffPercent = 0;
let globalTrainingKingPositionPercent = 0;
let globalTrainingMobilizeActive = false;
let globalTrainingKvKBonusActive = false;

function getTrainingTotalBuffPercentage() {
	let total = globalTrainingBuffPercent + globalTrainingKingPositionPercent;
	if (globalTrainingMobilizeActive) total += 30;
	if (globalTrainingKvKBonusActive) total += 25;
	return total
}

function applyTrainingSpeedupBuffs(originalSeconds) {
	if (originalSeconds <= 0) return 0;
	let remainingSeconds = originalSeconds;
	const totalPercent = getTrainingTotalBuffPercentage();
	if (totalPercent > 0) {
		remainingSeconds = remainingSeconds / (1 + totalPercent / 100)
	}
	return Math.max(1, Math.ceil(remainingSeconds))
}

function updateTrainingSpeedupBuffs() {
	const trainingInput = document.getElementById("globalTrainingBuffPercent");
	if (trainingInput) {
		globalTrainingBuffPercent = parseFloat(trainingInput.value) || 0;
		localStorage.setItem("globalTrainingBuffPercent", globalTrainingBuffPercent)
	}
	const kingSelect = document.getElementById("globalTrainingKingPosition");
	if (kingSelect) {
		globalTrainingKingPositionPercent = parseFloat(kingSelect.value) || 0;
		localStorage.setItem("globalTrainingKingPosition", globalTrainingKingPositionPercent)
	}
	const mobilizeCheckbox = document.getElementById("globalTrainingMobilizeCheckbox");
	if (mobilizeCheckbox) {
		globalTrainingMobilizeActive = mobilizeCheckbox.checked;
		localStorage.setItem("globalTrainingMobilizeActive", globalTrainingMobilizeActive)
	}
	const kvkBonusCheckbox = document.getElementById("globalTrainingKvKBonusCheckbox");
	if (kvkBonusCheckbox) {
		globalTrainingKvKBonusActive = kvkBonusCheckbox.checked;
		localStorage.setItem("globalTrainingKvKBonusActive", globalTrainingKvKBonusActive)
	}
	const displayElement = document.getElementById("globalTrainingTotalBuffDisplay");
	if (displayElement) {
		const totalPercent = getTrainingTotalBuffPercentage();
		let displayText = `${totalPercent}%`;
		displayElement.textContent = displayText
	}
	if (typeof refreshTroopsCalculations === "function") refreshTroopsCalculations()
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
	updateTrainingSpeedupBuffs()
}
// ============================================
// INPUT VALIDATION - Prevent Negative Values
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
	input.addEventListener('blur', function() {
		if (this.type === 'number' || this.type === 'text') {
			sanitizeNumericInput(this, true);
			if (typeof refreshCalculations === 'function') {
				refreshCalculations();
			}
			if (typeof refreshTroopsCalculations === 'function') {
				refreshTroopsCalculations();
			}
		}
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
	document.querySelectorAll('input[type="number"]').forEach(input => {
		attachInputValidation(input);
	});
	document.querySelectorAll('input[type="text"]').forEach(input => {
		const isNumericField = input.id?.startsWith('vault_') || input.id?.includes('qty') || input.id?.includes('quantity') || input.id?.includes('troop') || input.placeholder?.toLowerCase().includes('quantity') || input.placeholder?.toLowerCase().includes('qty') || input.classList.contains('hero-shard-input');
		if (isNumericField) {
			attachInputValidation(input);
		}
	});
}

function initializeInputValidation() {
	attachValidationToAllInputs();
	const observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			mutation.addedNodes.forEach(function(node) {
				if (node.nodeType === 1) {
					if (node.tagName === 'INPUT') {
						attachInputValidation(node);
					}
					node.querySelectorAll('input[type="number"], input[type="text"]').forEach(function(input) {
						attachInputValidation(input);
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
// GLOBAL TOTAL SCORE SYSTEM
// ============================================
let globalTotalScore = 0;
let currentPageScore = 0;

function getCurrentPageKey() {
	const path = window.location.pathname;
	if (path.includes('buildings')) return 'score_buildings';
	if (path.includes('war-academy')) return 'score_academy';
	if (path.includes('forgehammer')) return 'score_forgehammer';
	if (path.includes('widgets')) return 'score_widgets';
	if (path.includes('heroes')) return 'score_heroes';
	if (path.includes('hero-gear')) return 'score_herogear';
	if (path.includes('gov-gear')) return 'score_govgear';
	if (path.includes('gov-charm')) return 'score_govcharm';
	if (path.includes('pets')) return 'score_pets';
	if (path.includes('troops')) return 'score_troops';
	return null;
}

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
// EXPORTS
// ============================================
window.gameDB = gameDB;
window.lockedUpgrades = lockedUpgrades;
window.RESOURCE_ITEMS = RESOURCE_ITEMS;
window.SCORE_RULES = SCORE_RULES;
window.parseTimeToSeconds = parseTimeToSeconds;
window.formatSecondsToTime = formatSecondsToTime;
window.secondsToSpeedupMinutes = secondsToSpeedupMinutes;
window.parseTimeToMinutesForVault = parseTimeToMinutesForVault;
window.parseCost = parseCost;
window.formatNumber = formatNumber;
window.getImageFileName = getImageFileName;
window.getCurrentVault = getCurrentVault;
window.createNewPreset = createNewPreset;
window.updatePreset = updatePreset;
window.saveCurrentToPreset = saveCurrentToPreset;
window.loadPreset = loadPreset;
window.deletePreset = deletePreset;
window.loadPresetsFromStorage = loadPresetsFromStorage;
window.loadGameData = loadGameData;
window.applyPresetToCurrentPage = applyPresetToCurrentPage;
window.parseTimeStringToSeconds = parseTimeStringToSeconds;
// Building speedup exports
window.getBuildingTotalBuffPercentage = getBuildingTotalBuffPercentage;
window.applyBuildingSpeedupBuffs = applyBuildingSpeedupBuffs;
window.updateBuildingSpeedupBuffs = updateBuildingSpeedupBuffs;
window.loadBuildingSpeedupBuffs = loadBuildingSpeedupBuffs;
window.getResourceReductionPercentage = getResourceReductionPercentage;
// Research speedup exports
window.getResearchTotalBuffPercentage = getResearchTotalBuffPercentage;
window.applyResearchSpeedupBuffs = applyResearchSpeedupBuffs;
window.updateResearchSpeedupBuffs = updateResearchSpeedupBuffs;
window.loadResearchSpeedupBuffs = loadResearchSpeedupBuffs;
// Training speedup exports
window.getTrainingTotalBuffPercentage = getTrainingTotalBuffPercentage;
window.applyTrainingSpeedupBuffs = applyTrainingSpeedupBuffs;
window.updateTrainingSpeedupBuffs = updateTrainingSpeedupBuffs;
window.loadTrainingSpeedupBuffs = loadTrainingSpeedupBuffs;
// Input validation exports
window.sanitizeNumericInput = sanitizeNumericInput;
window.attachInputValidation = attachInputValidation;
window.attachValidationToAllInputs = attachValidationToAllInputs;
window.initializeInputValidation = initializeInputValidation;
// Global total score exports
window.globalTotalScore = globalTotalScore;
window.currentPageScore = currentPageScore;
window.updateGlobalTotalScore = updateGlobalTotalScore;
window.recalculateTotalFromStorage = recalculateTotalFromStorage;
window.saveCurrentPageScore = saveCurrentPageScore;
window.getCurrentPageKey = getCurrentPageKey;
