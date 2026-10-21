/**
 * Curated combination library.
 *
 * Each entry is a space-separated list of technique ids from data/techniques.js,
 * written for an orthodox fighter. Southpaw mirroring happens at render time.
 *
 * Focus tags (boxing, kicks, knees, elbows, teeps, defense, footwork, clinch) are
 * derived automatically from the techniques in each combination, so new entries
 * only need to be added to the right level list.
 *
 * Generated combinations (lib/combos.js → generatedCombos) are added on top of
 * these to provide variety while respecting the same technical rules.
 */

export const CURATED_COMBOS = {
  beginner: [
    // Boxing
    'jab', 'jab jab', 'jab cross', 'cross', 'jab lhook', 'cross lhook',
    'jab jab cross', 'jab cross lhook', 'jabBody cross', 'jab crossBody',
    'jab cross jab',
    // Kicks & teeps
    'rlow', 'rbody', 'lbody', 'llow', 'lteep', 'rteep',
    'jab rlow', 'jab rbody', 'jab cross llow', 'jab cross lbody', 'cross lbody',
    'lteep jab', 'lteep rlow',
    // Knees
    'rknee', 'lknee', 'jab rknee', 'jab cross lknee',
    // Elbows (Muay Thai only)
    'relbow', 'lelbow', 'jab relbow', 'cross lelbow',
    // Defense & footwork
    'slip cross', 'parry cross', 'block jab cross', 'lcheck rlow', 'jab slip',
    'jab stepBack', 'stepIn jab cross', 'jab cross pivot',
    // Clinch
    'clinch rknee lknee',
  ],

  intermediate: [
    // Boxing
    'jab cross lhook cross', 'jab cross lupper cross', 'jab rupper lhook cross',
    'lhook cross lhook', 'jab cross lhookBody lhook', 'cross lhook cross',
    'jab jab cross lhook', 'jabBody jab cross', 'jab cross rhookBody lhook',
    'lupper cross lhook',
    // Kicks & teeps
    'jab cross lhook rlow', 'jab cross lbody', 'cross lhook rbody', 'lhook cross lhead',
    'jab cross switchKick', 'lteep jab cross llow', 'rlow lhook cross',
    'jab rupper lhook rlow', 'jab rteep', 'lteep rbody', 'jab cross lhook rbody',
    'llow cross lhook rlow',
    // Knees
    'jab cross lknee', 'lhook rknee', 'jab cross switchKnee', 'rknee lknee rknee',
    'jab lhook rknee',
    // Elbows
    'jab cross lelbow', 'cross lhook relbow', 'jab relbow lelbow', 'lhook relbow',
    'jab rupElbow lelbow', 'cross lelbow relbow',
    // Defense & footwork
    'slip cross lhook rlow', 'lcheck lhook cross', 'block cross lhook',
    'roll lhook cross', 'parry cross lbody', 'lcheck rbody', 'jab cross angle lhook',
    'jab stepBack cross', 'stepIn jab cross lhook', 'jab cross pivot',
    'lean cross lhook',
    // Clinch
    'clinch rknee lknee rknee', 'jab cross clinch rknee', 'clinch turn rknee',
  ],

  advanced: [
    // Boxing
    'jab cross lhook rupper lhook cross', 'jab cross lhookBody lhook cross',
    'lupper lhook cross lhook', 'jab rhook lhook cross',
    'cross lhook cross lupper cross', 'jabBody jab cross lhook rhook',
    'jab cross lhook rhookBody lhook cross',
    // Kicks
    'jab cross lhook cross lbody', 'jab rupper lhook rhead', 'lhook rhook lhook rlow',
    'switchKick cross lhook rlow', 'lteep jab cross lhook rbody',
    'cross lhook cross lhead', 'jab jab cross lhook rlow', 'jab cross lhook rlow lhead',
    'rlow cross lhook rbody', 'jab cross lhookBody lhook rhead',
    // Knees
    'jab cross lhook rknee lknee', 'lhook cross switchKnee rknee',
    'jab cross lhook rknee lhook cross',
    // Elbows
    'jab cross lhook relbow', 'jab rupper lelbow relbow', 'lhook relbow lupElbow',
    'cross lhook relbow spinElbow', 'jab cross lelbow relbow lknee',
    'lteep jab relbow lelbow', 'slip cross lelbow relbow',
    // Defense & footwork
    'slip cross lhook cross lbody', 'roll lhook cross lhook rbody',
    'lcheck lhook cross lbody', 'parry cross lhook rhead',
    'block jab cross lhook rlow', 'lean cross lhook rbody', 'jab cross slip cross lhook',
    'jab cross lhook pivot cross', 'stepIn jab cross lhook angle rlow',
    'rcheck jab cross lhook',
    // Clinch
    'jab cross clinch rknee lknee rknee', 'clinch turn rknee lelbow',
  ],
};
