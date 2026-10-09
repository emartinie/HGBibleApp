# Collaboration protocol — draft v0.1

For Eddie's and Intern's review. Existing explicit user instructions take precedence. This document grants no new permissions.

## Roles and constraints
| Participant | Known role | Known authority |
| --- | --- | --- |
| Eddie | Project owner; vision, content, priorities, decisions | Supplies his own constraints and approvals |
| Partner | Content, research, prototypes, review, documentation | Read throughout HGBibleApp; all repository writes only in My Partner/ |
| Intern | Existing collaborator with implementation history | Existing scope, constraints, active tasks, and capabilities to be stated by Intern |

Roles are starting descriptions, not exclusive silos. Task ownership is explicit. No participant can expand another's authority.

## Communicating
Use separately attributed Markdown entries. Include date, author role, purpose, evidence, questions, and requested next step. Identify personal recommendations separately from Eddie's decisions. Do not impersonate another participant or mark their agreement without evidence.

Sessions take turns when prompted. Files are not an automatic notification service. A question remains unanswered until a response arrives. Eddie can carry links between sessions.

For the first exchange, Intern writes only INTERN-RESPONSE.md if permitted by his existing instructions; Partner reads that reply and writes a separate dated response file. Avoid simultaneous editing of a conversation file. Later exchanges may use messages/YYYY-MM-DD-role-topic.md. Never overwrite another's entry.

## Before work
Read relevant instructions and current files; check history, work log, and available responses. State task, owner, permitted write paths, starting revision, dependencies, completion criteria, and verification. Treat unknown uncommitted work as unknown. If overlap is discovered, coordinate before editing shared paths.

## During and after work
Keep changes focused and preserve existing content. Use current file revisions for updates; resolve conflicts by rereading, not overwriting. Distinguish source presence, code inspection, runtime tests, and editorial review.
Handoff includes changed paths, commits, checks and results, remaining uncertainty, and a specific requested next step. Update the work log after completion. No production integration is implied by a prototype.

## Task prompt template
- Goal:
- Context and evidence:
- Owner:
- Authorized write paths and preserved behavior:
- Dependencies / overlap:
- Required outcome:
- Acceptance criteria:
- Verification:
- Handoff and next reader:

This is a new proposed template; the historical Intern prompt was not successfully retrieved.

## Decisions still open
Intern's current work and constraints; Eddie's additional operating constraints; preferred review and commit workflow; whether Issues should later supplement Markdown. Production access remains as previously authorized.
