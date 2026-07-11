import { expect, test } from "@playwright/test";

test("opens the training application and instructor route", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "ItsVital" })).toBeVisible();
  await expect(page.getByText(/Training tool only/)).toBeVisible();

  await page.getByRole("link", { name: "Instructor" }).click();
  await expect(page.getByRole("heading", { name: "Instructor" })).toBeVisible();
});
