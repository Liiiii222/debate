# Firebase Authentication Setup

This document outlines the Firebase authentication implementation for the debate app.

## Features Implemented

### 1. Two-Step Signup Process
- **Step 1**: Account Name (required, unique) + Email validation + Password (minimum 6 characters)
- **Step 2**: Optional profile information
  - Age (optional)
  - Country (optional, searchable dropdown with 195+ countries + "Other")
  - Languages (optional, searchable dropdown with 80+ languages + "Other")
  - Skip option available

### 2. Real-time Name Availability
- Debounced checking (500ms delay)
- Automatic suggestions when name is taken
- Suggestions include random numbers and suffixes

### 3. Enhanced Password Validation
- Real-time feedback for password length
- Visual indicators (red border for invalid, green checkmark for valid)
- Clear error messages for password requirements

### 4. Searchable Dropdown Menus
- Comprehensive country and language lists
- Real-time search functionality
- Multi-select for languages
- "Other" specification with text input fields

### 5. Login Functionality
- **Firebase Auth Integration**: Uses `signInWithEmailAndPassword`
- **Error Handling**: Specific error messages for different auth failures
- **Form Validation**: Email format and password length validation
- **Loading States**: Proper loading indicators during authentication
- **Redirect**: Automatic redirect to home page after successful login

### 6. User Data Storage
- Firebase Authentication for user accounts
- Firestore for user profile data
- User document structure:
  ```typescript
  {
    email: string,
    name: string,
    age: number | null,
    country: string | null,
    languages: string[],
    profileImage: string,
    uid: string,
    createdAt: Date
  }
  ```

### 7. Authentication State Management
- AuthContext for global auth state
- Real-time auth state updates
- Loading states for better UX
- Automatic profile picture display in navbar

### 8. Navigation Integration
- Conditional rendering based on auth state
- User profile display with dropdown menu
- Sign out functionality
- Profile picture replaces login/signup buttons after login

## Environment Variables Required

Create a `.env.local` file in the frontend directory with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Firebase Configuration

1. Enable Email/Password authentication in Firebase Console
2. Create Firestore database
3. Set up security rules for user data
4. Configure authentication providers as needed

## Usage

### Signup Flow
1. User enters account name, email and password
2. Validates all required fields
3. Proceeds to profile setup (optional)
4. Real-time name availability checking
5. Creates user account and stores profile data
6. Automatically logs in and redirects to home

### Login Flow
1. User enters email and password
2. Validates credentials using Firebase Auth
3. Handles specific Firebase auth errors with user-friendly messages
4. Redirects to home page on success
5. Profile picture appears in navbar

### Navigation
- Shows Log In/Sign Up buttons when not authenticated
- Shows user profile with dropdown when authenticated
- Includes sign out functionality
- Profile picture displays user's photo or initials

## Error Handling

### Login Errors
- `auth/user-not-found`: "No account found with this email address."
- `auth/wrong-password`: "Incorrect password."
- `auth/invalid-email`: "Invalid email address."
- `auth/too-many-requests`: "Too many failed attempts. Please try again later."
- `auth/user-disabled`: "This account has been disabled."
- `auth/invalid-credential`: "Invalid email or password."

### Signup Errors
- Name already taken with suggestions
- Email format validation
- Password length requirements
- Firebase auth errors

## Security Considerations

- Password minimum length enforced
- Email format validation
- Unique username enforcement
- Firestore security rules should be configured
- Authentication state properly managed
- Error handling for all auth operations
- Secure redirect handling 