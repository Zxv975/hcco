export async function setup(ctx) {
	await ctx.gameData.addPackage('package.json');
	ctx.onInterfaceReady(ctx => {
		if(game.currentGamemode.id === 'mcco:mcco')
			sidebar.category("Non-Combat").remove();
	})
}
