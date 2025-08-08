import { parseFullName, getFullName, getInitials } from './name.utils';

describe('Name Utils', () => {
  describe('parseFullName', () => {
    it('should parse a simple full name', () => {
      const result = parseFullName('John Doe');
      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should handle names with multiple parts', () => {
      const result = parseFullName('John Jacob Jingleheimer Schmidt');
      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Jacob Jingleheimer Schmidt',
      });
    });

    it('should handle single names', () => {
      const result = parseFullName('Madonna');
      expect(result).toEqual({
        firstName: 'Madonna',
        lastName: '',
      });
    });

    it('should handle empty or null inputs', () => {
      expect(parseFullName('')).toEqual({
        firstName: 'User',
        lastName: '',
      });

      expect(parseFullName(null)).toEqual({
        firstName: 'User',
        lastName: '',
      });

      expect(parseFullName(undefined)).toEqual({
        firstName: 'User',
        lastName: '',
      });
    });

    it('should handle extra whitespace', () => {
      const result = parseFullName('  John   Doe  ');
      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should handle names with only whitespace', () => {
      const result = parseFullName('   ');
      expect(result).toEqual({
        firstName: 'User',
        lastName: '',
      });
    });
  });

  describe('getFullName', () => {
    it('should combine first and last name', () => {
      expect(getFullName('John', 'Doe')).toBe('John Doe');
    });

    it('should handle missing last name', () => {
      expect(getFullName('John')).toBe('John');
    });

    it('should handle missing first name', () => {
      expect(getFullName(undefined, 'Doe')).toBe('Doe');
    });

    it('should handle both names missing', () => {
      expect(getFullName()).toBe('');
    });

    it('should trim extra whitespace', () => {
      expect(getFullName('  John  ', '  Doe  ')).toBe('John Doe');
    });
  });

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John', 'Doe')).toBe('JD');
    });

    it('should handle lowercase names', () => {
      expect(getInitials('john', 'doe')).toBe('JD');
    });

    it('should handle missing last name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('should handle missing first name', () => {
      expect(getInitials(undefined, 'Doe')).toBe('D');
    });

    it('should handle both names missing', () => {
      expect(getInitials()).toBe('');
    });

    it('should handle names with extra whitespace', () => {
      expect(getInitials('  John  ', '  Doe  ')).toBe('JD');
    });
  });
});
