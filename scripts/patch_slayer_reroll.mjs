export class PatchSlayerReroll {
	AddRepeatSlayerTaskButton = (ctx) => {
		const radioButtonValues = {
			manualSlayer: "manual_slayer",
			autoSlayer: "auto_slayer",
			repeatSlayer: "repeat_slayer"
		}

		const buttonNames = {
			rebalance: 'co-rebalance-button-value',
			rebalanceQoL: 'co-re-qol-button-value',
			summoning: 'co-summoning-button-value',
			township: 'co-township-button-value',
			marks: 'co-mark-button-value',
			rerollEnable: 'co-repeatslayer-button-value',
			reroll: 'repeat-slayer-task-checkbox-value',
			oldReroll: 'reroll-slayer-task',
			drops: 'dropsLayout'
		}

		let radioButtons = document.createElement("div");
		document.querySelector("#combat-slayer-task-menu > div > div").appendChild(radioButtons)
		radioButtons.outerHTML = `
			<div id="slayerRadioDiv">
			<label class="col-12 font-w400 font-size-sm pt-3" align="center">
				<input class="slayerBlock" type="radio" name="slayerRadio" onclick="game.settings.boolData.enableAutoSlayer.currentValue = false;document.querySelector('#settings-checkbox-2').checked=false" value="${radioButtonValues.manualSlayer}" id="${radioButtonValues.manualSlayer}"/>
				<b>
					Manually select Slayer tasks
				</b>
			</label>
	
			<label class="col-12 font-w400 font-size-sm pt-3" align="center">
				<input class="slayerBlock" type="radio" name="slayerRadio" onclick="game.settings.boolData.enableAutoSlayer.currentValue = true; document.querySelector('#settings-checkbox-2').checked=true" value="${radioButtonValues.autoSlayer}" id="${radioButtonValues.autoSlayer}"/>
				<b>
					Automatically fight new Slayer tasks
				</b>
			</label>
	
			<label class="col-12 font-w400 font-size-sm pt-3" align="center">
				<input class="slayerBlock" type="radio" name="slayerRadio" onclick="game.settings.boolData.enableAutoSlayer.currentValue = false; document.querySelector('#settings-checkbox-2').checked=false" value="${radioButtonValues.repeatSlayer}" id="${radioButtonValues.repeatSlayer}"/>
				<b>
					Repeat enemy [35%<img class="skill-icon-xxs mr-1" src="https://cdn.melvor.net/core/v018/assets/media/main/slayer_coins.svg"> 35%<img class="skill-icon-xxs mr-1" src="https://cdn.melvor.net/core/v018/assets/media/skills/slayer/slayer.svg">]
				</b>
			</label>
			</div>
			`

		document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox").classList.add('d-none')
		document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox > div").classList.add('d-none')
		document.querySelector("#slayerRadioDiv").classList.remove('d-none')

		ctx.patch(Currency, "add").before(function (amount) {
				const modifyFlag = slayerRerollButtonValue() === undefined ? false : slayerRerollButtonValue() // check if characterStorage is undefined first
				if (this instanceof SlayerCoins)
					amount = Math.max(Math.floor(amount * (1 - 0.65 * modifyFlag)), 1)
				return [amount];
			})

			ctx.patch(Slayer, 'addXP').before((amount, masteryAction) => {
				if (!(rerollEnableButtonValue() || slayerRerollButtonValue()))
					return [amount, masteryAction]

				if (game.combat.enemy.monster === game.combat.slayerTask.monster)
					return [amount * (1 - 0.65), masteryAction]
			})
	}
}