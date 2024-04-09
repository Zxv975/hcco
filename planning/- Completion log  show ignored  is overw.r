- Completion log "show ignored" is overwriting options, so need to change that to be automatic
- Need to consider whether to include Cartography
- Can possibly undo some drop table changes
- Check patched functions, mostly summoning related
    ctx.patch(Summoning, "getChanceForMark").replace(function (o, mark, skill, modifiedInterval) // Only allow obtaining marks if summon equipped
    ctx.patch(SlayerTask, 'getMonsterSelection').replace(function (o, tier)  // This should always be patched, since it's bugged ingame
    ctx.patch(Bank, "willItemsFit").replace(function (o, items)  // This fixes resupplies etc so that they don't need one of every item in order to be purchased with a mostly full bank
    ctx.patch(Player, "autoEat").replace(function (o, foodSwapped)  // Fix autoeat potatoes in Arid Plains
    ctx.patch(Summoning, "checkForPetMark").replace(function (o) 
    ctx.patch(Player, "processDeath").replace(function (o) 
    ctx.patch(Player, "removeSummonCharge").replace(function (o, slot, interval) 
    ctx.patch(Township, "addXP").replace(function (o, amount, masteryAction)  return }) // Make township give no XP
    ctx.patch(Township, "rollForPets").replace(function (o, interval)  return }) // Make township give no pet
    ctx.patch(SynergySearchMenu, "updateFilterOptions").replace(function (o) 
    ctx.patch(Completion, "updateSkillProgress").replace(function (o) 
    ctx.patch(Completion, "updateMasteryProgress").replace(function (o) 
    ctx.patch(Completion, "updateItemProgress").replace(function (o) 
    ctx.patch(Completion, "updateMonsterProgress").replace(function (o) 
    ctx.patch(Completion, "updatePetProgress").replace(function (o) 
    ctx.patch(CompletionMap, "getCompValue").replace(function (o, namespace) 
    ctx.patch(Completion, "computeTotalProgressPercent").replace(function (o, namespace) 
- Fix method for hiding shop items
- Fix issue with township tasks being hidden
- Summoning doesnt collapse
- purchaseRequirements is stuffed. I tihnk it's a getter now. Think i just change to _purchaseRequirements.set
- Change markLevels to regular old array, Summoning.markLevels = [1, 6, 16, 31, 46, 61, 121];


- Better offline recap crashes atm from the replace
    ctx.patch(Game, "createOfflineModal").replace(function (o, oldSnapshot, timeDiff) 
