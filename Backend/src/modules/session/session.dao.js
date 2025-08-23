import User from "../users/user.model.js";

export const findByEmail = async (email) => User.findOne({ email });
export const findById = async (id, projection = "") => User.findById(id).select(projection).lean();
export const createUser = async (data) => User.create(data);
export const updatePassword = async (id, password) =>
  User.updateOne({ _id: id }, { $set: { password } });
export const updateUser = async (id, data) =>
  User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select("-password");

