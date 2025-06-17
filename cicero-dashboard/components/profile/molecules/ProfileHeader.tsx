"use client";
import Avatar from "../atoms/Avatar";
import ProfileActions from "./ProfileActions";

interface Props {
  avatar: string;
  name: string;
  email: string;
}

export default function ProfileHeader({ avatar, name, email }: Props) {
  return (
    <section className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center gap-3">
      <Avatar src={avatar} alt="Avatar pengguna" />
      <div className="font-semibold text-lg">{name}</div>
      <div className="text-sm text-gray-500">{email}</div>
      <ProfileActions />
    </section>
  );
}
