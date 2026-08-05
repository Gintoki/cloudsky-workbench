# Data Model Notes

## Research Agent conversations

`agent_conversations` stores an individual user's conversation header. Every row is scoped by `organization_id` and `user_id`; repository access always filters both values, so one user cannot read another user's history.

`agent_messages` stores ordered user questions and assistant answers. Assistant messages retain the model name and the internal citations returned for that answer. API keys and provider request payloads are never persisted.

`agent_writebacks` links one assistant answer to the single `research_items` draft created from it. The unique message constraint prevents duplicate write-back. It is only available through the `agent.writeback` server-side permission, granted to `DIRECTOR` and `ADMINISTRATOR`.

## Controlled write-back

Research Agent write-back creates a `research_items` row with `status = INBOX`, `confidence = LOW`, source records for the cited internal material, and provenance in `details`. It is a reviewable draft, not a verified fact or an automatically published research conclusion. The existing research-item version and audit-log transaction remains the system of record for the new draft.
