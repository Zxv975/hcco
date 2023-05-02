ctx = mod.getDevContext()

ctx.patch(Summoning, "rollForMark").replace(function (o, mark, skill, modifiedInterval) {
    const markLevel = this.getMarkLevel(mark);
    const cantRoll = this.level < mark.level || !mark.skills.includes(skill) || markLevel >= Summoning.markLevels.length;
    if (!cantRoll && rollPercentage(this.getChanceForMark(mark, skill, modifiedInterval))) {
        this.discoverMark(mark);
    }
})