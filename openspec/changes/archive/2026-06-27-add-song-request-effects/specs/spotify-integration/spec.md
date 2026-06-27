## ADDED Requirements

### Requirement: Spotify Account Linking
The script SHALL register a Firebot integration that links a Spotify account through Firebot's
OAuth UI and refreshes the access token automatically.

#### Scenario: Linking an account
- **WHEN** the streamer enters their Spotify client id/secret and links the account in Firebot
- **THEN** Firebot completes the OAuth flow and stores the tokens
- **AND** an expired access token is refreshed automatically before the next API call

#### Scenario: Explanatory configuration page
- **WHEN** the script configuration page is shown
- **THEN** it explains that authentication is performed by linking the account (not from inside Firebot prompts) and where to obtain the client id/secret

### Requirement: Authenticated API Client
The script SHALL expose a single API helper that injects the Spotify base URL and current bearer
token and raises a typed error on non-OK responses.

#### Scenario: Calling the API
- **WHEN** an effect calls the Spotify API helper
- **THEN** the request includes the current bearer token and Spotify base URL
- **AND** a non-2xx response raises a typed error carrying the HTTP status

### Requirement: Configuration Parameters
The script SHALL expose configuration parameters for the Spotify client id/secret, a blocked-terms
list, and a no-repeat window.

#### Scenario: Applying saved parameters
- **WHEN** the streamer saves the parameters
- **THEN** the blocked-terms list and no-repeat window are applied to subsequent song requests
