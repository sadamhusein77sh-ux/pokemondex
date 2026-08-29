# Building Pokemondex into Android & iOS Apps

This project is an **Ionic + Angular** application wrapped with **Capacitor**, which lets you ship the same web codebase as a native mobile app. Below is a complete step-by-step guide for building, running, and shipping Android and iOS binaries.

---

## 0. Prerequisites

Install these tools on your machine before you start.

| Tool | Version | Why |
|------|---------|-----|
| **Node.js** | ≥ 20 LTS | Runs the Angular/Ionic/Capacitor build tooling |
| **npm** | ≥ 10 | Package manager (ships with Node) |
| **Java JDK** | 17 (LTS) | Required by Android Gradle |
| **Android Studio** | Hedgehog (2023.1) or newer | SDK, emulator, and APK/AAB signing |
| **Android SDK** | API 34+ (compileSdk 34/35) | Native build target |
| **Xcode** | 15+ (macOS only) | iOS build, simulator, and signing |
| **CocoaPods** | latest | Pulls iOS native dependencies |
| **Ionic CLI** *(optional)* | `npm i -g @ionic/cli` | Convenience commands |

Verify your toolchain:

```bash
node -v
npm -v
java -version
```

---

## 1. First-Time Setup in the Project

From the project root (`pokemondex/`):

```bash
# Install JS dependencies
npm install

# Add the iOS and Android native platforms (only once per machine/repo)
npx cap add android
npx cap add ios
```

This creates:

- `android/` — native Android Studio project
- `ios/` — native Xcode project

---

## 2. Build the Web Bundle

Capacitor copies the static `www/` output into each native shell, so always build the web app **first**:

```bash
# Production build (minified, tree-shaken, AOT)
npm run build
```

The build output is emitted to `www/` (matching `capacitor.config.ts → webDir`).

For quick local testing you can use a development build:

```bash
npm run build -- --configuration=development
```

---

## 3. Sync Web Assets into Native Projects

Every time the web bundle changes, push it into the native shells:

```bash
npx cap sync
```

What `cap sync` does:

1. Copies `www/` → `android/app/src/main/assets/public` and `ios/App/App/public`.
2. Installs/updates Capacitor plugins (e.g. `@capacitor/status-bar`) on each platform.
3. Refreshes plugin registrations.

Use `npx cap copy` if you **only** need the web assets (faster), or `npx cap update` if you only changed plugin versions.

---

## 4. Run on Android

### 4.1 Run on an emulator / connected device (debug)

```bash
npx cap open android          # opens Android Studio
# OR
npx cap run android           # builds + installs + launches on the first connected device
```

Inside Android Studio:

1. Wait for Gradle sync to finish.
2. Pick a device from the device dropdown.
3. Press the green **Run ▶** button.

### 4.2 Build a debug APK from CLI

```bash
cd android
./gradlew assembleDebug
# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.3 Build a release AAB for the Play Store

1. Create a release keystore (only once):

   ```bash
   keytool -genkey -v -keystore pokemondex-release.keystore \
     -alias pokemondex -keyalg RSA -keysize 2048 -validity 10000
   ```

2. In **Android Studio**: `Build → Generate Signed App Bundle / APK…`
   - Choose **Android App Bundle** (required for Play Store).
   - Point to your keystore and enter passwords.
   - Select `release` variant.

3. Or from CLI:

   ```bash
   cd android
   ./gradlew bundleRelease
   # AAB output: android/app/build/outputs/bundle/release/app-release.aab
   ```

4. Upload the `.aab` to Google Play Console.

### 4.4 Common Android tweaks

- **App ID / Name** → `android/app/build.gradle` (`applicationId`, `versionCode`, `versionName`) and `android/app/src/main/AndroidManifest.xml`.
- **Status bar / splash** → controlled from `capacitor.config.ts` and `resources/`.

---

## 5. Run on iOS (macOS only)

### 5.1 Install CocoaPods dependencies (only first time or after plugin changes)

```bash
cd ios
pod install
cd ..
```

### 5.2 Open in Xcode

```bash
npx cap open ios
```

Inside Xcode:

1. Select the **App** target → **Signing & Capabilities**.
2. Pick your **Team** (auto-sign with a personal Apple ID is fine for dev).
3. Choose a simulator or a connected device.
4. Press **Run ▶**.

### 5.3 Build from CLI (alternative)

```bash
npx cap run ios
```

### 5.4 Build a release IPA for App Store / TestFlight

1. In Xcode: **Product → Archive**.
2. When the Organizer opens, choose **Distribute App**.
3. Pick the distribution method:
   - **App Store Connect** → upload for TestFlight / release.
   - **Ad Hoc** → install on registered devices.
   - **Development** → internal team testing.
4. Follow the wizard; Xcode handles signing with your selected Team.

### 5.5 Common iOS tweaks

- **Bundle ID / Display Name** → Xcode target settings → **General** (`Identity`, `Display Name`).
- **Info.plist** → `ios/App/App/Info.plist` for permissions (camera, location, etc.).
- **Universal / iPhone-only** → Target → **Deployment Info**.

---

## 6. One-Command Helper (optional)

Add a convenience script to `package.json`:

```json
"scripts": {
  "build:android": "ng build && cap sync android && cap open android",
  "build:ios":     "ng build && cap sync ios && cap open ios"
}
```

Then run:

```bash
npm run build:android
npm run build:ios
```

---

## 7. Typical End-to-End Workflow

```bash
# 1. Develop / change code
npm run start                  # local browser preview at http://localhost:4200

# 2. Ship a new native build
npm run build                  # rebuild www/
npx cap sync                   # push assets + plugin updates

# 3a. Android release
cd android && ./gradlew bundleRelease

# 3b. iOS release
npx cap open ios               # then Product → Archive
```

---

## 8. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `capacitor.config.ts` changes ignored | Run `npx cap sync` again |
| New plugin not present in app | `npm install <plugin>` → `npx cap sync` |
| Android Gradle errors after upgrade | `cd android && ./gradlew clean` |
| iOS build can't find pods | `cd ios && pod install --repo-update` |
| White screen on launch | Make sure `webDir` in `capacitor.config.ts` points to `www` and the build succeeded |
| CORS / network errors on device | The API must allow the device origin; use HTTPS |

---

## 9. Resources

- Capacitor docs: https://capacitorjs.com/docs
- Ionic Angular guide: https://ionicframework.com/docs/angular
- Android publishing: https://developer.android.com/studio/publish
- App Store submission: https://developer.apple.com/app-store/submissions/

Happy shipping! 🚀