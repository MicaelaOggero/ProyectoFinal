import User from "./user.model.js";

export const findUsersByRole = async (rol) => {
  return await User.find({ rol }).select("-password");
};

export const findById = async (id) => {
  return await User.findById(id).select("-password");
};

export const update = async (id, data) => {
  return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select("-password");
};

export const remove = async (id) => {
  return await User.findByIdAndDelete(id).select("-password");
};
