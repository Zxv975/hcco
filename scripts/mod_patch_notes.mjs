// ## Mod Patch Notes

const generateLogFile = () => {
	let logfile = ''
	let generatedHtml = `<h5 class='font-w600 mb-1'><hr></hr></h5>`
	let checkedMonsters = new Set()
	const htmlDropTableGenerator = (drops, totalWeight) => {
		// const tdStyle = 'style="min-width:100px;border:1px solid red'
		// const thStyle = `style="min-width:150px;"`
		const tdStyle = ''
		const localeSettings = { minimumFractionDigits: 0, maximumFractionDigits: 2 }
		let htmlString = `<table border="1" style="margin:0 auto"><tr><th style="min-width:300px">Item</th><th style="min-width:150px">Quantity</th><th style="min-width:175px" colspan="2">Drop Rate</th></tr>`
		drops.forEach(drop => {
			htmlString += `<tr><td ${tdStyle}><img class="skill-icon-xs mr-2" src="${drop.item.media}">${drop.item.name}</td><td ${tdStyle}>`
			if (drop.minQuantity === drop.maxQuantity) htmlString += `${drop.maxQuantity}`
			else htmlString += `(${drop.minQuantity} – ${drop.maxQuantity})`
			htmlString += `<td>${(100 * drop.weight / totalWeight).toLocaleString(undefined, localeSettings)}%</td><td ${tdStyle}>${simplifyFraction(drop.weight, totalWeight)}</td></tr>`
		})
		htmlString += `</table>`
		return htmlString
	}
	const simplifyFraction = (numerator, denominator) => {
		var gcd = function gcd(a, b) {
			return b ? gcd(b, a % b) : a;
		};
		gcd = gcd(numerator, denominator);
		return `${numerator / gcd}/${denominator / gcd}`;
	}
	// Sorting template: arr.sort((a, b) => a.first < b.first ? -1 : a.first === b.first ? a.second < b.second ? -1 : a.second === a.second ? a.third < b.third ? -1 : 1 : 1 : 1)

	Object.entries(vanillaDrops).sort(([monsterID_a, data_a], [monsterID_b, data_b]) => { // Sort in ascending level order
		const [lootDropperKey_a, tableKey_a] = chestOrMonsterChecker(data_a.chestOrMonster)
		const [lootDropperKey_b, tableKey_b] = chestOrMonsterChecker(data_b.chestOrMonster)
		return data_b.chestOrMonster.charCodeAt(0) - data_a.chestOrMonster.charCodeAt(0) || // Sort monsters at the top, then sort by combat level, then sort by chest price, then sort alphabetically.
			game[lootDropperKey_a].getObjectByID(monsterID_a)?.combatLevel - game[lootDropperKey_b].getObjectByID(monsterID_b)?.combatLevel ||
			game[lootDropperKey_a].getObjectByID(monsterID_a)?.sellsFor - game[lootDropperKey_b].getObjectByID(monsterID_b)?.sellsFor ||
			game[lootDropperKey_a].getObjectByID(monsterID_a)?.name.charCodeAt(0) - game[lootDropperKey_a].getObjectByID(monsterID_b)?.name.charCodeAt(0) ||
			game[lootDropperKey_a].getObjectByID(monsterID_a)?.name.charCodeAt(1) - game[lootDropperKey_a].getObjectByID(monsterID_b)?.name.charCodeAt(1)
		// Awful implementation using ternary, but it works.
		// return data_a.chestOrMonster < data_b.chestOrMonster ? 1 : data_a.chestOrMonster === data_b.chestOrMonster ?
		// 	game[lootDropperKey_a].getObjectByID(monsterID_a)?.combatLevel < game[lootDropperKey_b].getObjectByID(monsterID_b)?.combatLevel ? -1 : game[lootDropperKey_a].getObjectByID(monsterID_a)?.combatLevel === game[lootDropperKey_b].getObjectByID(monsterID_b)?.combatLevel ?
		// 		game[lootDropperKey_a].getObjectByID(monsterID_a)?.name < game[lootDropperKey_a].getObjectByID(monsterID_b)?.name ? -1 : 1 : 1 : -1
		// Original implementation that doesn't work really. Works sometimes... by accident
		// if (game.monsters.getObjectByID(a[0])?.combatLevel === undefined) return 1
		// if (game.monsters.getObjectByID(b[0])?.combatLevel === undefined) return -1
		// if (game.monsters.getObjectByID(a[0])?.combatLevel < game.monsters.getObjectByID(b[0])?.combatLevel) return -1
		// if (game.monsters.getObjectByID(a[0])?.combatLevel > game.monsters.getObjectByID(b[0])?.combatLevel) return 1
	}).forEach(([monsterID, data]) => {
		const [lootDropperKey, tableKey] = chestOrMonsterChecker(data.chestOrMonster)

		const monster = game[lootDropperKey].getObjectByID(monsterID)

		// logfile = logfile.concat(`${monster.name} drop table modified:\n`)
		generatedHtml += `<div><div id="monsterImageDiv" style="display:inline-block;width:25%"><h3 style="color:white">${monster.name}</h3><br><img class="swal2-image" width=100 height=100 src="${monster.media}"><br></div>`

		const vanillaDropTableHTML = htmlDropTableGenerator(data.drops, data.totalWeight)
		const modifiedDropTableHTML = htmlDropTableGenerator(game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray, game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight)

		generatedHtml += `<div id="dropTableChangesDiv" style="display:inline-block;width:75%">${vanillaDropTableHTML}<br>&dArr; &dArr; &dArr; <br><br>${modifiedDropTableHTML}</div>`
		// generatedHtml += `<br>Loot Chance: ${data.lootChance} &rArr; ${game[lootDropperKey].getObjectByID(monsterID)?.lootChance}<br>`

		if (vanillaBones[monsterID]?.bones !== undefined) {
			logfile = logfile.concat(`\t× Bones drop ${vanillaBones[monsterID].bones.vanillaBonesDrop} (${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity}).\n`)
			generatedHtml = generatedHtml.concat(`<img class="skill-icon-xs" src=${vanillaBones[monsterID]?.bones.vanillaBonesDrop.media}> <i style="color:yellow">${vanillaBones[monsterID]?.bones.vanillaBonesDrop.name} (${vanillaBones[monsterID]?.bones.vanillaQuantity}) replaced with <img class="skill-icon-xs" src=${game.monsters.getObjectByID(monsterID).bones.item.media}> ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity})
				</i><br>`)
		}

		generatedHtml += `</div><h5 class='font-w600 mb-1'><hr></hr></h5>`

		checkedMonsters.add(monsterID)
		logfile = logfile.concat('\n')
	})
	Object.keys(vanillaBones).filter(monsterID => !checkedMonsters.has(monsterID)).forEach(monsterID => { // These are for monsters who only have bone drop table changes and no standard loot changes
		logfile = logfile.concat(`${game.monsters.getObjectByID(monsterID).name} drop table modified:\n`)
		generatedHtml = generatedHtml += `<img class="swal2-image" width=50 height=50 src="${game.monsters.getObjectByID(monsterID).media}"><br><b style="color:white">${game.monsters.getObjectByID(monsterID).name}</b><br>`

		logfile = logfile.concat(`\t× Bones drop ${vanillaBones[monsterID].bones.vanillaBonesDrop} (${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity}).\n`)
		generatedHtml = generatedHtml += `<i style="color:yellow">Bones drop <img class="skill-icon-xs" src=${vanillaBones[monsterID].bones.vanillaBonesDrop.media}> ${vanillaBones[monsterID].bones.vanillaBonesDrop.name}(${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with <img class="skill-icon-xs" src=${game.monsters.getObjectByID(monsterID).bones.item.media}> ${game.monsters.getObjectByID(monsterID).bones.item.name}(${game.monsters.getObjectByID(monsterID).bones.quantity})</i><br>`
	})

	return { log: logfile, html: generatedHtml }
}
const potatoPatchNotes = () => {
	const { log, html } = generateLogFile()
	SwalLocale.fire({
		title: `${game.currentGamemode.localID.toUpperCase()} Drop Table Changes V${versionNumber[0]}.${versionNumber[1]}.${versionNumber[2]}`,
		html: html,
		imageUrl: cdnMedia(`assets/media/bank/${game.currentGamemode.localID === "mcco" ? 'chilli' : 'potato'}.png`),
		imageWidth: 150,
		imageHeight: 150,
		width: '65em'
	})
	document.querySelector("body > div.swal2-container.swal2-center.swal-infront.swal2-backdrop-show > div").childNodes[4].outerHTML = `<center><h2 class="swal2-title" id="swal2-title" style="display: block;">MCCO Drop Table Changes V3.3</h2></center>`
	document.querySelector("body > div.swal2-container.swal2-center.swal-infront.swal2-backdrop-show > div").childNodes[4].appendChild(document.querySelector("body > div.swal2-container.swal2-center.swal-infront.swal2-backdrop-show > div > div.swal2-actions > button.swal2-confirm.btn.btn-primary.m-1"))
}
