# Release signing

This directory holds the release keystore. Everything here except this README is gitignored.

- `party-games-release.jks`: the signing key (PKCS12, alias `party-games`)
- `signing.env`: the variables the Docker build reads

Every future APK must be signed with this same key, or phones won't accept it as an update. If the app is published on Google Play, this is the upload key.

## Where the backups are

The key is never committed. The maintainer keeps offline copies, stored separately so neither one is useful alone:

- **Keystore file:** the maintainer's private Google Drive, folder `party-games-signing`
- **Password:** the maintainer's password manager, entry `github.com/nkyriazis/party_games_mobile` (username = key alias)
- **CI copy:** the repository secrets (write-only, so they can't be used as a backup)

To check that a restored keystore is the right one, compare its certificate with the one below. The fingerprint is public, since every released APK contains it:

```
SHA-256: cd:05:6e:ad:9b:8b:13:7b:cc:7b:37:8d:ba:e4:cd:26:c0:78:7a:5c:86:d8:a9:a6:97:79:70:d5:24:ea:f4:86
keytool -list -v -keystore party-games-release.jks -alias party-games   # prints it (asks for the password)
```

## Restore on a new machine

1. Download `party-games-release.jks` from Drive into `.signing/`.
2. Create `.signing/signing.env` with the password from the password manager:
   ```
   ANDROID_KEYSTORE_FILE=/app/.signing/party-games-release.jks
   ANDROID_KEYSTORE_PASSWORD=<password>
   ANDROID_KEY_ALIAS=party-games
   ANDROID_KEY_PASSWORD=<password>
   ```

## Local signed build

```bash
docker compose --env-file .signing/signing.env run --rm android-build
```

Without `--env-file`, the build produces a debug APK instead.

## CI

`.github/workflows/android.yml` gets the same key from these repository secrets:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 .signing/party-games-release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | from `signing.env` |
| `ANDROID_KEY_ALIAS` | `party-games` |

If the secrets are missing, CI falls back to a debug APK.
