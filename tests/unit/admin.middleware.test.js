describe('adminMiddleware', () => {
  const { adminMiddleware } = require('../../src/middleware/auth');

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('pasa si role=admin', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('bloquea si no es admin', () => {
    const req = { user: { role: 'user' } };
    const res = mockRes();
    const next = jest.fn();

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admin only.' });
    expect(next).not.toHaveBeenCalled();
  });
});
