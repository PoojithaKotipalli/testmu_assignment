import { chromium, expect, firefox, test as base, webkit } from '@playwright/test';

type Diagnostics = {
  console: string[];
  network: string[];
};

type RemoteCapability = {
  browserName: string;
  browserVersion: string;
  platform: string;
  testName: string;
};

const remoteCapabilities: Record<string, RemoteCapability> = {
  'pw-chromium:latest:Windows 10@lambdatest': {
    browserName: 'pw-chromium',
    browserVersion: 'latest',
    platform: 'Windows 10',
    testName: 'TestMu Assignment - Windows 10 Chromium',
  },
  'pw-firefox:latest:MacOS Catalina@lambdatest': {
    browserName: 'pw-firefox',
    browserVersion: 'latest',
    platform: 'MacOS Catalina',
    testName: 'TestMu Assignment - MacOS Catalina Firefox',
  },
};

const browserTypes = { chromium, firefox, webkit };

const test = base.extend<{ diagnostics: Diagnostics }>({
  browser: [async ({ browserName }, use, workerInfo) => {
    const browserType = browserTypes[browserName];
    const remoteCapability = remoteCapabilities[workerInfo.project.name];
    let browser;

    if (remoteCapability) {
      const username = process.env.LT_USERNAME;
      const accessKey = process.env.LT_ACCESS_KEY;

      if (!username || !accessKey) {
        throw new Error('Set LT_USERNAME and LT_ACCESS_KEY before starting TestMu cloud tests.');
      }

      const capabilities = {
        browserName: remoteCapability.browserName,
        browserVersion: remoteCapability.browserVersion,
        'LT:Options': {
          platform: remoteCapability.platform,
          build: 'TestMu AI Certification Assignment',
          name: remoteCapability.testName,
          user: username,
          accessKey,
          network: true,
          video: true,
          console: true,
          visual: true,
        },
      };
      const wsEndpoint = `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify(capabilities))}`;
      browser = await browserType.connect({ wsEndpoint });
    } else {
      browser = await browserType.launch();
    }

    try {
      await use(browser);
    } finally {
      await browser.close();
    }
  }, { scope: 'worker' }],
  diagnostics: [async ({ page }, use, testInfo) => {
    const diagnostics: Diagnostics = { console: [], network: [] };

    page.on('console', (message) => {
      diagnostics.console.push(`${message.type()}: ${message.text()}`);
    });
    page.on('request', (request) => {
      diagnostics.network.push(`${request.method()} ${request.url()}`);
    });
    page.on('requestfailed', (request) => {
      diagnostics.network.push(`FAILED ${request.method()} ${request.url()}`);
    });

    await use(diagnostics);

    await testInfo.attach('console.log', {
      body: diagnostics.console.join('\n'),
      contentType: 'text/plain',
    });
    await testInfo.attach('network.log', {
      body: diagnostics.network.join('\n'),
      contentType: 'text/plain',
    });
  }, { auto: true }],
});

test.afterEach(async ({ page }, testInfo) => {
  if (!remoteCapabilities[testInfo.project.name]) {
    return;
  }

  const status = testInfo.status === 'passed' ? 'passed' : 'failed';
  const remark = testInfo.error?.message ?? 'All assertions passed.';

  try {
    await page.evaluate(
      (_command: string) => {},
      `lambdatest_action: ${JSON.stringify({ action: 'setTestStatus', arguments: { status, remark } })}`,
    );
    const sessionDetails = await page.evaluate(
      (_command: string) => {},
      `lambdatest_action: ${JSON.stringify({ action: 'getTestDetails' })}`,
    );
    await testInfo.attach('testmu-session.json', {
      body: JSON.stringify(sessionDetails, null, 2),
      contentType: 'application/json',
    });
  } catch (error) {
    await testInfo.attach('testmu-session-error.txt', {
      body: String(error),
      contentType: 'text/plain',
    });
  }
});

test('Simple Form Demo echoes the entered message', async ({ page }) => {
  const message = 'Welcome to TestMu AI';

  await page.goto('https://www.testmuai.com/selenium-playground/simple-form-demo/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/simple-form-demo/);
  await page.getByPlaceholder('Please enter your Message').fill(message);
  await page.getByRole('button', { name: 'Get Checked Value' }).click();

  await expect(page.getByText('Your Message:')).toBeVisible();
  await expect(page.getByText(message, { exact: true })).toBeVisible();
});

test('Drag & Drop Sliders sets Default value 15 to 95', async ({ page }) => {
  await page.goto('https://www.testmuai.com/selenium-playground/drag-drop-range-sliders-demo/');
  await page.waitForLoadState('networkidle');

  const sliderGroup = page.getByRole('heading', { name: 'Default value 15' }).locator('xpath=..');
  const slider = sliderGroup.getByRole('slider');
  const bounds = await slider.boundingBox();

  if (!bounds) {
    throw new Error('The Default value 15 slider is not visible.');
  }

  const range = await slider.evaluate((element: HTMLInputElement) => ({
    min: Number(element.min || 0),
    max: Number(element.max || 100),
    value: Number(element.value),
  }));
  const trackInset = bounds.height / 2;
  const trackWidth = bounds.width - trackInset * 2;
  const xForValue = (value: number) =>
    bounds.x + trackInset + ((value - range.min) / (range.max - range.min)) * trackWidth;
  const y = bounds.y + bounds.height / 2;

  await page.mouse.move(xForValue(range.value), y);
  await page.mouse.down();
  await page.mouse.move(xForValue(94), y, { steps: 20 });
  await page.mouse.up();

  await expect(slider).toHaveValue('95');
  await expect(sliderGroup.getByRole('status')).toHaveText('95');
});

test('Input Form Submit validates required fields and submits completed details', async ({ page }) => {
  await page.goto('https://www.testmuai.com/selenium-playground/input-form-demo/');

  const name = page.getByRole('textbox', { name: 'Name' });
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect
    .poll(() => name.evaluate((input: HTMLInputElement) => input.validationMessage))
    .toMatch(/fill/i);

  await name.fill('Taylor Test');
  await page.getByRole('textbox', { name: 'Email*' }).fill('taylor.test@example.com');
  await page.getByPlaceholder('Password').fill('Playwright123!');
  await page.getByRole('textbox', { name: 'Company' }).fill('Example Company');
  await page.getByRole('textbox', { name: 'Website' }).fill('https://example.com');
  await page.getByRole('combobox').selectOption({ label: 'United States' });
  await page.getByRole('textbox', { name: 'City', exact: true }).fill('New York');
  await page.getByPlaceholder('Address 1').fill('123 Example Street');
  await page.getByPlaceholder('Address 2').fill('Suite 4');
  await page.getByPlaceholder('State').fill('New York');
  await page.getByPlaceholder('Zip code').fill('10001');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(
    page.getByText('Thanks for contacting us, we will get back to you shortly.', { exact: true }),
  ).toBeVisible();
});
