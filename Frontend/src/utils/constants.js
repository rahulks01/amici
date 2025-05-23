export const HOST = import.meta.env.VITE_BACKEND_URL;

export const AUTH_ROUTE = "api/auth";
export const SIGNUP_ROUTE = `${AUTH_ROUTE}/signup`;
export const LOGIN_ROUTE = `${AUTH_ROUTE}/login`;
export const VERIFY_OTP = `${AUTH_ROUTE}/verify-otp`;
export const RESEND_OTP = `${AUTH_ROUTE}/resend-otp`;
export const GET_USER_INFO = `${AUTH_ROUTE}/user-info`;
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTE}/update-profile`;
export const ADD_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTE}/add-profile-image`;
export const REMOVE_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTE}/remove-profile-image`;
export const LOGOUT_ROUTE = `${AUTH_ROUTE}/logout`;

export const CONTACTS_ROUTE = "api/contacts";
export const SEARCH_CONTACTS_ROUTES = `${CONTACTS_ROUTE}/search`;
export const GET_DM_CONTACTS_ROUTES = `${CONTACTS_ROUTE}/get-contacts-for-dm`;
export const GET_ALL_CONTACTS_ROUTES = `${CONTACTS_ROUTE}/get-all-contacts`;

export const MESSAGES_ROUTES = "api/messages";
export const GET_ALL_MESSAGES_ROUTE = `${MESSAGES_ROUTES}/get-messages`;
export const UPLOAD_FILE_ROUTE = `${MESSAGES_ROUTES}/upload-file`;

export const CHANNEL_ROUTES = "api/channel";
export const CREATE_CHANNEL_ROUTE = `${CHANNEL_ROUTES}/create-channel`;
export const GET_USER_CHANNELS_ROUTE = `${CHANNEL_ROUTES}/get-user-channels`;
export const GET_CHANNEL_MESSAGES = `${CHANNEL_ROUTES}/get-channel-messages`;
export const LEAVE_CHANNEL_ROUTE = `${CHANNEL_ROUTES}/leave-channel`;
export const DELETE_CHANNEL_ROUTE = `${CHANNEL_ROUTES}/delete-channel`;
export const REMOVE_MEMBER_ROUTE = `${CHANNEL_ROUTES}/remove-member`;
export const ADD_MEMBERS_ROUTE = `${CHANNEL_ROUTES}/add-members`;
export const SEARCH_USERS_FOR_CHANNEL = `${CHANNEL_ROUTES}/search-users`;
