const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');

function uniqueUser() {
  return `user_${Date.now()}_${Math.floor(Math.random() * 999)}`;
}

describe('User Model', () => {
  describe('create', () => {
    test('✅ Creates a user successfully', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);

      expect(user).toHaveProperty('id');
      expect(user.username).toBe(username);
      expect(user.email).toBe(email);
      expect(user.role).toBe('user');
    });

    test('✅ Creates an admin user', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password, 'admin');

      expect(user).toHaveProperty('id');
      expect(user.role).toBe('admin');
    });
  });

  describe('findByUsername', () => {
    test('✅ Finds existing user', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      await User.create(username, email, password);
      const foundUser = await User.findByUsername(username);

      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe(username);
    });

    test('✅ Returns undefined for non-existent user', async () => {
      const user = await User.findByUsername('nonexistent_user_12345');
      expect(user).toBeFalsy();
    });
  });

  describe('findByEmail', () => {
    test('✅ Finds existing user by email', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      await User.create(username, email, password);
      const foundUser = await User.findByEmail(email);

      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe(email);
    });

    test('✅ Returns undefined for non-existent email', async () => {
      const user = await User.findByEmail('nonexistent@email.com');
      expect(user).toBeFalsy();
    });
  });

  describe('findById', () => {
    test('✅ Finds existing user by ID', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const created = await User.create(username, email, password);
      const foundUser = await User.findById(created.id);

      expect(foundUser).toBeTruthy();
      expect(foundUser.id).toBe(created.id);
      expect(foundUser.username).toBe(username);
      expect(foundUser).not.toHaveProperty('password');
    });

    test('✅ Returns undefined for non-existent ID', async () => {
      const user = await User.findById(999999);
      expect(user).toBeFalsy();
    });
  });

  describe('findAll', () => {
    test('✅ Returns array of users', async () => {
      const users = await User.findAll();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      
      if (users.length > 0) {
        expect(users[0]).toHaveProperty('username');
        expect(users[0]).toHaveProperty('email');
        expect(users[0]).not.toHaveProperty('password');
      }
    });
  });

  describe('update', () => {
    test('✅ Updates username', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);
      const newUsername = uniqueUser();

      const updated = await User.update(user.id, { username: newUsername });

      expect(updated).toBeTruthy();
      expect(updated.username).toBe(newUsername);
    });

    test('✅ Updates email', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);
      const newEmail = `${uniqueUser()}@newemail.com`;

      const updated = await User.update(user.id, { email: newEmail });

      expect(updated).toBeTruthy();
      expect(updated.email).toBe(newEmail);
    });

    test('✅ Updates role', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);

      const updated = await User.update(user.id, { role: 'admin' });

      expect(updated).toBeTruthy();
      expect(updated.role).toBe('admin');
    });

    test('✅ Updates multiple fields', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);
      const newUsername = uniqueUser();
      const newEmail = `${uniqueUser()}@newemail.com`;

      const updated = await User.update(user.id, { 
        username: newUsername, 
        email: newEmail,
        role: 'admin'
      });

      expect(updated).toBeTruthy();
      expect(updated.username).toBe(newUsername);
      expect(updated.email).toBe(newEmail);
      expect(updated.role).toBe('admin');
    });

    test('✅ Ignores invalid role', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);

      // When only invalid role is provided, update returns null (no valid fields)
      const updated = await User.update(user.id, { role: 'superadmin' });

      expect(updated).toBeNull();
    });

    test('✅ Trims whitespace from username', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);
      const newUsername = uniqueUser();

      const updated = await User.update(user.id, { username: `  ${newUsername}  ` });

      expect(updated).toBeTruthy();
      expect(updated.username).toBe(newUsername);
    });

    test('✅ Returns null if no fields to update', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);

      const updated = await User.update(user.id, {});

      expect(updated).toBeNull();
    });

    test('✅ Returns null if only empty strings', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);

      const updated = await User.update(user.id, { username: '   ', email: '   ' });

      expect(updated).toBeNull();
    });

    test('✅ Handles non-string values gracefully', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);

      const updated = await User.update(user.id, { username: 123, email: null });

      expect(updated).toBeNull();
    });
  });

  describe('deleteById', () => {
    test('✅ Deletes user successfully', async () => {
      const username = uniqueUser();
      const email = `${username}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const user = await User.create(username, email, password);
      const result = await User.deleteById(user.id);

      expect(result).toHaveProperty('changes');
      expect(result.changes).toBe(1);

      const foundUser = await User.findById(user.id);
      expect(foundUser).toBeFalsy();
    });

    test('✅ Returns 0 changes for non-existent user', async () => {
      const result = await User.deleteById(999999);

      expect(result).toHaveProperty('changes');
      expect(result.changes).toBe(0);
    });
  });
});
