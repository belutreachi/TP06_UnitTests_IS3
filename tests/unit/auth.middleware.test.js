const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken');

describe('Auth Middleware (AAA)', () => {
  const { authMiddleware } = require('../../src/middleware/auth');

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('✅ Token válido → next()', () => {
    const req = { headers: { authorization: 'Bearer valid.token' } };
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: 1, username: 'belen', role: 'user' });

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 1, username: 'belen', role: 'user' });
  });

  test('❌ Sin token → 401', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('❌ Token inválido → 401', () => {
    const req = { headers: { authorization: 'Bearer bad.token' } };
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation(() => { throw new Error(); });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });
});
