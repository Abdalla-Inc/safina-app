import json
from safina.domain import ROOT,RULE_VERSION,QUESTIONS
confirmed={
 'overlap':'Actual coverage is a union; labels never create another recitation.',
 'daily':'B and BI have exact daily surah assignments.',
 'bj1':'BJ1 is synchronized by calendar day in approved non-February months.',
 'bj2_day_one':'BJ2 day one is fulfilled by B alone.',
 'monthly_free':'Monthly group day 31 is free; day 1 starts a new cycle.',
 'weekly_reset':'Sunday starts a new cycle, retaining incomplete prior coverage.',
 'weekly_pace':'BJ5 can cover 30 juz in six days; BJ4 needs two extra beyond 4×7.',
 'changes':'Monthly changes same day; weekly changes next Sunday.',
 'full_credit':'An approved complete personal day earns one credit, capped at one.',
 'ship_threshold':'Thirty approved credits complete one ship; carry/presentation remains open.',
 'khatma':'A khatma needs complete actual canonical coverage within a cycle.',
 'privacy':'Reading and calendar are private; publication requires separate consent.',
 'reader':'Observed reader traces and listening never prove actual reading.',
 'dhikr':'Dhikr goals and actual counts never confer reading credit.'}
rules=[]
for key,text in confirmed.items():rules.append({'id':key,'status':'confirmed','text':text,'source':'docs/BACKEND_REQUEST_2026-09-28.md','sourceVersion':'2026-09-28'})
for key,q in QUESTIONS.items():rules.append({'id':key,'status':'proposed' if key in ('partial_credit','ship_carry') else 'open','question':q,'source':'docs/BACKEND_REQUEST_2026-09-28.md','sourceVersion':'2026-09-28'})
for key,text in {'additive_B':'Mandatory second B for overlapping juz','ship_25':'25-credit ship','all_monthly':'Monthly cycles at every tier','next_day':'Next-day-only monthly level changes','blocking_build':'Wait for all open rules before implementing independent core','proposed_fraction_in_code':'Spec pseudocode credit=r is a proposal, not an approved reward'}.items():rules.append({'id':key,'status':'superseded','text':text,'source':'HABIT_ENGINE_SPEC.md / ENGINE_TEST_MATRIX.md','sourceVersion':'v0.1/v0.2','supersededBy':'2026-09-28 backend request'})
(ROOT/'data/program_rules.json').write_text(json.dumps({'version':RULE_VERSION,'authority':'founder','evidence':'supplied master request; no fabricated approval timestamp','rules':rules},indent=2)+'\n')
