# song-requests

## Purpose
Defines the Request Song effect and the moderation, filtering, no-repeat, and requester-attribution rules that govern viewer song requests.

## Requirements

### Requirement: Request Song Effect
The script SHALL provide a single Request Song effect that, in one atomic invocation, searches
Spotify for tracks only, applies moderation, and adds the matched track to the Spotify playback
queue. It SHALL output a single `success` flag and, on failure, an `errorReason` identifying the
stage that failed.

#### Scenario: Successful request
- **WHEN** the Request Song effect runs with a query that matches a track passing all moderation, and an active device is available
- **THEN** the track is added to the Spotify playback queue
- **AND** the effect outputs `success: true` with `trackUri`, `trackName`, and `artistName` populated

#### Scenario: No result
- **WHEN** the search returns no track
- **THEN** the effect outputs `success: false` and `errorReason: not-found`

#### Scenario: Podcasts excluded
- **WHEN** the query would otherwise match a podcast or episode
- **THEN** it is not returned, because search is limited to `type=track`

#### Scenario: Single branch point for the streamer
- **WHEN** the request fails at any stage (search, moderation, or queue)
- **THEN** the failure is reported through the one `success: false` output with a specific `errorReason`, so the streamer can branch (e.g. refund a redemption) with a single condition

### Requirement: Substring Moderation
The Request Song effect SHALL reject a matched track when any configured blocked term appears, as a
case-insensitive substring, in the track's artist name or track name. The blocked-terms parameter
SHALL ship pre-filled with the editable default terms `karaoke`, `instrumental`, and `inst.`.

#### Scenario: Blocked term present
- **WHEN** a matched track's artist or track name contains a configured blocked term as a substring (case-insensitive)
- **THEN** the effect outputs `success: false` and `errorReason: blocked-term`
- **AND** the track is not queued

#### Scenario: Default blocked terms
- **WHEN** the streamer has not modified the blocked-terms parameter
- **THEN** `karaoke`, `instrumental`, and `inst.` are in effect as default blocked terms

### Requirement: Explicit Track Filter
The Request Song effect SHALL expose a per-effect "allow explicit tracks" checkbox (default off).
When it is off, a matched track whose Spotify `explicit` field is true SHALL be rejected.

#### Scenario: Explicit track blocked
- **WHEN** the "allow explicit tracks" checkbox is off and a matched track is marked explicit
- **THEN** the effect outputs `success: false` and `errorReason: explicit`
- **AND** the track is not queued

#### Scenario: Explicit track allowed
- **WHEN** the "allow explicit tracks" checkbox is on
- **THEN** an explicit track is not rejected on the basis of being explicit

### Requirement: No-Repeat Window
The Request Song effect SHALL reject a matched track whose URI was queued within the configured
no-repeat window. The no-repeat check and the ledger write SHALL occur within the same atomic
effect invocation so the same track cannot pass the check twice before being recorded.

#### Scenario: Recently queued
- **WHEN** a matched track's URI was recorded in the ledger within the no-repeat window
- **THEN** the effect outputs `success: false` and `errorReason: recently-played`
- **AND** the track is not queued again

### Requirement: Queue Failure Reporting
When moderation passes but the track cannot be queued, the Request Song effect SHALL report the
failure without recording the track in the ledger.

#### Scenario: No active device or not Premium
- **WHEN** moderation passes but no active device is available, or the account is not Premium
- **THEN** the effect outputs `success: false` and `errorReason` of `no-active-device` or `not-premium`
- **AND** nothing is written to the ledger

### Requirement: Requester Ledger
The script SHALL maintain an in-memory ledger mapping a track URI to its requester and the time it
was queued, used for the no-repeat check and for requester attribution. The ledger SHALL be written
only on a successful queue, SHALL NOT be persisted across restarts, and SHALL be cleared on
`stop()`.

#### Scenario: Recorded on successful queue
- **WHEN** the Request Song effect successfully queues a track
- **THEN** the track's URI, requester (from the effect trigger), and a timestamp are recorded in the ledger

#### Scenario: Cleared on teardown
- **WHEN** the script stops
- **THEN** the ledger is cleared
