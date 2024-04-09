1) Remove requirement on Eye-conic cave. Maybe replace with level 5 summoning entry req?
2) Add Mucky cave req to blind monsters. Maybe 1/250 from all of them. Figure out an item to unlock. Chosen Navigation chart. 30 Summoning req
3) 

Ancient stone tablet - Golem territory - Dark Quarry
Old Route Chart - Unholy forest - Tree overgrowth
Torn scrolls - Trickery Temple - Lost temple
Lost Cursed Text - Cult Grounds - Ritual site
Melantis (Melantis Clue 1 2 3 4) - Underwater City - Underwater ruins

Eye-conic cave - None
Mucky Cave - 35 cart / City chart
//Tree overgrowth - old route chart
Collapsed city - Glacia city - 80 cart / 65 arch (Uncovered Dusty Torn Book of Dangerous Untold Knowledge from the Past with missing pages) + Navigation_Chart
//Lost temple - torn scrolls
//Ritual site - 
Shipwreck cove - Ancient Wall Chart
//Underwater ruins 

Navigation chart

- Make sure to fix HCCO patch notes for lootChance 
- TODO IMPORTANT: CHANGE ALL MIN/MAX QUANTITIES TO DELTA SYSTEM ✔️
- Disable AoD completion message shiz ✔️
- Update entry requirements on patch application ✔️
- Mark of the tortoise ✔️
- Fix bug with repeatedly turning on and off (probably accomplished by not modifying loot chances thingy) ✔️
- Update township requirements to remove POIs ✔️

Blind ghost:
Loot chance must be 1/6 / (5/6) = 1/5 = 20/100
Barrier touch gem (1/6 and 5/6), Lesser summoning amulet (1/30 and 1/6)
Meant to be 3/100 for the city map

T = 6
w = [5, 1]
v = 3
n = 20
x = Tv/n = 6 × 3 / 20 = 9/10
w/T × n/100 = [1/6, 1/30] (drop rates)
✔️✔️✔️✔️✔️

Since x is non-integer:
    w' = [nw..., x] = [nw1, nw2, ..., nx] = [5×20, 1×20, 9/10×20] = [100, 20, 18]
Maybe do this absolutely last...
w' = [w..., x] = [w1, w2, ..., x] = [5, 6, 9/10]
T' = T + x = 6.9 = 69/10
n' = n + v = 23
w'/T' × n'/100 = 
    [1/6, 1/30, 3/100]
✔️✔️✔️✔️✔️

Now, since w' and T' aren't integers, need to multiply by common denominator... Which should be n?
nw' = [100, 20, 18]
nT' = 138
nw'/nT' × n'/100 = 
    [100, 20, 18] /138 × 23/100 = [1/6, 1/30, 3/100]
✔️✔️✔️✔️✔️


T' = Total@w' = 138
n'/n = T'/T => n' = nT'/T = 20×138/6 = 460 (this doesn't seem to be a guaranteed integer... and it's also not < 100...?) [[Figured it out, this calculation is garbage because the real answer is meant to have factors of nT'. See above for correct]]
n' = n + v??
T' = T + x??
w1'T' × n'/100 = 100 × 138 × 460 / 100 = 
❌❌❌❌❌

So the modifications made are: 
    w1 => w1' - w1... w => w' - w = [w1', w2', ..., x] - [w1, w2, ..., 0] ✔️
    T' = recalculated from w' = Total@w' ✔️
    n' => n + v ✔️?

To undo this patch, we need to modify T' => T, n' => n, w' => w.

!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Test settings change works in live version

Spectre: goes from:
Moonwort: 500/501
Greataxe: 1/501

to

Moonwort: 500/701
Spectre: 200/701
Greataxe: 1/701



to

Moonwort: 500/901
Spectre: 200/901
Soul rune: 200/901
Greataxe: 1/901

1/501 = (1+x)/(901+x)