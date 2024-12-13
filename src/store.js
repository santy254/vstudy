import { configureStore } from '@reduxjs/toolkit';
import userReducer from './features/user/userSlice'; // Adjust path based on your file structure

const store = configureStore({
  reducer: {
    user: userReducer,
    // add other slices here as needed
  },
});

export default store;
