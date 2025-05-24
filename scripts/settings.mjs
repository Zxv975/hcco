// ## Settings
ctx.settings.section("CO Rebalance")
ctx.settings.section("CO Rebalance").add([
	{
		type: 'label',
		label: `This mod contains several CO-centric changes that will only affect CO characters made through the mod. The changes include several drop table adjustments and a new skill. The goal is to improve the overall CO experience and make end-game TotH content achievable.`,
		// `Includes several changes the CO experience to make pre-expansion content more balanced and post-expansion content completable.  as well as an entire new skill added to the CO arsenal which is in the spirit of the gamemode. New monsters and dungeons are planned for the future.`,
		name: `${buttonNames.rebalance}-label`
	},
	{
		type: 'switch',
		name: `${buttonNames.rebalance}-button`,
		label: 'Enable CO rebalance: Several drop tables adjusted (check CO patch notes at the top of the sidebar) and Combat Max Capes added. Drop tables are mostly rebalanced for runes and for Linden Boat requirements.',
		hint: 'HP capped at 99 until 10k Dark Waters kills.',
		default: false,
		onChange: (value) => {
			if (!coGamemodeCheck())
				return
			ctx.characterStorage.setItem(buttonNames.rebalance, value);
			coRebalancePatch(value);
		}
	},
	{
		type: 'switch',
		name: `${buttonNames.rebalanceQoL}-button`,
		label: `Enable CO QoL changes: Enables multiple QoL fixes that don't affect gameplay.`,
		hint: `The shop items will be filtered to remove unobtainable items and the 90 Cooking requirement on Cooking Upgrade 2 is removed.`,
		default: true,
		onChange: (value) => {
			if (!coGamemodeCheck())
				return
			ctx.characterStorage.setItem(buttonNames.rebalanceQoL, value);
			coRebalanceQoLPatch(value);
		}
	},
	{
		type: 'switch',
		name: `${buttonNames.summoning}-button`,
		label: 'Enable Summoning & AoD: Summoning tablets added to drop tables and AoD areas are unlocked through combat.',
		hint: `Tablets are primarily found in the Strange Cave, in the shop and some other drop tables too. Check the CO patch notes at the top of the sidebar for specific details.`,
		default: false,
		onChange: (value) => {
			if (!coGamemodeCheck())
				return
			ctx.characterStorage.setItem(buttonNames.summoning, value);
			coSummoningPatch(value);
		}
	},
	{
		type: 'switch',
		name: `${buttonNames.marks}-button`,
		label: 'Enable Mark rebalance: Tablets become unlimited at mark level 7, but marks are only obtained with the familiar equipped.',
		default: false,
		onChange: (value) => {
			if (!coGamemodeCheck())
				return
			ctx.characterStorage.setItem(buttonNames.marks, value);
			coMarkRebalance(value)
		}
	},
	{
		type: 'switch',
		name: `${buttonNames.reroll}-button`,
		label: 'Enable repeat slayer tasks button: Current task can be repeated indefinitely, but a penalty of -65% fewer slayer coins and -65% slayer experience will be applied while doing so.',
		hint: `If repeat current task is enabled, the current monster will be set as a slayer task if it is within the selected tier when rolling for a task.`,
		default: false,
		onChange: (value) => {
			if (value === false) {
				if (!coGamemodeCheck())
					return
				// Make the button swap to false if it's disabled entirely, but don't necessarily turn it on when re-enabled
				ctx.characterStorage.setItem(buttonNames.reroll, false);
				//document.querySelector(`#${buttonNames.reroll}-checkbox`).checked = false
			}
			ctx.characterStorage.setItem(buttonNames.rerollEnable, value);
			coRepeatSlayerTaskButton(value)
		}
	},
	{
		type: 'switch',
		name: `${buttonNames.township}-button`,
		label: 'Enable Township Tasks.',
		hint: `Towns not available.`,
		default: false,
		onChange: (value) => {
			if (!coGamemodeCheck())
				return
			ctx.characterStorage.setItem(buttonNames.township, value);
			coTownshipPatch(value)
		}
	}
])
ctx.settings.section("Layout")
ctx.settings.section("Layout").add([{
	type: 'switch',
	name: `${buttonNames.drops}-button`,
	label: 'Use revamped layout for drop tables.',
	hint: `Displays minimum roll, percentage drop chance and table drop weights.`,
	default: false,
	onChange: (value) => {
		if (!coGamemodeCheck())
			return
		ctx.characterStorage.setItem(buttonNames.drops, value);
	}
}])