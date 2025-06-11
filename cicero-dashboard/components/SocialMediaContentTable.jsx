"use client";
import { useState } from "react";

export default function SocialMediaContentTable({ platform, initialPosts = [] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState("");
  const [schedule, setSchedule] = useState("");

  const addPost = () => {
    if (!caption.trim() || !schedule.trim()) return;
    setPosts([...posts, { caption, schedule, status: "Scheduled" }]);
    setCaption("");
    setSchedule("");
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow border p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg text-blue-700">{platform} Content</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
        >
          {showForm ? "Cancel" : "Add Post"}
        </button>
      </div>

      {showForm && (
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <input
            type="text"
            placeholder="Schedule"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button
            onClick={addPost}
            className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
          >
            Save
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-2 text-left">Caption</th>
              <th className="py-2 px-2 text-left">Schedule</th>
              <th className="py-2 px-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-1 px-2 break-words">{p.caption}</td>
                <td className="py-1 px-2">{p.schedule}</td>
                <td className="py-1 px-2">{p.status}</td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan="3" className="py-4 text-center text-gray-500">
                  No posts available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
