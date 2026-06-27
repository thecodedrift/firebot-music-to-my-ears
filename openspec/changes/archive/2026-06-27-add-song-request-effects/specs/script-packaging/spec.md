## ADDED Requirements

### Requirement: Single-File CommonJS Bundle
The build SHALL produce exactly one self-contained CommonJS `.js` file whose default export is the
Firebot script object, with the public function names `run`, `getScriptManifest`, and
`getDefaultParameters` preserved (not mangled).

#### Scenario: Building the script
- **WHEN** the build runs
- **THEN** a single `.js` file is emitted with no code-splitting and no separate license file
- **AND** the bundle's default export exposes `run`, `getScriptManifest`, and `getDefaultParameters` under their original names

### Requirement: Namespaced Registration IDs
Every effect registered by the script SHALL have an id namespaced as `music-to-my-ears:<name>`.

#### Scenario: Registering an effect
- **WHEN** an effect is registered during `run()`
- **THEN** its definition id is prefixed with `music-to-my-ears:`

### Requirement: Lifecycle Teardown
Everything registered or started during `run()` SHALL be unregistered, cancelled, or cleared during
`stop()`.

#### Scenario: Stopping the script
- **WHEN** Firebot calls `stop()`
- **THEN** every effect registered in `run()` is unregistered
- **AND** all in-memory state (including the requester ledger) is cleared
