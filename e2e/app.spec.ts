import { expect, test, type Locator } from "@playwright/test";

async function canvasHasRenderedPixels(canvas: Locator, channel: string) {
  return canvas.evaluate((element, waveformChannel) => {
    const drawing = element as HTMLCanvasElement;
    const context = drawing.getContext("2d");

    if (!context || drawing.width === 0 || drawing.height === 0) {
      return false;
    }

    const pixels = context.getImageData(0, 0, drawing.width, drawing.height).data;

    for (let index = 0; index < pixels.length; index += 16) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];

      const isWaveformPixel =
        (waveformChannel === "ecg" && green > 150 && green > red + 40 && green > blue + 20) ||
        (waveformChannel === "pleth" && blue > 180 && blue > red + 50 && green > 120) ||
        (waveformChannel === "capnography" && red > 180 && green > 150 && blue < 160);

      if (isWaveformPixel) {
        return true;
      }
    }

    return false;
  }, channel);
}

test("synchronizes instructor changes and restores monitor state after reconnect", async ({
  browser,
  page,
}) => {
  test.setTimeout(30_000);
  await page.goto("/instructor");

  const joinCode = await page.getByTestId("join-code").textContent();
  expect(joinCode).toMatch(/^[A-Z0-9]{6}$/);

  const localMonitorPagePromise = page.context().waitForEvent("page");
  await page.getByRole("link", { name: "Open local monitor view" }).click();
  const localMonitorPage = await localMonitorPagePromise;
  await expect(page.getByRole("heading", { name: "Session controls" })).toBeVisible();
  await expect(localMonitorPage.getByRole("heading", { name: "ItsVital" })).toBeVisible();
  await localMonitorPage.close();

  const monitorContext = await browser.newContext();
  const monitorPage = await monitorContext.newPage();
  await monitorPage.goto(`/monitor/${joinCode}`);
  await expect(monitorPage.getByTestId("monitor-heart-rate")).toHaveText("80");

  for (const channel of ["ecg", "pleth", "capnography"]) {
    const canvas = monitorPage.getByTestId(`${channel}-waveform`);
    await expect(canvas).toBeVisible();
    await expect.poll(() => canvasHasRenderedPixels(canvas, channel)).toBe(true);
  }

  await expect(monitorPage.getByText(/Revision 0\./)).toBeVisible();
  await monitorPage.getByLabel("50 mm/s").check();
  await monitorPage.getByTestId("grid-toggle").uncheck();
  await monitorPage.getByLabel("ECG gain").selectOption("2");
  await expect(monitorPage.getByText(/Revision 0\./)).toBeVisible();

  await monitorPage.setViewportSize({ width: 390, height: 844 });
  for (const channel of ["ecg", "pleth", "capnography"]) {
    const box = await monitorPage.getByTestId(`${channel}-waveform`).boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      expect(box.width).toBeGreaterThan(100);
      expect(box.height).toBeGreaterThan(50);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }
  }
  await monitorPage.setViewportSize({ width: 1280, height: 720 });

  await page.getByTestId("heart-rate-input").fill("104");
  await page.getByTestId("heart-rate-input").press("Enter");
  await expect(monitorPage.getByTestId("monitor-heart-rate")).toHaveText("104");

  await page.getByTestId("student-operated-mode").click();
  await expect(page.getByTestId("student-operated-mode")).toBeChecked();
  await expect(monitorPage.getByRole("button", { name: "Activate ECG" })).toBeVisible();
  await expect(monitorPage.getByTestId("monitor-heart-rate")).toHaveText("--");
  await expect(monitorPage.getByTestId("monitor-blood-pressure")).toHaveText("--/--");

  await monitorPage.getByRole("button", { name: "Activate ECG" }).click();
  await monitorPage.getByRole("button", { name: "Activate SpO2" }).click();
  await monitorPage.getByRole("button", { name: "Activate CO2" }).click();
  await expect(monitorPage.getByTestId("monitor-heart-rate")).toHaveText("104");

  await monitorPage.getByTestId("nibp-capture").click();
  await expect(monitorPage.getByTestId("monitor-blood-pressure")).toHaveText("120/80");
  await page.getByTestId("systolic-input").fill("130");
  await page.getByTestId("systolic-input").press("Enter");
  await expect(monitorPage.getByTestId("monitor-blood-pressure")).toHaveText("120/80");
  await monitorPage.getByTestId("nibp-capture").click();
  await expect(monitorPage.getByTestId("monitor-blood-pressure")).toHaveText("130/80");

  await page.getByLabel("Instructor managed").click();
  await expect(page.getByLabel("Instructor managed")).toBeChecked();
  await expect(monitorPage.getByRole("button", { name: "Activate ECG" })).toHaveCount(0);
  await expect(monitorPage.getByTestId("monitor-blood-pressure")).toHaveText("130/80");

  const bloodPressureBox = await monitorPage.getByTestId("monitor-blood-pressure").boundingBox();
  const bloodPressureCardBox = await monitorPage
    .getByTestId("monitor-blood-pressure")
    .locator("..")
    .boundingBox();

  expect(bloodPressureBox).not.toBeNull();
  expect(bloodPressureCardBox).not.toBeNull();

  if (bloodPressureBox && bloodPressureCardBox) {
    expect(bloodPressureBox.x + bloodPressureBox.width).toBeLessThanOrEqual(
      bloodPressureCardBox.x + bloodPressureCardBox.width + 1,
    );
  }

  await monitorContext.close();
  await page.getByTestId("heart-rate-input").fill("88");
  await page.getByTestId("heart-rate-input").press("Enter");

  const reconnectedMonitorContext = await browser.newContext();
  const reconnectedMonitorPage = await reconnectedMonitorContext.newPage();
  await reconnectedMonitorPage.goto(`/monitor/${joinCode}`);
  await expect(reconnectedMonitorPage.getByTestId("monitor-heart-rate")).toHaveText("88");

  await reconnectedMonitorContext.close();
});
