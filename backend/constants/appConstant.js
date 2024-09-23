// HTTP Status Codes
export const STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
    MISSING_DETAILS: 'Missing Details',
    INVALID_EMAIL: 'Invalid email format',
    EMAIL_EXISTS: 'Email already registered',
    WEAK_PASSWORD: 'Password must be at least 8 characters',
    UNAUTHORIZED: 'Not Authorized, Login Again',
    USER_NOT_FOUND: 'User does not exist',
    INVALID_CREDENTIALS: 'Invalid credentials',
    SERVER_ERROR: 'Server error, please try again later',
};

// Enums for roles
export const ROLES = {
    USER: 'user',
    DOCTOR: 'doctor',
    ADMIN: 'admin',
};

