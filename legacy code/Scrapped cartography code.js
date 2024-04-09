
	const patchCartographyDrops = (patchFlag) => {
		patchDropTable("melvorAoD:MagicGolem", "monster", patchFlag, [{ 'id': "melvorD:Runite_Bar", "weight": 10 }], [{ 'id': "melvorF:Mystic_Water_Staff", 'weight': 10, 'minQuantity': 1, 'maxQuantity': 1 }])
		patchDropTable("melvorAoD:AngryTeak", "monster", patchFlag, [{ 'id': "melvorAoD:Unholy_Logs", "weight": 10 }], [{ 'id': "melvorF:Water_Expert_Wizard_Hat", 'weight': 10, 'minQuantity': 1, 'maxQuantity': 1 }])
		patchDropTable("melvorAoD:CrystalProwler", "monster", patchFlag, [{ 'id': "melvorAoD:Crystal_Binding_Dust", "weight": 1 }], [{ 'id': "melvorF:Water_Expert_Wizard_Boots", 'weight': 1, 'minQuantity': 1, 'maxQuantity': 1 }])
		patchDropTable("melvorAoD:CrystalManipulator", "monster", patchFlag, [{ 'id': "melvorAoD:Pure_Crystal_Binding_Dust", "weight": 1 }], [{ 'id': "melvorF:Water_Expert_Wizard_Robes", 'weight': 1, 'minQuantity': 1, 'maxQuantity': 1 }])
		patchDropTable("melvorAoD:Trickery_Chest", "chest", patchFlag, [{ 'id': "melvorAoD:Barrier_Exalted_Shard", 'weight': 5 }], [{ 'id': "melvorF:Water_Expert_Wizard_Bottoms", 'weight': 5, 'minQuantity': 1, 'maxQuantity': 1 }])
		// patchDropTable("melvorAoD:ShipwreckBeast", "monster", patchFlag, [{ 'id': "melvorD:Water_Rune", "weight": 10 }], [{ 'id': "melvorF:Water_Expert_Wizard_Robes", 'weight': 10, 'minQuantity': 1, 'maxQuantity': 1 }])
	}

		// ## Cartography Patch

		const coCartographyPatch = (patchFlag) => {
			// patchSkill(patchFlag, 'melvorAoD:Cartography', 'Combat', 'Non-Combat')
			patchSkill(patchFlag, 'melvorAoD:Cartography', 'Non-Combat')
			// updateCartographyKCs(patchFlag)
			patchCartographyDrops(patchFlag)
			// checkMonsterKCs(patchFlag)
		}
	
		const levelUpHex = (hex, newLevel) => {
			// const xpToAdd = Cartography.SURVEY_XP_PER_LEVEL[hex._surveyLevel + 1] - hex._surveyXP
			const xpToAdd = Cartography.SURVEY_XP_PER_LEVEL[newLevel] - hex._surveyXP
			for (var i = 0; i < xpToAdd; i++)
				game.cartography.surveyHex(hex)
		}
	
	
		function setMonsterKillCountText(monsterID, hexes) {
			var eleName = `monster-area-img-${monsterID}`;
			var kcElementName = eleName + '-cartograph-kc';
			var kcElement = document.getElementById(kcElementName);
	
			if (!kcElement) { // Element doesn't exist, create it
				var parentNode = document.getElementById(`monster-area-img-${monsterID}`).parentNode.parentNode.childNodes[3]
				var textDiv = document.createElement('div');
				textDiv.className = 'font-size-sm';
				textDiv.id = eleName + '-cartograph-kc';
				textDiv.innerHTML = '<small>Hexes unlocked: ' + hexes + '</small>';
				parentNode.appendChild(textDiv);
			} else { // Element exists, update its innderHTML
				kcElement.innerHTML = '<small>Hexes unlocked: ' + hexes + '</small>';
			}
		}
	
		const grantCartographyXPFromMonsters = (monster) => {
			var storedMonsterList = ctx.characterStorage.getItem("surveyedMonsters") // An array of the format [monsterID, hexesUnlocked, maxHexesUnlocked]. Stored as array to save space
			const monsterIndex = storedMonsterList.findIndex(([id, hexesUnlocked, maxHexesUnlocked]) => monster.id === id)
			var storedMonster = storedMonsterList[monsterIndex]
			// storedMonsterList[storedMonsterList.indexOf(monster.id)]
			if (monsterIndex === -1) // Monster does not grant cartography xp (e.g. The Herald)
				return
			if (storedMonster[2]) // Checks if the maximum number of hexes have already been granted
				return
	
			const cartographyKCThresholds = [[100, 1], [200, 2], [300, 3], [400, 4], [500, 5], [600, 6]] // Format of pair: [threshold, hexesUnlocked]
			// const cartographyKCThresholds = [[200, 5]]
			var hexCount = 0
			cartographyKCThresholds.forEach(([threshold, newHexesUnlocked]) => {
				if (game.stats.monsterKillCount(monster) >= threshold)
					hexCount = newHexesUnlocked
			})
	
			var unlockedHexes = Math.max(0, hexCount - storedMonster[1])
	
			var currentHex = game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").hexes.get(15).get(10) // Centre of the Map
			game.cartography.autoSurveyHex = currentHex
			if (currentHex.isMaxLevel)
				currentHex = game.cartography.getNextAutoSurveyHex(currentHex)
	
			for (var i = 0; i < unlockedHexes; i++) {
				if (currentHex === undefined) continue // All hexes surveyed
				levelUpHex(currentHex, 5)
				if (game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").undiscoveredPOIs.includes(currentHex.hasPOI))
					game.cartography.discoverPOI(currentHex.pointOfInterest)
				currentHex = game.cartography.getNextAutoSurveyHex(currentHex)
				game.cartography.autoSurveyHex = currentHex
			}
	
			// storedMonsterList[monster]["hexesUnlocked"] = hexCount
			// storedMonsterList[monster]["maxHexesUnlocked"] = hexCount === cartographyKCThresholds.at(-1)[1] // Check if the total number of hexes unlocked is at the max
	
			storedMonster = [monster.id, hexCount, hexCount === cartographyKCThresholds.at(-1)[1]]
			storedMonsterList.splice(monsterIndex, 1, storedMonster)
			ctx.characterStorage.setItem("surveyedMonsters", storedMonsterList)
			setMonsterKillCountText(monster.id, hexCount)
			game.cartography.autoSurveyHex = undefined
		}
	
		// const updateCartographyKCs = (patchFlag) => {
		// 	if (!patchFlag)
		// 		return
	
		// 	// var cartographyKCThresholds = (monster) => { // Old version with custom level thresholds 
		// 	// 	// 				if (game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Umbora")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Rokken")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Kutul")) >= 10000)
		// 	// 	// [...game.combatAreas.allObjects.map(area => area.monsters), ...game.slayerAreas.allObjects.map(area => area.monsters), ...game.dungeons.allObjects].flat().map(monster => cartographyKCThresholds(monster))
		// 	// 	//		const combatTiers = ["Easy", "Medium", "Hard", "Elite", "Master", "Legendary", "Mythical"]
		// 	// 	// combatTiers.forEach(x => console.log(x, monsters.filter(y => y.combatTier == x)))
		// 	// 	// const kcTiers = [0, 1, 2, 3, 4]
		// 	// 	// kcTiers.forEach(x => console.log(x, monsters.filter(y => y.kcTier == x)))
		// 	// 	// cartXPToGive.forEach(([x, y]) => game.cartography.getNextAutoSurveyHexes(game.cartography.worldMaps.allObjects[0].hexes.get(15).get(10), y.length).forEach(z => levelUpHex(z, x) ))
	
		// 	// 	const combatLevelThresholds = [
		// 	// 		{ levelMin: 0, levelMax: 49, tier: "Easy", kcThresholds: [25, 50, 100, 200, 500] },
		// 	// 		{ levelMin: 50, levelMax: 99, tier: "Medium", kcThresholds: [50, 100, 150, 250, 600] },
		// 	// 		{ levelMin: 100, levelMax: 199, tier: "Hard", kcThresholds: [100, 150, 200, 300, 700] },
		// 	// 		{ levelMin: 200, levelMax: 374, tier: "Elite", kcThresholds: [125, 200, 350, 500, 800] },
		// 	// 		{ levelMin: 375, levelMax: 789, tier: "Master", kcThresholds: [150, 400, 500, 600, 1000] },
		// 	// 		{ levelMin: 790, levelMax: 999, tier: "Legendary", kcThresholds: [200, 450, 650, 850, 1250] },
		// 	// 		{ levelMin: 1000, levelMax: 10000000, tier: "Mythical", kcThresholds: [250, 500, 750, 1000, 1500] },
		// 	// 	]
	
		// 	// 	// const cartHexUnlocks = { "Easy": 3, "Medium": 4, "Hard": 5, "Elite": 6, "Master": 7, "Legendary": 8, "Mythical": 9 } // These are how many hexes each tier unlocks
	
		// 	// 	if (monster instanceof Dungeon)
		// 	// 		monster = monster.monsters.filter(x => x.isBoss)[0] // Grab only the boss of the dungeon
	
		// 	// 	const currentMonsterTier = combatLevelThresholds.filter(x => monster.combatLevel >= x.levelMin && monster.combatLevel <= x.levelMax)[0]
	
		// 	// 	var kcFlag = 0
		// 	// 	currentMonsterTier.kcThresholds.forEach((x, i) => { if (game.stats.monsterKillCount(monster) >= x) kcFlag = i + 1 })
	
		// 	// 	return { id: monster.id, combatTier: currentMonsterTier.tier, kcTier: kcFlag }
		// 	// 	// , unlockedHexes: cartHexUnlocks[currentMonsterTier.tier] }
		// 	// }
		// 	var cartographyKCThresholds = (monster) => {
		// 		// 				if (game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Umbora")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Rokken")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Kutul")) >= 10000)
		// 		// [...game.combatAreas.allObjects.map(area => area.monsters), ...game.slayerAreas.allObjects.map(area => area.monsters), ...game.dungeons.allObjects].flat().map(monster => cartographyKCThresholds(monster))
		// 		//		const combatTiers = ["Easy", "Medium", "Hard", "Elite", "Master", "Legendary", "Mythical"]
		// 		// combatTiers.forEach(x => console.log(x, monsters.filter(y => y.combatTier == x)))
		// 		// const kcTiers = [0, 1, 2, 3, 4]
		// 		// kcTiers.forEach(x => console.log(x, monsters.filter(y => y.kcTier == x)))
		// 		// cartXPToGive.forEach(([x, y]) => game.cartography.getNextAutoSurveyHexes(game.cartography.worldMaps.allObjects[0].hexes.get(15).get(10), y.length).forEach(z => levelUpHex(z, x) ))
	
		// 		const kcThreshold = 200
		// 		const combatLevelThresholds = [
		// 			{ levelMin: 0, levelMax: 49, tier: "Easy", kcThresholds: [kcThreshold] },
		// 			{ levelMin: 50, levelMax: 99, tier: "Medium", kcThresholds: [kcThreshold] },
		// 			{ levelMin: 100, levelMax: 199, tier: "Hard", kcThresholds: [kcThreshold] },
		// 			{ levelMin: 200, levelMax: 374, tier: "Elite", kcThresholds: [kcThreshold] },
		// 			{ levelMin: 375, levelMax: 789, tier: "Master", kcThresholds: [kcThreshold] },
		// 			{ levelMin: 790, levelMax: 999, tier: "Legendary", kcThresholds: [kcThreshold] },
		// 			{ levelMin: 1000, levelMax: 10000000, tier: "Mythical", kcThresholds: [kcThreshold] },
		// 		]
	
		// 		// const cartHexUnlocks = { "Easy": 3, "Medium": 4, "Hard": 5, "Elite": 6, "Master": 7, "Legendary": 8, "Mythical": 9 } // These are how many hexes each tier unlocks
	
		// 		const bannedMonsters = ["melvorF:Ahrenia", "melvorTotH:TheHeraldPhase1", "melvorTotH:TheHeraldPhase2", "melvorTotH:TheHeraldPhase3"]
		// 		var monsterListLength = [...game.combatAreas.allObjects.map(area => area.monsters), ...game.slayerAreas.allObjects.map(area => area.monsters), ...game.dungeons.allObjects.map(x => x.monsters.filter(x => x.isBoss && !bannedMonsters.includes(x.id)))].flat().length
		// 		const cartHexUnlocks = Math.ceil(game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").numberOfHexes / monsterListLength)  // These are how many hexes each tier unlocks. Set to be such that the total number of available monsters is unlocks slightly more than the full map
	
		// 		if (monster instanceof Dungeon)
		// 			monster = monster.monsters.filter(x => x.isBoss)[0] // Grab only the boss of the dungeon
	
		// 		const currentMonsterTier = combatLevelThresholds.filter(x => monster.combatLevel >= x.levelMin && monster.combatLevel <= x.levelMax)[0]
	
		// 		var kcFlag = 0
		// 		currentMonsterTier.kcThresholds.forEach((x, i) => { if (game.stats.monsterKillCount(monster) >= x) kcFlag = i + 1 })
	
		// 		// return { id: monster.id, combatTier: currentMonsterTier.tier, kcTier: kcFlag, unlockedHexes: cartHexUnlocks[currentMonsterTier.tier] }
		// 		return { id: monster.id, combatTier: currentMonsterTier.tier, kcTier: kcFlag, unlockedHexes: kcFlag === 0 ? 0 : cartHexUnlocks }
		// 	}
		// 	if (ctx.characterStorage.getItem("surveyedMonsters") === undefined) {
		// 		const bannedMonsters = ["melvorF:Ahrenia", "melvorTotH:TheHeraldPhase1", "melvorTotH:TheHeraldPhase2", "melvorTotH:TheHeraldPhase3"]
		// 		var monsterList = [...game.combatAreas.allObjects.map(area => area.monsters), ...game.slayerAreas.allObjects.map(area => area.monsters), ...game.dungeons.allObjects.map(x => x.monsters.filter(x => x.isBoss && !bannedMonsters.includes(x.id)))].flat()
		// 		ctx.characterStorage.setItem("surveyedMonsters", monsterList)
		// 	}
	
		// 	var monsterList = [...game.combatAreas.allObjects.map(area => area.monsters), ...game.slayerAreas.allObjects.map(area => area.monsters), ...game.dungeons.allObjects].flat().map(monster => cartographyKCThresholds(monster))
	
		// 	// const surveyedMonsters = ctx.characterStorage.getItem("surveyedMonsters")
		// 	// monsterList.forEach(monster => {
		// 	// 	if (surveyedMonsters[monster.id] === "undefined")
		// 	// 		surveyedMonsters[monster.id] = monster
		// 	// 	if (monster.kcTier <= surveyedMonsters[monster.id]?.kcTier)
		// 	// 		monster.kcTier = 0 // Give no exp if monster is already surveyed fully
		// 	// })
		// 	// ctx.characterStorage.setItem("surveyedMonsters", surveyedMonsters)
	
		// 	// const combatTiers = ["Easy", "Medium", "Hard", "Elite", "Master", "Legendary", "Mythical"]
		// 	// const kcTiers = [0, 1, 2, 3, 4]
		// 	// const kcTiers = [0, 1]
		// 	const surveyedMonsters = monsterList.filter(monster => monster.kcTier === 1)
		// 	var currentHex = game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").hexes.get(15).get(10) // Centre of the map
		// 	// const tierPartitionedMonsterList = kcTiers.map(tier => ([tier, monsterList.filter(monster => monster.kcTier == tier)]))[1] // Partition monsters
	
		// 	surveyedMonsters.forEach(monster => {
		// 		// var hexesToUnlock = 0
		// 		for (var i = 0; i < monster.unlockedHexes; i++) {
		// 			if (currentHex === undefined) continue // All hexes surveyed
		// 			levelUpHex(currentHex, 5)
		// 			if (game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").undiscoveredPOIs.includes(currentHex.hasPOI))
		// 				game.cartography.discoverPOI(currentHex.pointOfInterest)
		// 			// hexesToUnlock += monster.unlockedHexes
		// 			currentHex = game.cartography.getNextAutoSurveyHex(currentHex)
		// 		}
		// 		// game.cartography.getNextAutoSurveyHexes(game.cartography.worldMaps.allObjects[0].hexes.get(15).get(10), hexesToUnlock).forEach(surveyHex => levelUpHex(surveyHex, tier))
		// 	})
		// }

		{
			type: 'switch',
			name: `${buttonNames.summoning}-button`,
			label: 'Enable Summoning & Cartography: Summoning tablets added to drop tables; Cartography map gradually unlocked through combat.',
			hint: `Tablets are primarily found in the Strange Cave and in the shop, as well as some other drop tables too. Check CO patch notes at the top of the sidebar for details. The Cartography map is unlocked as the player's kill count at various monsters increases; the required KC for each monster depends on its combat level category and is listed on the monster directly.`,
			default: false,
			onChange: (value) => { ctx.characterStorage.setItem(buttonNames.summoning, value); coSummoningPatch(value); coCartographyPatch(value); }
		},

		ctx.patch(Cartography, "hasMinibar").get((o) => {
			if (!summoningButtonValue())
				return o()
			else
				return false
		})
		ctx.patch(Cartography, "isCombat").get((o) => {
			if (!summoningButtonValue())
				return o()
			else
				return true
		})

		const patchCartography = () => {
			// Ancient stone tablet => Monuments  => (6, 8) / [6, 11]
			// Old Route Chart => Glacia City Ruins => (17, 17) / [17, 25]
			// Torn Scrolls => Lost Temple => (23, -3) / [23, 8] / Discovery requirement: Find Old Temple Chart (ritual site)
			// Lost Cursed Text => Ritual Site => (2, 1) / [2, 2]
			// Misty jewel => Shipwreck Cove => (9, -1) / [9, 3] / Discovery requirement: Find Ancient Wall Chart (Cathedral)
			// Old Temple Chart => Ritual Site => 
			// Ancient Wall Chart => Cathedral => 
			// Example POI reward: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(10).get(22)
			// Outdated example grid manipulation: var hexGrid = [...game.cartography.worldMaps.allObjects[0].hexes].forEach(([position, map]) => [...map].forEach(([position2, hex]) => { if (hex.hasSurveyedNeighbour) console.log([hex.q, hex.r], [hex.to_oddq().oddq_to_axial().q, hex.to_oddq().oddq_to_axial().r], hex.hasSurveyedNeighbour) }))
			//game.cartography.getNextAutoSurveyHexes(game.cartography.worldMaps.allObjects[0].hexes.get(15).get(10), 5) 
			//(15,9) / [15, 16] is centre of map

			// var poiRewards = [
			// 	{ poiID: "melvorAoD:Monuments", rewardID: "melvorAoD:Ancient_Stone_Tablet" },
			// 	{ poiID: "melvorAoD:RuinedCity", rewardID: "melvorAoD:Old_Route_Chart" },
			// 	{ poiID: "melvorAoD:RitualSite", rewardID: "melvorAoD:Torn_Scrolls" },
			// 	{ poiID: "melvorAoD:LostTemple", rewardID: "melvorAoD:Lost_Cursed_Text," },
			// 	{ poiID: "melvorAoD:ShipwreckCove", rewardID: "melvorAoD:Misty_Jewel" },
			// 	{ poiID: "melvorAoD:Cathedral", rewardID: "melvorAoD:Ancient_Wall_Chart" },
			// 	{ poiID: "melvorAoD:Bazaar", rewardID: "melvorAoD:Ancient_Silk" }
			// ]

			// var additionalRewards = [
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(2).get(1), rewardID: "melvorAoD:Old_Temple_Map" },
			// 	// { hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(15).get(4), rewardID: "melvorAoD:Ancient_Silk" }
			// ]
			// var additionalRewards = [
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(2).get(1), rewardID: "melvorAoD:Old_Temple_Map" },
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(16).get(5), rewardID: "melvorAoD:Melantis_Clue_1" },
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(9).get(7), rewardID: "melvorAoD:Melantis_Clue_2" },
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(1).get(15), rewardID: "melvorAoD:Melantis_Clue_3" },
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(2).get(27), rewardID: "melvorAoD:Melantis_Clue_4" }
			// ]


			// var pois = ["melvorAoD:Monuments", "melvorAoD:RuinedCity", "melvorAoD:RitualSite", "melvorAoD:LostTemple", "melvorAoD:ShipwreckCove", "melvorAoD:Cathedral", "melvorAoD:Bazaar", "melvorAoD:Mines", "melvorAoD:AncientMarket", "melvorAoD:OldVillage"]
			// var rewards = ["melvorAoD:Ancient_Stone_Tablet", "melvorAoD:Old_Route_Chart", "melvorAoD:Torn_Scrolls", "melvorAoD:Lost_Cursed_Text", "melvorAoD:Misty_Jewel", "melvorAoD:Ancient_Wall_Chart", "melvorAoD:Ancient_Silk", "melvorAoD:Mining_Lantern", "melvorAoD:City_Map", "melvorAoD:Torn_Map"]
			// if (ctx.characterStorage.getItem("surveyedMonsters") === undefined)
			// 	ctx.characterStorage.setItem("surveyedMonsters", {})
			if (ctx.characterStorage.getItem("surveyedMonsters") === undefined) {
				// const bannedMonsters = ["melvorF:Ahrenia", "melvorTotH:TheHeraldPhase1", "melvorTotH:TheHeraldPhase2", "melvorTotH:TheHeraldPhase3"]
				// var monsterList = [...game.combatAreas.allObjects.map(area => area.monsters), ...game.slayerAreas.allObjects.map(area => area.monsters), ...game.dungeons.allObjects.map(x => x.monsters.filter(x => x.isBoss && !bannedMonsters.includes(x.id)))].flat().map(monster => ([monster.id, 0, false])) // Format is: [id, hexesUnlocked] // Not gonna bother with dungeons
				var monsterList = [...game.combatAreas.allObjects.map(area => area.monsters), ...game.slayerAreas.allObjects.map(area => area.monsters)].flat().map(monster => ([monster.id, 0, false])) // Format is: [id, hexesUnlocked]

				// ({ id: monster.id, hexesUnlocked: 0, maxHexesUnlocked: false })) // Again, storing objects is ruining me
				// .reduce((acc, value) => ({ ...acc, [value]: { hexesUnlocked: 0, maxHexesUnlocked: false } }), {}) // Lol storing as an object is too big, so gotta use array
				ctx.characterStorage.setItem("surveyedMonsters", monsterList)
			}
			ctx.characterStorage.getItem("surveyedMonsters").forEach(([monsterID, hexesUnlocked, _]) => setMonsterKillCountText(monsterID, hexesUnlocked))

			var pois = [
				"melvorAoD:Monuments", "melvorAoD:RuinedCity", "melvorAoD:LostTemple", "melvorAoD:RitualSite", "melvorAoD:ShipwreckCove", "melvorAoD:Cathedral",
				"melvorAoD:Bazaar", "melvorAoD:Mines", "melvorAoD:AncientMarket", "melvorAoD:OldVillage"
			]
			var rewards = [
				"melvorAoD:Ancient_Stone_Tablet", "melvorAoD:Old_Route_Chart", "melvorAoD:Torn_Scrolls", "melvorAoD:Lost_Cursed_Text", "melvorAoD:Misty_Jewel", "melvorAoD:Ancient_Wall_Chart",
				"melvorAoD:Ancient_Silk", "melvorAoD:Mining_Lantern", "melvorAoD:City_Map", "melvorAoD:Torn_Map"
			]
			// The above two variables are linked by relative order. I know it's a bad way to do this but sue me

			var archPois = [...archaeologyMenus.digSites].filter(x => pois.includes(x[0].id)).map(x => [x[0], x[0].poi]).map(([x, y]) => [x, y, y.id])
			var archHexes = archPois.map(([archDigsite, digsitePoi, id]) => ({ hex: digsitePoi.hex, q: digsitePoi.hex.q, r: digsitePoi.hex.r }))
			var poiHexRewards = pois.map((x, i) => ({
				poiID: x,
				rewardID: rewards[i],
				hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(archHexes[i].q).get(archHexes[i].r), poi: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(archHexes[i].q).get(archHexes[i].r).pointOfInterest,
				offsetHexCoords: [archHexes[i].hex.to_oddq().col, archHexes[i].hex.to_oddq().row]
			}))

			poiHexRewards.forEach(x => x.poi.discoveryRewards = { items: [{ item: game.items.getObjectByID(x.rewardID), quantity: 1 }] })
			game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(archHexes[2].q).get(archHexes[2].r).pointOfInterest.discoveryRewards.items.push({ item: game.items.getObjectByID("melvorAoD:Old_Temple_Map"), quantity: 1 }) // Add this one in additionally because this POI has two rewards
			// additionalRewards.forEach(hexPair => hexPair.hex.pointOfInterest.discoveryRewards.items.push({ item: game.items.getObjectByID(hexPair.rewardID), quantity: 1 }))

			// game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(archHexes[2].q).get(archHexes[2].r).pointOfInterest.discoveryRewards.items.push({ item: game.items.getObjectByID("melvorAoD:Old_Temple_Map"), quantity: 1 }) // Add this one in additionally because this POI has two rewards


			ctx.patch(Cartography, "goToWorldMapOnClick").replace(function (o, poi) {
				if (!coGamemodeCheck())
					return o(poi)
				return __awaiter(this, void 0, void 0, function* () {
					if (this.game.isGolbinRaid)
						return;
					if (this.isActive && (this.actionMode === 2 || this.actionMode === 1) && !this.stop())
						return;
					cartographyMap.showLoading();
					this.activeMap = poi.destination.map;
					this.activeMap.setPlayerPosition(poi.destination);
					this.renderQueue.hexOverview = true;
					this.renderQueue.masteryButton = true;
					const destPOI = poi.destination.pointOfInterest;
					if (destPOI !== undefined && (destPOI.hidden === undefined || this.isHiddenPOIMet(destPOI.hidden))) // This section is changed, want to prevent players getting bricked by allowing repeat unlocks
						if (!destPOI.isDiscovered)
							this.discoverPOI(destPOI);
						else
							checkRewards(destPOI)

					this.updateHiddenPOIDiscoveryHandler();
					yield Promise.all([cartographyMap.loadWorldMap(this.activeMap, this), delayPromise(1000)]);
					cartographyMap.hideLoading();
				});
			})

			const checkRewards = function (poi) {
				if (poi.discoveryRewards === undefined)
					return
				const repeatableRewards = ["melvorAoD:Ancient_Stone_Tablet", "melvorAoD:Old_Route_Chart", "melvorAoD:Torn_Scrolls", "melvorAoD:Lost_Cursed_Text", "melvorAoD:Misty_Jewel", "melvorAoD:Ancient_Wall_Chart", "melvorAoD:Ancient_Silk", "melvorAoD:Old_Temple_Map", "melvorAoD:Mining_Lantern"]

				poi.discoveryRewards.items.forEach(reward => {
					if (repeatableRewards.includes(reward.item.id) && !game.bank.hasItem(reward.item)) {
						const rewards = new Rewards(this.game);
						rewards.addItemsAndCurrency(reward);
						rewards.giveRewards(true);
					}
				})
			}

			
		patchCartography()

		
		const patchCartography = () => {
			// Ancient stone tablet => Monuments  => (6, 8) / [6, 11]
			// Old Route Chart => Glacia City Ruins => (17, 17) / [17, 25]
			// Torn Scrolls => Lost Temple => (23, -3) / [23, 8] / Discovery requirement: Find Old Temple Chart (ritual site)
			// Lost Cursed Text => Ritual Site => (2, 1) / [2, 2]
			// Misty jewel => Shipwreck Cove => (9, -1) / [9, 3] / Discovery requirement: Find Ancient Wall Chart (Cathedral)
			// Old Temple Chart => Ritual Site => 
			// Ancient Wall Chart => Cathedral => 
			// Example POI reward: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(10).get(22)
			// Outdated example grid manipulation: var hexGrid = [...game.cartography.worldMaps.allObjects[0].hexes].forEach(([position, map]) => [...map].forEach(([position2, hex]) => { if (hex.hasSurveyedNeighbour) console.log([hex.q, hex.r], [hex.to_oddq().oddq_to_axial().q, hex.to_oddq().oddq_to_axial().r], hex.hasSurveyedNeighbour) }))
			//game.cartography.getNextAutoSurveyHexes(game.cartography.worldMaps.allObjects[0].hexes.get(15).get(10), 5) 
			//(15,9) / [15, 16] is centre of map

			// var poiRewards = [
			// 	{ poiID: "melvorAoD:Monuments", rewardID: "melvorAoD:Ancient_Stone_Tablet" },
			// 	{ poiID: "melvorAoD:RuinedCity", rewardID: "melvorAoD:Old_Route_Chart" },
			// 	{ poiID: "melvorAoD:RitualSite", rewardID: "melvorAoD:Torn_Scrolls" },
			// 	{ poiID: "melvorAoD:LostTemple", rewardID: "melvorAoD:Lost_Cursed_Text," },
			// 	{ poiID: "melvorAoD:ShipwreckCove", rewardID: "melvorAoD:Misty_Jewel" },
			// 	{ poiID: "melvorAoD:Cathedral", rewardID: "melvorAoD:Ancient_Wall_Chart" },
			// 	{ poiID: "melvorAoD:Bazaar", rewardID: "melvorAoD:Ancient_Silk" }
			// ]

			// var additionalRewards = [
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(2).get(1), rewardID: "melvorAoD:Old_Temple_Map" },
			// 	// { hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(15).get(4), rewardID: "melvorAoD:Ancient_Silk" }
			// ]
			// var additionalRewards = [
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(2).get(1), rewardID: "melvorAoD:Old_Temple_Map" },
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(16).get(5), rewardID: "melvorAoD:Melantis_Clue_1" },
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(9).get(7), rewardID: "melvorAoD:Melantis_Clue_2" },
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(1).get(15), rewardID: "melvorAoD:Melantis_Clue_3" },
			// 	{ hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(2).get(27), rewardID: "melvorAoD:Melantis_Clue_4" }
			// ]


			// var pois = ["melvorAoD:Monuments", "melvorAoD:RuinedCity", "melvorAoD:RitualSite", "melvorAoD:LostTemple", "melvorAoD:ShipwreckCove", "melvorAoD:Cathedral", "melvorAoD:Bazaar", "melvorAoD:Mines", "melvorAoD:AncientMarket", "melvorAoD:OldVillage"]
			// var rewards = ["melvorAoD:Ancient_Stone_Tablet", "melvorAoD:Old_Route_Chart", "melvorAoD:Torn_Scrolls", "melvorAoD:Lost_Cursed_Text", "melvorAoD:Misty_Jewel", "melvorAoD:Ancient_Wall_Chart", "melvorAoD:Ancient_Silk", "melvorAoD:Mining_Lantern", "melvorAoD:City_Map", "melvorAoD:Torn_Map"]
			// if (ctx.characterStorage.getItem("surveyedMonsters") === undefined)
			// 	ctx.characterStorage.setItem("surveyedMonsters", {})
			if (ctx.characterStorage.getItem("surveyedMonsters") === undefined) {
				// const bannedMonsters = ["melvorF:Ahrenia", "melvorTotH:TheHeraldPhase1", "melvorTotH:TheHeraldPhase2", "melvorTotH:TheHeraldPhase3"]
				// var monsterList = [...game.combatAreas.allObjects.map(area => area.monsters), ...game.slayerAreas.allObjects.map(area => area.monsters), ...game.dungeons.allObjects.map(x => x.monsters.filter(x => x.isBoss && !bannedMonsters.includes(x.id)))].flat().map(monster => ([monster.id, 0, false])) // Format is: [id, hexesUnlocked] // Not gonna bother with dungeons
				var monsterList = [...game.combatAreas.allObjects.map(area => area.monsters), ...game.slayerAreas.allObjects.map(area => area.monsters)].flat().map(monster => ([monster.id, 0, false])) // Format is: [id, hexesUnlocked]

				// ({ id: monster.id, hexesUnlocked: 0, maxHexesUnlocked: false })) // Again, storing objects is ruining me
				// .reduce((acc, value) => ({ ...acc, [value]: { hexesUnlocked: 0, maxHexesUnlocked: false } }), {}) // Lol storing as an object is too big, so gotta use array
				ctx.characterStorage.setItem("surveyedMonsters", monsterList)
			}
			ctx.characterStorage.getItem("surveyedMonsters").forEach(([monsterID, hexesUnlocked, _]) => setMonsterKillCountText(monsterID, hexesUnlocked))

			var pois = [
				"melvorAoD:Monuments", "melvorAoD:RuinedCity", "melvorAoD:LostTemple", "melvorAoD:RitualSite", "melvorAoD:ShipwreckCove", "melvorAoD:Cathedral",
				"melvorAoD:Bazaar", "melvorAoD:Mines", "melvorAoD:AncientMarket", "melvorAoD:OldVillage"
			]
			var rewards = [
				"melvorAoD:Ancient_Stone_Tablet", "melvorAoD:Old_Route_Chart", "melvorAoD:Torn_Scrolls", "melvorAoD:Lost_Cursed_Text", "melvorAoD:Misty_Jewel", "melvorAoD:Ancient_Wall_Chart",
				"melvorAoD:Ancient_Silk", "melvorAoD:Mining_Lantern", "melvorAoD:City_Map", "melvorAoD:Torn_Map"
			]
			// The above two variables are linked by relative order. I know it's a bad way to do this but sue me

			var archPois = [...archaeologyMenus.digSites].filter(x => pois.includes(x[0].id)).map(x => [x[0], x[0].poi]).map(([x, y]) => [x, y, y.id])
			var archHexes = archPois.map(([archDigsite, digsitePoi, id]) => ({ hex: digsitePoi.hex, q: digsitePoi.hex.q, r: digsitePoi.hex.r }))
			var poiHexRewards = pois.map((x, i) => ({
				poiID: x,
				rewardID: rewards[i],
				hex: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(archHexes[i].q).get(archHexes[i].r), poi: game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(archHexes[i].q).get(archHexes[i].r).pointOfInterest,
				offsetHexCoords: [archHexes[i].hex.to_oddq().col, archHexes[i].hex.to_oddq().row]
			}))

			poiHexRewards.forEach(x => x.poi.discoveryRewards = { items: [{ item: game.items.getObjectByID(x.rewardID), quantity: 1 }] })
			game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(archHexes[2].q).get(archHexes[2].r).pointOfInterest.discoveryRewards.items.push({ item: game.items.getObjectByID("melvorAoD:Old_Temple_Map"), quantity: 1 }) // Add this one in additionally because this POI has two rewards
			// additionalRewards.forEach(hexPair => hexPair.hex.pointOfInterest.discoveryRewards.items.push({ item: game.items.getObjectByID(hexPair.rewardID), quantity: 1 }))

			// game.cartography.worldMaps.getObjectByID('melvorAoD:Melvor').hexes.get(archHexes[2].q).get(archHexes[2].r).pointOfInterest.discoveryRewards.items.push({ item: game.items.getObjectByID("melvorAoD:Old_Temple_Map"), quantity: 1 }) // Add this one in additionally because this POI has two rewards


			ctx.patch(Cartography, "goToWorldMapOnClick").replace(function (o, poi) {
				if (!coGamemodeCheck())
					return o(poi)
				return __awaiter(this, void 0, void 0, function* () {
					if (this.game.isGolbinRaid)
						return;
					if (this.isActive && (this.actionMode === 2 || this.actionMode === 1) && !this.stop())
						return;
					cartographyMap.showLoading();
					this.activeMap = poi.destination.map;
					this.activeMap.setPlayerPosition(poi.destination);
					this.renderQueue.hexOverview = true;
					this.renderQueue.masteryButton = true;
					const destPOI = poi.destination.pointOfInterest;
					if (destPOI !== undefined && (destPOI.hidden === undefined || this.isHiddenPOIMet(destPOI.hidden))) // This section is changed, want to prevent players getting bricked by allowing repeat unlocks
						if (!destPOI.isDiscovered)
							this.discoverPOI(destPOI);
						else
							checkRewards(destPOI)

					this.updateHiddenPOIDiscoveryHandler();
					yield Promise.all([cartographyMap.loadWorldMap(this.activeMap, this), delayPromise(1000)]);
					cartographyMap.hideLoading();
				});
			})

			const checkRewards = function (poi) {
				if (poi.discoveryRewards === undefined)
					return
				const repeatableRewards = ["melvorAoD:Ancient_Stone_Tablet", "melvorAoD:Old_Route_Chart", "melvorAoD:Torn_Scrolls", "melvorAoD:Lost_Cursed_Text", "melvorAoD:Misty_Jewel", "melvorAoD:Ancient_Wall_Chart", "melvorAoD:Ancient_Silk", "melvorAoD:Old_Temple_Map", "melvorAoD:Mining_Lantern"]

				poi.discoveryRewards.items.forEach(reward => {
					if (repeatableRewards.includes(reward.item.id) && !game.bank.hasItem(reward.item)) {
						const rewards = new Rewards(this.game);
						rewards.addItemsAndCurrency(reward);
						rewards.giveRewards(true);
					}
				})
			}

			ctx.patch(CombatManager, "onEnemyDeath").before(function () {
				if (!coGamemodeCheck())
					return
				if (!summoningButtonValue())
					return
				grantCartographyXPFromMonsters(this.enemy.monster)
			})

			if (summoningButtonValue())
				coCartographyPatch()
		}

		
		patchCartographyDrops(summoningButtonValue())
		
		game.pages.getObjectByID("melvorAoD:Cartography").skillSidebarCategoryID = "Combat"
		patchSkill(summoningButtonValue(), 'melvorAoD:Cartography', 'Non-Combat')

		
		const cartographyHTMLModifications = () => {
			ctx.patch(HexOverviewElement, "updateSurveyButtons").replace(function (o, hex, game, cartography) {
				if (!coGamemodeCheck())
					o(hex, game, cartography)
			})
			ctx.patch(HexOverviewElement, "updateQueueButtonText").replace(function (o, hex, cartography) {
				if (!coGamemodeCheck())
					o(hex, cartography)
			})
			ctx.patch(HexOverviewElement, "updateAutoSurveyButtonText").replace(function (o, hex, cartography) {
				if (!coGamemodeCheck())
					o(hex, cartography)
			})

			// cartographyMap.hexOverview.queueSurveyBtn = ""
			// cartographyMap.hexOverview.autoSurveyBtn = ""
			cartographyMap.hexOverview.queueSurveyBtn.classList.add("d-none")
			cartographyMap.hexOverview.autoSurveyBtn.classList.add("d-none")
			cartographyMap.createMapBtn.classList.add("d-none")
		}

		
		cartographyHTMLModifications()

				// ctx.patch(Hex, "isFullySurveyed").get(function (o) {
		// 	if (!coGamemodeCheck())
		// 		return o
		// 	return true
		// })

		// Temporarily commenting this out
		// ctx.patch(Hex, "isMaxLevel").get(function (o) {
		// 	if (!coGamemodeCheck())
		// 		return
		// 	return Math.max(this.maxSurveyLevel, this.maxMasteryLevel)
		// })
		// ctx.patch(Hex, "maxLevel").get(function (o) {
		// 	if (!coGamemodeCheck())
		// 		return
		// 	return Math.max(this.maxSurveyLevel, this.maxMasteryLevel)
		// })
