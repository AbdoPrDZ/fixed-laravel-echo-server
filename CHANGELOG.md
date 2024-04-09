# 1.6.3

## Fixed

- Security patch - update dependencies

# 1.6.2

## Added

- Add method to stop the server (#502)[https://github.com/tlaverdure/laravel-echo-server/pull/502]
- Document how to use Redis Sentinel (#437)[https://github.com/tlaverdure/laravel-echo-server/pull/437]
- Add Apache proxt example tp docs (#361)[https://github.com/tlaverdure/laravel-echo-server/pull/361]
- Expose user member user info in API. (#356)[https://github.com/tlaverdure/laravel-echo-server/pull/356]

## Fixed

- Fix crash when invalid referer is sent (#513)[https://github.com/tlaverdure/laravel-echo-server/pull/513]

# 1.6.1

- Update dependencies for security reasons.

# 1.6.0

Add support for Redis prefixing.

# 1.5.0

Add `stop` command

# 1.3.7

Allow variables in .env file to set options in the server configuration.

### Updates

- Auth Host: `LARAVEL_ECHO_SERVER_AUTH_HOST` _Note_: This option will fall back to the `LARAVEL_ECHO_SERVER_HOST` option as the default if that is set in the .env file.

- _Host_: `LARAVEL_ECHO_SERVER_HOST`

- _Port_: `LARAVEL_ECHO_SERVER_PORT`

- _Debug_: `LARAVEL_ECHO_SERVER_DEBUG`

# 1.3.3

Return a better error when member data is not present when joining presence channels.

# 1.3.2

Added CORS support to the HTTP API.

# 1.2.9

Updated to socket.io v2

# 1.2.0

## Upgrade Guide

- Re-install laravel-echo-server globally using the command.

```shell
npm install -g laravel-echo-server
```

- In your `laravel-echo-server.json` file, remove the section named `referrers`. Then follow the [instructions](https://github.com/tlaverdure/laravel-echo-server#api-clients) to generate an app id and key. The `referrers` section has been replaced with `clients`.

# Abdo Pr Part

- This My Changes part

# 0.0.1

- Upgrade Socket.io Version to 4.7.1.

# 0.0.2

- Send private channel auth data by event ("channel_subscribe_success").

# 0.0.3

- Fix some bugs.
- Change welcome message.
- Add FirebaseAdmin service.

# 0.0.4

- change default "laravel-echo-server.json" to "fixed-laravel-echo-server.json"

# 0.0.5-beta

- Replace request package with axios.
- Upgrade some packages versions.

# 0.0.6-beta

- Fix firebase admin config file error.

# 0.0.7-beta

- Upgrade some packages versions.
- Pass socket id with channel auth request form data.
- Add client connect and disconnect endpoints to truck client connection status.
- Edit some functions documentations.
- Clean the code.

# 0.0.8

- Pass channels auth headers automatically in client connect/disconnect requests.

# 0.0.9

- Log firebase-admin messaging response.

# 0.1.0

- Replace 'OK' response message to json response.
- Clean the code.
- Fix url query parameters
- Fix getChannel, getChannels functions
