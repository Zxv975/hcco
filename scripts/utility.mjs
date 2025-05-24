// ## Utility

function flattenRaggedArray(items) {
	const flat = [];

	items.forEach(item => {
		if (Array.isArray(item)) {
			flat.push(...flattenRaggedArray(item));
		} else {
			flat.push(item);
		}
	});

	return flat;
}

function capitalise(s) {
	return s && s[0].toUpperCase() + s.slice(1);
}


const coGamemodeCheck = () => { // Check if the user is playing a CO game mode
	return game.currentGamemode.isCO === true
}

const patchGameModes = () => {
	game.gamemodes.getObjectByID("hcco:hcco")["isCO"] = true
	game.gamemodes.getObjectByID("hcco:mcco")["isCO"] = true
	// game.gamemodes.getObjectByID("hcco:arcomSpeedrun")["isCO"] = true
	game.gamemodes.getObjectByID("melvorF:HCCOSpeedrun")["isCO"] = true
	game.gamemodes.getObjectByID("melvorAoD:HCCOARSpeedrun")["isCO"] = true
}