import { expect, test } from "@playwright/test";

test("synchronizes instructor changes and restores monitor state after reconnect", async ({
  browser,
  page,
}) => {
  test.setTimeout(30_000);
  await page.goto("/instructor");

  const joinCode = await page.getByTestId("join-code").textContent();
  expect(joinCode).toMatch(/^[A-Z0-9]{6}$/);

  const monitorContext = await browser.newContext();
  const monitorPage = await monitorContext.newPage();
  await monitorPage.goto(`/monitor/${joinCode}`);
  await expect(monitorPage.getByTestId("monitor-heart-rate")).toHaveText("80");

  await page.getByTestId("heart-rate-input").fill("104");
  await expect(monitorPage.getByTestId("monitor-heart-rate")).toHaveText("104");

  await monitorContext.close();
  await page.getByTestId("heart-rate-input").fill("88");

  const reconnectedMonitorContext = await browser.newContext();
  const reconnectedMonitorPage = await reconnectedMonitorContext.newPage();
  await reconnectedMonitorPage.goto(`/monitor/${joinCode}`);
  await expect(reconnectedMonitorPage.getByTestId("monitor-heart-rate")).toHaveText("88");

  await reconnectedMonitorContext.close();
});
