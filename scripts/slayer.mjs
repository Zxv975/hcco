	// ## Rerolling
	const coRepeatSlayerTaskButton = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		if (patchFlag) {
			document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox").classList.add('d-none')
			document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox > div").classList.add('d-none')
			document.querySelector("#slayerRadioDiv").classList.remove('d-none')
		} else {
			document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox").classList.remove('d-none')
			document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox > div").classList.remove('d-none')
			document.querySelector("#slayerRadioDiv").classList.add('d-none')
		}
	}