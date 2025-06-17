"use client";
import { Button } from "@/components/ui/button";

export default function ProfileActions() {
  return (
    <div className="flex gap-2 mt-4">
      <Button aria-label="Edit profil" size="sm">Edit Profil</Button>
      <Button aria-label="Pengaturan" size="sm" variant="outline">
        Pengaturan
      </Button>
      <Button aria-label="Keluar" size="sm" variant="outline">
        Logout
      </Button>
    </div>
  );
}
