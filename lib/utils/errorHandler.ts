// Error handling utilities for the POS Offline system

// Custom error classes for specific error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// General error handler function
export const handleAppError = (error: any, context?: string): Error => {
  // Log error for debugging
  console.error(`Error in ${context || 'unknown context'}:`, error);
  
  // Handle different types of errors
  if (error instanceof ValidationError) {
    return error;
  }
  
  if (error instanceof DatabaseError) {
    return error;
  }
  
  if (error instanceof NetworkError) {
    return error;
  }
  
  if (error instanceof AuthenticationError) {
    return error;
  }
  
  if (error instanceof AuthorizationError) {
    return error;
  }
  
  // Handle common error types
  if (error.name === 'TypeError') {
    return new ValidationError(`Type error: ${error.message}`);
  }
  
  if (error.name === 'ReferenceError') {
    return new ValidationError(`Reference error: ${error.message}`);
  }
  
  // Handle Supabase-specific errors
  if (error.status && error.status >= 400) {
    if (error.status === 401) {
      return new AuthenticationError('Authentication failed');
    }
    if (error.status === 403) {
      return new AuthorizationError('Authorization failed');
    }
    if (error.status === 404) {
      return new ValidationError('Resource not found');
    }
    if (error.status >= 500) {
      return new DatabaseError('Server error occurred');
    }
  }
  
  // Default error
  return new Error(error.message || 'An unknown error occurred');
};

// Error boundary component handler
export const handleBoundaryError = (error: Error): void => {
  console.error('Error boundary caught error:', error);
  // In a real app, you might want to send this to an error reporting service
  // and/or display a user-friendly error message
};

// Format error message for display
export const formatErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    if (error.error_description) {
      return error.error_description;
    }
    if (error.message) {
      return error.message;
    }
    if (error.error) {
      return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }
  }
  
  return 'An unknown error occurred';
};

// Log error with additional context
export const logError = (error: any, context: string, additionalData?: any): void => {
  const errorObj = {
    message: formatErrorMessage(error),
    context,
    timestamp: new Date().toISOString(),
    additionalData,
    stack: error?.stack,
  };
  
  console.error('App Error:', errorObj);
  
  // In a real application, you might send this to an error tracking service
  // For example: Sentry.captureException(error, { contexts: { custom: errorObj } });
};

// Check if error is related to offline status
export const isOfflineError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = formatErrorMessage(error).toLowerCase();
 const offlineKeywords = [
    'network',
    'fetch',
    'connection',
    'offline',
    'timeout',
    'failed to fetch'
  ];
  
  return offlineKeywords.some(keyword => errorMessage.includes(keyword));
};