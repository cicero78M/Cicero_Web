// components/CardStat.jsx
export default function CardStat({ title, value }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 flex flex-col items-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
    </div>
  );
}

