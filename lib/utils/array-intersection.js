/**
 * Return an array of values which are present in both arr1 and arr2
 */
module.exports = (arr1 = [], arr2 = []) => arr1.filter(v => arr2.includes(v))
