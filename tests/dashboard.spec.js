import { test, expect } from '@playwright/test';

test.describe('Pruebas de Calidad (QA) - Dashboard de Inventario', () => {

  test('Debe iniciar sesión correctamente y cargar el Dashboard', async ({ page }) => {
    // 1. Navegar a la aplicación
    await page.goto('http://localhost:5173/');

    // 2. Realizar Login
    await page.getByPlaceholder('usuario@empresa.com').fill('admin@test.com');
    await page.getByPlaceholder('••••••••').fill('12345678');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // 3. Validar elementos del Dashboard
    await expect(page.getByText('Ingreso Manual')).toBeVisible();
    await expect(page.getByText('Revisión (0)')).toBeVisible();
  });

  test('Debe agregar un producto manualmente a la tabla de revisión', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:5173/');
    await page.getByPlaceholder('usuario@empresa.com').fill('admin@test.com');
    await page.getByPlaceholder('••••••••').fill('12345678');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // 2. Esperar a que el formulario sea visible
    await expect(page.getByText('Ingreso Manual')).toBeVisible();

    // 3. Llenar Proveedor y Categoría
    const inputsSeleccionar = page.getByPlaceholder('Seleccionar...');
    await inputsSeleccionar.nth(0).fill('Impresiones y Publicaciones S.A.');
    await inputsSeleccionar.nth(1).fill('Tazas y Libros');

    // 4. Llenar Nombre y SKU
    await page.getByPlaceholder('Ej: Taza...').fill('Taza del dia del Padre');
    await page.getByPlaceholder('SKU', { exact: true }).fill('RVR-1960-01');

    // 5. Escribir únicamente el Precio
    const inputPrecio = page.locator('input[type="number"]').nth(0);
    await inputPrecio.fill('25.00');

    // 6. Escribir el Costo manualmente
    const inputCosto = page.locator('input[type="number"]').nth(1);
    await inputCosto.fill('20.00');
    
    // 8. Enviar el formulario
    await page.getByRole('button', { name: 'Añadir a Revisión' }).click();

    // 9. Validar que la tabla de revisión se actualice a (1) y aparezca el SKU dentro del input en la tabla
    await expect(page.getByText('Revisión (1)')).toBeVisible();
    await expect(page.locator('table input[value="RVR-1960-01"]')).toBeVisible();
  });

});