ACTUAL AOD PATCH HORRAY
- AoD combat areas, slayer areas and dungeons are accessible through items obtainable through combat
- Revamped entire drop table modification system
    - Bit technical, but "empty drops" are now no longer handled through the monster.lootChance variable. Every drop table now has an "empty drop" (signified as the empty equipment item), and any previous lootChance is converted directly to the weight of the empty drop item. This is a much more extensible system, and will make future drop table modifications much, much easier.
    - Drops added to tables first consume empty slots, then if there are no empty slots, now reduce the likelihood of *all* other items (by increasing the total weight of the drop table), instead of reducing the drop rate of a particular item.
- Added tortoise familiar.
- Completion messages are now completely disabled, as they were firing at very inconvenient times. Hopefully these can be fixed in future to behave appropriately.
- Updated in game patch notes generator. Monster drop changes are now displayed in a table format.
- Added an optional revamped display format which incorporates drop percentages, drop table weighting and minimum rolls.