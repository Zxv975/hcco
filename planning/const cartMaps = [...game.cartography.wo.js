const cartMaps = [...game.cartography.worldMaps.allObjects[0].hexes].map(([x, y]) => y).map(x => [...x].map(([y, z]) => z)).flat()
const res = [0, 1, 2, 3, 4, 5].map(x => cartMaps.filter(y => x === y.maxLevel))
ctx.patch(Hex, "isMaxLevel").get(function (o) {
    if (!coGamemodeCheck())
        return
    return Math.max(this.maxSurveyLevel, this.maxMasteryLevel)
})
ctx.patch(Hex, "maxLevel").get(function (o) {
    if (!coGamemodeCheck())
        return
    return Math.max(this.maxSurveyLevel, this.maxMasteryLevel)
})