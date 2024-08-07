import Blacklist from '../models/blacklist.js'; 

export const blacklistToken = async (token) => {
  const newBlacklist = new Blacklist({ token, expiry: new Date() });
  await newBlacklist.save();
  console.log('Token blacklisted:', token);
};
