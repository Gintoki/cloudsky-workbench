import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "登录工作台" })).toBeVisible();
  const response = await page.request.post("/api/auth/login", {
    data: { email, password: "DemoOnly!2026" },
  });
  expect(response.status()).toBe(200);
  await page.goto("/");
  await expect(page).toHaveURL("/", { timeout: 15_000 });
}

test("Director can open the Intelligence OS command center", async ({ page }) => {
  await login(page, "director@cloudsky.demo");
  await expect(
    page.getByRole("heading", { name: "Command Center" }),
  ).toBeVisible();
  await expect(page.getByText("PUBLIC MARKET DATA")).toBeVisible();
  await expect(page.getByText("INDUSTRY INTELLIGENCE")).toBeVisible();
});

test("Viewer only sees approved facts and cannot read audit logs", async ({
  page,
}) => {
  await login(page, "viewer@cloudsky.demo");
  await page.goto("/facts");
  await expect(
    page.getByRole("heading", { name: "公司事实库" }),
  ).toBeVisible();
  await expect(page.locator("tbody").getByText("Pending Review")).toHaveCount(0);

  const response = await page.request.post(
    "/api/facts/10000000-0000-4000-8000-000000000003/transition",
    { data: { status: "PENDING_REVIEW" } },
  );
  expect(response.status()).toBe(403);

  await page.goto("/audit");
  await expect(page.getByRole("heading", { name: "权限不足" })).toBeVisible();
});

test("Analyst can create a sourced draft fact", async ({ page }) => {
  await login(page, "analyst@cloudsky.demo");
  await page.goto("/facts");
  await page.getByRole("button", { name: "新建事实" }).click();
  await page.getByLabel("一级分类 *").selectOption("技术");
  await page.getByLabel("事实标题 *").fill("E2E 权限与来源测试事实");
  await page
    .getByLabel("事实内容 *")
    .fill("这是一个完全虚构的 E2E 测试事实，只用于验证创建流程。");
  await page.getByLabel("统计口径 *").fill("E2E 自动化测试口径");
  await page.getByLabel("数据所属期间").fill("2026 Q2（Demo）");
  await page.getByLabel("信息来源 *").fill("E2E Demo Source");
  await page
    .getByLabel("原文引用")
    .fill("此引用为自动化测试生成，不代表真实公司资料。");
  await page.getByRole("button", { name: "保存 Draft" }).click();
  await expect(
    page.locator("tbody").getByText("E2E 权限与来源测试事实"),
  ).toBeVisible();
});

test("Viewer can filter intelligence and open a sourced detail", async ({
  page,
}) => {
  await login(page, "viewer@cloudsky.demo");
  await page.goto("/intelligence");
  await expect(
    page.getByRole("heading", { name: "行业动态" }),
  ).toBeVisible();
  await page.getByLabel("按行业分类筛选").selectOption("edge-cloud");
  await expect(page.getByText("PPIO 发布 Agentic Cloud 与智能模型网关")).toBeVisible();
  await page
    .getByLabel("按公司筛选")
    .selectOption("41000000-0000-4000-8000-000000000013");
  await page
    .getByRole("link", {
      name: "PPIO 发布 Agentic Cloud 与智能模型网关",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "PPIO 发布 Agentic Cloud 与智能模型网关",
    }),
  ).toBeVisible();
  await expect(page.getByText("来源与限定")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "PPIO 官方博客", exact: true }),
  ).toBeVisible();
});
