import Blacklist from '../models/blacklist.js'; 

export const isTokenBlacklisted = async (token) => {
  const blacklisted = await Blacklist.findOne({ token });
  const result = blacklisted!== null
  // console.log('blacklisted?',result);
  return result ;
};