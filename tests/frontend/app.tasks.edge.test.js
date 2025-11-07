/** @jest-environment jsdom */
describe('Tasks – casos edge', () => {
  beforeEach(() => {
    __loadIndexHtml();
    jest.isolateModules(() => {
      require('../../public/app.js');
    });
  });

  test('si /api/tasks devuelve arreglo vacío, se muestra estado "sin tareas"', async () => {
    // Arrange: mock login OK y después tasks vacías
    global.fetch
      .mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => ({ token: 'x', user: { username: 'belu' } }) }))
      .mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => ([]) }))
      .mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => ({ completed: 0, pending: 0, total: 0, progress: 0 }) })); // stats

    // Act: logueo rápido
    document.getElementById('loginUsername').value = 'belu';
    document.getElementById('loginPassword').value = '123';
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    
    // Esperar a que se resuelvan TODAS las promesas (login + loadTasks + stats)
    await new Promise(resolve => setTimeout(resolve, 50));

    // Assert
    const emptyState = document.querySelector('.empty-state, [data-testid="empty-state"]'); 
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toMatch(/no hay tareas|sin tareas/i);
  });

  test('renderiza una lista grande sin romper (100 ítems)', async () => {
    const bigList = Array.from({ length: 100 }, (_, i) => ({ 
      id: i+1, 
      title: `T${i+1}`,
      due_date: '2024-12-31',
      completed: false,
      user_id: 1
    }));
    
    global.fetch
      .mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => ({ token: 'x', user: { id: 1, username: 'belu' } }) }))
      .mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => bigList }))
      .mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => ({ completed: 0, pending: 100, total: 100, progress: 0 }) }));

    document.getElementById('loginUsername').value = 'belu';
    document.getElementById('loginPassword').value = '123';
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    
    // Esperar a que se renderice todo
    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = document.querySelectorAll('#tasksList .task-card');
    expect(rows.length).toBeGreaterThanOrEqual(100);
  });

  test('si /api/tasks devuelve 500, muestra estado de error y no rompe', async () => {
    global.fetch
      .mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => ({ token: 'x', user: { username: 'belu' } }) }))
      .mockImplementationOnce(async () => ({ ok: false, status: 500, json: async () => ({ error: 'boom' }) }));

    document.getElementById('loginUsername').value = 'belu';
    document.getElementById('loginPassword').value = '123';
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    
    // Esperar a que se procese el error
    await new Promise(resolve => setTimeout(resolve, 50));

    // Tu código muestra el error en #tasksList con clase .error
    const errorBox = document.querySelector('#tasksList .error, #error, [data-testid="error"]');
    expect(errorBox).toBeTruthy();
    expect((errorBox.textContent || '').toLowerCase()).toMatch(/error|intente|falló/);
  });
});