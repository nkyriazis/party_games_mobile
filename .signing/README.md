# Release signing

This directory holds the release keystore. Everything here except this README is gitignored.

- `party-games-release.jks`: the signing key (PKCS12, alias `party-games`)
- `signing.env`: the variables the Docker build reads

**Back up both files somewhere safe, such as a password manager.** Every future APK must be signed with this same key, or phones won't accept it as an update. If you later publish on Google Play, this becomes your upload key.

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
