import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  googleId?: string | null;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, default: null },
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },
  },
  { timestamps: true },
);

const UserModel = mongoose.model<IUser>("User", UserSchema);
export default UserModel;
