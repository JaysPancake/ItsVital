import { expect, test } from "@playwright/test";

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

  await page.getByTestId("heart-rate-input").fill("104");
  await page.getByTestId("heart-rate-input").press("Enter");
  await expect(monitorPage.getByTestId("monitor-heart-rate")).toHaveText("104");

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
