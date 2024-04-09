let arr = [
    { first: 5, second: 5, third: 5, name: 'a' },
    { first: 2, second: 3, third: 5, name: 'b' },
    { first: 3, second: 5, third: 5, name: 'c' },
    { first: 5, second: 5, third: 1, name: 'd' },
    { first: 2, second: 6, third: 1, name: 'e' },
]
let arr2 = [
    { first: 2, second: 1, third: 5, name: 'a' },
    { first: 1, second: 2, third: 5, name: 'b' },
    { first: 3, second: 3, third: 5, name: 'c' },
]
arr2.sort((a, b) => a.first - b.first || a.second - b.second || a.third - b.third) // This works because of short-circuit evaluation breaking symmetry and injecting left-right ordering to the OR operator
arr2.sort((a, b) => a.second - b.second || a.first - b.first || a.third - b.third)

arr.sort((a, b) => a.first < b.first ? -1 : a.first === b.first ? a.second < b.second ? -1 : a.second === a.second ? a.third < b.third ? -1 : 1 : 1 : 1)
arr.sort((a, b) => a.first < b.first ? -1 : a.first === b.first ? a.second < b.second ? -1 : 1 : 1)
arr.sort((a, b) => a.first < b.first ? -1 : a.first > b.first ? 1 : a.first === b.first ? a.second < b.second ? -1 : 1 : 1)

