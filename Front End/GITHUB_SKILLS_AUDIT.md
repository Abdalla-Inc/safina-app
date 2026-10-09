# GitHub design capability audit — targeted recheck

**28 September 2026 · Research only.** Original recommendations remain [archived](research/archive/2026-09-25/GITHUB_SKILLS_AUDIT.md) and reproduced below as historical evidence. This update changes the ranking to reflect Arabic interaction risk and the expanded scope. Third-party instructions were read as audit material, not applied as instructions for this task. No pack, dependency, font, installer or repository code was installed/executed.

## Ranked recommendation for founder review

| Rank / exact choice | Maintainer, license, version/activity evidence | Files inspected and fit | Adoption condition |
|---|---|---|---|
| **1 — selective platform checklist:** [ehmo/platform-design-skills](https://github.com/ehmo/platform-design-skills) | ehmo; MIT LICENSE inspected. CHANGELOG v1.1.1, March 2026; connector reports changelog modified 19 March. iOS/Android SKILL frontmatter still says 1.0.0 | [iOS](https://github.com/ehmo/platform-design-skills/blob/main/skills/ios/SKILL.md), [Android](https://github.com/ehmo/platform-design-skills/blob/main/skills/android/SKILL.md), [changelog](https://github.com/ehmo/platform-design-skills/blob/main/CHANGELOG.md), LICENSE and repository README. Useful focus, gesture-alternative and native review prompts | Manual, bounded checklist excerpts only after founder review. Pin commit before adoption; verify claims with platform/W3C sources. No wholesale rule activation |
| **2 — optional exploration aid:** [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | NextLevelBuilder; MIT LICENSE inspected. `skill.json` says 2.13.0, modified 6 Sep; CLI package 2.5.0, modified 31 Aug. Earlier audit reported release 2.15.0; release/manifest mapping remains unresolved | [SKILL.md](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md), [search.py](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/src/ui-ux-pro-max/scripts/search.py), [CLI manifest](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/package.json), [init command](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/src/commands/init.ts). Searchable design data, not member research | Defer adoption to authorized visual exploration. Pin matching source/CLI assets, inspect transitive imports and data. Avoid persisted/generated design-system defaults and no global install |
| **3 — conditional web-prototype verification pair:** [dequelabs/axe-core](https://github.com/dequelabs/axe-core) + [microsoft/playwright](https://github.com/microsoft/playwright) | Deque, MPL-2.0; develop manifest 4.13.0, modified 23 Sep. Microsoft, Apache-2.0; main manifest 1.64.0-next, modified 19 Sep; README 24 Sep. These are branch snapshots, **not verified stable releases** | Both README/package/license files inspected. `axe-core` targets HTML accessibility; Playwright supports browser flows. Relevant future files: axe `doc/rule-descriptions.md` and Playwright test configuration | Only if an interactive **web** prototype is selected later. Pin reviewed stable packages/lockfile; inspect browser download and install scripts; use synthetic fixtures. Neither certifies Arabic usability or native iOS/Android accessibility |

Activity dates above are **per-file connector metadata**, not a claim about the repository's latest commit or release. Main/develop links are mutable. No commit SHA or binary integrity was verified; installation is not ready for approval on that evidence alone.

## Findings that change the earlier recommendation

The platform pack's iOS text repeatedly describes back navigation using a physical left edge; that is unsafe to adopt as a universal Arabic gesture rule without platform/locale validation. It also makes categorical menu/layout prescriptions. The Android text favors dynamic wallpaper color; applying that indiscriminately could destabilize historical level categories. These are prompts to review, not authorities over the founder's design or approved semantics. The changelog itself records earlier fabricated/deprecated API corrections. Its bundled scraped Apple HIG PDF has separate provenance concerns; do not redistribute it on the strength of the repository's MIT label.

UI/UX Pro Max contains actual search code and local design data, so it is more than a generic prompt. Its skill advertises Python 3 with no external Python dependencies, but `search.py` imports local `core` and `design_system` modules; those transitive modules/data have not received a complete trust review. The script has persistence/output/force options that can write a generated design system. Its CLI depends on chalk, commander, ora and prompts. The inspected init path supports local/global generation and a legacy release-download path, including optional token handling. No token is needed for this read-only audit; do not grant account or file access just to evaluate style presets.

The earlier first-place visual pack recommendation is therefore narrowed: useful optional inspiration after the design gate, with no authority over Arabic typography, religious copy, research findings or product rules. No tool here replaces a fluent Arabic reviewer, member access, licensed content or signed contracts.

## UI library and font candidates

| Candidate | Exact evidence | Decision |
|---|---|---|
| [callstack/react-native-paper](https://github.com/callstack/react-native-paper) — Callstack, MIT manifest | [README](https://github.com/callstack/react-native-paper/blob/main/README.md) and [package.json](https://github.com/callstack/react-native-paper/blob/main/package.json) inspected; main says **6.0.0-alpha.0**, modified 9 Sep. React/React Native, safe-area, Reanimated and worklets peers; current branch is not a stable default | Defer until stack/direction selection. Inspect actual stable-release peers and [installation guide](https://callstack.github.io/react-native-paper/docs/guides/getting-started), RTL components and theming before proposing installation. A Material library must not decide the visual direction |
| [aliftype/amiri](https://github.com/aliftype/amiri) — Amiri Project Authors, SIL OFL 1.1 | README modified 17 May 2025; describes maturity after v1 in 2022 and no further development planned. README/OFL inspected; build instructions use Python requirements and make | Font candidate, not a skill or complete scripture solution. Prefer an approved released binary after glyph/edition checks; do not execute source build tooling for this audit |
| [dadederk/iOS-Accessibility-Agent-Skill](https://github.com/dadederk/iOS-Accessibility-Agent-Skill) | **Inherited 25 Sep evidence:** MIT, work in progress, no verified release date | Optional iOS checklist only; not re-audited in this targeted update |
| [Community-Access/accessibility-agents](https://github.com/Community-Access/accessibility-agents) | **Inherited evidence:** installer/hooks and version/readme mismatch | Continue deferral; new native/Arabic needs do not justify global hooks |
| Vercel/Anthropic general agent packs | Earlier candidates only; no new file audit | No new recommendation based on popularity |

## Installation/dependency review and integration plan

1. **No adoption required for this research delivery.** The current capabilities were sufficient to inspect public evidence and create Markdown. Do not install a pack merely because it ranks highly.
2. Proposed next use is manual review of the two named ehmo mobile files and selective UI/UX Pro Max exploration references. Before adoption, capture an immutable commit and file hashes, verify license/provenance, review full imported instructions and compare them against Arabic primary guidance. Founder reviews the exact files and integration scope.
3. The ehmo README suggests `npx skills add ehmo/platform-design-skills`; that is an installer invocation with network/file-writing effects, not a read-only command. Its installer dependency was not executed or exhaustively audited. Manual selected-file review is the preferred proposal.
4. UI/UX Pro Max's installer and search engine receive separate reviews. Check extraction paths, overwrite/global modes, hooks, network/token handling, bundled assets and local-module imports. No unpinned “latest” or `--force` execution is proposed.
5. If the later prototype is web-based, review pinned `@playwright/test` and `axe-core` packages, dependency/license notices and browser installation. Use a disposable test profile; do not embed private member records or store authenticated traces in review artifacts. Native platform testing remains separate.
6. Target stack, design-tool choice and budget are not confirmed. Keep React Native Paper, fonts and audio/player libraries conditional. Record accepted/rejected recommendations and reasons at the design gate; no new dependency should silently become architecture.

This is a bounded source review, not an exhaustive security audit. Unreviewed transitive code, mutable branch links and unverified release alignment remain explicit blockers to **installation**, not to completing research.

---

# Historical GitHub capability audit — 25 September 2026

The original ranking and version claims below are retained for provenance; the narrower recommendation above takes precedence.

**25 September 2026.** Public repository pages, release/changelog, README and installation instructions were inspected. No third-party code or agent pack was installed or executed. Review of repository text is not a security audit; pin an exact revision and inspect transitive dependencies before any adoption.

## Ranked recommendations

| Rank and exact repository | Maintainer / license / activity | Relevant files and installation | Benefit, limitation and adoption condition |
|---|---|---|---|
| 1. [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | NextLevelBuilder; MIT; [v2.15.0 release](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/releases) shown 13 Aug 2026. Main `skill.json` may lag release version. | `.claude/skills/ui-ux-pro-max/SKILL.md`, `src/ui-ux-pro-max/scripts/search.py`, `skill.json`; README documents `uipro init --ai codex`, which writes an agent skill. Search script uses Python, described without external Python deps. | Useful structured prompts/search for multiple visual directions, typography and UX review. Its presets cannot validate Arabic, religious tone or user outcomes. **Condition:** pin a reviewed release commit; read skill, installer writes and search data first; use as read-only inspiration before considering integration. |
| 2. [`ehmo/platform-design-skills`](https://github.com/ehmo/platform-design-skills) | ehmo; MIT; [CHANGELOG](https://github.com/ehmo/platform-design-skills/blob/main/CHANGELOG.md) records v1.1.1 March 2026. v1.1.0 corrected fabricated/deprecated API and touch-target references. | `skills/ios/SKILL.md`, `skills/android/SKILL.md`, per-platform `metadata.json` and `rules/`; README suggests `npx skills add ehmo/platform-design-skills`. | A useful platform pattern checklist for handoff across iOS and Android. Some Apple HIG material is scraped/compiled; source provenance and currency are concerns. **Condition:** pin version, inspect included assets and installer, check each claim against live [Apple](https://developer.apple.com/design/human-interface-guidelines/right-to-left), [Android](https://developer.android.com/guide/topics/ui/accessibility/apps) and [W3C](https://www.w3.org/TR/wcag/) guidance; avoid copying proprietary compiled text. |
| 3. [`dadederk/iOS-Accessibility-Agent-Skill`](https://github.com/dadederk/iOS-Accessibility-Agent-Skill) | Daniel Devesa Derksen-Staats; MIT; three commits visible, no verified release date/tag; maintainer labels it work in progress. | `ios-accessibility/SKILL.md`; README gives `npx skills add dadederk/iOS-Accessibility-Agent-Skill --skill ios-accessibility` or manual placement. | Focused prompts for VoiceOver, Dynamic Type and reduced motion. **Condition:** use only if iOS is in scope, inspect exact revision, pair with Android/TalkBack testing and real Arabic screen-reader users; do not treat a prompt checklist as an audit. |

## Conditional tools and rejected defaults

| Repository | What it offers | Decision now |
|---|---|---|
| [`Community-Access/accessibility-agents`](https://github.com/Community-Access/accessibility-agents), MIT, [releases](https://github.com/Community-Access/accessibility-agents/releases) show v6.0 on 15 Jun 2026; README references v7 refactor | `skills/`, `scripts/install.mjs`, `mcp-server/`, package lock; `npm install` and installer dry-run; broader web accessibility agents and hooks. | Defer. Version/readme mismatch, global skill writes and hooks that can block edits/final responses demand a separate trust review. Web emphasis does not replace native Arabic VoiceOver/TalkBack tests. |
| [`callstack/react-native-paper`](https://github.com/callstack/react-native-paper), MIT, actively released | React Native Material UI components, RTL support and native dependencies. | Conditional library only if engine/implementation team chooses React Native and the selected visual direction fits; assess bundle, theming, RTL and actual native behavior then. No stack is approved. |
| [`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills) web design guidance; [`anthropics/skills`](https://github.com/anthropics/skills) accessibility-related examples | General web review prompts or WCAG-oriented checklists. | Do not rank as a mobile research capability merely because they are popular. Their live rules, device coverage and Arabic validation need separate verification. |

## Integration plan for founder review

1. Approve **read-only evaluation** of #1 and #2 at named commits, with exact source files, license and installer script review. No automatic third-party execution or replacement of platform documentation.
2. Use #1 only to widen later visual exploration and #2 only as a checklist; compare recommendations against this brief, approved engine contract and current primary platform guidance. If iOS is confirmed, optionally review #3.
3. Request repository access and target platform/stack from the implementation owner before selecting a UI library or adding dependencies. Prototype in the approved design tool without assuming React Native, Flutter or a 3D engine.
4. Before any install, review file-writing scope, scripts/hooks, network calls, dependency lockfiles and licenses at a pinned revision. Founder sees the exact proposed integration and access needs first. No package can certify Qur’anic content, Arabic copy or devotional fit.

Repositories and release pages were consulted on the audit date; their main branches and install commands can change. A recommendation here is permission to inspect, **not** permission to install.
