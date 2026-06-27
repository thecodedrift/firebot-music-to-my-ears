## ADDED Requirements

### Requirement: Skip Track Effect
The script SHALL provide a Skip Track effect that advances Spotify to the next track.

#### Scenario: Skipping with an active device
- **WHEN** the Skip Track effect runs and an active Spotify device is available
- **THEN** playback advances to the next track and the effect outputs `success: true`

#### Scenario: No active device
- **WHEN** the Skip Track effect runs and no active device is available (or the account is not Premium)
- **THEN** the effect outputs `success: false` and `errorReason` of `no-active-device` or `not-premium`

### Requirement: Play and Pause Effects
The script SHALL provide Play/Resume and Pause effects that control Spotify playback.

#### Scenario: Resuming or pausing
- **WHEN** the Play/Resume (or Pause) effect runs and an active device is available
- **THEN** playback resumes (or pauses) and the effect outputs `success: true`

#### Scenario: No active device
- **WHEN** the effect runs and no active device is available (or the account is not Premium)
- **THEN** the effect outputs `success: false` and `errorReason` of `no-active-device` or `not-premium`

### Requirement: Get Current Track Effect
The script SHALL provide a Get Current Track effect that outputs the currently playing track's
metadata and its requester.

#### Scenario: A track is playing
- **WHEN** the Get Current Track effect runs while a track is playing
- **THEN** it outputs `trackName`, `artistName`, `trackUri`, and `isPlaying: true`
- **AND** `requestedBy` is the ledger's recorded requester for that URI, or empty if the track was not a request

#### Scenario: Nothing is playing
- **WHEN** the Get Current Track effect runs while nothing is playing
- **THEN** it outputs `isPlaying: false` and empty track fields
