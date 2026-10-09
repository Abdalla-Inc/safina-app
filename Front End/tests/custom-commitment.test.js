import test from 'node:test';
import assert from 'node:assert/strict';
import {customCommitmentPayload} from '../src/connected/customCommitment.js';
import {exampleCheckins} from '../src/data/community.js';
import {exampleCelebration} from '../src/data/communityWeeks.js';
const draft = {period:'weekly',selections:[{surahId:2,fromAyah:1,toAyah:20},{surahId:67,fromAyah:1,toAyah:30}],verseTarget:'40'};
test('custom commitment keeps canonical selection and bounded period target',()=>{
 assert.deepEqual(customCommitmentPayload(draft),{...draft,verseTarget:40});
 assert.ok(!('verseTarget' in customCommitmentPayload({...draft,verseTarget:''})));
 for(const period of ['daily','weekly','monthly']) assert.equal(customCommitmentPayload({...draft,period}).period,period);
});
test('custom commitment rejects empty, duplicate, invalid and over-target ranges',()=>{
 for(const value of [{...draft,selections:[]},{...draft,selections:[draft.selections[0],draft.selections[0]]},{...draft,selections:[{surahId:2,fromAyah:4,toAyah:3}]},{...draft,verseTarget:51},{...draft,verseTarget:1.5},{...draft,period:'yearly'}]) assert.throws(()=>customCommitmentPayload(value));
});
test('owner examples include fourteen distinct members with daily and weekly istighfar',()=>{
 const daily=exampleCheckins('2026-10-03');
 const weekly=exampleCelebration('2026-09-27');
 assert.equal(new Set(daily.map(p=>p.memberId)).size,14);
 assert.equal(new Set(daily.map(p=>p.id)).size,14);
 assert.equal(weekly.length,14);
 for(const p of [...daily,...weekly]) {assert.equal(p.example,true);assert.ok(p.tasks.some(t=>t.kind==='istighfar'));}
});
