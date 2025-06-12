import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "https://api.dicebear.com/7.x/initials/svg?seed=default_group", 
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

groupSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("name")) {
    this.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      this.name
    )}`;
  }
  next();
});

const Group = mongoose.model("Group", groupSchema);
export default Group;
