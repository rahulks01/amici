# API Documentation

This document describes the available API endpoints for the backend controllers in Amici.

---

## Messages API

### POST `/api/messages/get-messages`

- **Description:** Retrieves conversation messages between two users.
- **Request Body:**
  - `id` (string): The recipient user’s ID.
- **Response:**
  - JSON object containing an array of `messages`.

### POST `/api/messages/upload-file`

- **Description:** Uploads a file and returns its saved path.
- **Request:**
  - Form-data with a file field named `file`.
- **Response:**
  - JSON object containing `filePath`.

---

## Contacts API

### POST `/api/contacts/search`

- **Description:** Searches for users matching a given term.
- **Request Body:**
  - `searchTerm` (string): The term to search for.
- **Response:**
  - JSON object containing an array of `contacts`.

### GET `/api/contacts/get-contacts-for-dm`

- **Description:** Retrieves a list of direct message contacts based on recent message activity.
- **Response:**
  - JSON object containing an array of `contacts`.

### GET `/api/contacts/get-all-contacts`

- **Description:** Retrieves all contacts (excluding the current user).
- **Response:**
  - JSON object containing an array of `contacts`.

---

## Channel API

### POST `/api/channel/create-channel`

- **Description:** Creates a new channel with the given name and members.
- **Request Body:**
  - `name` (string): The name of the channel.
  - `members` (array[string]): Array of user IDs to add.
- **Response:**
  - JSON object containing the created `channel`.

### GET `/api/channel/get-user-channels`

- **Description:** Retrieves all channels where the current user is an admin or member.
- **Response:**
  - JSON object containing an array of `channels`.

### GET `/api/channel/get-channel-messages/:channelId`

- **Description:** Retrieves messages for a specified channel.
- **Parameters:**
  - `channelId` (string): The channel ID.
- **Response:**
  - JSON object containing an array of `messages`.

### GET `/api/channel/get-channel-members/:channelId`

- **Description:** Retrieves the list of members for the given channel. Only accessible by channel members.
- **Parameters:**
  - `channelId` (string): The channel ID.
- **Response:**
  - JSON object with information on `admin`, `members`, `channelId`, and `channelName`.

### POST `/api/channel/leave-channel/:channelId`

- **Description:** Allows a user to leave a channel. If the user is the admin and there are other members, a new admin is assigned.
- **Parameters:**
  - `channelId` (string): The channel ID.
- **Response:**
  - JSON object with a message regarding the operation.

### DELETE `/api/channel/delete-channel/:channelId`

- **Description:** Deletes a channel. Only allowed for the channel admin.
- **Parameters:**
  - `channelId` (string): The channel ID.
- **Response:**
  - JSON object with a success message.

### POST `/api/channel/remove-member`

- **Description:** Removes a specified member from a channel. Only allowed for the channel admin.
- **Request Body:**
  - `channelId` (string): The channel ID.
  - `memberId` (string): The user ID to remove.
- **Response:**
  - JSON object with a success message.

### POST `/api/channel/add-members`

- **Description:** Adds one or more members to a channel. Only allowed for the channel admin.
- **Request Body:**
  - `channelId` (string): The channel ID.
  - `memberIds` (array[string]): Array of user IDs to add.
- **Response:**
  - JSON object with a success message and the updated channel information.

### GET `/api/channel/search-users`

- **Description:** Allows the channel admin to search for users to add to a channel.
- **Query Parameters:**
  - `channelId` (string): The channel ID.
  - `query` (string, optional): A search term to filter users.
- **Response:**
  - JSON object containing an array of `users`.

---

## Auth API

### POST `/api/auth/signup`

- **Description:** Registers a new user by sending an OTP to the provided email address.
- **Request Body:**
  - `email` (string): User’s email.
  - `password` (string): User’s password.
- **Response:**
  - JSON object with a message and a `registrationId` to use in OTP verification.

### POST `/api/auth/login`

- **Description:** Authenticates a user with email and password.
- **Request Body:**
  - `email` (string)
  - `password` (string)
- **Response:**
  - JSON object with user information.

### GET `/api/auth/user-info`

- **Description:** Retrieves information for the current authenticated user.
- **Response:**
  - JSON object with user details like `id`, `email`, `profileSetup`, `firstName`, `lastName`, `image`, and `color`.

### POST `/api/auth/update-profile`

- **Description:** Updates the current user’s profile.
- **Request Body:**
  - `firstName` (string)
  - `lastName` (string)
  - `color` (string)
- **Response:**
  - JSON object with updated user details.

### POST `/api/auth/add-profile-image`

- **Description:** Uploads and sets a new profile image for the user.
- **Request:**
  - Form-data with a file field named `profile-image`.
- **Response:**
  - JSON object with the new `image` path.

### DELETE `/api/auth/remove-profile-image`

- **Description:** Removes the current user’s profile image.
- **Response:**
  - Success message.

### POST `/api/auth/verify-otp`

- **Description:** Verifies the OTP sent during signup.
- **Request Body:**
  - `otp` (string)
  - `registrationId` (string)
- **Response:**
  - JSON object with user details upon successful verification.

### POST `/api/auth/resend-otp`

- **Description:** Resends the OTP for a pending user signup.
- **Response:**
  - JSON object with a success message.

### POST `/api/auth/logout`

- **Description:** Logs out the current user by clearing the JWT cookie.
- **Response:**
  - Success message.

---

**Note:** Most endpoints require authentication via the `verifyToken` middleware. Make sure to include the JWT token with your requests (via cookies).

---
