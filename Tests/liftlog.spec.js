// @ts-check
import { test, expect } from '@playwright/test';

// Landing Page
// Verifies the home page loads correctly with the right title,
// all three dashboard stat cards are visible, and the navbar
// links to all major pages are present.

test.describe('Landing Page', () => {

  test('should display the landing page with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/LiftLog/);
  });

  test('should show dashboard stat cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Total Workouts')).toBeVisible();
    await expect(page.getByText('Last Workout')).toBeVisible();
    await expect(page.getByText('PRs This Month')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Log Workout/i }).first()).toBeVisible();
    await expect(page.locator('nav').getByRole('link', { name: /History/i })).toBeVisible();
    await expect(page.locator('nav').getByRole('link', { name: /Progress/i })).toBeVisible();
  });

});

// Log Workout Form
// Verifies the form renders with all required fields, that exercise
// rows can be dynamically added and removed via client-side JS,
// and that a valid submission saves to the DB and redirects to history.

test.describe('Log Workout', () => {

  test('should display the log workout form', async ({ page }) => {
    await page.goto('/workouts/log');
    await expect(page.getByRole('heading', { name: /Log a Workout/i })).toBeVisible();
    await expect(page.locator('#workout_date')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
  });

  test('should dynamically add an exercise row', async ({ page }) => {
    await page.goto('/workouts/log');
    const rowsBefore = await page.locator('.exercise-row').count();
    await page.getByRole('button', { name: /Add Exercise/i }).click();
    const rowsAfter = await page.locator('.exercise-row').count();
    expect(rowsAfter).toBe(rowsBefore + 1);
  });

  test('should dynamically remove an exercise row', async ({ page }) => {
    await page.goto('/workouts/log');
    await page.getByRole('button', { name: /Add Exercise/i }).click();
    const rowsBefore = await page.locator('.exercise-row').count();
    await page.locator('.remove-row-btn').last().click();
    const rowsAfter = await page.locator('.exercise-row').count();
    expect(rowsAfter).toBe(rowsBefore - 1);
  });

  test('should submit a workout and redirect to history', async ({ page }) => {
    await page.goto('/workouts/log');

    await page.locator('#workout_date').fill('2026-04-01');
    await page.locator('#name').fill('Playwright Test Workout');
    await page.locator('input[name="exercise_name"]').first().fill('Bench Press');
    await page.locator('input[name="sets"]').first().fill('3');
    await page.locator('input[name="reps"]').first().fill('5');
    await page.locator('input[name="weight_lbs"]').first().fill('185');

    await page.getByRole('button', { name: /Save Workout/i }).click();

    await expect(page).toHaveURL('/workouts');
    await expect(page.getByText('Playwright Test Workout').first()).toBeVisible();
  });

});

// Workout History
// Verifies the history page loads and displays workouts, and that
// deleting a workout removes it from the list. The delete test logs
// a fresh workout first so it has something to delete regardless of
// what's already in the database.

test.describe('Workout History', () => {

  test('should display the history page', async ({ page }) => {
    await page.goto('/workouts');
    await expect(page.getByRole('heading', { name: /Workout History/i })).toBeVisible();
  });

  test('should delete a workout and confirm it is removed', async ({ page }) => {
    // Log a workout specifically to delete
    await page.goto('/workouts/log');
    await page.locator('#workout_date').fill('2026-04-02');
    await page.locator('#name').fill('Workout To Delete');
    await page.locator('input[name="exercise_name"]').first().fill('Squat');
    await page.locator('input[name="sets"]').first().fill('3');
    await page.locator('input[name="reps"]').first().fill('5');
    await page.locator('input[name="weight_lbs"]').first().fill('225');
    await page.getByRole('button', { name: /Save Workout/i }).click();

    await expect(page).toHaveURL('/workouts');
    await expect(page.getByText('Workout To Delete').first()).toBeVisible();

    // Accept the confirm dialog and click delete on the first card
    const countBefore = await page.locator('.workout-card').filter({ hasText: 'Workout To Delete' }).count();

    page.on('dialog', dialog => dialog.accept());
    await page.locator('.workout-card').filter({ hasText: 'Workout To Delete' }).first()
      .getByRole('button', { name: /Delete/i }).first()
      .click();

    await page.waitForURL('/workouts');
    const countAfter = await page.locator('.workout-card').filter({ hasText: 'Workout To Delete' }).count();
    expect(countAfter).toBe(countBefore - 1);
  });

});

// Workout Detail
// Verifies that navigating to a valid workout ID renders the full
// exercise breakdown including estimated 1RM, and that hitting a
// non-existent ID shows a graceful error instead of crashing.

test.describe('Workout Detail', () => {

  test('should render full workout detail for a valid ID', async ({ page }) => {
    // Go to history and click the first workout's View button
    await page.goto('/workouts');
    await page.getByRole('link', { name: /View/i }).first().click();

    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByText(/Est. 1RM/i)).toBeVisible();
  });

  test('should show graceful error for a non-existent workout ID', async ({ page }) => {
    await page.goto('/workouts/999999');
    await expect(page.getByText(/Workout Not Found/i)).toBeVisible();
  });

});

// Exercise Progress
// Verifies the progress page loads, the exercise dropdown is populated
// from the database, selecting an exercise filters the results table
// to only show matching sets, and the PR banner appears for exercises
// that have a recorded personal record.

test.describe('Exercise Progress', () => {

  test('should display the progress page', async ({ page }) => {
    await page.goto('/workouts/progress');
    await expect(page.getByRole('heading', { name: /Exercise Progress/i })).toBeVisible();
  });

  test('should populate the exercise dropdown from the database', async ({ page }) => {
    await page.goto('/workouts/progress');
    const options = await page.locator('#exercise option').count();
    // Expects at least the placeholder option + one exercise from seeded data
    expect(options).toBeGreaterThan(1);
  });

  test('should filter sets by selected exercise', async ({ page }) => {
    await page.goto('/workouts/progress');

    // Select the first real exercise (index 1 skips the placeholder)
    const firstExercise = await page.locator('#exercise option').nth(1).textContent() ?? '';
    await page.locator('#exercise').selectOption({ index: 1 });

    // The table header should show the selected exercise name
    await expect(page.locator('.card-header').filter({ hasText: firstExercise.trim() })).toBeVisible();
  });

  test('should show PR banner when an exercise has a PR', async ({ page }) => {
    await page.goto('/workouts/progress');
    await page.locator('#exercise').selectOption({ index: 1 });
    await expect(page.locator('.alert-warning')).toBeVisible();
  });

});