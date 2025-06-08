// components/Loader.jsx
export default function Loader() {
  return (
    <div className="flex justify-center items-center h-64">
      <span className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></span>
      <span className="ml-4 text-blue-700">Memuat data...</span>
    </div>
  );
}
