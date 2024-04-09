	const generateLogFile = () => {
		let logfile = ''
		let generatedHtml = ''
		let checkedMonsters = new Set()
		Object.entries(modifications).sort((a, b) => { // Sort in ascending level order
			if (game.monsters.getObjectByID(a[0])?.combatLevel === undefined) return 1
			if (game.monsters.getObjectByID(b[0])?.combatLevel === undefined) return -1
			if (game.monsters.getObjectByID(a[0])?.combatLevel < game.monsters.getObjectByID(b[0])?.combatLevel) return -1
			if (game.monsters.getObjectByID(a[0])?.combatLevel > game.monsters.getObjectByID(b[0])?.combatLevel) return 1
		}).forEach(([monsterID, states]) => { // States is a set of JSON stringified states
			// Recall: state = JSON.stringify({ monsterID, chestOrMonster, oldItemsToPatch, newItemsToInclude })
			const statesArray = [...states]
			if (statesArray.length === 0)
				return
			const firstState = JSON.parse(statesArray[0])
			const { lootDropperKey, tableKey } = chestOrMonsterChecker(firstState.chestOrMonster)
			logfile = logfile.concat(`${game[lootDropperKey].getObjectByID(monsterID).name} drop table modified:\n`)

			generatedHtml = generatedHtml.concat(`<img class="swal2-image" width=50 height=50 src="${game[lootDropperKey].getObjectByID(monsterID).media}"><br><b style="color:white">${game[lootDropperKey].getObjectByID(monsterID).name}</b><br>`)
			const itemsAdded = {}
			const itemsModified = {}

			statesArray.forEach(state => {
				const stateParsed = JSON.parse(state)
				stateParsed.oldItemsToPatch.forEach(item => {
					if (itemsModified[item.id] === undefined)
						itemsModified[item.id] = {}
					// We assume all the min and max quantities are the same between state modifications, but the weight can change from state to state
				})

				stateParsed.newItemsToInclude.forEach(item => {
					if (itemsAdded[item.id] === undefined)
						itemsAdded[item.id] = { 'minQuantity': item.minQuantity, 'maxQuantity': item.maxQuantity, 'weight': item.weight }
					itemsAdded[item.id].weight = item.weight
					itemsAdded[item.id].minQuantity = item.minQuantity
					itemsAdded[item.id].maxQuantity = item.maxQuantity
				})
			})

			const lootChance = (game[lootDropperKey].getObjectByID(monsterID)?.lootChance || 100) / 100 // LootChance is never modified
			Object.keys(itemsModified).forEach(dropID => {
				const droptable = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.filter(y => y.item.id === dropID)[0]
				// const droptableWeight = game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight / (lootChance / 100)

				const itemDropRate = game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight / (lootChance / 100) / droptable.weight
				const itemDropRatePercentage = Math.round(100 / itemDropRate, 3)

				const vanillaItemDropRate = vanillaDrops[monsterID].vanillaTotalWeight / (lootChance / 100) / droptable.weight
				const vanillaItemDropRatePercentage = Math.round(100 / vanillaItemDropRate, 3)

				const dropProperties = vanillaDrops[monsterID][dropID]

				// Check if the weight or the quantity have been modified
				const weightFlag = (dropProperties.vanillaWeight !== droptable.weight) // Weight has been modified 
				const quantityFlag = (dropProperties.vanillaMinQuantity !== undefined) && (dropProperties.vanillaMinQuantity !== droptable.minQuantity || dropProperties.vanillaMaxQuantity !== droptable.maxQuantity) // Quantity has been modified

				if (!weightFlag && !quantityFlag) // Neither weight nor quantity have been modified, so return
					return
				logfile = logfile.concat(`\t- ${droptable.item.name}`)
				generatedHtml = generatedHtml.concat(`<img class="skill-icon-xs" src=${droptable.item.media}> <i style="color:fuchsia">${droptable.item.name}`)
				if (weightFlag) {
					// logfile = logfile.concat(` drop rate changed from ${dropProperties.vanillaWeight}/${droptableWeight} to ${droptable.weight}/${droptableWeight}`)
					// generatedHtml = generatedHtml.concat(` drop rate changed from ${dropProperties.vanillaWeight}/${droptableWeight} to ${droptable.weight}/${droptableWeight}`)
					let textToAdd = `drop rate changed from 1/${vanillaItemDropRate} ${(vanillaItemDropRatePercentage)} to 1/${itemDropRate} (${itemDropRatePercentage}%)`
					logfile = logfile.concat(textToAdd)
					generatedHtml = generatedHtml.concat(textToAdd)
				}
				if (quantityFlag)
					if (weightFlag) { // Both have been modified (grammar)
						logfile = logfile.concat(` and`)
						generatedHtml = generatedHtml.concat(` and`)
						// logfile = logfile.concat(` and drop quantity changed from ${dropProperties.vanillaMinQuantity}-${dropProperties.vanillaMaxQuantity} to ${droptable.minQuantity}-${droptable.maxQuantity}`)
						// generatedHtml = generatedHtml.concat(` and drop quantity changed from ${dropProperties.vanillaMinQuantity}-${dropProperties.vanillaMaxQuantity} to ${droptable.minQuantity}-${droptable.maxQuantity}`)
					} // Only quantity has been modified (grammar)

				textToAdd = ` drop quantity changed from ${dropProperties.vanillaMinQuantity}-${dropProperties.vanillaMaxQuantity} to ${droptable.minQuantity}-${droptable.maxQuantity}.`
				// logfile = logfile.concat('.\n')
				// generatedHtml = generatedHtml.concat('</i><br>')
			})
			Object.entries(itemsAdded).forEach(([dropID, dropProperties]) => {
				const droptable = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.filter(y => y.item.id === dropID)[0]
				const droptableWeight = game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight / (lootChance / 100)
				logfile = logfile.concat(`\t+ ${droptable.item.name} added to the drop table at a rate of ${dropProperties.weight}/${droptableWeight} and with a drop quantity of ${dropProperties.minQuantity}-${dropProperties.maxQuantity}.\n`)
				generatedHtml = generatedHtml.concat(`<img class="skill-icon-xs" src=${droptable.item.media}> <i style="color:cyan">${droptable.item.name} added to the drop table at a rate of ${dropProperties.weight}/${droptableWeight} and with a drop quantity of ${dropProperties.minQuantity}-${dropProperties.maxQuantity}</i><br>`)
			})

			if (vanillaBones[monsterID]?.bones !== undefined) {
				logfile = logfile.concat(`\t× Bones drop ${vanillaBones[monsterID].bones.vanillaBonesDrop} (${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity}).\n`)
				generatedHtml = generatedHtml.concat(`<img class="skill-icon-xs" src=${vanillaBones[monsterID]?.bones.vanillaBonesDrop.media}> <i style="color:yellow">${vanillaBones[monsterID]?.bones.vanillaBonesDrop.name} (${vanillaBones[monsterID]?.bones.vanillaQuantity}) replaced with <img class="skill-icon-xs" src=${game.monsters.getObjectByID(monsterID).bones.item.media}> ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity})
				</i><br>`)
			}

			checkedMonsters.add(monsterID)
			logfile = logfile.concat('\n')
		})
		Object.keys(vanillaBones).filter(monsterID => !checkedMonsters.has(monsterID)).forEach(monsterID => { // These are for monsters who only have bone drop table changes and no standard loot changes
			logfile = logfile.concat(`${game.monsters.getObjectByID(monsterID).name} drop table modified:\n`)
			generatedHtml = generatedHtml.concat(`<img class="swal2-image" width=50 height=50 src="${game.monsters.getObjectByID(monsterID).media}"><br><b style="color:white">${game.monsters.getObjectByID(monsterID).name}</b><br>`)

			logfile = logfile.concat(`\t× Bones drop ${vanillaBones[monsterID].bones.vanillaBonesDrop} (${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity}).\n`)
			generatedHtml = generatedHtml.concat(`<i style="color:yellow">Bones drop <img class="skill-icon-xs" src=${vanillaBones[monsterID].bones.vanillaBonesDrop.media}> ${vanillaBones[monsterID].bones.vanillaBonesDrop.name}(${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with <img class="skill-icon-xs" src=${game.monsters.getObjectByID(monsterID).bones.item.media}> ${game.monsters.getObjectByID(monsterID).bones.item.name}(${game.monsters.getObjectByID(monsterID).bones.quantity})</i><br>`)
		})
		return { log: logfile, html: generatedHtml }
	}