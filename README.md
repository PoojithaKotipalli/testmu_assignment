# TestMu Playwright Assignment

This project automates the three Selenium Playground scenarios with Playwright and TypeScript.

## Local Runs

```powershell
npm.cmd test
```

By default, the suite runs locally in Chromium, Firefox, and WebKit. Screenshots, videos, traces, console logs, and network logs are captured for each test.

## TestMu AI Cloud Runs

The cloud configuration runs the suite on Windows 10 with Playwright Chromium and macOS Catalina with Playwright Firefox. TestMu capabilities enable network logs, video, console logs, and screenshots for every command.

In a PowerShell terminal, set the TestMu credentials and enable the cloud configuration. Enter your own values directly in the terminal; do not commit credentials or paste them into chat.

```powershell
$env:LT_USERNAME = "YOUR_TESTMU_USERNAME"
$env:LT_ACCESS_KEY = "YOUR_TESTMU_ACCESS_KEY"
$env:TESTMU_CLOUD = "1"
npm.cmd run test:cloud
```

The HTML report and per-test artifacts are written under `playwright-report/` and `test-results/`. Each cloud test also attaches its TestMu session details when available.

## Scenario Notes

- Simple Form Demo checks the URL, enters a variable-backed message, and verifies the echoed value.
- Drag & Drop Sliders drags the slider labeled `Default value 15` to 95 and checks both the input and displayed status.
- Input Form Submit checks required-field validity, fills every field, selects `United States` by its option text, and verifies the success message.

The current Input Form page uses native browser validation and displays a browser-specific message such as `Please fill out this field`, rather than the assignment's exact `Please fill in the fields` text. The test verifies the native validation message and then submits valid details.

## Submission

Push the project to a private GitHub repository, share it with `admin@testmuaicertifications.com`, and submit the repository URL and TestMu session IDs through the exam portal.